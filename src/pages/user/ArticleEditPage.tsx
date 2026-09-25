import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Flex,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
// react-simplemde-editor 的 default 导出在 webpack 生产构建里可能为 undefined，
// 用 require 取值并兼容 .default，避免 React #130（element type is invalid）
const SimpleMDEImport = require('react-simplemde-editor');
const SimpleMDE = (SimpleMDEImport && (SimpleMDEImport.default || SimpleMDEImport)) as any;
import 'easymde/dist/easymde.min.css';

import { usePageMeta } from '@/hooks/usePageMeta';
import {
  getMyColumns,
  getMyArticles,
  articleSave,
  getColumnConfig,
  aiSummary,
  aiGenerate,
  uploadColumnImg,
  type ColumnItem,
  type ColumnArticleItem,
} from '@/services/column';
import { getToken } from '@/utils/auth';
import ColumnImgUpload from '@/components/common/ColumnImgUpload';

const { Text, TextArea } = Typography;
const { Title } = Typography;

const ArticleEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const key = getToken();
  const isEdit = !!editId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [minChars, setMinChars] = useState(0);

  const [tid, setTid] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [pic, setPic] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [content, setContent] = useState('');

  const [aiModal, setAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  usePageMeta({
    title: isEdit ? '编辑文章' : '投稿文章',
    description: '撰写并提交专栏文章',
  });

  const myColumns = useMemo(() => columns.filter((c) => c.status === 1), [columns]);

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getMyColumns(key), getColumnConfig(), getMyArticles(key)])
      .then(([cols, cfg, arts]) => {
        setColumns(cols.code === 1 ? cols.data || [] : []);
        const minC = (cfg.code === 1 && cfg.data?.article_min_chars) || 0;
        setMinChars(typeof minC === 'number' ? minC : parseInt(String(minC), 10) || 0);

        const queryTid = Number(search.get('tid')) || 0;
        const passed = cols.code === 1 ? cols.data || [] : [];
        const editable = passed.filter((c) => c.status === 1);
        if (isEdit) {
          const a: ColumnArticleItem | undefined = (arts.code === 1 ? arts.data || [] : []).find(
            (x) => String(x.id) === String(editId)
          );
          if (a) {
            setTid(a.tid);
            setTitle(a.title);
            setPic(a.pic || '');
            setDescription(a.description || '');
            setKeywords(a.keywords || '');
            setContent(a.content || '');
          }
        } else if (queryTid) {
          setTid(queryTid);
        } else if (editable.length === 1) {
          setTid(editable[0].article_cate_id || editable[0].id);
        }
      })
      .catch(() => {
        setColumns([]);
      })
      .finally(() => setLoading(false));
  }, [key, editId, search]);

  // SimpleMDE 图片上传（复用专栏图标/封面上传接口）
  const imageUploadFunction = async (
    file: File,
    onSuccess: (url: string, name?: string) => void,
    onError: (error: string) => void
  ) => {
    if (!key) {
      onError('请先登录');
      return;
    }
    try {
      const r = await uploadColumnImg(key, file);
      if (r.code === 1 && r.data?.url) onSuccess(r.data.url, file.name);
      else onError(r.msg || '上传失败');
    } catch (e: any) {
      onError(e?.message || '上传失败');
    }
  };

  const mdeOptions = useMemo(
    () => ({
      autofocus: true,
      spellChecker: false,
      placeholder: '在此撰写正文，支持 Markdown；可点击工具栏上传图片、切换全屏',
      uploadImage: true,
      imageUploadFunction,
      toolbar: [
        'bold',
        'italic',
        'heading',
        '|',
        'quote',
        'code',
        'table',
        '|',
        'list-ul',
        'list-ol',
        'link',
        'image',
        '|',
        'fullscreen',
        'preview',
        'side-by-side',
        'guide',
      ] as any,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const countZh = (s: string) => (s.match(/[一-龥]/g) || []).length;

  const onAiSummary = () => {
    if (!key) {
      message.error('请先登录');
      return;
    }
    setSummaryLoading(true);
    aiSummary({ key, title, content })
      .then((r) => {
        if (r.code === 1 && r.data) {
          if (r.data.description) setDescription(r.data.description);
          if (r.data.keywords) setKeywords(r.data.keywords);
          message.success('已根据文章生成摘要与关键词');
        } else {
          message.error(r.msg || '生成失败');
        }
      })
      .catch((e) => message.error(e?.message || '生成失败'))
      .finally(() => setSummaryLoading(false));
  };

  const onAiGenerate = () => {
    if (!key) {
      message.error('请先登录');
      return;
    }
    if (!aiPrompt.trim()) {
      message.warning('请填写写作要求');
      return;
    }
    setAiLoading(true);
    setGenLoading(true);
    aiGenerate({
      key,
      prompt: aiPrompt.trim(),
      onChunk: (s) => setContent((prev) => prev + s),
    })
      .then(() => {
        message.success('AI 文章已生成');
        setAiModal(false);
        setAiPrompt('');
      })
      .catch((e) => message.error(e?.message || '生成失败'))
      .finally(() => {
        setAiLoading(false);
        setGenLoading(false);
      });
  };

  const onSubmit = () => {
    if (!tid) {
      message.error('请选择投稿的专栏');
      return;
    }
    if (!title.trim()) {
      message.error('请填写文章标题');
      return;
    }
    if (!content.trim()) {
      message.error('请填写正文');
      return;
    }
    if (minChars > 0 && countZh(content) < minChars) {
      message.error(`正文中文内容过少，至少需 ${minChars} 字（当前 ${countZh(content)} 字）`);
      return;
    }
    setSaving(true);
    articleSave({
      id: isEdit ? Number(editId) : undefined,
      tid,
      title: title.trim(),
      pic,
      content: content.trim(),
      description: description.trim(),
      keywords: keywords.trim(),
    })
      .then((r) => {
        if (r.code === 1) {
          message.success(isEdit ? '已提交修改，等待审核' : '已提交，等待审核');
          navigate('/user/columns');
        } else {
          message.error(r.msg || '提交失败');
        }
      })
      .catch((e) => message.error(e?.message || '提交失败'))
      .finally(() => setSaving(false));
  };

  if (!key) {
    return (
      <Card className="user-center-card">
        <Alert type="info" showIcon message="请先登录" description="登录后可投稿或编辑文章。" />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="user-center-card">
        <Flex justify="center" style={{ padding: 40 }}>
          <Spin />
        </Flex>
      </Card>
    );
  }

  if (myColumns.length === 0) {
    return (
      <Card className="user-center-card">
        <Alert
          type="warning"
          showIcon
          message="你还没有已通过的专栏"
          description="请先在「我的专栏」中创建并通过审核一个专栏，才能投稿。"
        />
        <div style={{ marginTop: 12 }}>
          <Button type="link" onClick={() => navigate('/user/columns')}>
            去我的专栏
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="user-center-card">
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Title level={5} style={{ margin: 0 }}>
            {isEdit ? '编辑文章' : '投稿文章'}
          </Title>
          <Button type="link" onClick={() => navigate('/user/columns')}>
            返回我的专栏
          </Button>
        </Flex>

        {minChars > 0 ? (
          <Alert
            type="info"
            showIcon
            message={`正文最少需 ${minChars} 个中文字（防水贴），当前 ${countZh(content)} 字`}
          />
        ) : null}

        <Flex vertical gap={6}>
          <Text strong>所属专栏</Text>
          <Select
            value={tid || undefined}
            placeholder="选择投稿的专栏"
            onChange={(v) => setTid(v)}
            style={{ maxWidth: 360 }}
            options={myColumns.map((c) => ({
              value: c.article_cate_id || c.id,
              label: c.name,
            }))}
          />
        </Flex>

        <Flex vertical gap={6}>
          <Text strong>文章标题</Text>
          <Input
            value={title}
            maxLength={100}
            placeholder="文章标题"
            onChange={(e) => setTitle(e.target.value)}
          />
        </Flex>

        <Flex vertical gap={6}>
          <Text strong>封面图（可选）</Text>
          <ColumnImgUpload
            value={pic}
            onChange={setPic}
            hint="点击上传文章封面（可选，不传则不展示封面）。"
          />
        </Flex>

        <Flex vertical gap={6}>
          <Flex align="center" justify="space-between">
            <Text strong>摘要</Text>
            <Button size="small" loading={summaryLoading} onClick={onAiSummary}>
              AI 生成
            </Button>
          </Flex>
          <TextArea
            rows={2}
            maxLength={200}
            value={description}
            placeholder="一句话摘要（可点击右侧 AI 生成）"
            onChange={(e) => setDescription(e.target.value)}
          />
        </Flex>

        <Flex vertical gap={6}>
          <Flex align="center" justify="space-between">
            <Text strong>关键词</Text>
            <Button size="small" loading={summaryLoading} onClick={onAiSummary}>
              AI 生成
            </Button>
          </Flex>
          <Input
            value={keywords}
            maxLength={100}
            placeholder="用空格或逗号分隔（可点击右侧 AI 生成）"
            onChange={(e) => setKeywords(e.target.value)}
          />
        </Flex>

        <Flex vertical gap={6}>
          <Flex align="center" justify="space-between" wrap gap={8}>
            <Text strong>正文（Markdown）</Text>
            <Button
              type="primary"
              ghost
              size="small"
              loading={genLoading}
              onClick={() => setAiModal(true)}
            >
              AI 写文章
            </Button>
          </Flex>
          <SimpleMDE value={content} onChange={setContent} options={mdeOptions} />
        </Flex>

        <Flex gap={12} wrap>
          <Button type="primary" loading={saving} onClick={onSubmit}>
            {isEdit ? '提交修改' : '提交审核'}
          </Button>
          <Button onClick={() => navigate('/user/columns')}>取消</Button>
        </Flex>
      </Flex>

      <Modal
        title="AI 写文章"
        open={aiModal}
        onCancel={() => !aiLoading && setAiModal(false)}
        onOk={onAiGenerate}
        confirmLoading={aiLoading}
        okText="开始生成"
        cancelText="取消"
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="将按以下要求生成文章并扣取 AI 生成费，生成结果会追加到正文编辑器。"
        />
        <TextArea
          rows={5}
          value={aiPrompt}
          placeholder="例如：写一篇关于古代汉语声调演变的科普文章，1500字左右，结构清晰，适合入门读者。"
          onChange={(e) => setAiPrompt(e.target.value)}
        />
      </Modal>
    </Card>
  );
};

export default ArticleEditPage;

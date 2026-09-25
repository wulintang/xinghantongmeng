import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Flex,
  Input,
  Modal,
  Select,
  Spin,
  Typography,
  message,
} from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';

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

const { Text } = Typography;
const { TextArea } = Input;
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
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [content, setContent] = useState('');

  const [aiModal, setAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [keywordsLoading, setKeywordsLoading] = useState(false);

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

  const onUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
    if (!key) {
      message.error('请先登录');
      return;
    }
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const r = await uploadColumnImg(key, file);
          if (r.code === 1 && r.data?.url) return r.data.url;
          throw new Error(r.msg || '上传失败');
        })
      );
      callback(urls);
    } catch (e: any) {
      message.error(e?.message || '上传失败');
    }
  };

  const countZh = (s: string) => (s.match(/[一-龥]/g) || []).length;

  const onAiSummary = () => {
    if (!key) {
      message.error('请先登录');
      return;
    }
    setSummaryLoading(true);
    aiSummary({ key, title, content })
      .then((r) => {
        if (r.code === 1 && r.data?.description) {
          setDescription(r.data.description);
          message.success('已生成摘要');
        } else {
          message.error(r.msg || '生成失败');
        }
      })
      .catch((e) => message.error(e?.message || '生成失败'))
      .finally(() => setSummaryLoading(false));
  };

  const onAiKeywords = () => {
    if (!key) {
      message.error('请先登录');
      return;
    }
    setKeywordsLoading(true);
    aiSummary({ key, title, content })
      .then((r) => {
        if (r.code === 1 && r.data?.keywords) {
          setKeywords(r.data.keywords);
          message.success('已生成关键词');
        } else {
          message.error(r.msg || '生成失败');
        }
      })
      .catch((e) => message.error(e?.message || '生成失败'))
      .finally(() => setKeywordsLoading(false));
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
      <div className="article-edit-fullscreen">
        <Alert type="info" showIcon message="请先登录" description="登录后可投稿或编辑文章。" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="article-edit-fullscreen">
        <Flex justify="center" style={{ padding: 40 }}>
          <Spin />
        </Flex>
      </div>
    );
  }

  if (myColumns.length === 0) {
    return (
      <div className="article-edit-fullscreen">
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
      </div>
    );
  }

  return (
    <div className="article-edit-fullscreen">
      <div className="article-edit-top">
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Title level={5} style={{ margin: 0 }}>
            {isEdit ? '编辑文章' : '投稿文章'}
          </Title>
          <Flex gap={8} wrap>
            <Button type="primary" loading={saving} onClick={onSubmit}>
              {isEdit ? '提交修改' : '提交审核'}
            </Button>
            <Button onClick={() => navigate('/user/columns')}>取消</Button>
          </Flex>
        </Flex>

        {minChars > 0 ? (
          <Alert
            type="info"
            showIcon
            message={`正文最少需 ${minChars} 个中文字（防水贴），当前 ${countZh(content)} 字`}
          />
        ) : null}

        <Flex gap={16} wrap>
          <Flex vertical gap={6} style={{ flex: '2 1 280px', minWidth: 240 }}>
            <Text strong>文章标题</Text>
            <Input
              value={title}
              maxLength={100}
              placeholder="文章标题"
              onChange={(e) => setTitle(e.target.value)}
            />
          </Flex>
          <Flex vertical gap={6} style={{ flex: '1 1 200px', minWidth: 180 }}>
            <Text strong>所属专栏</Text>
            <Select
              value={tid || undefined}
              placeholder="所属专栏"
              onChange={(v) => setTid(v)}
              style={{ width: '100%' }}
              options={myColumns.map((c) => ({
                value: c.article_cate_id || c.id,
                label: c.name,
              }))}
            />
          </Flex>
        </Flex>

        <Flex vertical gap={6}>
          <Text strong>关键词</Text>
          <Flex gap={8} align="center">
            <Input
              value={keywords}
              maxLength={100}
              placeholder="用空格或逗号分隔"
              onChange={(e) => setKeywords(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button size="small" loading={keywordsLoading} onClick={onAiKeywords}>
              AI 生成
            </Button>
          </Flex>
        </Flex>

        <Flex vertical gap={6}>
          <Text strong>摘要</Text>
          <Flex gap={8} align="center">
            <TextArea
              rows={2}
              maxLength={200}
              value={description}
              placeholder="一句话摘要"
              onChange={(e) => setDescription(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button size="small" loading={summaryLoading} onClick={onAiSummary}>
              AI 生成
            </Button>
          </Flex>
        </Flex>
      </div>

      <div className="article-edit-editor">
        <Flex align="center" justify="space-between" wrap gap={8}>
          <Text strong>正文（Markdown）</Text>
          <Button type="primary" ghost size="small" loading={genLoading} onClick={() => setAiModal(true)}>
            AI 写文章
          </Button>
        </Flex>
        <MdEditor modelValue={content} onChange={setContent} preview="live" onUploadImg={onUploadImg} />
      </div>

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
    </div>
  );
};

export default ArticleEditPage;

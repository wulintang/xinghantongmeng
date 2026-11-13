import React, { useEffect, useMemo, useState } from 'react';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import {
  Button, Card, Form, Input, InputNumber, Modal, Select, Space, Spin, Switch, Tabs, Typography, Upload, message,
} from 'antd';
import { PlusOutlined, UploadOutlined, DownloadOutlined, FileTextOutlined, CodeOutlined } from '@ant-design/icons';
import { addSkill, editSkill, getTool, getToolCates, importSkillFromGit, uploadFile, type CateItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import {
  ensureFieldsDeclared, FIELDS_SNIPPET, parseSkillFieldsFromMd,
  SKILL_MD_PLACEHOLDER, SKILL_MD_TEMPLATE, skillMdFromObject,
} from '@/utils/skillDoc';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useTheme } from '@/context/ThemeProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;

/** 一键导入弹窗里的 JSON 示例：导入后会被转成一份 SKILL.md 原文，不再拆成 7 个表单框 */
const JSON_EXAMPLE = `{
  "title": "文章润色",
  "alias": "polish",
  "tid": 3,
  "pic": "",
  "instruction": "把下面文章改成更书面、逻辑更清晰、保留原意，语气风格为{语气风格}。\n\n原文：\n{原文}",
  "whenUse": "已有草稿需要润色、纠错、提升可读性时使用。",
  "whenNot": "需要从零原创写作时请用其他技能。",
  "params": [
    { "name": "article", "label": "原文", "type": "textarea", "example": "今天天气很好，我们去公园玩。" },
    { "name": "tone", "label": "语气风格", "type": "select", "options": ["正式", "轻松", "专业"], "example": "正式" }
  ],
  "outputFormat": "只返回润色后的全文，不要解释。",
  "example": "原文：今天天气很好，我们去公园玩。",
  "rmb": 0,
  "export_rmb": 0
}`;

const genInitialIcon = (text: string): Promise<File> => {
  const ch = (text.trim()[0] || 'S').toUpperCase();
  const palette = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d', '#2f54eb'];
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  const bg = palette[hash % palette.length];
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/><text x="32" y="33" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="32" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${esc(ch)}</text></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return Promise.resolve(new File([blob], `${Date.now()}.svg`, { type: 'image/svg+xml' }));
};

const SubmitSkillPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = !!editId;
  usePageMeta({ title: isEdit ? '编辑技能' : '提交技能' });
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { dark } = useTheme();
  const [editLoading, setEditLoading] = useState(false);

  const [cates, setCates] = useState<CateItem[]>([]);
  const [catesLoading, setCatesLoading] = useState(true);
  const [pic, setPic] = useState('');
  const [isUserPic, setIsUserPic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 技能正文：一份 SKILL.md 原文。md 本身就是唯一数据源，不再拆成 7 个 state 再拼回去。
  const [skillMd, setSkillMd] = useState('');
  const [rmb, setRmb] = useState(0);
  // 导出技能独立收费（与使用价互不影响）：作者可在此设定导出一次金额
  const [exportRmb, setExportRmb] = useState(0);
  // 导出权限默认关闭，作者在提交页或「我的技能」里主动开启
  const [allowExport, setAllowExport] = useState(false);

  // 导入区
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [gitToken, setGitToken] = useState('');
  const [gitPrivate, setGitPrivate] = useState(false);
  const [gitLoading, setGitLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    getToolCates()
      .then((r) => { if (alive && r.code === 1 && Array.isArray(r.data)) setCates(r.data); })
      .catch(() => {})
      .finally(() => alive && setCatesLoading(false));
    return () => { alive = false; };
  }, []);

  // 编辑模式：按 toolbox_id 拉取已通过技能回填表单
  useEffect(() => {
    if (!isEdit || !editId) return;
    const key = getToken();
    if (!key) return;
    setEditLoading(true);
    getTool(editId, key)
      .then((r) => {
        if (r.code === 1 && r.data) {
          const t = r.data;
          if (t.title) form.setFieldValue('title', t.title);
          if (t.alias) form.setFieldValue('alias', t.alias);
          if (t.tid) form.setFieldValue('tid', Number(t.tid));
          setPic(t.pic || '');
          setRmb(parseFloat(t.rmb) || 0);
          setExportRmb(parseFloat(t.export_rmb) || 0);
          setAllowExport(Number(t.allow_export) === 1);
          // 整份 md 原文直接灌进正文框（老技能若只有结构化 fields，自动补一段显式声明）
          if (t.content) setSkillMd(ensureFieldsDeclared(t.content, t.fields));
        } else {
          message.error(r.msg || '加载失败');
        }
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setEditLoading(false));
  }, [isEdit, editId]);

  // 实时识别：md 里的「## 参数」声明直接决定前台填写表单，作者所见即使用者所得
  const parsedFields = useMemo(() => parseSkillFieldsFromMd(skillMd), [skillMd]);

  const doUpload = (file: File) => {
    const key = getToken();
    if (!key) { message.warning('请先登录'); return; }
    setUploading(true);
    uploadFile(key, file)
      .then((r) => {
        if (r.code === 1 && r.data?.url) { setPic(r.data.url); setIsUserPic(true); message.success('上传成功'); }
        else message.error(r.msg || '上传失败');
      })
      .catch(() => message.error('上传失败'))
      .finally(() => setUploading(false));
  };

  const onFinish = async (values: { title: string; alias: string; tid?: number }) => {
    const key = getToken();
    if (!key) { message.warning('请先登录'); return; }
    if (!skillMd.trim()) { message.warning('请填写或上传技能正文 SKILL.md'); return; }
    setSubmitting(true);
    try {
      let finalPic = pic;
      if (!isUserPic) {
        const name = values.title || values.alias || 'S';
        const file = await genInitialIcon(name);
        const up = await uploadFile(key, file);
        if (up.code === 1 && up.data?.url) finalPic = up.data.url;
        else { message.error(up.msg || '自动生成图标失败'); setSubmitting(false); return; }
      }
      // md 原文原样提交；字段表从 md 的「## 参数」显式声明解析，老写法交给后端兼容兜底
      const content = skillMd.trim();
      const fields = parsedFields.length ? JSON.stringify(parsedFields) : '';
      const r = isEdit
        ? await editSkill(key, { id: Number(editId), title: values.title, pic: finalPic, tid: values.tid ?? 0, rmb, export_rmb: exportRmb, content, fields, allow_export: allowExport ? 1 : 0 })
        : await addSkill(key, { title: values.title, alias: values.alias, tid: values.tid ?? 0, pic: finalPic, content, rmb, export_rmb: exportRmb, fields, allow_export: allowExport ? 1 : 0 });
      if (r.code === 1) { message.success(r.msg || (isEdit ? '已提交重新审核，等待管理员审核' : '提交成功，等待审核')); navigate('/user/skills'); }
      else message.error(r.msg || (isEdit ? '保存失败' : '提交失败'));
    } catch {
      message.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== 一键导入解析 =====
  const parseImport = () => {
    const text = importText.trim();
    if (!text) { message.warning('请先粘贴内容'); return; }
    try {
      if (text.startsWith('{')) {
        fillFromObject(JSON.parse(text));
      } else {
        // Markdown 原文直接进正文框，不再拆成 7 个表单分区
        setSkillMd(text);
        const h1 = text.match(/^#\s+(.+)$/m);
        if (h1) form.setFieldValue('title', h1[1].trim());
      }
      message.success('已导入技能正文');
      setImportOpen(false);
    } catch {
      message.error('解析失败，请检查格式');
    }
  };

  const handleGitImport = async () => {
    const url = gitUrl.trim();
    if (!url) { message.warning('请填写 Git 仓库地址'); return; }
    setGitLoading(true);
    try {
      const r = await importSkillFromGit(url, gitPrivate ? gitToken.trim() : '', gitPrivate);
      if (r.code === 1 && r.data) {
        fillFromObject(r.data);
        message.success('已从 Git 仓库导入技能正文');
        setImportOpen(false);
      } else {
        message.error(r.msg || '导入失败');
      }
    } catch (e: any) {
      message.error(e?.message || '导入失败，请检查仓库地址或网络');
    } finally {
      setGitLoading(false);
    }
  };

  /** JSON 模板 / Git 仓库返回的结构化数据 → 一份 SKILL.md 原文；元数据仍回填到底部表单 */
  const fillFromObject = (obj: any) => {
    if (obj.title) form.setFieldValue('title', obj.title);
    if (obj.alias) form.setFieldValue('alias', obj.alias);
    if (obj.tid) form.setFieldValue('tid', Number(obj.tid));
    if (obj.pic) setPic(String(obj.pic));
    if (typeof obj.rmb === 'number') setRmb(obj.rmb);
    if (typeof obj.export_rmb === 'number') setExportRmb(obj.export_rmb);
    setSkillMd(skillMdFromObject(obj));
  };

  const downloadTemplate = () => {
    const blob = new Blob([JSON_EXAMPLE], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'skill-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMdTemplate = () => {
    const blob = new Blob([SKILL_MD_TEMPLATE], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'SKILL.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const readMdFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setSkillMd(text);
      const h1 = text.match(/^#\s+(.+)$/m);
      if (h1) form.setFieldValue('title', h1[1].trim());
      message.success('已载入 SKILL.md');
    };
    reader.readAsText(file);
    return false;
  };

  const insertFieldsSnippet = () => {
    if (/^##\s*(参数|字段|输入项|Fields|Inputs)/im.test(skillMd)) {
      message.info('正文里已有「## 参数」段');
      return;
    }
    setSkillMd((prev) => `${(prev || '').replace(/\s+$/, '')}\n\n${FIELDS_SNIPPET}`);
  };

  const TYPE_TEXT: Record<string, string> = {
    text: '单行', textarea: '多行', select: '下拉', radio: '单选', date: '日期', time: '时间',
  };

  return (
    <Card className="user-center-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? '编辑技能' : '提交技能'}</Title>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>一键导入</Button>
          {!isEdit && <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>下载模板</Button>}
        </Space>
      </div>
      <Text type="secondary">技能正文是一份 SKILL.md：可上传 .md、从 Git 仓库导入或直接粘贴；在「## 参数」段里声明要填什么，系统据此生成运行界面。名称、分类等基本信息在下方填写。</Text>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 480px', minWidth: 320 }}>
          <Spin spinning={catesLoading || editLoading}>
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item label="技能名称" name="title" rules={[{ required: true, message: '请输入技能名称' }]}>
                <Input placeholder="例如：文章润色" />
              </Form.Item>
              <Form.Item label="调用标识（alias）" name="alias" rules={[
                { required: true, message: '请输入调用标识' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '只能含字母、数字、下划线' },
              ]}>
                <Input placeholder="例如：polish（唯一，作为工具地址）" disabled={isEdit} />
              </Form.Item>
              <Form.Item label="技能分类" name="tid" rules={[{ required: true, message: '请选择技能分类' }]}>
                <Select placeholder="选择技能分类" loading={catesLoading}>
                  {cates.map((c) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                </Select>
              </Form.Item>
              <Form.Item label="技能图标" required>
                <Space wrap>
                  <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => { doUpload(file); return false; }}>
                    <Button size="small" loading={uploading} icon={<UploadOutlined />}>上传图标</Button>
                  </Upload>
                  {pic ? <img src={pic} alt="pic" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} /> : null}
                </Space>
                <div style={{ marginTop: 4, color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)' }}>未手动上传则提交时自动按当前名称生成首字图标</div>
              </Form.Item>

              <Form.Item label="技能正文（SKILL.md）" required>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Space wrap size="small">
                    <Upload accept=".md,.markdown,.txt" showUploadList={false} beforeUpload={readMdFile}>
                      <Button size="small" icon={<UploadOutlined />}>上传 .md</Button>
                    </Upload>
                    <Button size="small" icon={<FileTextOutlined />} onClick={() => setImportOpen(true)}>一键导入 / Git 仓库</Button>
                    <Button size="small" icon={<CodeOutlined />} onClick={insertFieldsSnippet}>插入参数模板</Button>
                    <Button size="small" onClick={() => setSkillMd(SKILL_MD_TEMPLATE)}>填入示例</Button>
                    <Button size="small" type="link" onClick={downloadMdTemplate}>下载 SKILL.md 模板</Button>
                  </Space>
                  <div className="rx-md-view">
                    <MdEditor modelValue={skillMd} onChange={setSkillMd} preview="live" theme={dark ? 'dark' : 'light'} />
                  </div>
                  <div style={{ color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)', lineHeight: 1.7 }}>
                    正文自由写；用户要填什么，在 <code>## 参数</code> 段里逐行声明即可。
                    <code>- 字段名：单行/多行/下拉/单选/日期/时间，必填，示例 xxx</code>。
                    这份 md 会原样保存，导出时也是同一份，不再拆分、拼装或反猜。
                  </div>
                  <div className="skill-doc-fields">
                    <Text strong style={{ fontSize: 'var(--fs-sm)' }}>
                      自动识别的字段（{parsedFields.length}）
                    </Text>
                    {parsedFields.length ? (
                      <Space wrap size={[6, 6]} style={{ marginTop: 6 }}>
                        {parsedFields.map((f, i) => (
                          <span className="skill-doc-field" key={`${f.name}-${i}`}>
                            {f.label}{f.required ? ' *' : ''} · {TYPE_TEXT[f.type] || f.type}
                            {(f.options || []).length ? `（${(f.options || []).join(' / ')}）` : ''}
                          </span>
                        ))}
                      </Space>
                    ) : (
                      <div style={{ color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)', marginTop: 4 }}>
                        未声明「## 参数」段：老技能会按历史写法兼容解析；新技能建议显式声明，表单才完全可控。
                      </div>
                    )}
                  </div>
                </Space>
              </Form.Item>
              <Form.Item label="使用一次金额（元）" required>
                <InputNumber min={0} precision={2} step={0.01} value={rmb} onChange={(v) => setRmb(typeof v === 'number' ? v : 0)} style={{ width: '100%', maxWidth: 200 }} addonAfter="元/次" />
                <div style={{ marginTop: 4, color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)' }}>0 表示免费；大于 0 时，使用者每次运行按此金额从余额扣费（免费次数上限由站点统一配置）。</div>
              </Form.Item>

              <Form.Item label="导出一次金额（元）">
                <InputNumber min={0} precision={2} step={0.01} value={exportRmb} onChange={(v) => setExportRmb(typeof v === 'number' ? v : 0)} style={{ width: '100%', maxWidth: 200 }} addonAfter="元/次" />
                <div style={{ marginTop: 4, color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)' }}>0 表示免费；大于 0 时，使用者每次导出该技能 SKILL.md 按此金额从余额扣费。开启「允许导出」后此价格对外可见。</div>
              </Form.Item>

              <Form.Item label="允许导出技能（SKILL.md）">
                <Space size={8} wrap>
                  <Switch checked={allowExport} onChange={setAllowExport} />
                  <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>
                    默认关闭。开启后，技能详情页才显示「导出技能」按钮；也可稍后在「我的技能」里逐个设置。
                  </Text>
                </Space>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} icon={<PlusOutlined />}>{isEdit ? '提交重新审核' : '提交审核'}</Button>
              </Form.Item>
            </Form>
          </Spin>
        </div>

      </div>

      <Modal open={importOpen} title="一键导入技能定义" onCancel={() => setImportOpen(false)} footer={null} width={560}>
        <Tabs defaultActiveKey="git" items={[
          {
            key: 'git',
            label: 'Git 仓库导入',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="粘贴标准 agent skill 仓库地址，如 https://cnb.cool/ytecn/zblog-agent-skills"
                />
                <Space>
                  <Switch checked={gitPrivate} onChange={setGitPrivate} />
                  <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>私有仓库（需填访问令牌）</Text>
                </Space>
                {gitPrivate ? (
                  <Input.Password
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                    placeholder="填写私有仓库访问令牌"
                  />
                ) : null}
                <Button type="primary" loading={gitLoading} block onClick={handleGitImport}>
                  {gitPrivate ? '拉取并填充' : '直接导入（公开仓库）'}
                </Button>
                <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>支持 GitHub / Gitee / cnb.cool / GitLab / 自建等任意标准 git 仓库；公开仓库无需令牌，粘贴地址即可直接导入。</Text>
              </Space>
            ),
          },
          {
            key: 'paste',
            label: '粘贴 / 上传导入',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div className="verify-code-block" style={{ position: 'relative' }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-2)', marginBottom: 4 }}>
                    JSON 示例（点击右侧复制）
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      color: 'var(--c-text)',
                      fontSize: 'var(--fs-xs)',
                      lineHeight: 'var(--lh-base)',
                      maxHeight: 160,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {JSON_EXAMPLE}
                  </pre>
                  <Text
                    copyable={{ text: JSON_EXAMPLE }}
                    style={{ position: 'absolute', top: 8, right: 8, color: 'var(--c-link)' }}
                  />
                </div>
                <Input.TextArea rows={5} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="在此粘贴 JSON 或 Markdown…" />
                <Upload accept=".json,.md,.txt,.markdown" showUploadList={false} beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = () => { setImportText(String(reader.result || '')); };
                  reader.readAsText(file);
                  return false;
                }}>
                  <Button icon={<UploadOutlined />}>选择本地文件</Button>
                </Upload>
                <Button type="primary" block onClick={parseImport}>解析填充</Button>
              </Space>
            ),
          },
        ]} />
      </Modal>
    </Card>
  );
};

export default SubmitSkillPage;

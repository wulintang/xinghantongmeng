import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, Card, Form, Input, InputNumber, Modal, Select, Space, Spin, Switch, Tabs, Typography, Upload, message,
} from 'antd';
import { PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { addSkill, editSkill, getTool, getToolCates, importSkillFromGit, uploadFile, type CateItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useNavigate, useSearchParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

// 一键导入的 JSON 与之对应；params 支持 type：text(单行) / textarea(多行) / select(下拉) / radio(单选) / date / time
// select / radio 需带 options 数组。提交时 params 被序列化进 content 的自然语言参数行，由后端按类型渲染。
const JSON_EXAMPLE = `{
  "title": "文章润色",
  "alias": "polish",
  "tid": 3,
  "pic": "",
  "instruction": "把下面文章改成更书面、逻辑更清晰、保留原意，语气风格为{语气风格}。\n\n原文：\n{原文}",
  "whenUse": "已有草稿需要润色、纠错、提升可读性时使用。",
  "whenNot": "需要从零原创写作时请用其他技能。",
  "params": [
    { "name": "article", "label": "原文", "type": "textarea" },
    { "name": "tone", "label": "语气风格", "type": "select", "options": ["正式", "轻松", "专业"] }
  ],
  "outputFormat": "只返回润色后的全文，不要解释。",
  "example": "原文：今天天气很好，我们去公园玩。",
  "rmb": 0
}`;

type ParamType = 'text' | 'textarea' | 'select' | 'radio' | 'date' | 'time';
type ParamRow = { name: string; label: string; type: ParamType; options: string[] };

const serializeParams = (ps: ParamRow[]): string =>
  ps
    .map((p) => {
      const label = p.label.trim() || p.name.trim();
      if (!label) return '';
      const opts = (p.options || []).filter(Boolean);
      switch (p.type) {
        case 'textarea':
          return `${label}：用户可以填写${label}。`;
        case 'select':
        case 'radio': {
          if (opts.length < 2) return `${label}：用户选择${label}。`;
          const head = opts.slice(0, -1).join('、');
          const tail = opts[opts.length - 1];
          const joined = opts.length > 2 ? `${head}、或${tail}` : `${head}或${tail}`;
          return `${label}：用户选择${label}（${joined}）。`;
        }
        case 'date':
          return `${label}：用户选择${label}日期。`;
        case 'time':
          return `${label}：用户选择${label}时间。`;
        case 'text':
        default:
          return `${label}：用户输入${label}。`;
      }
    })
    .filter(Boolean)
    .join('\n');

const TEXTAREA_HINT = /(描述|要求|需求|内容|详情|分析|特长|条款|理由|经历|方案|计划|建议|说明|备注|经验|技能|行为|原因|影响|措施|承诺|信息|标的|付款方式|感受|总结|反馈|意见|问题|具体)/;

const parseParamsFromText = (text: string): ParamRow[] => {
  const out: ParamRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const s = raw.trim();
    if (!s || s.startsWith('#')) continue;
    if (/^开始生成[：:]/.test(s)) continue;
    const m = s.match(/^(.+?)[：:]\s*用户(?:可以)?(输入|选择|填写)(.*)$/);
    if (!m) continue;
    const label = m[1].trim();
    const action = m[2];
    const rest = m[3].trim();
    if (!label) continue;
    let type: ParamType = 'text';
    let options: string[] = [];
    if (action === '填写' || TEXTAREA_HINT.test(label)) {
      type = 'textarea';
    }
    if (action === '选择') {
      if (/(日期|date)/i.test(`${label} ${rest}`)) type = 'date';
      else if (/(时间|time)/i.test(`${label} ${rest}`)) type = 'time';
      else {
        const om = rest.match(/[（(]([^)）]+)[)）]/);
        if (om) {
          options = om[1].split(/[,，、]|或|或者|\/|\|/).map((x) => x.trim()).filter(Boolean);
          type = options.length === 2 ? 'radio' : 'select';
        } else {
          type = 'select';
        }
      }
    }
    out.push({ name: label, label, type, options });
  }
  return out.length ? out : [{ name: '', label: '', type: 'text', options: [] }];
};

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
  const [editLoading, setEditLoading] = useState(false);

  const [cates, setCates] = useState<CateItem[]>([]);
  const [catesLoading, setCatesLoading] = useState(true);
  const [pic, setPic] = useState('');
  const [isUserPic, setIsUserPic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 表单其余可见字段（不直接走 Form.Item 受控，便于实时预览拼装）
  const [instruction, setInstruction] = useState('');
  const [whenUse, setWhenUse] = useState('');
  const [whenNot, setWhenNot] = useState('');
  const [params, setParams] = useState<ParamRow[]>([{ name: '', label: '', type: 'text', options: [] }]);
  const [outputFormat, setOutputFormat] = useState('');
  const [example, setExample] = useState('');
  const [rmb, setRmb] = useState(0);

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
          if (t.content) fillFromMarkdown(t.content);
        } else {
          message.error(r.msg || '加载失败');
        }
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setEditLoading(false));
  }, [isEdit, editId]);

  // 实时拼装预览
  const watchedTitle = Form.useWatch('title', form) || '';
  const assembled = useMemo(() => {
    const lines: string[] = [];
    const title = watchedTitle || '';
    if (title) lines.push(`# ${title}`, '');
    if (instruction.trim()) lines.push(instruction.trim(), '');
    if (whenUse.trim()) lines.push('## 何时使用', whenUse.trim(), '');
    if (whenNot.trim()) lines.push('## 何时不使用', whenNot.trim(), '');
    const validParams = params.filter((p) => p.name.trim() || p.label.trim());
    if (validParams.length) {
      lines.push(serializeParams(validParams));
      lines.push('');
    }
    if (outputFormat.trim()) lines.push('## 输出格式', outputFormat.trim(), '');
    if (example.trim()) lines.push('## 示例', example.trim(), '');
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }, [watchedTitle, instruction, whenUse, whenNot, params, outputFormat, example]);

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
    if (!assembled) { message.warning('请填写指令模板'); return; }
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
      const r = isEdit
        ? await editSkill(key, { id: Number(editId), title: values.title, pic: finalPic, tid: values.tid ?? 0, rmb, content: assembled })
        : await addSkill(key, { title: values.title, alias: values.alias, tid: values.tid ?? 0, pic: finalPic, content: assembled, rmb });
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
        const obj = JSON.parse(text);
        fillFromObject(obj);
      } else {
        fillFromMarkdown(text);
      }
      message.success('已填充表单');
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
        const d = r.data;
        if (d.title) form.setFieldValue('title', d.title);
        if (d.instruction) setInstruction(d.instruction);
        if (d.whenUse) setWhenUse(d.whenUse);
        if (d.whenNot) setWhenNot(d.whenNot);
        if (Array.isArray(d.params) && d.params.length) {
          setParams(d.params.map((p: any) => ({
            name: String(p.name || ''),
            label: String(p.label || ''),
            type: (['text', 'textarea', 'select', 'radio', 'date', 'time'].includes(p.type) ? p.type : 'text') as ParamType,
            options: Array.isArray(p.options) ? p.options.map(String) : [],
          })));
        } else {
          setParams([{ name: '', label: '', type: 'text', options: [] }]);
        }
        message.success('已从 Git 仓库导入并填充表单');
        setImportOpen(false);
      } else {
        message.error(r.msg || '导入失败');
      }
    } catch {
      message.error('导入失败，请检查仓库地址或网络');
    } finally {
      setGitLoading(false);
    }
  };

  const fillFromObject = (obj: any) => {
    if (obj.title) form.setFieldValue('title', obj.title);
    if (obj.alias) form.setFieldValue('alias', obj.alias);
    if (obj.tid) form.setFieldValue('tid', Number(obj.tid));
    if (obj.pic) setPic(String(obj.pic));
    if (obj.instruction) setInstruction(String(obj.instruction));
    if (obj.whenUse) setWhenUse(String(obj.whenUse));
    if (obj.whenNot) setWhenNot(String(obj.whenNot));
    if (Array.isArray(obj.params) && obj.params.length) {
      setParams(obj.params.map((p: any) => ({
        name: String(p.name || ''),
        label: String(p.label || ''),
        type: (['text', 'textarea', 'select', 'radio', 'date', 'time'].includes(p.type) ? p.type : 'text') as ParamType,
        options: Array.isArray(p.options) ? p.options.map(String) : [],
      })));
    } else {
      setParams([{ name: '', label: '', type: 'text', options: [] }]);
    }
    if (obj.outputFormat) setOutputFormat(String(obj.outputFormat));
    if (obj.example) setExample(String(obj.example));
    if (typeof obj.rmb === 'number') setRmb(obj.rmb);
  };

  const fillFromMarkdown = (text: string) => {
    const lines = text.split(/\r?\n/);
    let title = '';
    let buf: string[] = [];
    const section: Record<string, string[]> = {};
    let cur = '';
    for (const ln of lines) {
      const h1 = ln.match(/^#\s+(.*)$/);
      const h2 = ln.match(/^##\s+(.*)$/);
      if (h1) { title = h1[1].trim(); continue; }
      if (h2) { section[cur] = buf; cur = h2[1].trim(); buf = []; continue; }
      buf.push(ln);
    }
    section[cur] = buf;
    if (title) form.setFieldValue('title', title);
    const norm = (s?: string) => (s ? s.trim() : '');
    setInstruction(norm((section['指令模板'] || section[''] || []).join('\n')));
    setWhenUse(norm(section['何时使用']?.join('\n')));
    setWhenNot(norm(section['何时不使用']?.join('\n')));
    setOutputFormat(norm(section['输出格式']?.join('\n')));
    setExample(norm(section['示例']?.join('\n')));
    const psRaw = section['参数'] || [];
    const psBlock = psRaw.join('\n');
    const jm = psBlock.match(/```json\s*([\s\S]*?)\s*```/);
    if (jm) {
      try {
        const arr = JSON.parse(jm[1]);
        if (Array.isArray(arr) && arr.length) {
          setParams(arr.map((p: any) => ({
            name: String(p.name || ''),
            label: String(p.label || ''),
            type: (['text', 'textarea', 'select', 'radio', 'date', 'time'].includes(p.type) ? p.type : 'text') as ParamType,
            options: Array.isArray(p.options) ? p.options.map(String) : [],
          })));
        } else {
          setParams(parseParamsFromText(text));
        }
      } catch {
        setParams(parseParamsFromText(text));
      }
    } else if (psRaw.length) {
      const ps = psRaw.map((l: string) => l.replace(/^[-*]\s*/, '')).filter(Boolean)
        .map((l: string) => { const [n, ...rest] = l.split('：'); return { name: (n || '').trim(), label: rest.join('：').trim(), type: 'textarea' as ParamType, options: [] as string[] }; });
      setParams(ps.length ? ps : parseParamsFromText(text));
    } else {
      setParams(parseParamsFromText(text));
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([JSON_EXAMPLE], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'skill-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateParam = (i: number, key: 'name' | 'label' | 'type' | 'options', val: any) => {
    setParams((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)));
  };

  const PARAM_TYPE_OPTIONS = [
    { value: 'text', label: '单行文本' },
    { value: 'textarea', label: '多行文本' },
    { value: 'select', label: '下拉选择' },
    { value: 'radio', label: '单选' },
    { value: 'date', label: '日期' },
    { value: 'time', label: '时间' },
  ];

  return (
    <Card className="user-center-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? '编辑技能' : '提交技能'}</Title>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>一键导入</Button>
          {!isEdit && <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>下载模板</Button>}
        </Space>
      </div>
      <Text type="secondary">填写结构化字段，由系统自动拼装为 AI 指令模板并生成运行界面；你也可以粘贴 JSON 或 Markdown 一键填充。</Text>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 480px', minWidth: 320 }}>
          <Spin spinning={catesLoading}>
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

              <Form.Item label="指令模板（prompt 本体）" required>
                <Input.TextArea rows={5} value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="描述这个技能要做什么、输入输出约束等。" />
              </Form.Item>
              <Form.Item label="何时使用">
                <Input.TextArea rows={2} value={whenUse} onChange={(e) => setWhenUse(e.target.value)} placeholder="选填" />
              </Form.Item>
              <Form.Item label="何时不使用">
                <Input.TextArea rows={2} value={whenNot} onChange={(e) => setWhenNot(e.target.value)} placeholder="选填" />
              </Form.Item>

              <Form.Item label="参数">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {params.map((p, i) => (
                    <Space key={i} wrap align="start">
                      <Input placeholder="参数名" value={p.name} onChange={(e) => updateParam(i, 'name', e.target.value)} style={{ width: 130 }} />
                      <Input placeholder="说明" value={p.label} onChange={(e) => updateParam(i, 'label', e.target.value)} style={{ width: 180 }} />
                      <Select value={p.type} onChange={(v) => updateParam(i, 'type', v)} style={{ width: 110 }} options={PARAM_TYPE_OPTIONS} />
                      {(p.type === 'select' || p.type === 'radio') && (
                        <Input
                          placeholder="选项，逗号分隔"
                          value={(p.options || []).join(', ')}
                          onChange={(e) => updateParam(i, 'options', e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean))}
                          style={{ width: 200 }}
                        />
                      )}
                      <Button size="small" danger onClick={() => setParams((prev) => prev.filter((_, idx) => idx !== i))} disabled={params.length === 1}>删除</Button>
                    </Space>
                  ))}
                  <Button size="small" icon={<PlusOutlined />} onClick={() => setParams((prev) => [...prev, { name: '', label: '', type: 'text', options: [] }])}>添加参数</Button>
                </Space>
              </Form.Item>

              <Form.Item label="输出格式">
                <Input.TextArea rows={2} value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} placeholder="选填" />
              </Form.Item>
              <Form.Item label="使用示例">
                <Input.TextArea rows={2} value={example} onChange={(e) => setExample(e.target.value)} placeholder="选填" />
              </Form.Item>
              <Form.Item label="使用一次金额（元）" required>
                <InputNumber min={0} precision={2} step={0.01} value={rmb} onChange={(v) => setRmb(typeof v === 'number' ? v : 0)} style={{ width: 200 }} addonAfter="元/次" />
                <div style={{ marginTop: 4, color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)' }}>0 表示免费；大于 0 时，使用者每次运行按此金额从余额扣费（免费次数上限由站点统一配置）。</div>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} icon={<PlusOutlined />}>{isEdit ? '提交重新审核' : '提交审核'}</Button>
              </Form.Item>
            </Form>
          </Spin>
        </div>

        <div style={{ flex: '1 1 360px', minWidth: 300 }}>
          <Text strong>实时预览（提交内容将拼装为以下 Markdown）</Text>
          <pre className="skill-preview" style={{
            marginTop: 'var(--space-2)', padding: 'var(--space-4)', background: 'var(--c-bg, #f7f8fa)',
            border: '1px solid var(--c-border, #eee)', borderRadius: 8, whiteSpace: 'pre-wrap',
            wordBreak: 'break-word', minHeight: 240, fontSize: 'var(--fs-sm)', lineHeight: 1.7,
          }}>{assembled || '填写左侧字段后，这里会实时显示拼好的内容…'}</pre>
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
                <Paragraph copyable={{ text: JSON_EXAMPLE }} className="verify-code-block" style={{ marginBottom: 0 }}>
                  <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>JSON 示例（点击右侧复制）</Text>
                </Paragraph>
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

import React, { useEffect, useState } from 'react';
import {
  Button, Card, Empty, Input, Modal, Select, Space, Spin, Tag, Typography, Upload, message,
} from 'antd';
import { EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import {
  editSkill, getMySkillApplies, getToolCates, uploadFile, type CateItem, type SkillApplyItem,
} from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const STATUS: Record<number, { color: string; label: string }> = {
  0: { color: 'orange', label: '待审' },
  1: { color: 'green', label: '通过' },
  2: { color: 'red', label: '拒绝' },
};

const MyToolsPage: React.FC = () => {
  usePageMeta({ title: '我的技能' });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<SkillApplyItem[]>([]);
  const [cates, setCates] = useState<CateItem[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SkillApplyItem | null>(null);
  const [eTitle, setETitle] = useState('');
  const [ePic, setEPic] = useState('');
  const [eContent, setEContent] = useState('');
  const [eRmb, setERmb] = useState(0);
  const [eTid, setETid] = useState<number | undefined>();
  const [eUploading, setEUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const key = getToken();
    if (!key) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getMySkillApplies(key),
      getToolCates(),
    ])
      .then(([r, c]) => {
        if (r.code === 1 && Array.isArray(r.data)) setList(r.data);
        if (c.code === 1 && Array.isArray(c.data)) setCates(c.data);
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openEdit = (item: SkillApplyItem) => {
    setEditing(item);
    setETitle(item.title);
    setEPic(item.pic);
    setEContent(item.content);
    setERmb(parseFloat(item.rmb) || 0);
    setETid(item.tid ? Number(item.tid) : undefined);
    setEditOpen(true);
  };

  const doUpload = (file: File) => {
    const key = getToken();
    if (!key) { message.warning('请先登录'); return; }
    setEUploading(true);
    uploadFile(key, file)
      .then((r) => { if (r.code === 1 && r.data?.url) { setEPic(r.data.url); message.success('上传成功'); } else message.error(r.msg || '上传失败'); })
      .catch(() => message.error('上传失败'))
      .finally(() => setEUploading(false));
  };

  const saveEdit = () => {
    const key = getToken();
    if (!key || !editing) return;
    if (!eTitle.trim()) { message.warning('请填写技能名称'); return; }
    if (!eContent.trim()) { message.warning('请填写指令模板'); return; }
    setSaving(true);
    editSkill(key, {
      id: editing.toolbox_id,
      title: eTitle,
      pic: ePic,
      tid: eTid ?? 0,
      rmb: eRmb,
      content: eContent,
    })
      .then((r) => {
        if (r.code === 1) { message.success(r.msg || '保存成功'); setEditOpen(false); load(); }
        else message.error(r.msg || '保存失败');
      })
      .catch(() => message.error('保存失败，请稍后重试'))
      .finally(() => setSaving(false));
  };

  return (
    <Card className="user-center-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>我的技能</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/user/submit-skill')}>提交技能</Button>
      </div>
      <Text type="secondary">提交后由管理员审核；通过即上线，拒绝会给出原因。已通过的技能可在此直接编辑（即时生效，无需重新审核）。</Text>

      <Spin spinning={loading}>
        {list.length === 0 && !loading ? (
          <Empty description="你还没有提交过技能" style={{ marginTop: 'var(--space-8)' }} />
        ) : (
          <Space direction="vertical" style={{ width: '100%', marginTop: 'var(--space-4)' }}>
            {list.map((it) => {
              const st = STATUS[it.status] || { color: 'default', label: '未知' };
              return (
                <Card key={it.id} size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {it.pic ? <img src={it.pic} alt={it.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} /> : null}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <Space wrap>
                        <Text strong>{it.title}</Text>
                        <Tag color={st.color}>{st.label}</Tag>
                        {it.rmb && Number(it.rmb) > 0 ? <Tag color="blue">¥{it.rmb}/次</Tag> : <Tag>免费</Tag>}
                      </Space>
                      <div style={{ color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)', marginTop: 2 }}>
                        {it.alias && <span>标识：{it.alias}　</span>}
                        <span>提交时间：{it.time ? new Date(it.time * 1000).toLocaleString() : '-'}</span>
                      </div>
                      {it.status === 2 && it.reason ? (
                        <Paragraph style={{ color: '#b91c1c', fontSize: 'var(--fs-sm)', margin: '4px 0 0' }}>
                          拒绝原因：{it.reason}
                        </Paragraph>
                      ) : null}
                    </div>
                    {it.status === 1 && it.toolbox_id > 0 ? (
                      <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(it)}>编辑</Button>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
      </Spin>

      <Modal open={editOpen} title={`编辑技能：${editing?.title || ''}`} onCancel={() => setEditOpen(false)} onOk={saveEdit} okText="保存" confirmLoading={saving} width={600}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>技能名称</Text>
            <Input value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="技能名称" />
          </div>
          <div>
            <Text>技能图标</Text>
            <Space wrap>
              <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => { doUpload(file); return false; }}>
                <Button size="small" loading={eUploading} icon={<UploadOutlined />}>上传图标</Button>
              </Upload>
              {ePic ? <img src={ePic} alt="pic" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} /> : null}
            </Space>
          </div>
          <div>
            <Text>技能分类</Text>
            <Select style={{ width: '100%' }} value={eTid} onChange={(v) => setETid(v)} placeholder="选择技能分类" allowClear>
              {cates.map((c) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </div>
          <div>
            <Text>指令模板（prompt 本体 / Markdown）</Text>
            <Input.TextArea rows={6} value={eContent} onChange={(e) => setEContent(e.target.value)} placeholder="技能说明 + 指令" />
          </div>
          <div>
            <Text>使用一次金额（元，0=免费）</Text>
            <Input style={{ width: 200 }} type="number" min={0} step={0.01} value={eRmb} onChange={(e) => setERmb(parseFloat(e.target.value) || 0)} addonAfter="元/次" />
          </div>
        </Space>
      </Modal>
    </Card>
  );
};

export default MyToolsPage;

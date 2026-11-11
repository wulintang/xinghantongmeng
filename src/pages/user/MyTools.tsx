import React, { useEffect, useState } from 'react';
import {
  Button, Card, Empty, InputNumber, Modal, Popconfirm, Space, Spin, Switch, Tag, Tooltip, Typography, message,
} from 'antd';
import { DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  delSkill, getMySkillApplies, setSkillExport, setSkillPrice, setSkillExportPrice, exportSkillDownload, type SkillApplyItem,
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
  const [delId, setDelId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 快捷设价：与「允许导出」同处管理，即时生效、不触发重新审核
  const [priceTarget, setPriceTarget] = useState<SkillApplyItem | null>(null);
  const [priceVal, setPriceVal] = useState<number>(0);
  const [priceSaving, setPriceSaving] = useState(false);
  const openPrice = (it: SkillApplyItem) => {
    setPriceTarget(it);
    setPriceVal(Number(it.rmb) || 0);
  };
  const savePrice = () => {
    if (!priceTarget) return;
    const key = getToken();
    if (!key) { message.warning('请先登录'); return; }
    setPriceSaving(true);
    setSkillPrice(key, priceTarget.id, priceVal)
      .then((r) => {
        if (r.code === 1) {
          setList((prev) => prev.map((x) => x.id === priceTarget.id ? { ...x, rmb: String(priceVal) } : x));
          message.success(r.msg || '已更新价格');
          setPriceTarget(null);
        } else message.error(r.msg || '设置失败');
      })
      .catch(() => message.error('设置失败'))
      .finally(() => setPriceSaving(false));
  };

  // 快捷设导出价：与「允许导出」同处管理，即时生效、不触发重新审核
  const [exportPriceTarget, setExportPriceTarget] = useState<SkillApplyItem | null>(null);
  const [exportPriceVal, setExportPriceVal] = useState<number>(0);
  const [exportPriceSaving, setExportPriceSaving] = useState(false);
  const openExportPrice = (it: SkillApplyItem) => {
    setExportPriceTarget(it);
    setExportPriceVal(Number(it.export_rmb) || 0);
  };
  const saveExportPrice = () => {
    if (!exportPriceTarget) return;
    const key = getToken();
    if (!key) { message.warning('请先登录'); return; }
    setExportPriceSaving(true);
    setSkillExportPrice(key, exportPriceTarget.id, exportPriceVal)
      .then((r) => {
        if (r.code === 1) {
          setList((prev) => prev.map((x) => x.id === exportPriceTarget.id ? { ...x, export_rmb: String(exportPriceVal) } : x));
          message.success(r.msg || '已更新导出价格');
          setExportPriceTarget(null);
        } else message.error(r.msg || '设置失败');
      })
      .catch(() => message.error('设置失败'))
      .finally(() => setExportPriceSaving(false));
  };

  const load = () => {
    const key = getToken();
    if (!key) { setLoading(false); return; }
    setLoading(true);
    getMySkillApplies(key)
      .then((r) => {
        if (r.code === 1 && Array.isArray(r.data)) setList(r.data);
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const doDelete = (id: number) => {
    const key = getToken();
    if (!key) { message.warning('请先登录'); return; }
    setDeleting(true);
    setDelId(id);
    delSkill(key, id)
      .then((r) => {
        if (r.code === 1) { message.success(r.msg || '已删除'); load(); }
        else message.error(r.msg || '删除失败');
      })
      .catch(() => message.error('删除失败，请稍后重试'))
      .finally(() => { setDeleting(false); setDelId(null); });
  };

  // 作者逐个控制「允许导出」：同时影响前台详情页按钮与后端导出接口
  const toggleExport = (it: SkillApplyItem, allow: boolean) => {
    const key = getToken();
    if (!key) { message.warning('请先登录'); return; }
    setSkillExport(key, it.id, allow ? 1 : 0)
      .then((r) => {
        if (r.code === 1) {
          setList((prev) => prev.map((x) => x.id === it.id ? { ...x, allow_export: allow ? 1 : 0 } : x));
          message.success(r.msg || '已更新');
        } else message.error(r.msg || '设置失败');
      })
      .catch(() => message.error('设置失败'));
  };

  // 导出标准 Agent Skill（SKILL.md）：已上线走后端校验，草稿本地生成同格式
  const onExport = (it: SkillApplyItem) => {
    // 默认禁止导出；只有作者在这里主动打开、且后端 allow_export 严格为 1 才放行
    if (it.allow_export !== 1) { message.warning('该技能未开启导出权限，请先在上方打开「允许导出」'); return; }
    if (it.toolbox_id > 0) {
      const key = getToken() || '';
      exportSkillDownload(it.toolbox_id, key)
        .then(() => message.success('已导出 SKILL.md'))
        .catch((e) => message.error(e?.message || '导出失败'));
      return;
    }
    const raw = it.content || '';
    const lines = raw.split(/\r?\n/).filter((l) => !/^#\s+/.test(l));
    const body = lines.join('\n').trim();
    const wu = body.match(/##\s*何时使用\s*\r?\n([\s\S]*?)(?:\r?\n##\s|$)/);
    const description = (wu && wu[1].trim()) ? wu[1].trim() : (it.title || 'skill');
    const name = (it.alias || 'skill').toLowerCase().replace(/_/g, '-');
    const q = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, ' ')}"`;
    const md = `---\nname: ${q(name)}\ndescription: ${q(description)}\n---\n\n${body}\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SKILL.md';
    a.click();
    URL.revokeObjectURL(url);
    message.success('已导出 SKILL.md');
  };

  return (
    <Card className="user-center-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>我的技能</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/user/submit-skill')}>提交技能</Button>
      </div>
      <Text type="secondary">提交后由管理员审核；通过即上线，拒绝会给出原因。已通过的技能可在此重新编辑，修改后需再次审核通过才会更新上线（审核期间线上保留旧版），也可删除。</Text>

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
                        {it.rmb && Number(it.rmb) > 0 ? <Tag color="blue">使用¥{it.rmb}/次</Tag> : <Tag>使用免费</Tag>}
                        {it.export_rmb && Number(it.export_rmb) > 0 ? <Tag color="purple">导出¥{it.export_rmb}/次</Tag> : <Tag>导出免费</Tag>}
                        <Button size="small" type="link" style={{ padding: '0 4px' }} onClick={() => openPrice(it)}>使用设价</Button>
                      </Space>
                      <div style={{ color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)', marginTop: 2 }}>
                        {it.alias && <span>标识：{it.alias}　</span>}
                        <span>提交时间：{it.time ? new Date(it.time * 1000).toLocaleString() : '-'}</span>
                      </div>
                      {it.status === 2 && it.reason ? (
                        <Paragraph style={{ color: 'var(--capsule-danger)', fontSize: 'var(--fs-sm)', margin: '4px 0 0' }}>
                          拒绝原因：{it.reason}
                        </Paragraph>
                      ) : null}
                    </div>
                    <Space wrap>
                      {(it.status === 1 || it.status === 2) && it.toolbox_id > 0 ? (
                        <Button size="small" icon={<EditOutlined />} onClick={() => navigate('/user/submit-skill?id=' + it.toolbox_id)}>编辑</Button>
                      ) : null}
                      <Tooltip title="关闭后，技能详情页不再显示导出按钮，后端导出接口也会拒绝">
                        <Space size={4}>
                          <Switch size="small" checked={it.allow_export === 1} onChange={(v) => toggleExport(it, v)} />
                          <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>允许导出</Text>
                        </Space>
                      </Tooltip>
                      <Button size="small" type="link" style={{ padding: '0 4px' }} onClick={() => openExportPrice(it)}>导出设价</Button>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        disabled={it.allow_export !== 1}
                        onClick={() => onExport(it)}
                      >导出</Button>
                      <Popconfirm
                        title="确认删除该技能？"
                        description="删除后已上线技能也将从广场移除，且不可恢复。"
                        okText="删除"
                        okButtonProps={{ danger: true, loading: deleting && delId === it.id }}
                        cancelText="取消"
                        onConfirm={() => doDelete(it.id)}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
      </Spin>
      <Modal
        title={`设置使用价格：${priceTarget?.title ?? ''}`}
        open={!!priceTarget}
        onCancel={() => setPriceTarget(null)}
        onOk={savePrice}
        confirmLoading={priceSaving}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">设定使用者每次调用（运行）该技能需支付的金额（元）。免费请填 0。</Text>
          <InputNumber
            min={0}
            max={999999}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            value={priceVal}
            onChange={(v) => setPriceVal(typeof v === 'number' ? v : 0)}
            placeholder="0.00"
            prefix="¥"
          />
        </Space>
      </Modal>

      <Modal
        title={`设置导出价格：${exportPriceTarget?.title ?? ''}`}
        open={!!exportPriceTarget}
        onCancel={() => setExportPriceTarget(null)}
        onOk={saveExportPrice}
        confirmLoading={exportPriceSaving}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">设定使用者每次导出该技能 SKILL.md 需支付的金额（元）。免费请填 0。</Text>
          <InputNumber
            min={0}
            max={999999}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            value={exportPriceVal}
            onChange={(v) => setExportPriceVal(typeof v === 'number' ? v : 0)}
            placeholder="0.00"
            prefix="¥"
          />
        </Space>
      </Modal>
    </Card>
  );
};

export default MyToolsPage;

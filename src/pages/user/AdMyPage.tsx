import React, { useEffect, useState } from 'react';
import { Button, Card, Spin, Tag, Tabs, Popconfirm, message, Modal, Form, Input, Radio } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getToken } from '@/utils/auth';
import {
  getMyAds,
  getPrices,
  deleteApply,
  deleteGridApply,
  updateApply,
  updateGridApply,
  AD_STATUS_TEXT,
  type AdPayApply,
  type AdPayGridApply,
  type AdPayPosition,
  type AdPayGridConfig,
} from '@/services/adpay';
import CardTable from '@/components/common/CardTable';
import AdImgUpload from '@/components/common/AdImgUpload';

const STATUS_COLOR: Record<number, string> = {
  0: 'orange',
  1: 'green',
  2: 'red',
  3: 'blue',
  4: 'volcano',
};

export default function AdMyPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applies, setApplies] = useState<AdPayApply[]>([]);
  const [gridApplies, setGridApplies] = useState<AdPayGridApply[]>([]);
  const [positions, setPositions] = useState<AdPayPosition[]>([]);
  const [grids, setGrids] = useState<AdPayGridConfig[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editGrid, setEditGrid] = useState(false);
  const [editRecord, setEditRecord] = useState<AdPayApply | AdPayGridApply | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    if (!getToken()) {
      message.warning('请先登录');
      setLoading(false);
      return;
    }
    Promise.all([getMyAds(), getPrices()])
      .then(([my, prices]) => {
        if (my.code === 1 && my.data) {
          setApplies((my.data.applies || []).filter((a) => a.status !== 4));
          setGridApplies((my.data.gridApplies || []).filter((g) => g.status !== 4));
        } else if (my.code !== 1) {
          message.error(my.msg || '加载失败');
        }
        if (prices.code === 1 && prices.data) {
          setPositions(prices.data.positions || []);
          setGrids(prices.data.grids || []);
        }
      })
      .catch((e) => message.error(e?.message || '加载失败'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onDeleteApply = (id: number) => {
    deleteApply(id)
      .then((r) => {
        if (r.code === 1) {
          message.success('已删除');
          load();
        } else {
          message.error(r.msg || '删除失败');
        }
      })
      .catch((e) => message.error(e?.message || '删除失败'));
  };
  const onDeleteGrid = (id: number) => {
    deleteGridApply(id)
      .then((r) => {
        if (r.code === 1) {
          message.success('已删除');
          load();
        } else {
          message.error(r.msg || '删除失败');
        }
      })
      .catch((e) => message.error(e?.message || '删除失败'));
  };

  const openEdit = (r: AdPayApply) => {
    setEditRecord(r);
    setEditGrid(false);
    form.setFieldsValue({
      title: r.title,
      link: r.link,
      img: r.img,
      formType: r.content ? 'code' : 'image',
      content: r.content,
    });
    setEditOpen(true);
  };
  const openEditGrid = (r: AdPayGridApply) => {
    setEditRecord(r);
    setEditGrid(true);
    form.setFieldsValue({ title: r.title, link: r.link, img: r.img });
    setEditOpen(true);
  };
  const onEditOk = () => {
    form.submit();
  };
  const onEditFinish = (values: any) => {
    if (!editRecord) return;
    setEditLoading(true);
    const payload = editGrid
      ? { title: values.title, link: values.link, img: values.img }
      : {
          title: values.title,
          link: values.link,
          img: values.formType === 'image' ? values.img : '',
          content: values.formType === 'code' ? values.content : '',
        };
    const p = editGrid
      ? updateGridApply(editRecord.id, payload)
      : updateApply(editRecord.id, payload);
    p.then((r) => {
        if (r.code === 1) {
          message.success('已保存');
          setEditOpen(false);
          load();
        } else {
          message.error(r.msg || '保存失败');
        }
      })
      .catch((e) => message.error(e?.message || '保存失败'))
      .finally(() => setEditLoading(false));
  };

  const sysColumns = [
    { title: '广告位', dataIndex: 'position_name' },
    { title: '标题', dataIndex: 'title' },
    { title: '时长(天)', dataIndex: 'duration_day' },
    { title: '金额', dataIndex: 'amount', render: (v: string) => `¥${v}` },
    { title: '状态', dataIndex: 'status', render: (s: number) => <Tag color={STATUS_COLOR[s]}>{AD_STATUS_TEXT[s]}</Tag> },
    {
      title: '到期',
      dataIndex: 'end_time',
      render: (t: number) => (t ? new Date(t * 1000).toLocaleDateString() : '-'),
    },
    {
      title: '操作',
      render: (_: any, r: AdPayApply) => (
        <>
          <Button type="link" size="small" onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该广告申请？" onConfirm={() => onDeleteApply(r.id)} okText="删除" cancelText="取消">
            <Button danger size="small">
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];
  const gridColumns = [
    { title: '页面', dataIndex: 'page', render: (v: string) => (v === 'home' ? '首页底部' : '单页格子') },
    { title: '标题', dataIndex: 'title' },
    {
      title: '区域',
      render: (_: any, r: AdPayGridApply) => `(${r.x},${r.y}) 起 ${r.w}×${r.h}（${r.cells_count}格）`,
    },
    { title: '月数', dataIndex: 'duration_month' },
    { title: '金额', dataIndex: 'amount', render: (v: string) => `¥${v}` },
    { title: '状态', dataIndex: 'status', render: (s: number) => <Tag color={STATUS_COLOR[s]}>{AD_STATUS_TEXT[s]}</Tag> },
    {
      title: '到期',
      dataIndex: 'end_time',
      render: (t: number) => (t ? new Date(t * 1000).toLocaleDateString() : '-'),
    },
    {
      title: '操作',
      render: (_: any, r: AdPayGridApply) => (
        <>
          <Button type="link" size="small" onClick={() => openEditGrid(r)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该格子广告申请？" onConfirm={() => onDeleteGrid(r.id)} okText="删除" cancelText="取消">
            <Button danger size="small">
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];
  const applyList = [
    ...positions.map((p) => ({ key: `sys-${p.pkey}`, kind: 'sys', name: p.name, loc: `${p.page} / ${p.location}`, price: `¥${p.price_month}`, pkey: p.pkey })),
    ...grids.map((g) => ({ key: `grid-${g.page}`, kind: 'grid', name: g.page === 'home' ? '首页底部格子广告' : '单页格子广告', loc: '格子广告画布', price: `¥${g.price_per_cell}/格`, pkey: g.page })),
  ];
  const applyColumns = [
    { title: '广告位', dataIndex: 'name' },
    { title: '页面/位置', dataIndex: 'loc' },
    { title: '月价', dataIndex: 'price' },
    {
      title: '操作',
      render: (_: any, r: any) => (
        <Button type="link" onClick={() => navigate(r.kind === 'sys' ? `/user/ad/buy?slot=${r.pkey}` : '/grid')}>
          {r.kind === 'sys' ? '申请' : '申请格子广告'}
        </Button>
      ),
    },
  ];

  if (loading) return <Spin className="page-spin" />;

  return (
    <Card className="user-center-card">
      <Tabs
        items={[
          {
            key: 'mine',
            label: '我的广告位列表',
            children: (
              <>
                <Card title="系统广告" className="ad-my-section">
                  <CardTable<AdPayApply>
                    rowKey="id"
                    dataSource={applies}
                    columns={sysColumns}
                    locale={{ emptyText: '暂无申请' }}
                  />
                </Card>
                <Card
                  title="格子广告"
                  extra={<Button type="link" onClick={() => navigate('/grid')}>去格子广告页</Button>}
                >
                  <CardTable<AdPayGridApply>
                    rowKey="id"
                    dataSource={gridApplies}
                    columns={gridColumns}
                    locale={{ emptyText: '暂无申请' }}
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'apply',
            label: '可申请广告位',
            children: (
              <Card title="可申请广告位">
                <CardTable
                  rowKey="key"
                  dataSource={applyList}
                  columns={applyColumns}
                  locale={{ emptyText: '暂无可申请广告位' }}
                />
              </Card>
            ),
          },
        ]}
      />
      <Modal
        title={editGrid ? '编辑格子广告' : '编辑系统广告'}
        open={editOpen}
        onOk={onEditOk}
        onCancel={() => setEditOpen(false)}
        confirmLoading={editLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onEditFinish}>
          <Form.Item label="广告标题" name="title" rules={[{ required: true, message: '请输入广告标题' }]}>
            <Input placeholder="如：兴汉同盟官网" maxLength={60} />
          </Form.Item>
          <Form.Item label="跳转链接" name="link" rules={[{ required: true, message: '请填写跳转链接' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          {!editGrid && (
            <Form.Item label="内容形式" name="formType">
              <Radio.Group>
                <Radio value="image">图片广告</Radio>
                <Radio value="code">自定义代码</Radio>
              </Radio.Group>
            </Form.Item>
          )}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.formType !== cur.formType || editGrid}>
            {({ getFieldValue }) => {
              if (editGrid || getFieldValue('formType') === 'image') {
                return (
                  <Form.Item label="广告图片" name="img" rules={[{ required: true, message: '请上传广告图片' }]}>
                    <AdImgUpload hint="支持 GIF/JPG/PNG 等，仅图片+链接" strictSize={!editGrid} />
                  </Form.Item>
                );
              }
              return (
                <Form.Item label="自定义代码" name="content" rules={[{ required: true, message: '请输入广告代码' }]}>
                  <Input.TextArea rows={4} placeholder="支持 HTML/JS" />
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

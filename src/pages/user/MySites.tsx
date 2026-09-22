import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Tag, Space, Popconfirm, Modal, Form, Input, Switch, Upload, message, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';

import { getMySites, editMySite, delMySite, uploadFile } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import CardTable from '@components/common/CardTable';
import type { WebsiteItem } from '@/services/userCenter';

const { Title, Text } = Typography;

/** DB 的 ssl 字段是字符串 'https://' / 'http://'，不是 0/1 */
const sslOn = (v: unknown) => String(v || '').indexOf('https') === 0;

export default function MySitesPage() {
  const navigate = useNavigate();
  usePageMeta({ title: '我的站点' });
  const [list, setList] = useState<WebsiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WebsiteItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ico, setIco] = useState('');
  const [pic, setPic] = useState('');
  const [form] = Form.useForm();

  const load = () => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    setLoading(true);
    getMySites(key)
      .then((r: any) => {
        if (r.code === 1) setList(r.data || []);
        else {
          message.error(r.msg || '加载失败');
          if (r.msg && r.msg.indexOf('登录') >= 0) navigate('/login');
        }
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  const openEdit = (row: WebsiteItem) => {
    setEditing(row);
    setIco(row.ico || '');
    setPic(row.pic || '');
    form.setFieldsValue({
      title: row.title,
      www: row.www,
      tips: row.tips,
      keywords: row.keywords,
      content: row.content,
      ssl: sslOn(row.ssl),
    });
  };

  const onUpload = (file: File, field: 'pic' | 'ico') => {
    const key = getToken();
    if (!key) return false;
    setUploading(true);
    uploadFile(key, file)
      .then((r: any) => {
        if (r.code === 1 && r.data?.url) {
          if (field === 'ico') setIco(r.data.url);
          else setPic(r.data.url);
          message.success('上传成功');
        } else {
          message.error(r.msg || '上传失败');
        }
      })
      .catch(() => message.error('上传失败'))
      .finally(() => setUploading(false));
    return false;
  };

  const onSave = (values: any) => {
    if (!editing) return;
    const key = getToken();
    setSaving(true);
    editMySite(key || '', {
      id: editing.id,
      title: values.title,
      www: values.www,
      tips: values.tips,
      keywords: values.keywords,
      content: values.content,
      pic,
      ico,
      ssl: values.ssl ? 'https://' : 'http://',
    })
      .then((r: any) => {
        if (r.code === 1) {
          message.success('已保存');
          setEditing(null);
          load();
        } else {
          message.error(r.msg || '保存失败');
        }
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setSaving(false));
  };

  const onDelete = (row: WebsiteItem) => {
    const key = getToken();
    delMySite(key || '', row.id)
      .then((r: any) => {
        if (r.code === 1) {
          message.success('已删除');
          load();
        } else {
          message.error(r.msg || '删除失败');
        }
      })
      .catch(() => message.error('网络错误'));
  };

  const columns = [
    {
      title: '站点',
      dataIndex: 'title',
      render: (v: string, row: WebsiteItem) => (
        <Space>
          {row.ico ? <img src={row.ico} alt={row.title || ''} className="mysite-ico" /> : null}
          <Link to={`/${row.www || row.domain}`} title={row.title || row.www || row.domain || v}>{v}</Link>
        </Space>
      ),
    },
    { title: '域名', dataIndex: 'www', render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'open',
      render: (v: number) =>
        Number(v) === 1 ? <Tag color="success">已收录</Tag> : <Tag color="warning">待审核</Tag>,
    },
    { title: '浏览', dataIndex: 'view' },
    { title: '点赞', dataIndex: 'zan' },
    {
      title: '操作',
      render: (_: any, row: WebsiteItem) => (
        <Space wrap className="mysite-actions">
          <Button size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该站点？" onConfirm={() => onDelete(row)} okText="删除" cancelText="取消">
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card className="user-center-card">
      <Title level={4}>我的站点</Title>
      <Text type="secondary">认领/提交的站点会出现在这里，可编辑资料或删除。待审核的站点由管理员收录后对外展示。</Text>
      <CardTable<WebsiteItem>
        className="mt-16"
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
      />

      <Modal
        title="编辑站点"
        className="user-center-modal"
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item name="title" label="站点名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="www" label="站点域名">
            <Input placeholder="例如 blog.dao.js.cn" />
          </Form.Item>
          <Form.Item name="tips" label="一句话简介">
            <Input />
          </Form.Item>
          <Form.Item name="keywords" label="关键词">
            <Input />
          </Form.Item>
          <Form.Item name="content" label="站点描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="站点图标">
            <Space wrap className="mysite-form-space">
              <Input
                className="mysite-input"
                placeholder="图标地址（可上传自动填充）"
                value={ico}
                onChange={(e) => setIco(e.target.value)}
              />
              <Upload accept="image/*" showUploadList={false} beforeUpload={(f) => onUpload(f, 'ico')}>
                <Button size="small" loading={uploading}>
                  <PlusOutlined /> 上传图标
                </Button>
              </Upload>
            </Space>
          </Form.Item>
          <Form.Item label="站点截图">
            <Space wrap className="mysite-form-space">
              <Input
                className="mysite-input"
                placeholder="截图地址（可上传自动填充）"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
              />
              <Upload accept="image/*" showUploadList={false} beforeUpload={(f) => onUpload(f, 'pic')}>
                <Button size="small" loading={uploading}>
                  <PlusOutlined /> 上传截图
                </Button>
              </Upload>
            </Space>
          </Form.Item>
          <Form.Item name="ssl" label="启用 HTTPS" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

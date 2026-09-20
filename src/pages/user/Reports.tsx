import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Table, Tag, Spin, Button, Modal, Form, Input, Space, message } from 'antd';
import { getReports, submitReport, type ReportItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';

const { Title } = Typography;

export default function ReportsPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fmt = (t: number) => (t ? new Date(t * 1000).toLocaleString() : '');

  const load = () => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    getReports(key)
      .then((r: any) => {
        if (r.code === 1) setList(r.data || []);
        else navigate('/login');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  const onSubmit = () => {
    form
      .validateFields()
      .then((vals) => {
        setSubmitting(true);
        submitReport(getToken() || '', vals)
          .then((r: any) => {
            if (r.code === 1) {
              message.success('举报已提交');
              setOpen(false);
              form.resetFields();
              load();
            } else {
              message.error(r.msg || '提交失败');
            }
          })
          .catch(() => message.error('网络错误'))
          .finally(() => setSubmitting(false));
      })
      .catch(() => {});
  };

  return (
    <Card style={{ maxWidth: 760, margin: '40px auto' }}>
      <Title level={4}>我的举报</Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setOpen(true)}>
          提交举报
        </Button>
      </Space>
      <Spin spinning={loading}>
        <Table<ReportItem>
          dataSource={list}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '标题', dataIndex: 'title' },
            { title: '内容', dataIndex: 'content', ellipsis: true },
            { title: '关键字', dataIndex: 'tag' },
            {
              title: '状态',
              dataIndex: 'status',
              render: (s: number) =>
                s === 1 ? <Tag color="green">已审核</Tag> : <Tag color="orange">待审核</Tag>,
            },
            { title: '时间', dataIndex: 'time', render: (t: number) => fmt(t) },
          ]}
        />
      </Spin>
      <Modal
        title="提交举报"
        open={open}
        onOk={onSubmit}
        confirmLoading={submitting}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题">
            <Input placeholder="举报标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请填写举报内容' }]}
          >
            <Input.TextArea rows={4} placeholder="举报内容" />
          </Form.Item>
          <Form.Item name="tag" label="关键字">
            <Input placeholder="如 违规类型" />
          </Form.Item>
          <Form.Item name="tid" label="关联ID(可选)">
            <Input placeholder="如某文章/站点 id" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

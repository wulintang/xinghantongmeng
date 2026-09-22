import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Form, Input, InputNumber, Spin, Typography, message } from 'antd';
import { getToken } from '@/utils/auth';
import { getGrid, applyGrid, type AdPayGrid } from '@/services/adpay';
import GridCanvas from '@components/common/GridCanvas';

const { Title, Paragraph, Text } = Typography;

export default function GridPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const page = params.get('page') || 'grid';
  const [grid, setGrid] = useState<AdPayGrid | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const loggedIn = !!getToken();

  useEffect(() => {
    getGrid(page)
      .then((r) => {
        if (r.code === 1) setGrid(r.data || null);
        else message.error(r.msg || '加载失败');
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  }, [page]);

  const toggle = (id: number) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const onFinish = (values: any) => {
    if (!selected.length) {
      message.error('请先选择格子');
      return;
    }
    setSubmitting(true);
    applyGrid({
      page,
      cells: selected,
      content: values.content,
      img: values.img,
      link: values.link,
      duration_month: values.duration_month || 1,
    })
      .then((r) => {
        if (r.code === 1) {
          message.success('申请提交成功，等待审核');
          setSelected([]);
          form.resetFields();
        } else {
          message.error(r.msg || '提交失败');
        }
      })
      .catch((e) => message.error(e?.message || '提交失败'))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  const totalPrice = (grid?.cells || [])
    .filter((c) => selected.includes(c.id))
    .reduce((sum, c) => sum + parseFloat(c.price || '0'), 0) * (form.getFieldValue('duration_month') || 1);

  return (
    <div className="grid-page">
      <Title level={3} style={{ fontSize: 'var(--fs-xl)' }}>
        {page === 'home' ? '首页底部格子广告' : '格子广告'}
      </Title>
      <Paragraph type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
        点击空闲格子框选投放区域，每格独立定价，所选格子总价 = 单价之和 × 投放月数。提交即从余额扣费，审核通过后展示。
      </Paragraph>

      <GridCanvas
        grid={grid}
        selectable={loggedIn}
        selected={selected}
        onToggle={toggle}
        onEmptyClick={() => {
          if (!loggedIn) {
            message.warning('请先登录');
            navigate('/login');
          }
        }}
      />

      {!loggedIn ? (
        <Alert style={{ marginTop: 'var(--page-gap)' }} type="info" message="登录后可框选格子并提交广告申请" />
      ) : (
        <Card title={`投放申请（已选 ${selected.length} 格）`} style={{ marginTop: 'var(--page-gap)' }}>
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ duration_month: 1 }}>
            <Form.Item label="广告图片 URL" name="img">
              <Input placeholder="图片地址（填写后优先展示图片）" />
            </Form.Item>
            <Form.Item label="跳转链接" name="link">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item label="广告代码（可选）" name="content">
              <Input.TextArea rows={3} placeholder="自定义 HTML 广告代码" />
            </Form.Item>
            <Form.Item label="投放月数" name="duration_month" rules={[{ required: true }]}>
              <InputNumber min={1} max={12} style={{ width: 160 }} />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
              预计扣费：¥{totalPrice.toFixed(2)}（含所选格子 {selected.length} 格）
            </Text>
            <div style={{ marginTop: 12 }}>
              <Button type="primary" htmlType="submit" loading={submitting} disabled={!selected.length}>
                提交申请并支付
              </Button>
            </div>
          </Form>
        </Card>
      )}
    </div>
  );
}

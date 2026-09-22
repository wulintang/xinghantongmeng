import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Form, Input, Select, Spin, Typography, message } from 'antd';
import { getToken } from '@/utils/auth';
import { getPosition, applyAd, AD_PLANS, planPrice, type AdPayPosition } from '@/services/adpay';
import AdImgUpload from '@/components/common/AdImgUpload';

const { Title, Paragraph, Text } = Typography;

export default function AdBuyPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const slot = params.get('slot') || '';
  const [pos, setPos] = useState<AdPayPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string>('month');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!slot) {
      setLoading(false);
      return;
    }
    if (!getToken()) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    getPosition(slot)
      .then((r) => {
        if (r.code === 1) setPos(r.data);
        else message.error(r.msg || '广告位不存在');
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  }, [slot, navigate]);

  const onFinish = (values: any) => {
    if (!pos) return;
    if ((pos as any)['min_day'] && planPrice(pos, plan) <= 0) {
      message.error('该广告位价格未配置');
      return;
    }
    setSubmitting(true);
    applyAd({ pkey: pos.pkey, plan, title: values.title, link: values.link, img: values.img, content: values.content })
      .then((r) => {
        if (r.code === 1) {
          message.success('申请提交成功，等待审核');
          navigate('/user/ad/my');
        } else {
          message.error(r.msg || '提交失败');
        }
      })
      .catch((e) => message.error(e?.message || '提交失败'))
      .finally(() => setSubmitting(false));
  };

  if (!slot) {
    return <Alert type="error" message="缺少广告位参数（slot）" />;
  }
  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  if (!pos) {
    return <Alert type="warning" message="该广告位不存在或未开放申请" />;
  }
  if ((pos as any).open !== 1) {
    return <Alert type="warning" message="该广告位暂未开放申请" />;
  }

  const price = planPrice(pos, plan);

  return (
    <div className="ad-buy-page">
      <Title level={3} style={{ fontSize: 'var(--fs-xl)' }}>
        申请广告位：{pos.name}
      </Title>
      <Paragraph type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
        提交即从余额扣费（¥{price || 0}），审核不通过将自动退款到余额。同一广告位允许多位用户投放，展示时登录用户优先看到自己的广告。
      </Paragraph>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ plan: 'month' }}>
          <Form.Item label="投放时长" name="plan" rules={[{ required: true }]}>
            <Select
              onChange={(v) => setPlan(v)}
              options={AD_PLANS.map((p) => ({
                value: p.key,
                label: `${p.label}（¥${planPrice(pos, p.key)}）`,
              }))}
            />
          </Form.Item>
          <Form.Item label="广告标题" name="title" rules={[{ required: true, message: '请输入广告标题' }]}>
            <Input placeholder="如：兴汉同盟官网" maxLength={60} />
          </Form.Item>
          <Form.Item label="跳转链接" name="link">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="广告图片" name="img">
            <AdImgUpload hint="上传后优先展示图片（可选）" />
          </Form.Item>
          <Form.Item label="广告代码（可选，图片为空时生效）" name="content">
            <Input.TextArea rows={4} placeholder="可填写自定义 HTML 广告代码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              提交申请并支付 ¥{price || 0}
            </Button>
            <Button style={{ marginLeft: 12 }} onClick={() => navigate(-1)}>
              返回
            </Button>
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>
            最短 {pos.min_day} 天，最长 {pos.max_day} 天。
          </Text>
        </Form>
      </Card>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Form, Input, InputNumber, Modal, Spin, Typography, message } from 'antd';
import { getToken } from '@/utils/auth';
import { getGrid, applyGrid, type AdPayGrid } from '@/services/adpay';
import GridCanvas from '@components/common/GridCanvas';
import AdImgUpload from '@/components/common/AdImgUpload';

const { Title, Paragraph, Text } = Typography;

type Rect = { x: number; y: number; w: number; h: number };

export default function GridPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const page = params.get('page') || 'grid';
  const [grid, setGrid] = useState<AdPayGrid | null>(null);
  const [loading, setLoading] = useState(true);
  const [rect, setRect] = useState<Rect | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const loggedIn = !!getToken();

  useEffect(() => {
    getGrid(page)
      .then((r) => {
        if (r.code === 1) setGrid(r.data || null);
        else message.error(r.msg || '加载失败');
      })
      .catch((e) => message.error(e?.message || '加载失败'))
      .finally(() => setLoading(false));
  }, [page]);

  const openModal = (r: Rect) => {
    if (!loggedIn) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    setRect(r);
    setModalOpen(true);
  };

  const cellsCount = rect ? rect.w * rect.h : 0;
  const pricePerCell = grid?.price_per_cell || 0;

  const onFinish = (values: any) => {
    if (!rect) return;
    setSubmitting(true);
    applyGrid({
      page,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      img: values.img,
      link: values.link,
      duration_month: values.duration_month || 1,
    })
      .then((r) => {
        if (r.code === 1) {
          message.success('申请提交成功，等待审核');
          setModalOpen(false);
          setRect(null);
          form.resetFields();
          getGrid(page).then((res) => res.code === 1 && setGrid(res.data || null));
        } else {
          message.error(r.msg || '提交失败');
        }
      })
      .catch((e) => message.error(e?.message || '提交失败'))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  return (
    <div className="grid-page">
      <Title level={3} style={{ fontSize: 'var(--fs-xl)' }}>
        {page === 'home' ? '首页底部格子广告' : '格子广告'}
      </Title>
      <Paragraph type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
        在下方画布拖拽框选投放区域（每格 ¥{pricePerCell}/月）。框选后弹出申请表单，提交即从余额扣费，审核通过后展示。
      </Paragraph>

      <GridCanvas
        grid={grid}
        selectable={loggedIn}
        onSelectRect={openModal}
        onEmptyClick={() => {
          if (!loggedIn) {
            message.warning('请先登录');
            navigate('/login');
          }
        }}
      />

      {!loggedIn ? <Alert style={{ marginTop: 'var(--page-gap)' }} type="info" message="登录后可框选格子并提交广告申请" /> : null}

      <Modal
        title={`格子广告申请（${cellsCount} 格）`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="提交并支付"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ duration_month: 1 }}>
          <Form.Item label="广告图片" name="img" rules={[{ required: true, message: '请上传广告图片' }]}>
            <AdImgUpload hint="支持 GIF/JPG/PNG 等，仅图片+链接" />
          </Form.Item>
          <Form.Item label="跳转链接" name="link" rules={[{ required: true, message: '请填写跳转链接' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="投放月数" name="duration_month" rules={[{ required: true }]}>
            <InputNumber min={1} max={12} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const m = form.getFieldValue('duration_month') || 1;
              const t = cellsCount * pricePerCell * m;
              return (
                <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                  每格 ¥{pricePerCell}/月 × {cellsCount} 格 × {m} 月 = ¥{t.toFixed(2)}
                </Text>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '@/utils/CommonUtil';
import { getAd, getGrid, applyGrid, type AdPayAd, type AdPayGrid } from '@/services/adpay';
import { getToken } from '@/utils/auth';
import GridCanvas from './GridCanvas';
import AdImgUpload from './AdImgUpload';
import { Form, Input, InputNumber, Modal, Typography, message } from 'antd';

const { Text } = Typography;

interface Props {
  label?: string;
  variant?: 'banner' | 'grid';
  /** 系统广告位标识（与后端 position.pkey 一致）；传入则拉取并渲染该位广告 */
  slot?: string;
  /** 格子广告页：home=首页底部 / grid=单页；传入则渲染格子画布 */
  page?: 'home' | 'grid';
}

/**
 * 广告位组件（广告增强插件 adpay 对接）
 * - 传 slot：拉取该位广告，登录用户优先展示自己的，否则随机；无广告时显示骨架，点击进入「我的广告」申请
 * - 传 page（格子）：渲染该页格子画布，拖拽框选后弹出申请表单（仅图片+链接）
 * - 都不传：纯静态骨架（兼容历史用法）
 */
export default function AdSlotSkeleton({ label = '广告位', variant = 'banner', slot, page }: Props): React.JSX.Element {
  const navigate = useNavigate();
  const [ad, setAd] = useState<AdPayAd | null>(null);
  const [adReady, setAdReady] = useState(false);
  const [grid, setGrid] = useState<AdPayGrid | null>(null);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const loggedIn = !!getToken();

  useEffect(() => {
    if (!slot) return;
    let alive = true;
    setAdReady(false);
    getAd(slot)
      .then((r) => {
        if (alive && r.code === 1) setAd(r.data || null);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setAdReady(true);
      });
    return () => {
      alive = false;
    };
  }, [slot]);

  useEffect(() => {
    if (variant !== 'grid' || !page) return;
    let alive = true;
    getGrid(page)
      .then((r) => {
        if (alive && r.code === 1) setGrid(r.data || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [variant, page]);

  // 格子模式：渲染画布 + 框选弹申请表单
  if (variant === 'grid' && page) {
    const cellsCount = rect ? rect.w * rect.h : 0;
    const pricePerCell = grid?.price_per_cell || 0;
    const onSelect = (r: { x: number; y: number; w: number; h: number }) => {
      if (!loggedIn) {
        message.warning('请先登录');
        navigate('/login');
        return;
      }
      setRect(r);
      setModalOpen(true);
    };
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
    return (
      <div className="ad-slot-skeleton ad-slot-skeleton-grid" style={{ margin: 'var(--page-gap) 0' }}>
        <GridCanvas
          grid={grid}
          selectable={loggedIn}
          onSelectRect={onSelect}
          onEmptyClick={() => {
            if (!loggedIn) {
              message.warning('请先登录');
              navigate('/login');
            }
          }}
        />
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
                    {`每格 ¥${pricePerCell}/月 × ${cellsCount} 格 × ${m} 月 = ¥${t.toFixed(2)}`}
                  </Text>
                );
              }}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  // 系统广告位：已拉到广告则渲染，否则骨架 + 申请入口（进入「我的广告」）
  if (slot) {
    if (adReady && ad) {
      return (
        <div className="ad-slot-filled" style={{ margin: 'var(--page-gap) 0' }}>
          <div className="ad-banner" dangerouslySetInnerHTML={{ __html: sanitizeHtml(ad.content) }} />
        </div>
      );
    }
    if (adReady && !ad) {
      return (
        <div
          className="ad-slot-skeleton ad-slot-skeleton-banner ad-slot-apply"
          style={{ margin: 'var(--page-gap) 0' }}
          onClick={() => navigate('/user/ad/my')}
          role="button"
        >
          <span className="ad-slot-skeleton-label">{label}</span>
          <span className="ad-slot-apply-tip">点击申请投放广告</span>
        </div>
      );
    }
    return (
      <div className="ad-slot-skeleton ad-slot-skeleton-banner" style={{ margin: 'var(--page-gap) 0' }}>
        <span className="ad-slot-skeleton-label">{label}</span>
      </div>
    );
  }

  // 纯静态骨架（无 slot）
  return (
    <div className={`ad-slot-skeleton ad-slot-skeleton-${variant}`} style={{ margin: 'var(--page-gap) 0' }}>
      <span className="ad-slot-skeleton-label">{label}</span>
    </div>
  );
}

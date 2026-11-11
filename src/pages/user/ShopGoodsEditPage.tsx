import React, { useEffect, useState } from 'react';
import {
  Alert, Button, Card, Flex, Input, Modal, Select, Spin, Typography, Upload, message,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';

import { aiSummary, aiGenerate, uploadColumnImg } from '@/services/column';
import { uploadFile } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
  saveGoods, getMyGoodsDetail, getMyShop, getShopConfig, payDeposit,
  cateOptionsFrom, type GoodsItem, type ShopConfig,
} from '@/services/shop';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * 商品新增 / 编辑：复用「专栏投稿编辑器」同一套结构——
 * 标题 / 所属类目 / 关键词(AI生成) / 摘要(AI生成) / 正文(MdEditor 实时预览) / AI写文章；
 * 商品特有字段（售价 / 库存 / 封面上传控件 / 交付方式 / 交付说明）附加在编辑器下方。
 * 不重造编辑器。
 */
const ShopGoodsEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = !!editId;
  const key = getToken();
  usePageMeta({ title: isEdit ? '编辑商品' : '新增商品' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [cate, setCate] = useState<string>('brand');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [cover, setCover] = useState('');
  const [delivery, setDelivery] = useState<'digital' | 'physical'>('digital');
  const [deliveryNote, setDeliveryNote] = useState('');

  const [aiModal, setAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // 保证金延后到「上架商品」这一步提示：创建店铺与缴纳保证金完全分开，
  // 这里只提示、不拦截编辑或提交，缴足后商品才会在用户集市对外展示。
  const [depositNeed, setDepositNeed] = useState(0);
  const [depositPaid, setDepositPaid] = useState(0);
  const [payingDeposit, setPayingDeposit] = useState(false);
  const [cfg, setCfg] = useState<ShopConfig | null>(null);
  const [adminRemark, setAdminRemark] = useState('');
  const needDeposit = depositNeed > 0 && depositPaid < depositNeed;
  const cateOptions = cateOptionsFrom(cfg).map((c) => ({ value: c.key, label: c.name }));
  const commission = Number(cfg?.commission_rate ?? 0) || 0;

  const refreshDeposit = () => {
    getShopConfig()
      .then((r: any) => {
        if (r.code === 1 && r.data) {
          setCfg(r.data);
          setDepositNeed(Number(r.data.deposit_amount) || 0);
        }
      })
      .catch(() => {});
    getMyShop()
      .then((r: any) => { if (r.code === 1 && r.data) setDepositPaid(Number(r.data.deposit_paid) || 0); })
      .catch(() => {});
  };

  useEffect(() => { refreshDeposit(); }, []);

  // 后台类目可增删改：默认类目失效时自动落到后台配置的第一个类目
  useEffect(() => {
    if (!cfg?.cate_list?.length) return;
    setCate((prev) => (cfg.cate_list!.some((c) => c.key === prev) ? prev : cfg.cate_list![0].key));
  }, [cfg]);

  const onPayDeposit = () => {
    setPayingDeposit(true);
    payDeposit()
      .then((r: any) => {
        if (r.code === 1) {
          message.success(r.msg || '保证金已缴足');
          refreshDeposit();
        } else message.error(r.msg || '缴纳失败，请检查账号余额');
      })
      .catch(() => message.error('缴纳失败'))
      .finally(() => setPayingDeposit(false));
  };

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (isEdit) {
      getMyGoodsDetail(Number(editId))
        .then((r: any) => {
          if (r.code === 1 && r.data) {
            const g: GoodsItem = r.data;
            setTitle(g.title);
            setCate(g.cate);
            setKeywords(g.keywords || '');
            setDescription(g.description || '');
            setContent(g.content || '');
            setPrice(Number(g.price) || 0);
            setStock(Number(g.stock) || 0);
            setCover(g.cover || '');
            setDelivery(g.delivery);
            setDeliveryNote(g.delivery_note || '');
            setAdminRemark(g.admin_remark || '');
          } else {
            message.error(r.msg || '商品不存在');
          }
        })
        .catch(() => message.error('加载失败'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [key, editId, isEdit]);

  const onUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
    if (!key) {
      message.error('请先登录');
      return;
    }
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const r = await uploadColumnImg(key, file);
          if (r.code === 1 && r.data?.url) return r.data.url;
          throw new Error(r.msg || '上传失败');
        })
      );
      callback(urls);
    } catch (e: any) {
      message.error(e?.message || '上传失败');
    }
  };

  const onAiSummary = () => {
    if (!key) return message.error('请先登录');
    setSummaryLoading(true);
    aiSummary({ key, title, content })
      .then((r) => {
        if (r.code === 1 && r.data?.description) {
          setDescription(r.data.description);
          message.success('已生成摘要');
        } else message.error(r.msg || '生成失败');
      })
      .catch((e) => message.error(e?.message || '生成失败'))
      .finally(() => setSummaryLoading(false));
  };

  const onAiKeywords = () => {
    if (!key) return message.error('请先登录');
    setKeywordsLoading(true);
    aiSummary({ key, title, content })
      .then((r) => {
        if (r.code === 1 && r.data?.keywords) {
          setKeywords(r.data.keywords);
          message.success('已生成关键词');
        } else message.error(r.msg || '生成失败');
      })
      .catch((e) => message.error(e?.message || '生成失败'))
      .finally(() => setKeywordsLoading(false));
  };

  const onAiGenerate = () => {
    if (!key) return message.error('请先登录');
    if (!aiPrompt.trim()) return message.warning('请填写写作要求');
    setAiLoading(true);
    setGenLoading(true);
    aiGenerate({ key, prompt: aiPrompt.trim(), onChunk: (s: string) => setContent((prev) => prev + s) })
      .then(() => {
        message.success('AI 文章已生成');
        setAiModal(false);
        setAiPrompt('');
      })
      .catch((e) => message.error(e?.message || '生成失败'))
      .finally(() => {
        setAiLoading(false);
        setGenLoading(false);
      });
  };

  const onCover = (file: File) => {
    if (!key) {
      message.error('请先登录');
      return false;
    }
    if (!/^image\//.test(file.type)) {
      message.error('请选择图片文件');
      return false;
    }
    setCoverUploading(true);
    uploadFile(key, file)
      .then((r: any) => {
        if (r.code === 1 && r.data?.url) {
          setCover(r.data.url);
          message.success('封面上传成功');
        } else message.error(r.msg || '上传失败');
      })
      .catch(() => message.error('上传失败'))
      .finally(() => setCoverUploading(false));
    return false;
  };

  const onSubmit = () => {
    if (!title.trim()) return message.error('请填写商品标题');
    if (!cate) return message.error('请选择商品类目');
    if (!content.trim()) return message.error('请填写正文');
    if (price < 0) return message.error('价格不合法');
    setSaving(true);
    saveGoods({
      id: isEdit ? Number(editId) : 0,
      title: title.trim(),
      cate,
      keywords: keywords.trim(),
      description: description.trim(),
      content: content.trim(),
      price,
      stock,
      cover,
      delivery,
      delivery_note: deliveryNote.trim(),
    })
      .then((r: any) => {
        if (r.code === 1) {
          message.success(r.msg || (isEdit ? '已提交修改' : '已提交，等待审核'));
          navigate('/user/shop');
        } else message.error(r.msg || '提交失败');
      })
      .catch((e) => message.error(e?.message || '提交失败'))
      .finally(() => setSaving(false));
  };

  if (!key) {
    return (
      <div className="article-edit-fullscreen">
        <Alert type="info" showIcon message="请先登录" description="登录后可新增或编辑商品。" />
      </div>
    );
  }
  if (loading) {
    return (
      <div className="article-edit-fullscreen">
        <Flex justify="center" style={{ padding: 'var(--space-10)' }}><Spin /></Flex>
      </div>
    );
  }

  return (
    <div className="article-edit-fullscreen">
      <div className="article-edit-top">
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Text strong style={{ fontSize: 'var(--fs-lg)' }}>{isEdit ? '编辑商品' : '新增商品'}</Text>
          <Flex gap={8} wrap>
            <Button type="primary" loading={saving} onClick={onSubmit}>{isEdit ? '提交修改' : '提交审核'}</Button>
            <Button onClick={() => navigate('/user/shop')}>取消</Button>
          </Flex>
        </Flex>

        <Alert
          type="info"
          showIcon
          message={`复用专栏编辑器：标题 / 类目 / 关键词 / 摘要 / 正文 / AI 写文章；下方为商品交易字段。平台按成交价抽取佣金 ${commission}%，卖家实得 ${100 - commission}%。`}
        />

        {adminRemark ? (
          <Alert
            type="error"
            showIcon
            className="shop-step-hint"
            message="平台整改要求（下架理由）"
            description={`${adminRemark}；修改商品信息并保存后会自动重新提交审核。`}
          />
        ) : null}

        {needDeposit ? (
          <Alert
            type="warning"
            showIcon
            className="shop-step-hint"
            message={`保证金未缴：需缴 ¥${depositNeed.toFixed(2)}（已缴 ¥${depositPaid.toFixed(2)}）`}
            description="商品仍可提交并在用户集市展示，但买家暂时无法购买；缴足保证金后自动恢复。现在仍可继续编辑并提交商品。"
            action={
              <Button size="small" type="primary" loading={payingDeposit} onClick={onPayDeposit}>
                去缴纳
              </Button>
            }
          />
        ) : null}

        <Flex gap={16} wrap>
          <Flex vertical gap={6} style={{ flex: '2 1 280px', minWidth: 240 }}>
            <Text strong>商品标题</Text>
            <Input value={title} maxLength={120} placeholder="商品标题" onChange={(e) => setTitle(e.target.value)} />
          </Flex>
          <Flex vertical gap={6} style={{ flex: '1 1 200px', minWidth: 180 }}>
            <Text strong>商品类目（只能虚拟互联网产品）</Text>
            <Select
              value={cate}
              onChange={(v) => setCate(v)}
              style={{ width: '100%' }}
              options={cateOptions}
            />
          </Flex>
        </Flex>

        <Flex vertical gap={6}>
          <Text strong>关键词</Text>
          <Flex gap={8} align="center">
            <Input value={keywords} maxLength={200} placeholder="用空格或逗号分隔" onChange={(e) => setKeywords(e.target.value)} style={{ flex: 1 }} />
            <Button size="small" loading={keywordsLoading} onClick={onAiKeywords}>AI 生成</Button>
          </Flex>
        </Flex>

        <Flex vertical gap={6}>
          <Text strong>摘要</Text>
          <Flex gap={8} align="center">
            <TextArea rows={2} maxLength={255} value={description} placeholder="一句话摘要" onChange={(e) => setDescription(e.target.value)} style={{ flex: 1 }} />
            <Button size="small" loading={summaryLoading} onClick={onAiSummary}>AI 生成</Button>
          </Flex>
        </Flex>
      </div>

      <div className="article-edit-editor">
        <Flex align="center" justify="space-between" wrap gap={8}>
          <Text strong>正文（Markdown，含商品详情 / 交付说明 / 售后）</Text>
          <Button type="primary" ghost size="small" loading={genLoading} onClick={() => setAiModal(true)}>AI 写商品文案</Button>
        </Flex>
        <MdEditor modelValue={content} onChange={setContent} preview="live" onUploadImg={onUploadImg} />
      </div>

      <Card size="small" style={{ background: 'var(--c-bg-soft)', border: 'none' }} title="商品交易字段">
        <Flex gap={16} wrap>
          <Flex vertical gap={6} style={{ flex: '1 1 200px', minWidth: 180 }}>
            <Text strong>售价（元）</Text>
            <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
          </Flex>
          <Flex vertical gap={6} style={{ flex: '1 1 200px', minWidth: 180 }}>
            <Text strong>库存（0 = 不限）</Text>
            <Input type="number" min={0} step="1" value={stock} onChange={(e) => setStock(Number(e.target.value) || 0)} />
          </Flex>
          <Flex vertical gap={6} style={{ flex: '2 1 280px', minWidth: 220 }}>
            <Text strong>封面上传（图片上传控件，禁止填 URL）</Text>
            <Flex gap={8} align="center">
              <Upload accept="image/*" showUploadList={false} beforeUpload={onCover}>
                <Button loading={coverUploading}>上传封面</Button>
              </Upload>
              {cover ? <img src={cover} alt="cover" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} /> : null}
            </Flex>
          </Flex>
        </Flex>

        <Flex gap={16} wrap style={{ marginTop: 'var(--space-3)' }}>
          <Flex vertical gap={6} style={{ flex: '1 1 200px', minWidth: 180 }}>
            <Text strong>交付方式（仅两类）</Text>
            <Select
              value={delivery}
              onChange={(v) => setDelivery(v)}
              style={{ width: '100%' }}
              options={[
                { value: 'digital', label: '数字交付（自动发货）' },
                { value: 'physical', label: '实体交付（物流）' },
              ]}
            />
          </Flex>
          <Flex vertical gap={6} style={{ flex: '2 1 280px', minWidth: 220 }}>
            <Text strong>交付说明</Text>
            <Input value={deliveryNote} maxLength={255} placeholder="如：顺丰包邮 / 电子证书另发" onChange={(e) => setDeliveryNote(e.target.value)} />
          </Flex>
        </Flex>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 'var(--space-3)' }}
          message="实体交付仅在「发货」时由商家填写快递公司 + 单号；买家下单填写收货地址。数字就是数字、实体就是实体，无需区分更多类型。"
        />
      </Card>

      <Modal
        title="AI 写商品文案"
        open={aiModal}
        onCancel={() => !aiLoading && setAiModal(false)}
        onOk={onAiGenerate}
        confirmLoading={aiLoading}
        okText="开始生成"
        cancelText="取消"
      >
        <TextArea rows={5} value={aiPrompt} placeholder="例如：写一篇关于某商标转让的商品介绍，含权属说明、交付方式、售后条款，800字左右。" onChange={(e) => setAiPrompt(e.target.value)} />
      </Modal>
    </div>
  );
};

export default ShopGoodsEditPage;

import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Spin, Typography, Upload, message, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { addSite, captchaUrl, genVerifyToken, getBalance, getSiteFee, getWebsiteCates, uploadFile, verifyDomain, type CateItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

type VerifyType = 'file' | 'dns' | 'meta' | 'manual';
const VERIFY_LABELS: Record<VerifyType, string> = {
  file: '文件验证',
  dns: 'DNS验证',
  meta: 'meta验证',
  manual: '人工验证',
};

const SubmitSite: React.FC = () => {
  usePageMeta({ title: '提交站点' });
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [cates, setCates] = useState<CateItem[]>([]);
  const [catesLoading, setCatesLoading] = useState(true);
  const [codeSrc, setCodeSrc] = useState(() => captchaUrl());
  const [ico, setIco] = useState('');
  const [pic, setPic] = useState('');
  const [uploading, setUploading] = useState<'ico' | 'pic' | null>(null);

  const [verifyType, setVerifyType] = useState<VerifyType | ''>('');
  const [activeModal, setActiveModal] = useState<VerifyType | ''>('');
  const [fetching, setFetching] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [vMsg, setVMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [vData, setVData] = useState<{ domain: string; token: string; metaHash: string } | null>(null);
  const [siteFee, setSiteFee] = useState(0);
  const [myBalance, setMyBalance] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const navigate = useNavigate();

  const refreshCode = () => setCodeSrc(captchaUrl());

  useEffect(() => {
    let alive = true;
    getWebsiteCates()
      .then((r) => {
        if (alive && r.code === 1 && Array.isArray(r.data)) setCates(r.data);
      })
      .catch(() => {})
      .finally(() => alive && setCatesLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const doUpload = (file: File, target: 'ico' | 'pic') => {
    const key = getToken();
    if (!key) {
      message.warning('请先登录');
      return;
    }
    setUploading(target);
    uploadFile(key, file)
      .then((r) => {
        if (r.code === 1 && r.data?.url) {
          if (target === 'ico') setIco(r.data.url);
          else setPic(r.data.url);
          message.success('上传成功');
        } else {
          message.error(r.msg || '上传失败');
        }
      })
      .catch(() => message.error('上传失败'))
      .finally(() => setUploading(null));
  };

  const getDomain = (): string => {
    const url = (form.getFieldValue('url') || '').trim();
    if (!url) return '';
    return url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  };

  const openVerify = async (type: VerifyType) => {
    setActiveModal(type);
    setVMsg(null);
    if (type === 'manual') {
      setFeeLoading(true);
      try {
        const key = getToken();
        const [feeRes, balRes] = await Promise.all([getSiteFee(), getBalance(key)]);
        if (feeRes.code === 1 && feeRes.data) setSiteFee(feeRes.data.fee);
        if (balRes.code === 1 && balRes.data) setMyBalance(balRes.data.total);
      } catch {}
      setFeeLoading(false);
      return;
    }
    const key = getToken();
    const domain = getDomain();
    if (!domain) {
      setVMsg({ ok: false, text: '请先在上方填写站点链接' });
      return;
    }
    setFetching(true);
    try {
      const r = await genVerifyToken(key, domain);
      if (r.code === 1 && r.data) {
        setVData(r.data);
      } else {
        setVMsg({ ok: false, text: r.msg || '获取验证信息失败' });
      }
    } catch {
      setVMsg({ ok: false, text: '获取验证信息失败' });
    } finally {
      setFetching(false);
    }
  };

  const runVerify = async () => {
    const type = activeModal;
    if (!type || type === 'manual' || !vData) return;
    const key = getToken();
    setVerifying(true);
    setVMsg(null);
    try {
      const r = await verifyDomain(key, { type: type as 'file' | 'dns' | 'meta', domain: vData.domain, value: vData.token });
      if (r.code === 1) {
        setVMsg({ ok: true, text: '验证成功' });
        setVerifyType(type);
        setTimeout(() => setActiveModal(''), 800);
      } else {
        setVMsg({ ok: false, text: r.msg || '验证失败' });
      }
    } catch {
      setVMsg({ ok: false, text: '验证失败，请重试' });
    } finally {
      setVerifying(false);
    }
  };

  const chooseManual = () => {
    if (siteFee > 0 && (myBalance === null || myBalance < siteFee)) {
      message.warning('余额不足，请先充值');
      navigate('/user/recharge');
      return;
    }
    setVerifyType('manual');
    setActiveModal('');
    message.success(`已选择人工验证，提交时将扣除 ¥${siteFee}`);
  };

  const onFinish = (values: { name: string; url: string; cate?: number; feed_url?: string; code: string }) => {
    const key = getToken();
    if (!key) {
      message.warning('请先登录');
      return;
    }
    if (!verifyType) {
      message.warning('请先完成一项域名归属验证');
      return;
    }
    setSubmitting(true);
    addSite(key, {
      name: values.name,
      url: values.url,
      cate: values.cate,
      ico,
      pic,
      feed_url: values.feed_url,
      type: 'website',
      code: values.code,
      verify_type: verifyType,
      verify_token: vData?.token || '',
    })
      .then((r) => {
        if (r.code === 1) {
          message.success(r.msg || '提交成功，等待审核');
          form.resetFields();
          setIco('');
          setPic('');
          setVerifyType('');
          setVData(null);
          refreshCode();
        } else {
          message.error(r.msg || '提交失败');
          refreshCode();
        }
      })
      .catch(() => message.error('提交失败，请稍后重试'))
      .finally(() => setSubmitting(false));
  };

  const uploadButton = (target: 'ico' | 'pic', done: string) => (
    <Upload
      accept="image/*"
      showUploadList={false}
      beforeUpload={(file) => {
        doUpload(file, target);
        return false;
      }}
    >
      <Button size="small" loading={uploading === target}>
        {done}
      </Button>
    </Upload>
  );

  const dotStyle = (active: boolean): React.CSSProperties => ({
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: `1px solid ${active ? '#1677ff' : '#d9d9d9'}`,
    color: active ? '#1677ff' : 'rgba(0,0,0,0.65)',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 12,
    background: '#fff',
    userSelect: 'none',
  });

  return (
    <Card className="user-center-card">
      <Title level={4}>提交站点</Title>
      <Text type="secondary">填写站点信息，并通过一种方式验证域名归属后提交，由管理员审核收录。</Text>
      <Spin spinning={catesLoading}>
        <Form form={form} layout="vertical" className="submit-site-form" onFinish={onFinish}>
          <Form.Item label="站点名称" name="name" rules={[{ required: true, message: '请输入站点名称' }]}>
            <Input placeholder="例如：兴汉同盟" />
          </Form.Item>
          <Form.Item
            label="站点链接"
            name="url"
            rules={[
              { required: true, message: '请输入站点链接' },
              { type: 'url', message: '请输入合法的链接' },
            ]}
          >
            <Input
              placeholder="https://example.com"
              onChange={() => {
                setVData(null);
                setVMsg(null);
              }}
            />
          </Form.Item>
          <Form.Item label="网站分类" name="cate" rules={[{ required: true, message: '请选择网站分类' }]}>
            <Select placeholder="选择后台网站分类">
              {cates.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="网站图标" required>
            <Space wrap className="submit-site-form-space">
              <Input className="submit-input" value={ico} onChange={(e) => setIco(e.target.value)} placeholder="图标地址（可上传自动填充）" />
              {uploadButton('ico', '上传图标')}
              {ico ? <img src={ico} alt="ico" className="submit-ico-preview" /> : null}
            </Space>
          </Form.Item>
          <Form.Item label="网站截图" required>
            <Space wrap className="submit-site-form-space">
              <Input className="submit-input" value={pic} onChange={(e) => setPic(e.target.value)} placeholder="截图地址（可上传自动填充）" />
              {uploadButton('pic', '上传截图')}
              {pic ? <img src={pic} alt="shot" className="submit-shot-preview" /> : null}
            </Space>
          </Form.Item>
          <Form.Item label="Feed 订阅地址" name="feed_url" rules={[{ type: 'url', message: '请输入合法的链接' }]}>
            <Input placeholder="https://example.com/feed（选填，收录后自动聚合文章）" />
          </Form.Item>
          <Form.Item label="域名归属验证（任选其一）" required>
            <Space size="middle" wrap>
              {(['file', 'dns', 'meta', 'manual'] as VerifyType[]).map((t) => (
                <Tooltip title={VERIFY_LABELS[t]} key={t}>
                  <span style={dotStyle(verifyType === t)} onClick={() => openVerify(t)}>
                    {verifyType === t ? '✓ ' : ''}
                    {VERIFY_LABELS[t]}
                  </span>
                </Tooltip>
              ))}
            </Space>
            {!verifyType && (
              <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>请选择一种验证方式完成域名归属验证</div>
            )}
            {verifyType && (
              <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12 }}>已通过：{VERIFY_LABELS[verifyType]}</div>
            )}
          </Form.Item>
          {verifyType && (
            <Form.Item label="图形验证码" name="code" rules={[{ required: true, message: '请输入图形验证码' }]}>
              <Space.Compact className="captcha-compact">
                <Input placeholder="请输入右侧验证码" />
                <Tooltip title="点击刷新">
                  <img src={codeSrc} alt="验证码" className="captcha-img" onClick={refreshCode} />
                </Tooltip>
              </Space.Compact>
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<PlusOutlined />} disabled={!verifyType}>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Spin>

      <Modal open={activeModal !== ''} title={activeModal ? VERIFY_LABELS[activeModal] : ''} onCancel={() => setActiveModal('')} footer={null}>
        {activeModal === 'manual' ? (
          <div>
            <p>由管理员人工核对域名归属。提交后将自动进入人工审核流程。</p>
            {feeLoading ? (
              <p>加载中…</p>
            ) : siteFee > 0 ? (
              <>
                <p>
                  人工验证费用：<strong>¥{siteFee}</strong>
                </p>
                <p>当前余额：¥{myBalance ?? 0}</p>
                {myBalance !== null && myBalance < siteFee ? (
                  <Button type="primary" danger onClick={() => navigate('/user/recharge')}>
                    余额不足，去充值
                  </Button>
                ) : (
                  <Button type="primary" onClick={chooseManual}>
                    申请人工验证（支付 ¥{siteFee}）
                  </Button>
                )}
              </>
            ) : (
              <Button type="primary" onClick={chooseManual}>
                申请人工验证
              </Button>
            )}
          </div>
        ) : (
          <div>
            {fetching && <p>获取验证信息中…</p>}
            {!fetching && vMsg && !vData && <p style={{ color: vMsg.ok ? '#52c41a' : '#ff4d4f' }}>{vMsg.text}</p>}
            {!fetching && vData && activeModal === 'file' && (
              <p>
                将以下内容保存到：<br />
                <code>https://{vData.domain}/{vData.domain}.txt</code>
                <br />
                文件内容仅包含：<br />
                <code>{vData.token}</code>
              </p>
            )}
            {!fetching && vData && activeModal === 'dns' && (
              <p>
                添加 TXT 记录：<br />
                <code>_verify.{vData.domain}</code> TXT = <code>{vData.token}</code>
              </p>
            )}
            {!fetching && vData && activeModal === 'meta' && (
              <p>
                在首页 &lt;head&gt; 中添加：<br />
                <code>&lt;meta name="dao-verify" content="{vData.metaHash}" /&gt;</code>
              </p>
            )}
            {!fetching && vData && vMsg && <p style={{ color: vMsg.ok ? '#52c41a' : '#ff4d4f' }}>{vMsg.text}</p>}
            {!fetching && vData && (
              <Button type="primary" loading={verifying} onClick={runVerify} disabled={!!vMsg?.ok}>
                验证
              </Button>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default SubmitSite;

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Spin, Typography, Upload, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';

import {
  addSite,
  captchaUrl,
  claimSite,
  editMySite,
  fetchSiteMeta,
  genVerifyToken,
  getBalance,
  getSiteFee,
  getWebsite,
  getWebsiteCates,
  uploadFile,
  verifyDomain,
  type CateItem,
} from '@/services/userCenter';
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
const TITLE_MAP: Record<string, string> = {
  submit: '提交站点',
  claim: '认领站点',
  edit: '编辑站点',
};
const DESC_MAP: Record<string, string> = {
  submit: '填写站点信息，并通过一种方式验证域名归属后提交，由管理员审核收录。',
  claim: '该站点尚未被认领，请通过一种方式验证域名归属，证明你是该站点的所有者。',
  edit: '修改站点资料；仅当编辑「域名」或「Feed」时才需重新验证域名归属，其余资料可直接保存。',
};

const SubmitSite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') as 'submit' | 'claim' | 'edit') || 'submit';
  const siteId = searchParams.get('siteId') || '';
  const isEdit = mode === 'edit';
  const isClaim = mode === 'claim';
  // 提交/认领：四项验证直接显示；编辑：仅当解锁域名或 feed 才显示
  const needVerifyAlways = !isEdit;
  const readOnly = isClaim; // 认领时不改站点资料，仅验证归属

  usePageMeta({ title: TITLE_MAP[mode] || '提交站点' });
  const [form] = Form.useForm();
  const navigate = useNavigate();

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
  // 普通获取 / AI 获取站点信息
  const [fetchingMeta, setFetchingMeta] = useState<'normal' | 'ai' | null>(null);

  // 编辑模式下域名/feed 默认锁定，点「编辑」解锁并唤出验证
  const [showVerify, setShowVerify] = useState(needVerifyAlways);
  const [domainLocked, setDomainLocked] = useState(isEdit);
  const [feedLocked, setFeedLocked] = useState(isEdit);
  const [loadingSite, setLoadingSite] = useState(isEdit || isClaim);

  const refreshCode = () => setCodeSrc(captchaUrl());

  // mode / siteId 变化（如从 ?mode=edit&siteId=46 跳回 /user/submit）整体重置，避免上个模式内容残留
  useEffect(() => {
    form.resetFields();
    setIco('');
    setPic('');
    setVerifyType('');
    setActiveModal('');
    setVMsg(null);
    setVData(null);
    setShowVerify(needVerifyAlways);
    setDomainLocked(isEdit);
    setFeedLocked(isEdit);
    setLoadingSite(isEdit || isClaim);
    refreshCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, siteId]);

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

  // 认领/编辑：拉取站点原值预填
  useEffect(() => {
    if ((isEdit || isClaim) && siteId) {
      const key = getToken();
      setLoadingSite(true);
      getWebsite(siteId, 0, key || '')
        .then((r) => {
          if (r.code === 1 && r.data) {
            const s = r.data;
            form.setFieldsValue({
              name: s.title,
              url: s.www,
              cate: s.tid ? Number(s.tid) : undefined,
              feed_url: s.feed_url,
              keywords: s.keywords,
              content: s.content,
            });
            setIco(s.ico || '');
            setPic(s.pic || '');
          } else {
            message.error(r.msg || '站点加载失败');
          }
        })
        .catch(() => message.error('网络错误'))
        .finally(() => setLoadingSite(false));
    }
  }, [siteId, isEdit, isClaim]);

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

  // 根据站点链接自动获取标题/关键词/描述：normal=抓取 meta，ai=后台 AI 生成
  const fetchMeta = async (mode: 'normal' | 'ai') => {
    const key = getToken();
    if (!key) {
      message.warning('请先登录');
      return;
    }
    const url = (form.getFieldValue('url') || '').trim();
    if (!url) {
      message.warning('请先填写站点链接');
      return;
    }
    setFetchingMeta(mode);
    try {
      const r = await fetchSiteMeta(key, url, mode);
      if (r.code === 1 && r.data) {
        form.setFieldsValue({
          name: r.data.title || undefined,
          keywords: r.data.keywords || undefined,
          content: r.data.content || undefined,
        });
        message.success(mode === 'ai' ? 'AI 获取成功' : '已获取站点信息');
      } else {
        message.error(r.msg || '获取失败');
      }
    } catch {
      message.error('获取失败，请重试');
    } finally {
      setFetchingMeta(null);
    }
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
    // 已为该域名取过 token 则三种验证方式共享同一组值，不再重新请求（避免关闭/切换弹窗时 token 变化）
    if (vData && vData.domain === domain) {
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
      const r = await verifyDomain(key, {
        type: type as 'file' | 'dns' | 'meta',
        domain: vData.domain,
        value: vData.token,
      });
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

  const requireVerify = needVerifyAlways || !domainLocked || !feedLocked;

  const onFinish = (values: {
    name: string;
    url: string;
    cate?: number;
    feed_url?: string;
    keywords?: string;
    content?: string;
    code?: string;
  }) => {
    const key = getToken();
    if (!key) {
      message.warning('请先登录');
      return;
    }
    if (requireVerify && !verifyType) {
      message.warning('请先完成一项域名归属验证');
      return;
    }
    setSubmitting(true);
    const done = () => setSubmitting(false);

    if (isClaim) {
      claimSite(key, { tid: Number(siteId), verify_type: verifyType as string, verify_token: vData?.token || '' })
        .then((r) => {
          if (r.code === 1) {
            message.success(r.msg || '认领成功');
            navigate('/user/mysites');
          } else {
            message.error(r.msg || '认领失败');
          }
        })
        .catch(() => message.error('网络错误'))
        .finally(done);
      return;
    }

    if (isEdit) {
      editMySite(key, {
        id: Number(siteId),
        title: values.name,
        www: values.url,
        cate: values.cate,
        ico,
        pic,
        feed_url: values.feed_url,
        keywords: values.keywords,
        content: values.content,
        verify_type: verifyType as string,
        verify_token: vData?.token || '',
      })
        .then((r) => {
          if (r.code === 1) {
            message.success(r.msg || '保存成功');
            navigate('/user/mysites');
          } else {
            message.error(r.msg || '保存失败');
          }
        })
        .catch(() => message.error('网络错误'))
        .finally(done);
      return;
    }

    // 新申请
    addSite(key, {
      name: values.name,
      url: values.url,
      cate: values.cate,
      ico,
      pic,
      feed_url: values.feed_url,
      keywords: values.keywords,
      content: values.content,
      type: 'website',
      code: values.code,
      verify_type: verifyType as string,
      verify_token: vData?.token || '',
    })
      .then((r) => {
        if (r.code === 1) {
          message.success(r.msg || '提交成功，等待审核');
          navigate('/user/mysites');
        } else {
          message.error(r.msg || '提交失败');
          refreshCode();
        }
      })
      .catch(() => message.error('提交失败，请稍后重试'))
      .finally(done);
  };

  const uploadButton = (target: 'ico' | 'pic', done: string) => (
    <Upload
      accept="image/*"
      showUploadList={false}
      disabled={readOnly}
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
    width: 76,
    height: 76,
    borderRadius: '50%',
    border: `1px solid ${active ? 'var(--c-link)' : 'var(--c-border, #f0f0f0)'}`,
    color: active ? 'var(--c-link)' : 'var(--c-text-2)',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    cursor: 'pointer',
    fontSize: 'var(--fs-xs)',
    background: '#fff',
    userSelect: 'none',
    transition: 'all .15s',
    boxShadow: active ? '0 2px 8px rgba(22,119,255,0.12)' : 'none',
  });

  const ro = readOnly;

  return (
    <Card className="user-center-card">
      <Title level={4}>{TITLE_MAP[mode] || '提交站点'}</Title>
      <Text type="secondary">{DESC_MAP[mode] || DESC_MAP.submit}</Text>
      <Spin spinning={catesLoading || loadingSite}>
        <Form form={form} layout="vertical" className="submit-site-form" onFinish={onFinish}>
          <Form.Item label="站点名称" name="name" rules={[{ required: true, message: '请输入站点名称' }]}>
            <Input placeholder="例如：兴汉同盟" disabled={ro} />
          </Form.Item>
          <Form.Item label="站点链接" required>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Form.Item name="url" noStyle rules={[{ required: true, message: '请输入站点链接' }]}>
                <Input
                  style={{ flex: 1 }}
                  disabled={ro || (isEdit && domainLocked)}
                  placeholder="https://example.com"
                  onChange={() => {
                    setVData(null);
                    setVMsg(null);
                  }}
                />
              </Form.Item>
              {isEdit && domainLocked && (
                <Button icon={<EditOutlined />} onClick={() => { setDomainLocked(false); setShowVerify(true); }}>
                  编辑
                </Button>
              )}
              <Button size="small" loading={fetchingMeta === 'normal'} onClick={() => fetchMeta('normal')}>
                普通获取
              </Button>
              <Button size="small" loading={fetchingMeta === 'ai'} onClick={() => fetchMeta('ai')}>
                AI获取
              </Button>
            </div>
          </Form.Item>
          <Form.Item label="网站分类" name="cate" rules={[{ required: true, message: '请选择网站分类' }]}>
            <Select placeholder="选择后台网站分类" disabled={ro}>
              {cates.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="网站图标" required>
            <Space wrap className="submit-site-form-space">
              <Input className="submit-input" value={ico} onChange={(e) => setIco(e.target.value)} placeholder="图标地址（可上传自动填充）" disabled={ro} />
              {uploadButton('ico', '上传图标')}
              {ico ? <img src={ico} alt="ico" className="submit-ico-preview" /> : null}
            </Space>
          </Form.Item>
          <Form.Item label="网站截图" required>
            <Space wrap className="submit-site-form-space">
              <Input className="submit-input" value={pic} onChange={(e) => setPic(e.target.value)} placeholder="截图地址（可上传自动填充）" disabled={ro} />
              {uploadButton('pic', '上传截图')}
              {pic ? <img src={pic} alt="shot" className="submit-shot-preview" /> : null}
            </Space>
          </Form.Item>
          <Form.Item label="Feed 订阅地址">
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Form.Item name="feed_url" noStyle rules={[{ type: 'url', message: '请输入合法的链接' }]}>
                <Input style={{ flex: 1 }} disabled={ro || (isEdit && feedLocked)} placeholder="https://example.com/feed（选填，须为站点域名下路径）" />
              </Form.Item>
              {isEdit && feedLocked && (
                <Button icon={<EditOutlined />} onClick={() => { setFeedLocked(false); setShowVerify(true); }}>
                  编辑
                </Button>
              )}
            </div>
          </Form.Item>
          <Form.Item label="关键词" name="keywords">
            <Input placeholder="关键词，逗号分隔" disabled={ro} />
          </Form.Item>
          <Form.Item label="站点描述" name="content">
            <Input.TextArea rows={3} placeholder="站点详细介绍" disabled={ro} />
          </Form.Item>

          {showVerify && (
            <Form.Item label="域名归属验证（任选其一）" required>
              <Space size="middle" wrap>
                {(['file', 'dns', 'meta', 'manual'] as VerifyType[]).map((t) => (
                  <Tooltip title={VERIFY_LABELS[t]} key={t}>
                    <span style={dotStyle(verifyType === t)} onClick={() => openVerify(t)}>
                      {verifyType === t ? '✓' : VERIFY_LABELS[t]}
                    </span>
                  </Tooltip>
                ))}
              </Space>
              {!verifyType && (
                <div style={{ marginTop: 'var(--space-2)', color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)' }}>请选择一种验证方式完成域名归属验证</div>
              )}
              {verifyType && (
                <div style={{ marginTop: 'var(--space-2)', color: 'var(--c-link)', fontSize: 'var(--fs-xs)' }}>已通过：{VERIFY_LABELS[verifyType]}</div>
              )}
            </Form.Item>
          )}
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
            <Button type="primary" htmlType="submit" loading={submitting} icon={<PlusOutlined />} disabled={requireVerify && !verifyType}>
              {isEdit ? '保存' : '提交'}
            </Button>
          </Form.Item>
        </Form>
      </Spin>

      <Modal open={activeModal !== ''} title={activeModal ? VERIFY_LABELS[activeModal] : ''} onCancel={() => setActiveModal('')} footer={null} width={480}>
        {activeModal === 'manual' ? (
          <div className="verify-modal-body">
            <p className="verify-desc">由管理员人工核对域名归属，提交后将自动进入人工审核流程。</p>
            {feeLoading ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <Spin />
              </div>
            ) : siteFee > 0 ? (
              <>
                <div className="verify-fee-row">
                  <span>人工验证费用</span>
                  <span className="verify-fee-amount">¥{siteFee}</span>
                </div>
                <div className="verify-fee-row">
                  <span>当前余额</span>
                  <span>¥{myBalance ?? 0}</span>
                </div>
                {myBalance !== null && myBalance < siteFee ? (
                  <Button type="primary" danger block onClick={() => navigate('/user/recharge')} style={{ marginTop: 'var(--space-4)' }}>
                    余额不足，去充值
                  </Button>
                ) : (
                  <Button type="primary" block onClick={chooseManual} style={{ marginTop: 'var(--space-4)' }}>
                    申请人工验证（支付 ¥{siteFee}）
                  </Button>
                )}
              </>
            ) : (
              <Button type="primary" block onClick={chooseManual} style={{ marginTop: 'var(--space-4)' }}>
                申请人工验证
              </Button>
            )}
          </div>
        ) : (
          <div className="verify-modal-body">
            {fetching && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <Spin />
              </div>
            )}
            {!fetching && !vData && vMsg && <Alert type={vMsg.ok ? 'success' : 'error'} message={vMsg.text} showIcon />}
            {!fetching && vData && (
              <>
                {activeModal === 'file' && (
                  <>
                    <p className="verify-desc">在您网站根目录创建验证文件，证明您拥有该域名的管理权限。</p>
                    <div className="verify-step">
                      <span className="verify-step-badge">1</span>
                      <div>
                        <div className="verify-step-title">创建文件</div>
                        <div className="verify-step-desc">文件名为 <Typography.Text code>{vData.domain}.txt</Typography.Text></div>
                      </div>
                    </div>
                    <Typography.Paragraph copyable={{ text: `https://${vData.domain}/${vData.domain}.txt` }} className="verify-code-block">
                      https://{vData.domain}/{vData.domain}.txt
                    </Typography.Paragraph>
                    <div className="verify-step">
                      <span className="verify-step-badge">2</span>
                      <div>
                        <div className="verify-step-title">文件内容</div>
                        <div className="verify-step-desc">仅包含下方字符串，请勿添加多余内容</div>
                      </div>
                    </div>
                    <Typography.Paragraph copyable={{ text: vData.token }} className="verify-code-block">
                      {vData.token}
                    </Typography.Paragraph>
                  </>
                )}
                {activeModal === 'dns' && (
                  <>
                    <p className="verify-desc">在域名的 DNS 解析中添加一条 TXT 记录。</p>
                    <div className="verify-step">
                      <span className="verify-step-badge">1</span>
                      <div>
                        <div className="verify-step-title">主机记录</div>
                        <div className="verify-step-desc">
                          完整记录名：<Typography.Text code>_verify.{vData.domain}</Typography.Text>。
                          {vData.domain.split('.').length > 2 && (
                            <>
                              <br />
                              若你的解析域名为 <Typography.Text code>{vData.domain.split('.').slice(1).join('.')}</Typography.Text>，主机记录填 <Typography.Text code>{'_verify.' + vData.domain.split('.')[0]}</Typography.Text>；
                              若你的解析域名为 <Typography.Text code>{vData.domain}</Typography.Text>，主机记录填 <Typography.Text code>_verify</Typography.Text>。
                            </>
                          )}
                          {vData.domain.split('.').length <= 2 && (
                            <>
                              <br />
                              主机记录填 <Typography.Text code>_verify</Typography.Text>。
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="verify-step">
                      <span className="verify-step-badge">2</span>
                      <div>
                        <div className="verify-step-title">记录值</div>
                        <div className="verify-step-desc">复制下方字符串填入</div>
                      </div>
                    </div>
                    <Typography.Paragraph copyable={{ text: vData.token }} className="verify-code-block">
                      {vData.token}
                    </Typography.Paragraph>
                    <Alert type="warning" showIcon message="DNS 记录生效通常需要几分钟，请稍后再点击验证。" className="verify-alert" />
                  </>
                )}
                {activeModal === 'meta' && (
                  <>
                    <p className="verify-desc">在您网站首页 <Typography.Text code>&lt;head&gt;</Typography.Text> 中添加以下 meta 标签。</p>
                    <div className="verify-step">
                      <span className="verify-step-badge">1</span>
                      <div>
                        <div className="verify-step-title">添加 meta 标签</div>
                        <div className="verify-step-desc">content 为 token 的哈希值，防止被模仿</div>
                      </div>
                    </div>
                    <Typography.Paragraph copyable={{ text: `<meta name="dao-verify" content="${vData.metaHash}" />` }} className="verify-code-block">
                      &lt;meta name="dao-verify" content="{vData.metaHash}" /&gt;
                    </Typography.Paragraph>
                  </>
                )}
                {vMsg && <Alert type={vMsg.ok ? 'success' : 'error'} message={vMsg.text} showIcon className="verify-alert" />}
                <Button type="primary" block loading={verifying} onClick={runVerify} disabled={!!vMsg?.ok} style={{ marginTop: 'var(--space-4)' }}>
                  验证
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default SubmitSite;

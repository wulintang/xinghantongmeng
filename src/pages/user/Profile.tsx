import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Radio, Spin, List, Modal, Space } from 'antd';
import { updateUserProfile, userLogout, sendCode, bindPhone, changeMail, changePassword } from '@/services/userCenter';
import { getToken, clearToken } from '@/utils/auth';
import { useMember } from '@/context/MemberContext';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const navigate = useNavigate();
  usePageMeta({ title: '个人资料' });
  const [form] = Form.useForm();
  const { info, setInfo, loading } = useMember();
  const [saving, setSaving] = useState(false);

  // 用户名字段实时同步到侧边栏
  const watchedName = Form.useWatch('name', form);
  useEffect(() => {
    if (watchedName === undefined || watchedName === null) return;
    setInfo((prev) => (prev ? { ...prev, name: watchedName } : prev));
  }, [watchedName, setInfo]);

  // 资料回填表单
  useEffect(() => {
    if (info) form.setFieldsValue(info);
  }, [info, form]);

  // 未登录或资料加载失败兜底
  useEffect(() => {
    if (!loading && !info && !getToken()) {
      clearToken();
      navigate('/login');
    }
  }, [loading, info, navigate]);

  const onSave = (values: any) => {
    setSaving(true);
    updateUserProfile(getToken(), values)
      .then((r: any) => {
        if (r.code === 1) {
          setInfo(r.data);
          message.success('资料已更新');
        } else {
          message.error(r.msg);
        }
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setSaving(false));
  };

  const onLogout = () => {
    userLogout().finally(() => {
      clearToken();
      message.success('已退出');
      navigate('/');
    });
  };

  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [cdPhone, setCdPhone] = useState(0);
  const [sendingPhone, setSendingPhone] = useState(false);
  const [newMail, setNewMail] = useState('');
  const [mailCode, setMailCode] = useState('');
  const [cdMail, setCdMail] = useState(0);
  const [sendingMail, setSendingMail] = useState(false);
  const [editType, setEditType] = useState<'phone' | 'mail' | null>(null);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdVtype, setPwdVtype] = useState<'phone' | 'mail'>('mail');
  const [pwdPhone, setPwdPhone] = useState('');
  const [pwdCode, setPwdCode] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [cdPwd, setCdPwd] = useState(0);
  const [sendingPwd, setSendingPwd] = useState(false);
  const timerPhone = useRef<number | null>(null);
  const timerMail = useRef<number | null>(null);
  const timerPwd = useRef<number | null>(null);
  useEffect(() => () => {
    if (timerPhone.current) clearInterval(timerPhone.current);
    if (timerMail.current) clearInterval(timerMail.current);
    if (timerPwd.current) clearInterval(timerPwd.current);
  }, []);
  const startPhoneCd = () => {
    setCdPhone(60);
    timerPhone.current = window.setInterval(() => {
      setCdPhone((c) => {
        if (c <= 1 && timerPhone.current) { clearInterval(timerPhone.current); timerPhone.current = null; return 0; }
        return c - 1;
      });
    }, 1000);
  };
  const startMailCd = () => {
    setCdMail(60);
    timerMail.current = window.setInterval(() => {
      setCdMail((c) => {
        if (c <= 1 && timerMail.current) { clearInterval(timerMail.current); timerMail.current = null; return 0; }
        return c - 1;
      });
    }, 1000);
  };
  const startPwdCd = () => {
    setCdPwd(60);
    timerPwd.current = window.setInterval(() => {
      setCdPwd((c) => {
        if (c <= 1 && timerPwd.current) { clearInterval(timerPwd.current); timerPwd.current = null; return 0; }
        return c - 1;
      });
    }, 1000);
  };
  const sendPhone = () => {
    if (!/^1[3-9]\d{9}$/.test(newPhone)) { message.error('请输入正确的手机号'); return; }
    setSendingPhone(true);
    sendCode('sms', newPhone, 'bind')
      .then((r: any) => { if (r.code === 1) { message.success('验证码已发送'); startPhoneCd(); } else message.error(r.msg || '发送失败'); })
      .catch(() => message.error('发送失败'))
      .finally(() => setSendingPhone(false));
  };
  const submitPhone = () => {
    if (!phoneCode) { message.error('请输入验证码'); return; }
    setSaving(true);
    bindPhone(newPhone, phoneCode)
      .then((r: any) => {
        if (r.code === 1) { message.success('手机号已更新'); setInfo((p) => (p ? { ...p, phone: newPhone } : p)); setNewPhone(''); setPhoneCode(''); setEditType(null); }
        else message.error(r.msg || '修改失败');
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setSaving(false));
  };
  const sendMail = () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newMail)) { message.error('请输入正确的邮箱'); return; }
    setSendingMail(true);
    sendCode('email', newMail, 'bindmail')
      .then((r: any) => { if (r.code === 1) { message.success('验证码已发送'); startMailCd(); } else message.error(r.msg || '发送失败'); })
      .catch(() => message.error('发送失败'))
      .finally(() => setSendingMail(false));
  };
  const submitMail = () => {
    if (!mailCode) { message.error('请输入验证码'); return; }
    setSaving(true);
    changeMail(newMail, mailCode)
      .then((r: any) => {
        if (r.code === 1) { message.success('邮箱已更新'); setInfo((p) => (p ? { ...p, mail: newMail } : p)); setNewMail(''); setMailCode(''); setEditType(null); }
        else message.error(r.msg || '修改失败');
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setSaving(false));
  };
  const targetForPwd = () => {
    if (pwdVtype === 'mail') return info?.mail || '';
    return info?.phone || pwdPhone;
  };
  const sendPwd = () => {
    const target = targetForPwd();
    if (!target) { message.error(pwdVtype === 'mail' ? '当前账号未绑定邮箱' : '请输入手机号'); return; }
    if (pwdVtype === 'phone' && !/^1[3-9]\d{9}$/.test(target)) { message.error('请输入正确的手机号'); return; }
    setSendingPwd(true);
    sendCode(pwdVtype === 'mail' ? 'email' : 'sms', target, 'forget')
      .then((r: any) => { if (r.code === 1) { message.success('验证码已发送'); startPwdCd(); } else message.error(r.msg || '发送失败'); })
      .catch(() => message.error('发送失败'))
      .finally(() => setSendingPwd(false));
  };
  const submitPwd = () => {
    const target = targetForPwd();
    if (!pwdCode) { message.error('请输入验证码'); return; }
    if (!pwdNew || pwdNew.length < 6) { message.error('新密码至少 6 位'); return; }
    const hasLetter = /[a-zA-Z]/.test(pwdNew);
    const hasDigit = /\d/.test(pwdNew);
    const hasPunct = /[^a-zA-Z0-9一-龥]/.test(pwdNew);
    if (!(hasLetter && hasDigit && hasPunct)) { message.error('密码须同时包含英文、数字、标点三种字符'); return; }
    if (pwdNew !== pwdConfirm) { message.error('两次输入的密码不一致'); return; }
    setSaving(true);
    changePassword({ vtype: pwdVtype, code: pwdCode, password: pwdNew, ...(pwdVtype === 'phone' && !info?.phone ? { new_phone: pwdPhone } : {}) })
      .then((r: any) => {
        if (r.code === 1) {
          message.success('密码已修改');
          setPwdCode(''); setPwdNew(''); setPwdConfirm(''); setPwdPhone(''); setPwdOpen(false);
        } else {
          message.error(r.msg || '修改失败');
        }
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="center-pad-60">
        <Spin />
      </div>
    );
  }

  return (
    <Card className="user-center-card">
      <Title level={5} style={{ marginBottom: 16 }}>个人资料</Title>
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item name="name" label="用户名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="签名">
          <Input.TextArea rows={2} maxLength={150} showCount placeholder="填写一句话签名，150字以内" />
        </Form.Item>
        <Form.Item name="qq" label="QQ">
          <Input placeholder="用于站内联系站长，留空则不展示" />
        </Form.Item>
        <Form.Item name="home" label="个人主页">
          <Input placeholder="https://example.com" />
        </Form.Item>
        <Form.Item name="sex" label="性别">
          <Radio.Group>
            <Radio value={0}>保密</Radio>
            <Radio value={1}>男</Radio>
            <Radio value={2}>女</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存资料
            </Button>
            <Button onClick={onLogout}>退出登录</Button>
          </Space>
        </Form.Item>
      </Form>
      <div style={{ marginTop: 16 }}>
        <Title level={5}>账号安全</Title>
        <List bordered>
          <List.Item
            actions={[
              <Button key="phone" type="link" onClick={() => setEditType('phone')}>修改</Button>,
            ]}
          >
            当前手机号：{info?.phone || '—'}
          </List.Item>
          <List.Item
            actions={[
              <Button key="mail" type="link" onClick={() => setEditType('mail')}>修改</Button>,
            ]}
          >
            当前邮箱：{info?.mail || '—'}
          </List.Item>
          <List.Item
            actions={[
              <Button key="pwd" type="link" onClick={() => setPwdOpen(true)}>修改</Button>,
            ]}
          >
            登录密码：********
          </List.Item>
        </List>
      </div>

      <Modal
        title="修改手机号"
        open={editType === 'phone'}
        onCancel={() => { setEditType(null); setNewPhone(''); setPhoneCode(''); }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="当前手机号">
            <Text>{info?.phone || '—'}</Text>
          </Form.Item>
          <Form.Item label="新手机号">
            <Input
              placeholder="请输入新手机号"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              maxLength={11}
            />
          </Form.Item>
          <Form.Item label="短信验证码">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="短信验证码"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
              />
              <Button disabled={cdPhone > 0} loading={sendingPhone} onClick={sendPhone}>
                {cdPhone > 0 ? `${cdPhone}s` : '获取验证码'}
              </Button>
            </Space.Compact>
          </Form.Item>
          <Button type="primary" block loading={saving} onClick={submitPhone}>修改手机号</Button>
        </Form>
      </Modal>

      <Modal
        title="修改邮箱"
        open={editType === 'mail'}
        onCancel={() => { setEditType(null); setNewMail(''); setMailCode(''); }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="当前邮箱">
            <Text>{info?.mail || '—'}</Text>
          </Form.Item>
          <Form.Item label="新邮箱">
            <Input
              placeholder="请输入新邮箱"
              value={newMail}
              onChange={(e) => setNewMail(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="邮箱验证码">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="邮箱验证码"
                value={mailCode}
                onChange={(e) => setMailCode(e.target.value)}
              />
              <Button disabled={cdMail > 0} loading={sendingMail} onClick={sendMail}>
                {cdMail > 0 ? `${cdMail}s` : '获取验证码'}
              </Button>
            </Space.Compact>
          </Form.Item>
          <Button type="primary" block loading={saving} onClick={submitMail}>修改邮箱</Button>
        </Form>
      </Modal>

      <Modal
        title="修改登录密码"
        open={pwdOpen}
        onCancel={() => { setPwdOpen(false); setPwdCode(''); setPwdNew(''); setPwdConfirm(''); setPwdPhone(''); }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="验证方式">
            <Radio.Group value={pwdVtype} onChange={(e) => setPwdVtype(e.target.value)}>
              <Radio value="mail" disabled={!info?.mail}>邮箱验证{info?.mail ? `（${info.mail}）` : '（未绑定邮箱）'}</Radio>
              <Radio value="phone">手机验证{info?.phone ? `（${info.phone}）` : '（可输入新手机号）'}</Radio>
            </Radio.Group>
          </Form.Item>
          {!info?.phone && pwdVtype === 'phone' ? (
            <Form.Item label="手机号">
              <Input
                placeholder="请输入手机号"
                value={pwdPhone}
                onChange={(e) => setPwdPhone(e.target.value)}
                maxLength={11}
              />
            </Form.Item>
          ) : (
            <Form.Item label={pwdVtype === 'mail' ? '当前邮箱' : '当前手机号'}>
              <Text>{pwdVtype === 'mail' ? (info?.mail || '—') : (info?.phone || '—')}</Text>
            </Form.Item>
          )}
          <Form.Item label="验证码">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="验证码"
                value={pwdCode}
                onChange={(e) => setPwdCode(e.target.value)}
              />
              <Button disabled={cdPwd > 0} loading={sendingPwd} onClick={sendPwd}>
                {cdPwd > 0 ? `${cdPwd}s` : '获取验证码'}
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="新密码" extra="至少 6 位，须同时包含英文、数字、标点三种字符">
            <Input.Password
              placeholder="至少 6 位，含英文、数字、标点"
              value={pwdNew}
              onChange={(e) => setPwdNew(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="确认新密码">
            <Input.Password
              placeholder="再次输入新密码"
              value={pwdConfirm}
              onChange={(e) => setPwdConfirm(e.target.value)}
            />
          </Form.Item>
          <Button type="primary" block loading={saving} onClick={submitPwd}>确认修改</Button>
        </Form>
      </Modal>
    </Card>
  );
}

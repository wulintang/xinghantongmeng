import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Avatar, Space, message, Radio, Spin, Upload, List, Modal } from 'antd';
import { getUserProfile, updateUserProfile, userLogout, uploadFile, sendCode, bindPhone, changeMail } from '@/services/userCenter';
import { getToken, clearToken } from '@/utils/auth';
import { assetUrl } from '@/utils/route';
import { MemberInfo } from '@/services/userCenter';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const navigate = useNavigate();
  usePageMeta({ title: '个人资料' });
  const [form] = Form.useForm();
  const [info, setInfo] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 头像上传：走 user 插件 upload（for=avatar 后端直接更新 my_member.head）
  const onUploadAvatar = (file: File) => {
    const key = getToken();
    if (!key) return false;
    if (!/^image\//.test(file.type)) {
      message.error('请选择图片文件');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片不能超过 5MB');
      return false;
    }
    setUploading(true);
    uploadFile(key, file, true)
      .then((r: any) => {
        if (r.code === 1) {
          const url = r.data?.url || '';
          setInfo((prev) => (prev ? { ...prev, head: url } : prev));
          message.success('头像已更新');
        } else {
          message.error(r.msg || '上传失败');
        }
      })
      .catch(() => message.error('上传失败，请稍后重试'))
      .finally(() => setUploading(false));
    return false; // 阻止 antd 自动上传
  };

  useEffect(() => {
    const key = getToken();
    if (!key) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    getUserProfile(key)
      .then((r: any) => {
        if (r.code === 1 && r.data) {
          setInfo(r.data);
          form.setFieldsValue(r.data);
        } else {
          clearToken();
          message.error(r.msg || '登录失效');
          navigate('/login');
        }
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setLoading(false));
  }, [navigate, form]);

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
  const timerPhone = useRef<number | null>(null);
  const timerMail = useRef<number | null>(null);
  useEffect(() => () => {
    if (timerPhone.current) clearInterval(timerPhone.current);
    if (timerMail.current) clearInterval(timerMail.current);
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

  if (loading) {
    return (
      <div className="center-pad-60">
        <Spin />
      </div>
    );
  }

  return (
    <Card className="user-center-card">
      <Space align="center" className="mb-16">
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={onUploadAvatar}
          disabled={uploading}
        >
          <div className="user-avatar-upload">
            <Avatar src={assetUrl(info?.head) || undefined} size={56}>
              {info?.name?.charAt(0)}
            </Avatar>
            <span className="user-avatar-mask">{uploading ? '上传中' : '更换'}</span>
          </div>
        </Upload>
        <Title level={4} className="user-profile-name">
          {info?.name}
        </Title>
      </Space>
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item name="name" label="用户名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="简介">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="qq" label="QQ">
          <Input />
        </Form.Item>
        <Form.Item name="home" label="个人主页">
          <Input />
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
    </Card>
  );
}

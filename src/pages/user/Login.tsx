import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Radio, Card, Typography, Space, message } from 'antd';
import { sendCode, userLogin } from '@/services/userCenter';
import { setToken } from '@/utils/auth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [mode, setMode] = useState<'pwd' | 'code'>('pwd');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  const onSendCode = () => {
    const v = form.getFieldsValue();
    const type: 'sms' | 'email' = v.phone ? 'sms' : 'email';
    const target = v.phone || v.mail;
    if (!target) {
      message.warning('请先填写手机号或邮箱');
      return;
    }
    setCodeLoading(true);
    sendCode(type, target, 'login')
      .then((r: any) => message[r.code ? 'success' : 'error'](r.msg))
      .finally(() => setCodeLoading(false));
  };

  const onFinish = (values: any) => {
    setLoading(true);
    userLogin(values)
      .then((r: any) => {
        if (r.code === 1) {
          setToken(r.key);
          message.success('登录成功');
          navigate('/user');
        } else {
          message.error(r.msg);
        }
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setLoading(false));
  };

  return (
    <Card className="user-card user-card-480">
      <Title level={3}>登录</Title>
      <Radio.Group
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="mb-16"
      >
        <Radio.Button value="pwd">密码登录</Radio.Button>
        <Radio.Button value="code">验证码登录</Radio.Button>
      </Radio.Group>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {mode === 'pwd' ? (
          <>
            <Form.Item
              name="account"
              label="账号（用户名 / 手机 / 邮箱）"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input placeholder="用户名、手机号或邮箱" />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item name="phone" label="手机号">
              <Input placeholder="用于接收短信验证码" />
            </Form.Item>
            <Form.Item name="mail" label="邮箱">
              <Input placeholder="用于接收邮箱验证码" />
            </Form.Item>
            <Space.Compact className="compact-full mb-16">
              <Form.Item name="sms_code" label="短信验证码" className="compact-item">
                <Input placeholder="手机验证码" />
              </Form.Item>
              <Form.Item name="email_code" label="邮箱验证码" className="compact-item">
                <Input placeholder="邮箱验证码" />
              </Form.Item>
              <Button onClick={onSendCode} loading={codeLoading}>
                获取验证码
              </Button>
            </Space.Compact>
          </>
        )}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form.Item>
      </Form>
      <Text>
        还没有账号？<Link to="/register">去注册</Link>
      </Text>
    </Card>
  );
}

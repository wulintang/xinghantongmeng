import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Radio, Card, Typography, Space, message } from 'antd';
import { sendCode, userLogin } from '@/services/userCenter';
import { setToken } from '@/utils/auth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [mode, setMode] = useState<'phone' | 'mail'>('phone');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  // 好道 Api.php::login：手机或邮箱二选一 + 密码 + 对应验证码
  const onSendCode = () => {
    const v = form.getFieldsValue();
    if (mode === 'phone') {
      if (!/^1[3-9]\d{9}$/.test(v.phone || '')) {
        message.warning('请先填写正确的手机号');
        return;
      }
      setCodeLoading(true);
      sendCode('sms', v.phone, 'login')
        .then((r: any) => message[r.code ? 'success' : 'error'](r.msg))
        .finally(() => setCodeLoading(false));
    } else {
      if (!v.mail) {
        message.warning('请先填写邮箱');
        return;
      }
      setCodeLoading(true);
      sendCode('email', v.mail, 'login')
        .then((r: any) => message[r.code ? 'success' : 'error'](r.msg))
        .finally(() => setCodeLoading(false));
    }
  };

  const onFinish = (values: any) => {
    setLoading(true);
    const payload: any = { password: values.password };
    if (mode === 'phone') {
      payload.phone = values.phone;
      payload.sms_code = values.sms_code;
    } else {
      payload.mail = values.mail;
      payload.email_code = values.email_code;
    }
    userLogin(payload)
      .then((r: any) => {
        if (r.code === 1) {
          // 好道原生 login 不返回 key，登录态靠 cookie；前端存登录标记
          setToken(r.key || '1');
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
        <Radio.Button value="phone">手机号登录</Radio.Button>
        <Radio.Button value="mail">邮箱登录</Radio.Button>
      </Radio.Group>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {mode === 'phone' ? (
          <>
            <Form.Item
              name="phone"
              label="手机号"
              rules={[{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误' }]}
            >
              <Input placeholder="用于接收短信验证码" />
            </Form.Item>
            <Form.Item label="短信验证码" className="mb-16">
              <Space.Compact block>
                <Form.Item
                  name="sms_code"
                  noStyle
                  rules={[{ required: true, message: '请输入短信验证码' }]}
                >
                  <Input placeholder="手机验证码" />
                </Form.Item>
                <Button onClick={onSendCode} loading={codeLoading}>
                  获取验证码
                </Button>
              </Space.Compact>
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              name="mail"
              label="邮箱"
              rules={[{ type: 'email', message: '邮箱格式错误' }]}
            >
              <Input placeholder="用于接收邮箱验证码" />
            </Form.Item>
            <Form.Item label="邮箱验证码" className="mb-16">
              <Space.Compact block>
                <Form.Item
                  name="email_code"
                  noStyle
                  rules={[{ required: true, message: '请输入邮箱验证码' }]}
                >
                  <Input placeholder="邮箱验证码" />
                </Form.Item>
                <Button onClick={onSendCode} loading={codeLoading}>
                  获取验证码
                </Button>
              </Space.Compact>
            </Form.Item>
          </>
        )}
        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password placeholder="每次登录都需输入密码" />
        </Form.Item>
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

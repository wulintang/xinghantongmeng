import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, message } from 'antd';
import { sendCode, userRegister } from '@/services/userCenter';
import { setToken } from '@/utils/auth';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  const onSendCode = (scene: 'sms' | 'email') => {
    const v = form.getFieldsValue();
    const target = scene === 'sms' ? v.phone : v.mail;
    if (!target) {
      message.warning(scene === 'sms' ? '请先填写手机号' : '请先填写邮箱');
      return;
    }
    setCodeLoading(true);
    sendCode(scene, target, 'reg')
      .then((r: any) => message[r.code ? 'success' : 'error'](r.msg))
      .finally(() => setCodeLoading(false));
  };

  const onFinish = (values: any) => {
    setLoading(true);
    userRegister(values)
      .then((r: any) => {
        if (r.code === 1) {
          setToken(r.key);
          message.success('注册成功');
          navigate('/user');
        } else {
          message.error(r.msg);
        }
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setLoading(false));
  };

  return (
    <Card style={{ maxWidth: 480, margin: '40px auto' }}>
      <Title level={3}>注册</Title>
      <Text type="secondary">手机号 + 短信验证码，或邮箱 + 邮箱验证码，二选一即可。</Text>
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
        <Form.Item
          name="phone"
          label="手机号"
          rules={[{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误', validateTrigger: 'onBlur' }]}
        >
          <Input placeholder="选填，用于短信验证" />
        </Form.Item>
        <Form.Item>
          <Button onClick={() => onSendCode('sms')} loading={codeLoading}>
            获取短信验证码
          </Button>
          <span style={{ marginLeft: 8, color: '#999' }}>（填了手机号再点）</span>
        </Form.Item>
        <Form.Item
          name="sms_code"
          label="短信验证码"
        >
          <Input placeholder="手机验证码" />
        </Form.Item>

        <Form.Item
          name="mail"
          label="邮箱"
          rules={[{ type: 'email', message: '邮箱格式错误', validateTrigger: 'onBlur' }]}
        >
          <Input placeholder="选填，用于邮箱验证" />
        </Form.Item>
        <Form.Item>
          <Button onClick={() => onSendCode('email')} loading={codeLoading}>
            获取邮箱验证码
          </Button>
          <span style={{ marginLeft: 8, color: '#999' }}>（填了邮箱再点）</span>
        </Form.Item>
        <Form.Item name="email_code" label="邮箱验证码">
          <Input placeholder="邮箱验证码" />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="passwords"
          label="确认密码"
          dependencies={['password']}
          rules={[
            { required: true, message: '请再次输入密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('两次密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            注册
          </Button>
        </Form.Item>
      </Form>
      <Text>
        已有账号？<Link to="/login">去登录</Link>
      </Text>
    </Card>
  );
}

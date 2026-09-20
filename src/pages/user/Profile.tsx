import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Avatar, Space, message, Radio, Spin } from 'antd';
import { getUserProfile, updateUserProfile, userLogout } from '@/services/userCenter';
import { getToken, clearToken } from '@/utils/auth';
import { MemberInfo } from '@/services/userCenter';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [info, setInfo] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      navigate('/home');
    });
  };

  if (loading) {
    return (
      <div className="center-pad-60">
        <Spin />
      </div>
    );
  }

  return (
    <Card className="user-card user-card-560">
      <Space align="center" className="mb-16">
        <Avatar src={info?.head} size={56}>
          {info?.name?.charAt(0)}
        </Avatar>
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
      <Text type="secondary">邮箱：{info?.mail || '未绑定'}</Text>
      <br />
      <Text type="secondary">手机：{info?.phone || '未绑定'}</Text>
    </Card>
  );
}

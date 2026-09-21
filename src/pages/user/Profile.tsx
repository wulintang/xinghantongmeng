import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Avatar, Space, message, Radio, Spin, Upload } from 'antd';
import { getUserProfile, updateUserProfile, userLogout, uploadFile } from '@/services/userCenter';
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
      <Text type="secondary">邮箱：{info?.mail || '未绑定'}</Text>
      <br />
      <Text type="secondary">手机：{info?.phone || '未绑定'}</Text>
    </Card>
  );
}

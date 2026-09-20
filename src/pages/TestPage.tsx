import React from 'react';
import { Card, Col, Row, Typography, Space, Divider } from 'antd';
import {
  BookOutlined,
  CloudServerOutlined,
  SkinOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  MobileOutlined,
  LineChartOutlined,
  RobotOutlined,
  SafetyOutlined,
} from '@ant-design/icons';

interface ServiceItem {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

interface ServiceCardProps {
  title: string;
  price?: string;
  services: ServiceItem[];
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, price, services }) => {
  return (
    <Card
      hoverable
      bordered={false}
      style={{
        height: '100%',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
      bodyStyle={{ padding: '28px 24px' }}
    >
      <Typography.Title
        level={4}
        style={{ textAlign: 'center', margin: 0, fontWeight: 600 }}
      >
        {title}
      </Typography.Title>

      {price && (
        <div style={{
          textAlign: 'center',
          margin: '12px 0',
          fontSize: 24,
          color: '#1890ff',
          fontWeight: 700
        }}>
          ¥{price}
        </div>
      )}

      <Divider style={{ margin: '16px 0 24px' }} />
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {services.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '12px 8px',
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 22, color: item.color, marginTop: 4 }}>
              {item.icon}
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#1f2937' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4, lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </Space>
    </Card>
  );
};

const ServicePage: React.FC = () => {
  // 基础服务
  const basicServices: ServiceItem[] = [
    {
      title: '博客搭建',
      desc: '快速搭建专属个人与企业博客站点',
      icon: <BookOutlined />,
      color: '#1890ff'
    },
    {
      title: '服务托管',
      desc: '稳定云服务器托管，免运维省心部署',
      icon: <CloudServerOutlined />,
      color: '#52c41a'
    },
    {
      title: '主题美化',
      desc: '定制精美主题模板，全站视觉美化',
      icon: <SkinOutlined />,
      color: '#722ed1'
    },
    {
      title: '性能加速',
      desc: '静态资源优化、CDN 加速访问速度',
      icon: <ThunderboltOutlined />,
      color: '#fa8c16'
    },
  ];

  // 增值服务
  const otherServices: ServiceItem[] = [
    {
      title: '技术支持',
      desc: '7×24 在线答疑与故障排查',
      icon: <CloudServerOutlined />,
      color: '#52c41a'
    },
    {
      title: '数据备份',
      desc: '定时自动备份，数据安全保障',
      icon: <BookOutlined />,
      color: '#1890ff'
    },
    {
      title: '安全防护',
      desc: '漏洞检测、防攻击、权限加固',
      icon: <SafetyOutlined />,
      color: '#ff4d4f'
    },
    {
      title: '博客 AI 增值赋能',
      desc: 'AI智能推荐、内容审核、个性化流量分发',
      icon: <RobotOutlined />,
      color: '#13c2c2'
    },
  ];

  // 定制服务
  const customServices: ServiceItem[] = [
    {
      title: '博客 App 开发',
      desc: 'iOS / Android 移动端独立应用打包',
      icon: <MobileOutlined />,
      color: '#13c2c2'
    },
    {
      title: '博客营销',
      desc: '流量推广、SEO 优化与品牌引流运营',
      icon: <LineChartOutlined />,
      color: '#faad14'
    },
    {
      title: '博客 AI 赋能',
      desc: 'AI文章创作、智能摘要、评论自动回复',
      icon: <RobotOutlined />,
      color: '#2f54eb'
    },
  ];

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '60px 20px',
        backgroundColor: '#f5f7fa',
        minHeight: '100vh',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Typography.Title level={2} style={{ marginBottom: 16, fontWeight: 700 }}>
          专业博客服务解决方案
        </Typography.Title>
        <Typography.Paragraph style={{ fontSize: 16, color: '#6b7280' }}>
          一站式博客搭建、定制开发与运营增值服务
        </Typography.Paragraph>
      </div>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={12} md={8}>
          <ServiceCard title="基础服务" price="19.9" services={basicServices} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <ServiceCard title="增值服务" price="99" services={otherServices} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <ServiceCard title="定制服务" price="199" services={customServices} />
        </Col>
      </Row>

      {/* 底部微信咨询二维码区块 */}
      <div
        style={{
          maxWidth: 800,
          margin: '60px auto 0',
          padding: '32px 24px',
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}
      >
        <Typography.Title level={4} style={{ marginBottom: 8, fontWeight: 600 }}>
          一对一专属咨询
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#6b7280', marginBottom: 24 }}>
          扫码添加微信，获取定制方案与专属优惠
        </Typography.Paragraph>

        {/* 替换为你自己的微信二维码图片地址 */}
        <img
          src="/assets/images/sites/service/wechat-service.jpg"
          alt="微信咨询二维码"
          style={{
            width: 200,
            height: 200,
            borderRadius: 12,
            border: '4px solid #f5f7fa',
            objectFit: 'cover'
          }}
        />

        <div style={{ marginTop: 16, fontSize: 14, color: '#888' }}>
          微信号：<span style={{ color: '#1890ff', fontWeight: 500 }}>wx_id_haoran</span>
        </div>
      </div>

    </div>
  );
};

export default ServicePage;
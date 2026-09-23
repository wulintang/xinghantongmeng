import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Statistic, Button, Space, message, Spin, Tag, Row, Col, Table } from 'antd';
import { getCheckin, doCheckin } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { CheckinStatus } from '@/services/userCenter';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title } = Typography;

export default function CheckinPage() {
  const navigate = useNavigate();
  usePageMeta({ title: '每日签到' });
  const [data, setData] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [doing, setDoing] = useState(false);

  const load = () => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    getCheckin(key)
      .then((r: any) => {
        if (r.code === 1) setData(r.data);
        else navigate('/login');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  const onCheckin = () => {
    setDoing(true);
    doCheckin(getToken())
      .then((r: any) => {
        if (r.code === 1) {
          message.success(`签到成功，连续 ${r.data.day} 天`);
          load();
        } else {
          message.error(r.msg);
        }
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setDoing(false));
  };

  const ruleDay = data?.rule?.day ?? 7;
  const ruleRmb1 = data?.rule?.rmb1 ?? 0.1;
  const ruleRmb2 = data?.rule?.rmb2 ?? 0.5;

  return (
    <Card className="user-center-card">
      <Title level={4}>每日签到</Title>
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Space size="large" className="mb-16">
              <Statistic title="连续签到(天)" value={data?.last_day ?? 0} />
              <Statistic title="累计签到(次)" value={data?.count ?? 0} />
            </Space>
            <div>
              {data?.today_done ? (
                <Tag color="green">今日已签到</Tag>
              ) : (
                <Button type="primary" loading={doing} onClick={onCheckin}>
                  立即签到
                </Button>
              )}
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Title level={5}>规则</Title>
            <Table
              size="small"
              pagination={false}
              bordered
              dataSource={[
                { key: '1', day: `连续签到 < ${ruleDay} 天`, rmb: `¥${ruleRmb1}` },
                { key: '2', day: `连续签到 ≥ ${ruleDay} 天`, rmb: `¥${ruleRmb2}` },
              ]}
              columns={[
                { title: '签到次数', dataIndex: 'day', key: 'day' },
                { title: '奖励金额', dataIndex: 'rmb', key: 'rmb' },
              ]}
            />
          </Col>
        </Row>
      </Spin>
    </Card>
  );
}

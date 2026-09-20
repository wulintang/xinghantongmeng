import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Statistic, Button, Space, message, Spin, Tag } from 'antd';
import { getCheckin, doCheckin } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { CheckinStatus } from '@/services/userCenter';

const { Title } = Typography;

export default function CheckinPage() {
  const navigate = useNavigate();
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

  return (
    <Card style={{ maxWidth: 560, margin: '40px auto' }}>
      <Title level={4}>每日签到</Title>
      <Spin spinning={loading}>
        <Space size="large" style={{ marginBottom: 16 }}>
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
      </Spin>
    </Card>
  );
}

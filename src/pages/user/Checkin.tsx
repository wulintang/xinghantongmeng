import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Statistic, Button, Space, message, Spin, Tag, Divider, List } from 'antd';
import dayjs from 'dayjs';
import { getCheckin, doCheckin, getCheckinList } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { CheckinStatus, CheckinRecord } from '@/services/userCenter';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title, Text } = Typography;

export default function CheckinPage() {
  const navigate = useNavigate();
  usePageMeta({ title: '每日签到' });
  const [data, setData] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [doing, setDoing] = useState(false);
  const [list, setList] = useState<CheckinRecord[]>([]);

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
    getCheckinList(key)
      .then((r: any) => {
        if (r.code === 1) setList(r.data || []);
      })
      .catch(() => {});
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
      <Spin spinning={loading}>
        <div className="checkin-head" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Title level={5}>每日签到</Title>
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
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Title level={5}>规则</Title>
            <div style={{ marginBottom: 8 }}>
              <Text>连续签到 &lt; {ruleDay} 天：¥{ruleRmb1}</Text>
            </div>
            <div>
              <Text>连续签到 ≥ {ruleDay} 天：¥{ruleRmb2}</Text>
            </div>
          </div>
        </div>
        <Divider />
        <Title level={5}>我的签到记录</Title>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
          dataSource={list}
          rowKey="id"
          renderItem={(item: CheckinRecord) => (
            <List.Item>
              <Card size="small">
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">签到日期</Text>
                  <div>{dayjs(item.time * 1000).format('YYYY-MM-DD HH:mm')}</div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">连续天数</Text>
                  <div>{item.day}</div>
                </div>
                <div>
                  <Text type="secondary">奖励金额</Text>
                  <div>¥{item.rmb}</div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
}

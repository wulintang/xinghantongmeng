import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Statistic, Button, Space, message, Spin, Tag, Divider, List, Table, Tabs, TabPane } from 'antd';
import dayjs from 'dayjs';
import { getCheckin, doCheckin, getCheckinList, getCheckinRank } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { CheckinStatus, CheckinRecord, CheckinRankItem } from '@/services/userCenter';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title, Text } = Typography;

export default function CheckinPage() {
  const navigate = useNavigate();
  usePageMeta({ title: '每日签到' });
  const [data, setData] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [doing, setDoing] = useState(false);
  const [list, setList] = useState<CheckinRecord[]>([]);
  const [rankList, setRankList] = useState<CheckinRankItem[]>([]);
  const [rankLoading, setRankLoading] = useState(true);

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
    getCheckinRank(key)
      .then((r: any) => {
        if (r.code === 1) setRankList(r.data || []);
      })
      .catch(() => {})
      .finally(() => setRankLoading(false));
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

  const myRecord = (
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
  );

  const myList = (
    <>
      <Table
        className="hidden-mobile"
        size="small"
        pagination={false}
        rowKey="id"
        dataSource={list}
        columns={[
          {
            title: '签到日期',
            dataIndex: 'time',
            key: 'time',
            render: (t: number) => dayjs(t * 1000).format('YYYY-MM-DD HH:mm'),
          },
          { title: '连续天数', dataIndex: 'day', key: 'day' },
          {
            title: '奖励金额',
            dataIndex: 'rmb',
            key: 'rmb',
            render: (v: number) => `¥${v}`,
          },
        ]}
      />
      <List
        className="hidden-desktop"
        grid={{ gutter: 16, xs: 1 }}
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
    </>
  );

  const rankView = (
    <>
      <Table
        className="hidden-mobile"
        size="small"
        pagination={false}
        rowKey="uid"
        loading={rankLoading}
        dataSource={rankList}
        columns={[
          { title: '排名', dataIndex: 'rank', key: 'rank', width: 80 },
          { title: '用户', dataIndex: 'name', key: 'name' },
          { title: '累计签到天数', dataIndex: 'days', key: 'days' },
          {
            title: '累计奖励金额',
            dataIndex: 'rmb',
            key: 'rmb',
            render: (v: number) => `¥${v}`,
          },
        ]}
      />
      <List
        className="hidden-desktop"
        grid={{ gutter: 16, xs: 1 }}
        dataSource={rankList}
        rowKey="uid"
        loading={rankLoading}
        renderItem={(item: CheckinRankItem) => (
          <List.Item>
            <Card size="small">
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">排名</Text>
                <div>{item.rank}</div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">用户</Text>
                <div>{item.name}</div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">累计签到天数</Text>
                <div>{item.days}</div>
              </div>
              <div>
                <Text type="secondary">累计奖励金额</Text>
                <div>¥{item.rmb}</div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </>
  );

  return (
    <Card className="user-center-card">
      <Spin spinning={loading}>
        {myRecord}
        <Divider />
        <Tabs defaultActiveKey="mine">
          <TabPane tab="我的签到记录" key="mine">
            {myList}
          </TabPane>
          <TabPane tab="签到排行" key="rank">
            {rankView}
          </TabPane>
        </Tabs>
      </Spin>
    </Card>
  );
}

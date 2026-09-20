import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, List, Tag, Button, Space, Spin, Empty, message } from 'antd';
import { getMessages, readMessage, type MessageItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title, Paragraph, Text } = Typography;

export default function MessagesPage() {
  const navigate = useNavigate();
  usePageMeta({ title: '消息中心' });
  const [list, setList] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fmt = (t: number) => (t ? new Date(t * 1000).toLocaleString() : '');

  const load = () => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    getMessages(key)
      .then((r: any) => {
        if (r.code === 1) setList(r.data || []);
        else {
          message.error(r.msg || '登录已失效');
          navigate('/login');
        }
      })
      .catch((e) => message.error(e?.message || '消息加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  const onRead = (m: MessageItem) => {
    readMessage(getToken() || '', m.id)
      .then(() => setList((l) => l.map((x) => (x.id === m.id ? { ...x, open: 1 } : x))))
      .catch(() => {});
    if (m.url) window.open(m.url, '_blank');
  };

  return (
    <Card className="user-card user-card-760">
      <Title level={4}>消息中心</Title>
      <Spin spinning={loading}>
        {list.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <List
            dataSource={list}
            renderItem={(m) => (
              <List.Item
                actions={[
                  <Button key="read" size="small" onClick={() => onRead(m)}>
                    {m.open ? '查看' : '标记已读'}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      {m.open ? (
                        <Tag color="default">已读</Tag>
                      ) : (
                        <Tag color="blue">未读</Tag>
                      )}
                      <Text type="secondary">{fmt(m.time)}</Text>
                    </Space>
                  }
                  description={<Paragraph className="user-msg-text">{m.msg}</Paragraph>}
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </Card>
  );
}

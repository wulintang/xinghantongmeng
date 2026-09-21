import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, List, Tag, Button, Space, Empty, message, Checkbox, Popconfirm } from 'antd';
import { getMessages, readMessage, deleteMessage, type MessageItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { MessagesSkeleton } from '@components/common/skeleton';

const { Title, Paragraph, Text } = Typography;

export default function MessagesPage() {
  const navigate = useNavigate();
  usePageMeta({ title: '消息中心' });
  const [list, setList] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);

  const fmt = (t: number) => (t ? new Date(t * 1000).toLocaleString() : '');

  const load = () => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    setLoading(true);
    getMessages(key)
      .then((r: any) => {
        if (r.code === 1) {
          setList(r.data || []);
          setCheckedIds([]);
        } else {
          message.error(r.msg || '登录已失效');
          navigate('/login');
        }
      })
      .catch((e) => message.error(e?.message || '消息加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  const allChecked = list.length > 0 && checkedIds.length === list.length;
  const onToggleAll = (checked: boolean) => {
    setCheckedIds(checked ? list.map((m) => m.id) : []);
  };
  const onToggleCheck = (id: number, checked: boolean) => {
    setCheckedIds((ids) => (checked ? [...new Set([...ids, id])] : ids.filter((x) => x !== id)));
  };

  const onRead = (m: MessageItem) => {
    readMessage(getToken() || '', m.id)
      .then(() => setList((l) => l.map((x) => (x.id === m.id ? { ...x, open: 1 } : x))))
      .catch((e) => message.error(e?.message || '标记已读失败'));
  };

  const onDelete = (m: MessageItem) => {
    deleteMessage(getToken() || '', m.id)
      .then(() => {
        message.success('已删除');
        setList((l) => l.filter((x) => x.id !== m.id));
        setCheckedIds((ids) => ids.filter((x) => x !== m.id));
      })
      .catch((e) => message.error(e?.message || '删除失败'));
  };

  const onReadChecked = () => {
    if (checkedIds.length === 0) return;
    readMessage(getToken() || '', checkedIds)
      .then(() => {
        message.success('已标记已读');
        setList((l) => l.map((x) => (checkedIds.includes(x.id) ? { ...x, open: 1 } : x)));
        setCheckedIds([]);
      })
      .catch((e) => message.error(e?.message || '标记已读失败'));
  };

  const onDeleteChecked = () => {
    if (checkedIds.length === 0) return;
    deleteMessage(getToken() || '', checkedIds)
      .then(() => {
        message.success('已删除选中消息');
        setList((l) => l.filter((x) => !checkedIds.includes(x.id)));
        setCheckedIds([]);
      })
      .catch((e) => message.error(e?.message || '删除失败'));
  };

  return (
    <Card className="user-center-card">
      <Title level={4}>消息中心</Title>
      <div className="msg-toolbar">
        <Checkbox checked={allChecked} onChange={(e) => onToggleAll(e.target.checked)}>全选</Checkbox>
        <Space>
          <Button size="small" type="primary" onClick={onReadChecked} disabled={checkedIds.length === 0}>
            标记已读{checkedIds.length ? `(${checkedIds.length})` : ''}
          </Button>
          <Button size="small" danger onClick={onDeleteChecked} disabled={checkedIds.length === 0}>
            删除选中{checkedIds.length ? `(${checkedIds.length})` : ''}
          </Button>
        </Space>
      </div>
      {loading ? (
        <MessagesSkeleton />
      ) : list.length === 0 ? (
        <Empty description="暂无消息" />
      ) : (
        <List
          dataSource={list}
          renderItem={(m) => (
            <List.Item
              actions={[
                m.open ? null : (
                  <Button key="read" size="small" onClick={() => onRead(m)}>
                    标记已读
                  </Button>
                ),
                <Popconfirm key="del" title="确认删除这条消息？" onConfirm={() => onDelete(m)} okText="删除" cancelText="取消">
                  <Button size="small" danger>删除</Button>
                </Popconfirm>,
              ]}
            >
              <div className="fav-item-wrap">
                <Checkbox
                  checked={checkedIds.includes(m.id)}
                  onChange={(e) => onToggleCheck(m.id, e.target.checked)}
                />
                <List.Item.Meta
                  title={
                    <div>
                      <Space size={8}>
                        {m.open ? <Tag color="default">已读</Tag> : <Tag color="blue">未读</Tag>}
                        <Text type="secondary">{fmt(m.time)}</Text>
                      </Space>
                      <Paragraph className="user-msg-text user-msg-paragraph">
                        {m.msg}
                      </Paragraph>
                    </div>
                  }
                />
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

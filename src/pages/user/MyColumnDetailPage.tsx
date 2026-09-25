import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { usePageMeta } from '@/hooks/usePageMeta';
import {
  getMyColumns,
  getMyArticles,
  articleSave,
  articleDel,
  COLUMN_STATUS_TEXT,
  type ColumnItem,
  type ColumnArticleItem,
} from '@/services/column';
import { getToken } from '@/utils/auth';
import { assetUrl } from '@/utils/route';
import ColumnImgUpload from '@/components/common/ColumnImgUpload';

const { Text } = Typography;
const { TextArea } = Input;

const MyColumnDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const columnId = Number(id) || 0;
  const key = getToken();

  const [loading, setLoading] = useState(true);
  const [column, setColumn] = useState<ColumnItem | null>(null);
  const [articles, setArticles] = useState<ColumnArticleItem[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ColumnArticleItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  usePageMeta({
    title: column?.name ? `${column.name} - 文章管理` : '专栏文章管理',
    description: '管理专栏内的文章',
  });

  const load = () => {
    if (!key || !columnId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getMyColumns(key), getMyArticles(key)])
      .then(([cols, arts]) => {
        const list = cols.code === 1 ? cols.data || [] : [];
        const c = list.find((x) => x.id === columnId) || null;
        setColumn(c);
        const allArts = arts.code === 1 ? arts.data || [] : [];
        // 文章 tid 是真实分类 id（my_article_cate.id），不是申请记录 id
        setArticles(allArts.filter((a) => a.tid === (c?.article_cate_id || 0)));
      })
      .catch(() => {
        setColumn(null);
        setArticles([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, columnId]);

  const openCreate = () => {
    if (!column || column.status !== 1) {
      message.warning('专栏通过审核后才能投稿');
      return;
    }
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ pic: '', tid: column?.article_cate_id || 0 });
    setEditOpen(true);
  };

  const openEdit = (a: ColumnArticleItem) => {
    setEditing(a);
    form.resetFields();
    form.setFieldsValue({
      tid: a.tid,
      title: a.title,
      pic: a.pic || '',
      description: a.description || '',
      keywords: a.keywords || '',
      content: a.content || '',
    });
    setEditOpen(true);
  };

  const onSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (!v.pic) {
        message.error('封面图必传');
        return;
      }
      setSubmitting(true);
      articleSave({
        id: editing?.id,
        tid: v.tid,
        title: v.title,
        pic: v.pic,
        content: v.content,
        description: v.description || '',
        keywords: v.keywords || '',
      })
        .then((r) => {
          if (r.code === 1) {
            message.success(editing ? '已提交修改，等待审核' : '已提交，等待审核');
            setEditOpen(false);
            load();
          } else {
            message.error(r.msg || '提交失败');
          }
        })
        .catch((e) => message.error(e?.message || '提交失败'))
        .finally(() => setSubmitting(false));
    } catch {
      /* 校验失败 */
    }
  };

  const onDelete = (a: ColumnArticleItem) => {
    articleDel(a.id)
      .then((r) => {
        if (r.code === 1) {
          message.success('文章已删除，已发放的奖励将退还');
          load();
        } else {
          message.error(r.msg || '删除失败');
        }
      })
      .catch((e) => message.error(e?.message || '删除失败'));
  };

  const statusTag = (a: ColumnArticleItem) => {
    const map: Record<number, { color: string; text: string }> = {
      0: { color: 'gold', text: COLUMN_STATUS_TEXT[0] },
      1: { color: 'green', text: COLUMN_STATUS_TEXT[1] },
      2: { color: 'red', text: COLUMN_STATUS_TEXT[2] },
    };
    const s = map[a.status] || map[0];
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columnStatusTag = useMemo(() => {
    if (!column) return null;
    const map: Record<number, { color: string; text: string }> = {
      0: { color: 'gold', text: COLUMN_STATUS_TEXT[0] },
      1: { color: 'green', text: COLUMN_STATUS_TEXT[1] },
      2: { color: 'red', text: COLUMN_STATUS_TEXT[2] },
    };
    const s = map[column.status] || map[0];
    return <Tag color={s.color}>{s.text}</Tag>;
  }, [column]);

  if (!key) {
    return (
      <Alert type="info" showIcon message="请先登录" description="登录后可管理专栏文章。" />
    );
  }

  if (loading) {
    return (
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center">
          <Text strong style={{ fontSize: 'var(--fs-lg)' }}>
            专栏文章管理
          </Text>
          <Button type="primary" disabled>
            投稿文章
          </Button>
        </Flex>
        <Card loading />
      </Flex>
    );
  }

  if (!column) {
    return (
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center">
          <Text strong style={{ fontSize: 'var(--fs-lg)' }}>
            专栏文章管理
          </Text>
        </Flex>
        <Alert type="warning" showIcon message="专栏不存在或无权访问" />
        <Button type="link" onClick={() => navigate('/user/columns')}>
          返回我的专栏
        </Button>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Flex align="center" gap={12} wrap>
          <Avatar shape="square" size={48} src={assetUrl(column.pic) || undefined}>
            {(column.name || '?').slice(0, 1)}
          </Avatar>
          <Flex vertical>
            <Flex align="center" gap={8}>
              <Text strong style={{ fontSize: 'var(--fs-lg)' }}>
                {column.name}
              </Text>
              {columnStatusTag}
            </Flex>
            <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
              {column.description || '暂无简介'} · 共 {articles.length} 篇文章
            </Text>
          </Flex>
        </Flex>
        <Button type="primary" onClick={openCreate} disabled={column.status !== 1}>
          投稿文章
        </Button>
      </Flex>

      {column.status === 2 && column.reason ? (
        <Alert type="error" showIcon message={`拒绝原因：${column.reason}`} />
      ) : null}

      {column.status !== 1 ? (
        <Alert
          type="warning"
          showIcon
          message="专栏尚未通过审核"
          description="通过审核后才能向该专栏投稿文章。"
        />
      ) : null}

      {articles.length === 0 ? (
        <Empty description="该专栏暂无文章，点击右上角投稿" />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2 }}
          dataSource={articles}
          renderItem={(a) => (
            <List.Item>
              <Card>
                <Flex gap={12} align="center" wrap>
                  <Avatar shape="square" size={48} src={assetUrl(a.pic) || undefined}>
                    {(a.title || '?').slice(0, 1)}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Flex align="center" gap={8} wrap>
                      <Text strong ellipsis>
                        <Link to={`/columns/article/${a.id}`} onClick={(e) => e.stopPropagation()}>
                          {a.title}
                        </Link>
                      </Text>
                      {statusTag(a)}
                    </Flex>
                    {a.status === 2 && a.reason ? (
                      <Text type="danger" style={{ fontSize: 'var(--fs-sm)' }}>
                        拒绝原因：{a.reason}
                      </Text>
                    ) : null}
                    <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                      {a.description || '暂无摘要'} · {dayjs.unix(a.time).format('YYYY-MM-DD')}
                    </Text>
                  </div>
                </Flex>
                <Flex gap={8} style={{ marginTop: 12 }} wrap>
                  <Button size="small" onClick={() => navigate(`/columns/article/${a.id}`)}>
                    查看
                  </Button>
                  <Button size="small" onClick={() => openEdit(a)} disabled={a.status === 1}>
                    编辑
                  </Button>
                  <Popconfirm
                    title="确认删除该文章？"
                    description="已发放的奖励将退还"
                    onConfirm={() => onDelete(a)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button size="small" danger>
                      删除
                    </Button>
                  </Popconfirm>
                </Flex>
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={editing ? '编辑文章' : '投稿文章'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={onSubmit}
        confirmLoading={submitting}
        okText="提交审核"
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="所属专栏"
            name="tid"
            rules={[{ required: true, message: '请选择投稿的专栏' }]}
          >
            <Select disabled options={[{ value: column.article_cate_id || 0, label: column.name }]} />
          </Form.Item>
          <Form.Item label="文章标题" name="title" rules={[{ required: true, message: '请填写标题' }]}>
            <Input maxLength={100} placeholder="文章标题" />
          </Form.Item>
          <Form.Item
            label="封面图（必传）"
            name="pic"
            rules={[{ required: true, message: '请上传封面图' }]}
          >
            <ColumnImgUpload hint="点击上传文章封面（必填，支持 webp/jpg/png/gif）。" />
          </Form.Item>
          <Form.Item label="摘要" name="description">
            <TextArea rows={2} maxLength={200} placeholder="一句话摘要" />
          </Form.Item>
          <Form.Item label="关键词" name="keywords">
            <Input maxLength={100} placeholder="用空格或逗号分隔" />
          </Form.Item>
          <Form.Item label="正文" name="content" rules={[{ required: true, message: '请填写正文' }]}>
            <TextArea rows={8} maxLength={20000} placeholder="支持 Markdown" />
          </Form.Item>
          {editing?.status === 1 ? (
            <Alert type="info" showIcon message="已通过文章修改后需重新审核，期间对外仍展示旧内容。" />
          ) : null}
        </Form>
      </Modal>
    </Flex>
  );
};

export default MyColumnDetailPage;

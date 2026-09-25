import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Tag,
  Typography,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';

import { usePageMeta } from '@/hooks/usePageMeta';
import {
  getMyColumns,
  getMyArticles,
  columnSave,
  columnDel,
  urlSave,
  COLUMN_STATUS_TEXT,
  COLUMN_URL_STATUS_TEXT,
  type ColumnItem,
  type ColumnArticleItem,
} from '@/services/column';
import { getToken } from '@/utils/auth';
import { assetUrl } from '@/utils/route';
import ColumnImgUpload from '@/components/common/ColumnImgUpload';

const { Text } = Typography;
const { TextArea } = Input;

const MyColumnsPage: React.FC = () => {
  const navigate = useNavigate();
  const key = getToken();

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<ColumnItem[]>([]);
  const [myArticles, setMyArticles] = useState<ColumnArticleItem[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ColumnItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const [urlOpen, setUrlOpen] = useState(false);
  const [urlTarget, setUrlTarget] = useState<ColumnItem | null>(null);
  const [urlForm] = Form.useForm();
  const [urlSubmitting, setUrlSubmitting] = useState(false);

  usePageMeta({ title: '我的专栏', description: '管理你创建的专栏' });

  const load = () => {
    if (!key) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getMyColumns(key), getMyArticles(key)])
      .then(([cols, arts]) => {
        setList(cols.code === 1 ? cols.data || [] : []);
        setMyArticles(arts.code === 1 ? arts.data || [] : []);
      })
      .catch(() => {
        setList([]);
        setMyArticles([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 某专栏下我的文章数
  const articleCountOf = (tid: number) => myArticles.filter((a) => a.tid === tid).length;

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ pic: '' });
    setEditOpen(true);
  };
  const openEdit = (c: ColumnItem) => {
    setEditing(c);
    form.resetFields();
    form.setFieldsValue({ name: c.name, description: c.description || '', pic: c.pic || '' });
    setEditOpen(true);
  };

  const onSubmitColumn = async () => {
    try {
      const v = await form.validateFields();
      if (!v.pic) {
        message.error('专栏图标必传');
        return;
      }
      setSubmitting(true);
      columnSave({ id: editing?.id, name: v.name, pic: v.pic, description: v.description || '' })
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

  const onDelete = (c: ColumnItem) => {
    const cnt = articleCountOf(c.id);
    if (cnt > 0) {
      message.warning(`该专栏下还有 ${cnt} 篇文章，请先在「我的文章」中删除后再删除专栏`);
      return;
    }
    columnDel(c.id)
      .then((r) => {
        if (r.code === 1) {
          message.success('专栏已删除');
          load();
        } else {
          message.error(r.msg || '删除失败');
        }
      })
      .catch((e) => message.error(e?.message || '删除失败'));
  };

  const openUrl = (c: ColumnItem) => {
    setUrlTarget(c);
    urlForm.resetFields();
    urlForm.setFieldsValue({ custom_url: c.custom_url || '' });
    setUrlOpen(true);
  };
  const onUrlSubmit = async () => {
    try {
      const v = await urlForm.validateFields();
      if (!urlTarget) return;
      setUrlSubmitting(true);
      urlSave({ id: urlTarget.id, custom_url: v.custom_url })
        .then((r) => {
          if (r.code === 1) {
            message.success('自定义URL已提交，等待审核');
            setUrlOpen(false);
            load();
          } else {
            message.error(r.msg || '提交失败');
          }
        })
        .catch((e) => message.error(e?.message || '提交失败'))
        .finally(() => setUrlSubmitting(false));
    } catch {
      /* 校验失败 */
    }
  };

  const statusTag = (c: ColumnItem) => {
    const map: Record<number, { color: string; text: string }> = {
      0: { color: 'gold', text: COLUMN_STATUS_TEXT[0] },
      1: { color: 'green', text: COLUMN_STATUS_TEXT[1] },
      2: { color: 'red', text: COLUMN_STATUS_TEXT[2] },
    };
    const s = map[c.status] || map[0];
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  if (!key) {
    return (
      <Card>
        <Alert type="info" showIcon message="请先登录" description="登录后可管理你的专栏。" />
      </Card>
    );
  }

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center">
        <Text strong style={{ fontSize: 'var(--fs-lg)' }}>
          我的专栏
        </Text>
        <Button type="primary" onClick={openCreate}>
          创建专栏
        </Button>
      </Flex>

      {loading ? (
        <Card loading />
      ) : list.length === 0 ? (
        <Alert type="info" showIcon message="你还没有专栏" description="创建专栏后可向其投稿文章，审核通过即获得随机奖励。" />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2 }}
          dataSource={list}
          renderItem={(c) => (
            <List.Item>
              <Card>
                <Flex gap={12} align="center" wrap>
                  <Avatar shape="square" size={48} src={assetUrl(c.pic) || undefined}>
                    {(c.name || '?').slice(0, 1)}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Flex align="center" gap={8} wrap>
                      <Text strong>{c.name}</Text>
                      {statusTag(c)}
                    </Flex>
                    {c.status === 2 && c.reason ? (
                      <Text type="danger" style={{ fontSize: 'var(--fs-sm)' }}>
                        拒绝原因：{c.reason}
                      </Text>
                    ) : null}
                    <Text type="secondary" className="column-my-desc">
                      {c.description || '暂无简介'}
                    </Text>
                    <div className="column-my-url">
                      <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                        自定义URL：
                        {c.custom_url ? (
                          <Tag color={c.url_status === 1 ? 'green' : c.url_status === 2 ? 'red' : 'gold'}>
                            {c.custom_url}（{COLUMN_URL_STATUS_TEXT[c.url_status] || '—'}）
                          </Tag>
                        ) : (
                          '未设置'
                        )}
                      </Text>
                      <Button size="small" type="link" onClick={() => openUrl(c)}>
                        设置
                      </Button>
                    </div>
                  </div>
                </Flex>
                <Flex gap={8} style={{ marginTop: 12 }} wrap>
                  <Button size="small" onClick={() => navigate(`/columns/${c.id}`)}>
                    查看
                  </Button>
                  <Button size="small" onClick={() => openEdit(c)} disabled={c.status === 1}>
                    编辑
                  </Button>
                  <Popconfirm title="确认删除该专栏？" onConfirm={() => onDelete(c)} okText="删除" cancelText="取消">
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
        title={editing ? '编辑专栏' : '创建专栏'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={onSubmitColumn}
        confirmLoading={submitting}
        okText="提交审核"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="专栏名称" name="name" rules={[{ required: true, message: '请填写专栏名称' }]}>
            <Input maxLength={50} placeholder="如：道家文化研究" />
          </Form.Item>
          <Form.Item label="专栏图标（必传）" name="pic" rules={[{ required: true, message: '请上传专栏图标' }]}>
            <ColumnImgUpload hint="点击上传专栏图标（必填，支持 webp/jpg/png/gif）。" />
          </Form.Item>
          <Form.Item label="专栏简介" name="description">
            <TextArea rows={3} maxLength={200} placeholder="一句话介绍这个专栏" />
          </Form.Item>
          {editing?.status === 1 ? (
            <Alert type="info" showIcon message="已通过的专栏修改后需重新审核，期间对外仍展示旧内容。" />
          ) : null}
        </Form>
      </Modal>

      <Modal
        title="自定义专栏URL"
        open={urlOpen}
        onCancel={() => setUrlOpen(false)}
        onOk={onUrlSubmit}
        confirmLoading={urlSubmitting}
        okText="提交并付费审核"
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="自定义URL需付费审核，提交即从余额扣费（禁止纯中文）。"
        />
        <Form form={urlForm} layout="vertical">
          <Form.Item
            label="自定义URL"
            name="custom_url"
            rules={[
              { required: true, message: '请填写自定义URL' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '仅允许字母/数字/横线/下划线，禁止纯中文' },
            ]}
          >
            <Input maxLength={100} placeholder="如：daojia-wenhua" />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
};

export default MyColumnsPage;

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Divider, Flex, Input, Modal, Space, Tooltip, Typography, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, AdSlotSkeleton } from '@components/common';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getColumnDetail, type ColumnArticleItem } from '@/services/column';
import { getToken } from '@/utils/auth';
import { stripHtmlSuffix } from '@/utils/route';
import { markdownToHtml, sanitizeHtml } from '@/utils/CommonUtil';
import { submitReport, toggleLike, toggleFavorite, readFaved } from '@/services/userCenter';

const { Text, Paragraph } = Typography;

const ColumnArticleDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const articleId = stripHtmlSuffix(id);

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ColumnArticleItem | null>(null);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [faved, setFaved] = useState(false);
  const [zan, setZan] = useState(0);
  const [liking, setLiking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reporting, setReporting] = useState(false);

  usePageMeta({
    title: item?.title || '文章详情',
    keywords: item?.keywords || undefined,
    description: item?.description || undefined,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setItem(null);
    getColumnDetail(articleId)
      .then((r) => {
        if (!alive) return;
        if (r.code === 1 && r.data) {
          setItem(r.data);
          setZan(Number(r.data.zan) || 0);
          readFaved(getToken(), Number(r.data.id), 'article').then(setFaved);
        } else setError(r.msg || '文章不存在');
      })
      .catch(() => {
        if (alive) setError('文章加载失败');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [articleId]);

  const onLike = () => {
    const key = getToken();
    if (!key) {
      message.warning('请先登录后再点赞');
      navigate('/login');
      return;
    }
    if (!item || liking) return;
    setLiking(true);
    toggleLike(key, Number(item.id), 'article')
      .then((r) => {
        if (r.code === 1) {
          const now = r.data?.liked === 1;
          setLiked(now);
          if (typeof r.data?.zan === 'number') setZan(r.data.zan);
          else setZan((v) => (now ? v + 1 : Math.max(0, v - 1)));
          message.success(now ? '点赞成功' : '已取消点赞');
        } else {
          message.error(r.msg || '操作失败');
        }
      })
      .catch((e) => message.error(e?.message || '网络错误'))
      .finally(() => setLiking(false));
  };
  const onFav = () => {
    const key = getToken();
    if (!key) {
      message.warning('请先登录后再收藏');
      navigate('/login');
      return;
    }
    if (!item) return;
    toggleFavorite(key, Number(item.id), 'article')
      .then((r) => {
        if (r.code === 1) {
          const now = r.data?.faved === 1;
          setFaved(now);
          message.success(now ? '已收藏' : '已取消收藏');
        } else {
          message.error(r.msg || '操作失败');
        }
      })
      .catch((e) => message.error(e?.message || '网络错误'));
  };
  const onReport = () => {
    const key = getToken();
    if (!key) {
      message.warning('请先登录后再举报');
      navigate('/login');
      return;
    }
    if (!item || !reportContent.trim()) {
      message.warning('请填写举报内容');
      return;
    }
    setReporting(true);
    submitReport(key, { tid: String(item.id), m: 'article', title: item.title || '', content: reportContent.trim() })
      .then((r) => {
        if (r.code === 1) {
          message.success(r.msg || '举报已提交');
          setReportOpen(false);
          setReportContent('');
        } else {
          message.error(r.msg || '提交失败');
        }
      })
      .catch((e) => message.error(e?.message || '网络错误'))
      .finally(() => setReporting(false));
  };

  if (loading) {
    return (
      <Flex vertical gap={20}>
        <PageHeader title="文章详情" crumbs={[{ label: '首页', to: '/' }, { label: '广场', to: '/square' }, { label: '详情' }]} />
        <Card loading />
      </Flex>
    );
  }
  if (error || !item) {
    return (
      <Flex vertical gap={16}>
        <PageHeader title="文章详情" crumbs={[{ label: '首页', to: '/' }, { label: '广场', to: '/square' }, { label: '详情' }]} />
        <Alert type="warning" showIcon message={error || '文章不存在'} />
        <div>
          <Button onClick={() => navigate('/square')}>返回广场</Button>
        </div>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={20}>
      <PageHeader
        title={item.title}
        crumbs={[
          { label: '首页', to: '/' },
          { label: '广场', to: '/square' },
          { label: item.title },
        ]}
        extra={
          <Space wrap>
            <Button icon={liked ? '♥' : '♡'} type={liked ? 'primary' : 'default'} onClick={onLike} loading={liking}>
              点赞 {zan}
            </Button>
            <Button type={faved ? 'primary' : 'default'} onClick={onFav}>
              {faved ? '★' : '☆'} 收藏
            </Button>
            <Tooltip title="举报">
              <Button onClick={() => setReportOpen(true)}>举报</Button>
            </Tooltip>
            <Button onClick={() => navigate('/square')}>返回广场</Button>
          </Space>
        }
      />

      <AdSlotSkeleton slot="detail_column_article_top" />

      <Space split={<Divider type="vertical" />} wrap className="detail-meta">
        <Text type="secondary">{item.author || '匿名'}</Text>
        <Text type="secondary">{dayjs.unix(item.time).format('YYYY-MM-DD HH:mm')}</Text>
        <Text type="secondary">浏览 {item.view}</Text>
        <Text type="secondary">点赞 {zan}</Text>
      </Space>

      <Card>
        {item.description ? (
          <Alert type="info" showIcon message={item.description} className="article-lead" />
        ) : null}
        {item.content ? (
          <div className="detail-content md-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(item.content)) }} />
        ) : (
          <Paragraph className="detail-content">暂无正文</Paragraph>
        )}
      </Card>

      <AdSlotSkeleton slot="detail_column_article_bottom" />

      <div>
        <Button onClick={() => navigate('/square')}>返回广场</Button>
      </div>

      <Modal
        title={`举报「${item.title}」`}
        open={reportOpen}
        onCancel={() => {
          setReportOpen(false);
          setReportContent('');
        }}
        onOk={onReport}
        okText="提交举报"
        confirmLoading={reporting}
      >
        <Input.TextArea
          rows={4}
          value={reportContent}
          onChange={(e) => setReportContent(e.target.value)}
          placeholder="请描述该文章的违规情况（如：虚假内容、侵权、垃圾信息等）"
          maxLength={500}
          showCount
        />
      </Modal>
    </Flex>
  );
};

export default ColumnArticleDetailPage;

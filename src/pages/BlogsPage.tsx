import React, { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Divider,
    Flex,
    Input,
    Modal,
    Pagination,
    Segmented,
    Space,
    Tag,
    Tooltip,
    Typography,
    message,
} from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, SearchBox } from '@components/common';
import { BlogsSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getPosts } from '@/services/postService';
import { getWebsiteByDomain, getWebsites, submitReport, toggleFavorite, toggleLike, type WebsiteItem } from '@/services/userCenter';
import type { PostData } from '@/types/post';
import { assetUrl, domainOf, jumpUrl, normalizeDomain } from '@/utils/route';
import { htmlToText } from '@/utils/CommonUtil';
import { getToken } from '@/utils/auth';

const { Text, Paragraph } = Typography;

const PAGE_SIZE = 10;

type SortKey = 'latest' | 'earliest' | 'site';

const sortOptions = [
    { label: '最新', value: 'latest' },
    { label: '最早', value: 'earliest' },
    { label: '按站点', value: 'site' },
];

// 内联 SVG 图标（项目未安装 @ant-design/icons，直接用车截图的 path 还原）
const StarIcon = () => (
    <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 00.6 45.3l183.7 179.1-43.4 252.9a31.95 31.95 0 0046.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3zM664.8 561.6l36.1 210.3L512 672.7 323.1 772l36.1-210.3-152.8-149L417.6 382 512 190.7 606.4 382l211.2 30.7-152.8 148.9z" />
    </svg>
);
const EyeIcon = () => (
    <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 000 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z" />
    </svg>
);
const ClockIcon = () => (
    <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
        <path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z" />
    </svg>
);
const MoreIcon = () => (
    <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M456 231a56 56 0 10112 0 56 56 0 10-112 0zm0 280a56 56 0 10112 0 56 56 0 10-112 0zm0 280a56 56 0 10112 0 56 56 0 10-112 0z" />
    </svg>
);

const HeartIcon = () => (
    <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M923 283.6c-13.4-31.1-32.6-58.9-56.9-82.8-24.3-23.8-52.5-42.4-84-55.5-32.5-13.5-64.3-20.3-97.4-20.3-36.5 0-68.7 8.3-98.4 24.3-29.7 16-53.5 37.3-72 63.2-4.6 6.2-8.8 12.4-12.7 18.9-3.9-6.5-8.1-12.7-12.7-18.9-18.5-25.9-42.3-47.2-72-63.2-29.7-16-61.9-24.3-98.4-24.3-33.1 0-64.9 6.8-97.4 20.3-31.5 13.1-59.7 31.7-84 55.5-24.3 23.9-43.5 51.7-56.9 82.8-13.4 31-20.3 64.2-20.3 99.1 0 35 8.3 68.2 24.3 98.4 16 29.7 37.3 53.5 63.2 72 6.2 4.6 12.4 8.8 18.9 12.7 6.5 3.9 12.7 8.1 18.9 12.7 25.9 18.5 47.2 42.3 63.2 72 16 30.2 24.3 63.4 24.3 98.4 0 34.9-6.9 68.1-20.3 99.1z" />
    </svg>
);

/** 相对时间：刚刚 / x 分钟前 / x 小时前 / x 天前 / x 个月前 / 日期 */
function timeAgo(t?: string): string {
    if (!t) return '';
    const d = dayjs(t);
    if (!d.isValid()) return '';
    const now = dayjs();
    const diffMin = now.diff(d, 'minute');
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin} 分钟前`;
    const diffH = now.diff(d, 'hour');
    if (diffH < 24) return `${diffH} 小时前`;
    const diffD = now.diff(d, 'day');
    if (diffD < 30) return `${diffD} 天前`;
    const diffM = now.diff(d, 'month');
    if (diffM < 12) return `${diffM} 个月前`;
    return d.format('YYYY-MM-DD');
}

const BlogsPage: React.FC = () => {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const keyword = params.get('keyword') || '';
    const sort = (params.get('sort') as SortKey) || 'latest';
    const page = Math.max(1, Number(params.get('page') || 1));

    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<PostData[]>([]);
    /** 域名 -> 站点头像（用网站数据 API 的 ico/pic，提交时上传、不可能为空） */
    const [siteIcons, setSiteIcons] = useState<Record<string, string>>({});

    // 举报弹窗
    const [reportPost, setReportPost] = useState<PostData | null>(null);
    const onFavFeed = (p: PostData) => {
        const key = getToken();
        if (!key) { message.warning('请先登录后再收藏'); navigate('/login'); return; }
        toggleFavorite(key, Number(p.id), 'feed')
            .then((r) => { if (r.code === 1) message.success(r.data?.faved === 1 ? '已收藏' : '已取消收藏'); else message.error(r.msg || '操作失败'); })
            .catch((e) => message.error(e?.message || '网络错误'));
    };

    const [likedIds, setLikedIds] = useState<number[]>([]);
    const onLikeFeed = (p: PostData) => {
        const key = getToken();
        if (!key) { message.warning('请先登录后再点赞'); navigate('/login'); return; }
        toggleLike(key, Number(p.id), 'feed')
            .then((r) => {
                if (r.code === 1) {
                    message.success(r.data?.liked === 1 ? '已点赞' : '已取消点赞');
                    setLikedIds((ids) => {
                        const n = Number(p.id);
                        return r.data?.liked === 1 ? (ids.includes(n) ? ids : [...ids, n]) : ids.filter((x) => x !== n);
                    });
                } else message.error(r.msg || '操作失败');
            })
            .catch((e) => message.error(e?.message || '网络错误'));
    };
    const [reportContent, setReportContent] = useState('');
    const [reporting, setReporting] = useState(false);

    usePageMeta({
        title: 'Feed广场',
        keywords: 'Feed广场, 文章聚合, 站点圈',
        description: '兴汉同盟收录站点的最新文章聚合。',
    });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        Promise.all([getPosts(), getWebsites({ page: 1, limit: 100 })])
            .then(([list, sites]) => {
                if (!alive) return;
                setPosts(list);
                const map: Record<string, string> = {};
                if (sites.code === 1 && sites.data?.list) {
                    (sites.data.list as WebsiteItem[]).forEach((w) => {
                        const icon = assetUrl(w.ico || w.pic || '');
                        if (icon) map[normalizeDomain(domainOf(w))] = icon;
                    });
                }
                setSiteIcons(map);
            })
            .catch(() => {
                if (alive) setPosts([]);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    /** 列表分页可能截断或域名形态不一致，地图没命中的站点按需回源补一次站点 logo */
    const missingDomains = useMemo(
        () =>
            Array.from(new Set(posts.map((p) => normalizeDomain(domainOf(p))))).filter(
                (d) => d && !siteIcons[d]
            ),
        [posts, siteIcons]
    );

    useEffect(() => {
        if (missingDomains.length === 0) return;
        let alive = true;
        Promise.all(missingDomains.map((d) => getWebsiteByDomain(d)))
            .then((rs) => {
                if (!alive) return;
                const add: Record<string, string> = {};
                rs.forEach((r) => {
                    const item = r.data as WebsiteItem | null;
                    if (r.code === 1 && item) {
                        const icon = assetUrl(item.pic || item.ico || '');
                        if (icon) add[normalizeDomain(domainOf(item))] = icon;
                    }
                });
                if (Object.keys(add).length > 0) setSiteIcons((m) => ({ ...m, ...add }));
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [missingDomains]);

    const updateParam = (patch: Record<string, string | number | undefined>) => {
        const next = new URLSearchParams(params);
        Object.keys(patch).forEach((k) => {
            const v = patch[k];
            if (v === undefined || v === '' || v === null) next.delete(k);
            else next.set(k, String(v));
        });
        setParams(next);
    };

    const list = useMemo(() => {
        const kw = keyword.trim().toLowerCase();
        let arr = posts.filter((p) => {
            if (!kw) return true;
            return [p.title, htmlToText(p.description), p.blogName, domainOf(p)].some((v) =>
                (v || '').toLowerCase().includes(kw)
            );
        });
        if (sort === 'earliest') {
            arr = [...arr].sort((a, b) => (a.publishedAt || '').localeCompare(b.publishedAt || ''));
        } else if (sort === 'site') {
            arr = [...arr].sort((a, b) => (a.blogName || '').localeCompare(b.blogName || '', 'zh-CN'));
        }
        return arr;
    }, [posts, keyword, sort]);

    const pageList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const siteCount = useMemo(() => new Set(posts.map((p) => domainOf(p))).size, [posts]);

    const onReport = () => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再举报');
            navigate('/login');
            return;
        }
        if (!reportPost || !reportContent.trim()) {
            message.warning('请填写举报内容');
            return;
        }
        setReporting(true);
        submitReport(key, {
            tid: String(reportPost.blogId || ''),
            m: 'article',
            title: reportPost.title || '',
            content: reportContent.trim(),
        })
            .then((r) => {
                if (r.code === 1) {
                    message.success(r.msg || '举报已提交');
                    setReportPost(null);
                    setReportContent('');
                } else {
                    message.error(r.msg || '提交失败');
                }
            })
            .catch((e) => message.error(e?.message || '网络错误'))
            .finally(() => setReporting(false));
    };

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title="Feed广场"
                description={`来自 ${siteCount} 个站点的最新文章`}
                crumbs={[{ label: '首页', to: '/' }, { label: 'Feed广场' }]}
            />

            <SearchBox placeholder="搜索文章标题、摘要、站点" gotoPage="/feed" />

            <Flex justify="space-between" align="center" wrap gap={12}>
                <Text type="secondary">共 {list.length} 篇</Text>
                <Segmented
                    value={sort}
                    onChange={(v) => updateParam({ sort: String(v), page: undefined })}
                    options={sortOptions}
                />
            </Flex>

            {loading ? (
                <BlogsSkeleton />
            ) : list.length === 0 ? (
                <div className="feed-empty">暂无文章</div>
            ) : (
                <>
                    <div className="feed-timeline">
                        {pageList.map((p) => {
                            const domain = domainOf(p);
                            const icon =
                                siteIcons[normalizeDomain(domain)] ||
                                assetUrl(p.blogAdminLargeImageURL || p.blogAdminMediumImageURL || '');
                            const abstractRoute = `/abstract?link=${encodeURIComponent(p.link)}`;
                            const domainRoute = `/${domain}`;
                            return (
                                <div className="feed-timeline-item" key={p.link || `${domain}-${p.title}`}>
                                    <Link to={domainRoute} className="feed-author-col">
                                        <Avatar
                                            className="feed-author-avatar"
                                            shape="circle"
                                            src={icon || undefined}
                                        >
                                            {(p.blogName || domain || '?').slice(0, 1)}
                                        </Avatar>
                                        <span className="feed-author-name">{p.blogName || domain}</span>
                                        {p.blogJoinYears ? (
                                            <span className="feed-author-meta feed-author-meta-blue">
                                                <StarIcon /> 已履约 {p.blogJoinYears} 年
                                            </span>
                                        ) : null}
                                        {p.blogTotalAccessCount ? (
                                            <span className="feed-author-meta feed-author-meta-blue">
                                                <EyeIcon /> {p.blogTotalAccessCount}
                                            </span>
                                        ) : null}
                                    </Link>

                                    <div
                                        className="feed-bubble"
                                        onClick={() => window.open(jumpUrl(p.link), '_blank')}
                                    >
                                        <div className="feed-bubble-arrow feed-bubble-arrow-border" />
                                        <div className="feed-bubble-arrow feed-bubble-arrow-fill" />
                                        <div className="feed-bubble-inner">
                                            <a
                                                className="feed-bubble-title"
                                                href={jumpUrl(p.link)}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {p.title || '无标题'}
                                            </a>
                                            {p.description ? (
                                                <div className="feed-bubble-desc">
                                                    {htmlToText(p.description, 140)}
                                                </div>
                                            ) : null}
                                            <Divider dashed className="feed-bubble-divider" />
                                            <div className="feed-bubble-foot">
                                                <Space size={16} className="feed-bubble-foot-left">
                                                    <span className="feed-bubble-time">
                                                        <ClockIcon /> {timeAgo(p.publishedAt)}
                                                    </span>
                                                    <span className="feed-bubble-views">
                                                        <EyeIcon /> {p.linkAccessCount || 0}
                                                    </span>
                                                    {p.recommended ? <Tag color="red">推荐</Tag> : null}
                                                    {p.pinned ? <Tag color="orange">置顶</Tag> : null}
                                                </Space>
                                                <Space size={12} className="feed-bubble-actions">
                                                    <Tooltip title="点赞">
                                                        <span
                                                            className={"feed-bubble-action feed-bubble-icon-only" + (likedIds.includes(Number(p.id)) ? " liked" : "")}
                                                            onClick={(e) => { e.stopPropagation(); onLikeFeed(p); }}
                                                        >
                                                            <HeartIcon />
                                                        </span>
                                                    </Tooltip>
                                                    <Tooltip title="收藏">
                                                        <span
                                                            className="feed-bubble-action feed-bubble-icon-only"
                                                            onClick={(e) => { e.stopPropagation(); onFavFeed(p); }}
                                                        >
                                                            <StarIcon />
                                                        </span>
                                                    </Tooltip>
                                                    <Tooltip title="举报">
                                                        <span
                                                            className="feed-bubble-action feed-bubble-icon-only feed-bubble-more"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReportPost(p);
                                                            }}
                                                        >
                                                            <MoreIcon />
                                                        </span>
                                                    </Tooltip>
                                                </Space>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {list.length > PAGE_SIZE ? (
                        <Flex justify="center">
                            <Pagination
                                current={page}
                                pageSize={PAGE_SIZE}
                                total={list.length}
                                showSizeChanger={false}
                                onChange={(p) => updateParam({ page: p })}
                            />
                        </Flex>
                    ) : null}
                </>
            )}

            <Modal
                title="举报文章"
                open={!!reportPost}
                onCancel={() => {
                    setReportPost(null);
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

export default BlogsPage;

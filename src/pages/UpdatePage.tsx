import React, { useEffect, useMemo, useState } from 'react';

import { usePageMeta } from '@/hooks/usePageMeta';
import {
    fetchCommitGroups,
    GIT_REPO_URL,
    CommitGroup,
    CommitItem,
} from '@/utils/gitCommits';

export default function UpdatePage(): React.JSX.Element {
    usePageMeta({ title: '更新日志' });

    const [data, setData] = useState<CommitGroup[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let alive = true;
        fetchCommitGroups()
            .then((groups) => {
                if (!alive) return;
                const init: Record<string, boolean> = {};
                groups.forEach((g) => {
                    init[g.date] = !g.latest; // 最新一天默认展开，其余折叠
                });
                setCollapsed(init);
                setData(groups);
            })
            .catch(() => {
                if (alive) setError('更新记录加载失败，请稍后重试');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const total = useMemo(
        () => (data ? data.reduce((s, g) => s + g.commits.length, 0) : 0),
        [data]
    );
    const latestSha =
        data && data.length && data[0].commits.length
            ? data[0].commits[0].sha.slice(0, 7)
            : '';

    return (
        <div className="update-page">
            <div className="update-hero">
                <h1 className="update-title">更新日志</h1>
                <p className="update-subtitle">
                    当前版本：兴汉同盟{' '}
                    {latestSha ? <span className="update-version">{latestSha}</span> : null}
                    <br />
                    共 {total} 次迭代，按日期分组展示。
                </p>
            </div>

            {loading ? (
                <div className="update-state">加载中…</div>
            ) : error ? (
                <div className="update-state update-state-error">{error}</div>
            ) : !data || data.length === 0 ? (
                <div className="update-state">暂无更新记录</div>
            ) : (
                data.map((group) => (
                    <div className="version-card" key={group.date}>
                        <div
                            className="version-header"
                            onClick={() =>
                                setCollapsed((c) => ({ ...c, [group.date]: !c[group.date] }))
                            }
                        >
                            <span className="collapse-arrow">
                                {collapsed[group.date] ? '▶' : '▼'}
                            </span>
                            <span className="version-date">{group.date}</span>
                            {group.latest ? <span className="version-badge">最新</span> : null}
                            <span className="version-count">
                                {group.commits.length} 条改动
                            </span>
                        </div>
                        {!collapsed[group.date]
                            ? group.commits.map((c) => (
                                  <div className="change-item" key={c.sha}>
                                      <span className="change-dot" />
                                      <div className="change-content">
                                          <div className="change-main">
                                              <a
                                                  className="change-hash"
                                                  href={`${GIT_REPO_URL}/commit/${c.sha}`}
                                                  target="_blank"
                                                  rel="noreferrer"
                                              >
                                                  {c.sha.slice(0, 7)}
                                              </a>
                                              <span className="change-message">
                                                  {c.message}
                                              </span>
                                          </div>
                                          <div className="change-meta">
                                              <span className="change-author">
                                                  @{c.authorName}
                                              </span>
                                          </div>
                                      </div>
                                  </div>
                              ))
                            : null}
                    </div>
                ))
            )}
        </div>
    );
}

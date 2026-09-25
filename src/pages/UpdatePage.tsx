import React, { useEffect, useMemo, useState } from 'react';

import { usePageMeta } from '@/hooks/usePageMeta';
import {
    fetchCommitGroups,
    GIT_REPO_URL,
    CommitGroup,
    CommitItem,
    CommitType,
} from '@/utils/gitCommits';

const TYPE_CFG: Record<CommitType, { cat: string; icon: string }> = {
    feat: { cat: '新功能', icon: '🎉' },
    fix: { cat: '问题修复', icon: '🐛' },
    ui: { cat: '样式调整', icon: '🎨' },
    perf: { cat: '性能优化', icon: '⚡' },
    revert: { cat: '回退', icon: '↩️' },
    other: { cat: '其他', icon: '📄' },
};
const TYPE_ORDER: CommitType[] = ['feat', 'fix', 'ui', 'perf', 'revert', 'other'];

function sectionsOf(group: CommitGroup) {
    const map: Record<string, { cat: string; icon: string; items: CommitItem[] }> = {};
    for (const c of group.commits) {
        const t = c.type || 'other';
        if (!map[t]) {
            const cfg = TYPE_CFG[t] || TYPE_CFG.other;
            map[t] = { cat: cfg.cat, icon: cfg.icon, items: [] };
        }
        map[t].items.push(c);
    }
    return TYPE_ORDER.filter((t) => map[t]).map((t) => ({ type: t, ...map[t] }));
}

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
        <div className="update-page container">
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
                            ? sectionsOf(group).map((sec) => (
                                  <div key={sec.type}>
                                      <div className="section-title">
                                          <span className="section-icon">{sec.icon}</span>
                                          <span className="section-name">{sec.cat}</span>
                                      </div>
                                      {sec.items.map((c) => (
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
                                      ))}
                                  </div>
                              ))
                            : null}
                    </div>
                ))
            )}
        </div>
    );
}

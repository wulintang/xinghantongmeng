// 运行时直接从 GitHub 拉取本仓库的提交记录（公开仓库，无需写死在前端）
const REPO = 'wulintang/xinghantongmeng';
export const GIT_REPO_URL = `https://github.com/${REPO}`;
export const GIT_REPO_NAME = 'xinghantongmeng';

export type CommitType = 'feat' | 'fix' | 'ui' | 'revert' | 'perf' | 'other';

export interface CommitItem {
    sha: string;
    message: string;
    type: CommitType;
    authorLogin: string;
}

export interface CommitGroup {
    date: string;
    latest: boolean;
    commits: CommitItem[];
}

const API = `https://api.github.com/repos/${REPO}/commits`;

// 轻量内存缓存：避免页脚每次挂载都打 GitHub API（未鉴权限流 60 次/小时）
const TTL = 10 * 60 * 1000;
let groupsCache: { ts: number; data: CommitGroup[] } | null = null;
let shaCache: { ts: number; sha: string } | null = null;

function categorize(msg: string): CommitType {
    const prefix = msg.split(':')[0].toLowerCase();
    if (['feat', 'fix', 'ui', 'revert', 'perf'].includes(prefix)) {
        return prefix as CommitType;
    }
    return 'other';
}

/** 拉取全部提交，按日期分组（最新日期在前），每日内按类型归类 */
export async function fetchCommitGroups(perPage = 100): Promise<CommitGroup[]> {
    if (groupsCache && Date.now() - groupsCache.ts < TTL) return groupsCache.data;
    const res = await fetch(`${API}?per_page=${perPage}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid response');

    const groups: Record<string, CommitGroup> = {};
    for (const c of data) {
        if (!c.commit || !c.sha) continue;
        const date =
            c.commit.author && c.commit.author.date
                ? c.commit.author.date.slice(0, 10)
                : 'unknown';
        if (!groups[date]) groups[date] = { date, latest: false, commits: [] };
        groups[date].commits.push({
            sha: c.sha,
            message: c.commit.message ? c.commit.message.split('\n')[0] : '',
            type: categorize(c.commit.message || ''),
            authorLogin:
                (c.author && c.author.login) ||
                (c.committer && c.committer.login) ||
                'unknown',
        });
    }

    const sorted = Object.keys(groups)
        .sort()
        .reverse()
        .map((d, i) => {
            groups[d].latest = i === 0;
            return groups[d];
        });
    groupsCache = { ts: Date.now(), data: sorted };
    return sorted;
}

/** 拉取最新一条提交的短哈希，用于页脚版本号展示 */
export async function fetchLatestSha(): Promise<string> {
    if (shaCache && Date.now() - shaCache.ts < TTL) return shaCache.sha;
    const res = await fetch(`${API}?per_page=1`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data[0] && data[0].sha) {
        const sha = data[0].sha.slice(0, 7);
        shaCache = { ts: Date.now(), sha };
        return sha;
    }
    throw new Error('No commits');
}

// 运行时从构建产物 public/changelog.json 读取提交记录。
// changelog.json 由 scripts/gen-changelog.js 在构建/启动前从本地 git 生成，
// 不再请求 GitHub API，避免未鉴权限流 403。
const REPO = 'wulintang/xinghantongmeng';
export const GIT_REPO_URL = `https://github.com/${REPO}`;

export type CommitType = 'feat' | 'fix' | 'ui' | 'revert' | 'perf' | 'other';

export interface CommitItem {
    sha: string;
    message: string;
    type: CommitType;
    authorName: string;
}

export interface CommitGroup {
    date: string;
    latest: boolean;
    commits: CommitItem[];
}

interface ChangelogPayload {
    latest: string;
    total: number;
    groups: CommitGroup[];
}

const API = '/static/changelog.json';

// 轻量内存缓存：避免页脚与更新日志页重复请求同一份静态 JSON
const TTL = 10 * 60 * 1000;
let groupsCache: { ts: number; data: CommitGroup[] } | null = null;
let shaCache: { ts: number; sha: string } | null = null;
let payloadCache: { ts: number; data: ChangelogPayload } | null = null;

async function fetchPayload(): Promise<ChangelogPayload> {
    if (payloadCache && Date.now() - payloadCache.ts < TTL) return payloadCache.data;
    const res = await fetch(API, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`changelog ${res.status}`);
    const data = (await res.json()) as ChangelogPayload;
    payloadCache = { ts: Date.now(), data };
    return data;
}

/** 读取全部提交，按日期分组（最新日期在前），每日内按类型归类 */
export async function fetchCommitGroups(): Promise<CommitGroup[]> {
    if (groupsCache && Date.now() - groupsCache.ts < TTL) return groupsCache.data;
    const { groups } = await fetchPayload();
    groupsCache = { ts: Date.now(), data: groups };
    return groups;
}

/** 读取最新一条提交的短哈希，用于页脚版本号展示 */
export async function fetchLatestSha(): Promise<string> {
    if (shaCache && Date.now() - shaCache.ts < TTL) return shaCache.sha;
    const { latest } = await fetchPayload();
    shaCache = { ts: Date.now(), sha: latest };
    return latest;
}

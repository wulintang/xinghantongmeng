/**
 * 构建时从本地 git 历史生成 public/changelog.json。
 * 运行时不再请求 GitHub API，避免未鉴权限流 403。
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const OUT_FILE = path.join(PUBLIC_DIR, 'changelog.json');
const GIT = process.env.GIT_PATH || 'git';

function runGit(args) {
    return execFileSync(GIT, args, {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 30_000,
        shell: false,
    });
}

function categorize(msg, body) {
    // 新规则：从提交正文首行「类型：中文类型」解析，标题已无英文前缀
    const firstLine = (body || '').split('\n')[0].trim();
    const m = firstLine.match(/^类型：(.+)$/);
    if (m) {
        const cn = m[1];
        const map = {
            '功能新增': 'feat',
            '问题修复': 'fix',
            '样式调整': 'ui',
            '版本回退': 'revert',
            '品牌调整': 'other',
            '代码重构': 'other',
            '其他调整': 'other',
        };
        if (map[cn]) return map[cn];
    }
    // 兜底：旧格式标题前缀
    const prefix = (msg || '').split(':')[0].toLowerCase();
    if (['feat', 'fix', 'ui', 'revert', 'perf'].includes(prefix)) return prefix;
    return 'other';
}

function main() {
    try {
        // 若平台做的是浅克隆，尝试拉全历史
        try {
            const shallow = runGit(['rev-parse', '--is-shallow-repository']).trim();
            if (shallow === 'true') {
                runGit(['fetch', '--unshallow']);
            }
        } catch {
            // 无法 deepen 时仍继续，用已有历史
        }

        const log = runGit(['log', '--format=%H%x09%ad%x09%an%x09%s%x09%b', '--date=short', '--reverse']);
        const lines = log.split(/\r?\n/).filter(Boolean);

        const groups = {};
        for (const line of lines) {
            const parts = line.split('\t');
            const sha = parts[0];
            const date = parts[1];
            const author = parts[2];
            const message = parts[3] || '';
            const body = parts.slice(4).join('\t');
            if (!sha || !date) continue;
            if (!groups[date]) groups[date] = { date, latest: false, commits: [] };
            groups[date].commits.push({
                sha,
                message,
                type: categorize(message, body),
                authorName: author || 'unknown',
            });
        }

        const sortedDates = Object.keys(groups).sort().reverse();
        sortedDates.forEach((d, i) => {
            groups[d].latest = i === 0;
            // 同一天内按时间倒序，最新提交在最前（git log --reverse 是从旧到新）
            groups[d].commits.reverse();
        });

        // --reverse 输出从旧到新，最后一条才是最新提交
        const latestSha = lines.length ? lines[lines.length - 1].split('\t')[0] : '';
        const payload = {
            latest: latestSha.slice(0, 7),
            total: lines.length,
            groups: sortedDates.map((d) => groups[d]),
        };

        if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
        fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
        console.log(`[gen-changelog] wrote ${lines.length} commits to public/changelog.json`);
    } catch (err) {
        console.warn('[gen-changelog] failed:', err.message);
        // 若已有历史文件则保留，避免清空线上数据；否则写入空文件保证运行时不报错
        try {
            if (fs.existsSync(OUT_FILE)) {
                const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'));
                if (existing && existing.total) {
                    console.log('[gen-changelog] kept existing changelog');
                    return;
                }
            }
        } catch {
            // 解析失败继续写空文件
        }
        if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
        fs.writeFileSync(
            OUT_FILE,
            JSON.stringify({ latest: '', total: 0, groups: [] }, null, 2)
        );
    }
}

main();

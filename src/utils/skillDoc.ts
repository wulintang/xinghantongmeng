import type { SkillField } from '@/services/userCenter';
import { cleanSkillOption, normalizeSkillFields } from '@/utils/skillFields';

/**
 * 技能正文 = 一份 SKILL.md 原文。
 *
 * 作者只写这份 md：正文自由发挥（每个技能都不一样），需要用户填写的字段
 * 在「## 参数」段里用短横线显式声明，系统按声明直接生成填写表单，不再猜自然语言。
 *
 *   ## 参数
 *   - 主题：单行，必填，示例 我的假期生活
 *   - 文体：下拉 记叙文/议论文/说明文，必填
 *   - 具体要求：多行，示例 不少于 500 字
 *   - 性别：单选 男/女
 *   - 出生日期：日期
 *
 * 类型词：单行 / 多行 / 下拉 / 单选 / 日期 / 时间（也接受英文 text/textarea/select/radio/date/time）
 * 修饰词：必填、示例 xxx、提示 xxx；下拉/单选的选项直接写在类型后面，用 / 分隔。
 * 兼容：段内 ```json 数组、以及历史 md 的自然语言参数行（由后端 SkillCommon 兜底解析）。
 */

/** 下载/插入用的标准模板（带 frontmatter，可直接放进任意 AI 的 skills 目录） */
export const SKILL_MD_TEMPLATE = `---
name: my-skill
description: 一句话说明这个技能做什么、什么时候用
---

# 技能名称

在这里写指令本体：这个技能要做什么、有哪些要求、输出什么样的结果。
正文中可以用 {字段名} 引用「参数」段里声明的字段。

## 参数
- 主题：单行，必填，示例 我的假期生活
- 年级：单行，必填，示例 小学三年级
- 文体：下拉 记叙文/议论文/说明文，必填
- 具体要求：多行，示例 不少于 500 字，语言生动

## 何时使用
已有明确写作主题、需要按指定年级与文体生成作文时使用。

## 输出格式
只输出作文正文，不要解释、不要加额外说明。
`;

/** 参数段里可直接粘贴的字段声明片段 */
export const FIELDS_SNIPPET = `## 参数
- 字段一：单行，必填，示例 这里写示例值
- 字段二：下拉 选项A/选项B/选项C，必填
- 字段三：多行，示例 这里写一段较长的要求
`;

export const SKILL_MD_PLACEHOLDER = `粘贴或上传 SKILL.md 原文，也可以点「插入参数模板」快速开始。

正文自由写；需要用户填写的内容放在 ## 参数 段里声明，例如：
- 年级：单行，必填，示例 小学三年级
- 文体：下拉 记叙文/议论文/说明文，必填`;

const SECTION_RE = /^##\s*(参数|字段|输入项|Fields|Inputs)/i;

/** 类型只在每个修饰片段的开头识别，避免示例值里的「时间管理」把字段误判成时间控件 */
const TYPE_PREFIX: [RegExp, SkillField['type']][] = [
    [/^多行|^长文本|^textarea/i, 'textarea'],
    [/^下拉|^select/i, 'select'],
    [/^单选|^radio/i, 'radio'],
    [/^日期|^date/i, 'date'],
    [/^时间|^time/i, 'time'],
    [/^单行|^文本|^text/i, 'text'],
];

const TYPE_LABEL: Record<SkillField['type'], string> = {
    text: '单行',
    textarea: '多行',
    select: '下拉',
    radio: '单选',
    date: '日期',
    time: '时间',
};

const LABEL_OF_TYPE = (t: string): SkillField['type'] => {
    switch (String(t || '').toLowerCase()) {
        case 'textarea': return 'textarea';
        case 'select': return 'select';
        case 'radio': return 'radio';
        case 'date': return 'date';
        case 'time': return 'time';
        default: return 'text';
    }
};

const cleanLabel = (s: string): string =>
    s.replace(/^[*`_\s]+|[*`_\s]+$/g, '').trim();

const splitOptions = (raw: string): string[] => {
    const out: string[] = [];
    for (const o of raw.split(/[/|、,，]|或者|或/)) {
        const v = cleanSkillOption(o);
        if (v && v.length <= 24 && out.indexOf(v) < 0) out.push(v);
    }
    return out;
};

/** 取 md 里「## 参数」段的原始行（frontmatter 内不会出现 ## 标题，天然被排除） */
const declaredLines = (md: string): string[] => {
    const lines = String(md || '').split(/\r?\n/);
    let inside = false;
    const out: string[] = [];
    for (const ln of lines) {
        if (/^##\s/.test(ln)) { inside = SECTION_RE.test(ln); continue; }
        if (/^#\s/.test(ln)) { inside = false; continue; }
        if (inside) out.push(ln);
    }
    return out;
};

/** 解析一行显式字段声明；返回 null 表示这行不是字段（说明文字、空行等） */
const parseDeclaredLine = (line: string, idx: number): SkillField | null => {
    const s = String(line || '').trim();
    if (!/^[-*+]\s+|^\d+[.)]\s+/.test(s)) return null;
    const body = s.replace(/^[-*+]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
    const m = body.match(/^(.+?)\s*[：:]\s*(.*)$/);
    if (!m) return null;
    const label = cleanLabel(m[1]);
    if (!label || label.length > 30) return null;

    const tokens = String(m[2] || '').split(/[，,；;、]/).map((t) => t.trim()).filter(Boolean);
    let type: SkillField['type'] = 'text';
    let options: string[] = [];
    let example = '';
    let placeholder = '';
    let required = false;

    for (const tk of tokens) {
        for (const [re, t] of TYPE_PREFIX) {
            if (type === 'text' && re.test(tk)) { type = t; break; }
        }
        const optRaw = tk.replace(/^(?:下拉|单选|select|radio|选项|选项为|可选|候选)\s*[:：]?\s*/i, '');
        if (optRaw !== tk && optRaw.trim()) options = splitOptions(optRaw);
        if (/^必填$|^required$/i.test(tk)) required = true;
        const em = tk.match(/^(?:示例|例如|例)\s*[:：]?\s*(.+)$/);
        if (em) example = cleanSkillOption(em[1]);
        const pm = tk.match(/^(?:提示|占位|placeholder|说明)\s*[:：]?\s*(.+)$/i);
        if (pm) placeholder = cleanSkillOption(pm[1]);
    }
    if (!placeholder) placeholder = example;

    const name = label.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').toLowerCase() || `field${idx}`;
    return { name, label, type, options, placeholder, example, required };
};

/**
 * 从 md 的显式声明解析字段表（零猜测）。
 * 没有「## 参数」段时返回空数组，交给后端 SkillCommon 用老的自然语言写法兜底。
 */
export const parseSkillFieldsFromMd = (md: string): SkillField[] => {
    const lines = declaredLines(md);
    const joined = lines.join('\n');
    const jm = joined.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (jm) {
        try {
            const arr = JSON.parse(jm[1].trim());
            if (Array.isArray(arr)) return normalizeSkillFields(arr);
        } catch { /* 落到逐行解析 */ }
    }
    const fields: SkillField[] = [];
    lines.forEach((ln, i) => {
        const f = parseDeclaredLine(ln, i);
        if (f) fields.push(f);
    });
    return normalizeSkillFields(fields);
};

/** md 是否自带显式字段声明 */
export const hasDeclaredFields = (md: string): boolean => {
    const lines = declaredLines(md);
    return lines.some((ln) => !!parseDeclaredLine(ln, 0)) || /```json/i.test(lines.join('\n'));
};

/** 把结构化字段表反向写成 md 的「## 参数」声明段 */
export const fieldsToDeclaration = (fields: SkillField[]): string => {
    const rows = (fields || []).map((f) => {
        let type: SkillField['type'] = f.type;
        if ((type === 'select' || type === 'radio') && (f.options || []).length < 2) type = 'text';
        // 选项必须紧跟类型词用空格连接，不能用逗号：逗号是修饰片段分隔符，
        // 写成「下拉，A/B/C」会让选项被当成独立片段而丢失。
        const choice = (type === 'select' || type === 'radio') && (f.options || []).length;
        const head = choice ? `${TYPE_LABEL[type]} ${(f.options || []).join('/')}` : (TYPE_LABEL[type] || '单行');
        const parts = [head];
        if (f.required) parts.push('必填');
        const ex = String(f.example || f.placeholder || '').trim().replace(/[,，;；、]/g, ' ');
        if (ex) parts.push(`示例 ${ex}`);
        return `- ${f.label}：${parts.join('，')}`;
    });
    return `## 参数\n${rows.join('\n')}`;
};

/** 编辑老技能：md 里没有显式声明但库里存过 fields 时，把声明段补进 md，避免字段丢失 */
export const ensureFieldsDeclared = (md: string, fieldsJson?: string): string => {
    const text = String(md || '');
    if (hasDeclaredFields(text)) return text;
    let fields: SkillField[] = [];
    try {
        const dec = JSON.parse(fieldsJson || '');
        if (Array.isArray(dec)) fields = normalizeSkillFields(dec);
    } catch { /* 没有字段表就不动原文 */ }
    if (!fields.length) return text;
    return `${text.replace(/\s+$/, '')}\n\n${fieldsToDeclaration(fields)}\n`;
};

/**
 * 一键导入（JSON 模板 / Git 仓库返回的结构化对象）→ 一份 SKILL.md 原文。
 * 导入后整份 md 直接灌进正文框，不再拆成 7 个表单 state。
 */
export const skillMdFromObject = (obj: any): string => {
    const o = obj || {};
    const title = String(o.title || '').trim();
    const alias = String(o.alias || '').trim();
    const whenUse = String(o.whenUse || '').trim();
    const description = (whenUse.split(/\r?\n/)[0] || title || '技能说明').slice(0, 120);
    const lines: string[] = ['---', `name: ${alias || 'my-skill'}`, `description: ${description}`, '---', ''];
    if (title) lines.push(`# ${title}`, '');
    if (o.instruction) lines.push(String(o.instruction).trim(), '');
    if (whenUse) lines.push('## 何时使用', whenUse, '');
    if (o.whenNot) lines.push('## 何时不使用', String(o.whenNot).trim(), '');

    const ps: any[] = Array.isArray(o.params) ? o.params : [];
    const rows = ps.map((p: any) => {
        const label = String(p?.label || p?.name || '').trim();
        if (!label) return '';
        let type: SkillField['type'] = LABEL_OF_TYPE(p?.type);
        const opts: string[] = Array.isArray(p?.options) ? p.options.map(String) : [];
        if ((type === 'select' || type === 'radio') && opts.length < 2) type = 'text';
        const choice = (type === 'select' || type === 'radio') && opts.length >= 2;
        const parts = [choice ? `${TYPE_LABEL[type]} ${opts.join('/')}` : TYPE_LABEL[type]];
        if (p?.required) parts.push('必填');
        const ex = String(p?.example || p?.placeholder || '').trim().replace(/[,，;；、]/g, ' ');
        if (ex) parts.push(`示例 ${ex}`);
        return `- ${label}：${parts.join('，')}`;
    }).filter(Boolean);
    if (rows.length) lines.push('## 参数', ...rows, '');

    if (o.outputFormat) lines.push('## 输出格式', String(o.outputFormat).trim(), '');
    if (o.example) lines.push('## 示例', String(o.example).trim(), '');
    if (o.references) lines.push('## 参考资料', String(o.references).trim(), '');
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

/** 标准 SKILL.md 常带 YAML frontmatter，预览/提示词里不需要重复展示 */
export const stripFrontmatter = (md: string): string => {
    const text = String(md || '');
    const m = text.match(/^(?:\uFEFF)?---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/);
    return m ? text.slice(m[0].length) : text;
};

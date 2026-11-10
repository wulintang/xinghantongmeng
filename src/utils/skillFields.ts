import type { SkillField } from '@/services/userCenter';

/**
 * 技能字段表的全站统一归一化（与后端 app/skills/SkillCommon.php 规则一致）。
 *
 * 解决的问题：
 * - 「用户选择适合的年级」没写选项 → 旧逻辑生成「请选择 → 暂无数据」的空下拉；
 * - 「用户选择出生时辰（子时、丑时、寅时等）」→ 旧逻辑只列出 3 项，还把「寅时等」当成一个选项。
 *
 * 规则：只有 ≥2 个完整确定的选项才允许 select/radio；开放式列举要么补全为完整枚举，
 * 要么降级为可自由填写的输入框（原选项保留为填写参考提示）。
 */
export const KNOWN_ENUMS: [string, string[]][] = [
    ['时辰', ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时']],
    ['生肖', ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']],
    ['属相', ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']],
    ['天干', ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']],
    ['地支', ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']],
    ['星座', ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']],
    ['月份', ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']],
    ['星期', ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']],
    ['季节', ['春季', '夏季', '秋季', '冬季']],
    ['学历', ['小学', '初中', '高中', '中专', '大专', '本科', '硕士', '博士']],
];

/** 清理单个选项：去引号、去「等 / 等等 / …」这类开放式后缀 */
export const cleanSkillOption = (o: string): string =>
    String(o ?? '')
        .replace(/^[\s"“”「」'‘’]+|[\s"“”「」'‘’]+$/gu, '')
        .replace(/(?:等等|等|诸如此类|之类|及其他|…|\.\.\.)$/u, '')
        .trim();

/** 从描述里解析候选项；open=true 表示「…等」开放式列举，调用方须退回输入框或补全枚举 */
export const parseSkillOptions = (label: string, desc: string): { options: string[]; open: boolean } => {
    const bm = desc.match(/[（(]([^)）]+)[)）]/);
    const rm = bm ? null : desc.match(/可参考\s*([^。；;]+)/);
    const raw = bm ? bm[1].trim() : (rm ? rm[1].trim() : '');
    const open = !!rm || /(等|…|\.\.\.|之类|诸如此类|及其他)/.test(raw);
    // 「或者」必须排在「或」前面，否则「A或者B」会被切成 "A" 和 "者B"
    let options = raw
        ? raw.split(/[,，、]|或者|或|\/|\|/)
            .map(cleanSkillOption)
            .filter((o) => o && o.length <= 20 && !/[。；;！？]/.test(o))
        : [];
    options = options.filter((o, i) => options.indexOf(o) === i);
    if (!open && options.length >= 2) return { options, open: false };

    const text = `${label} ${desc}`;
    for (const [kw, full] of KNOWN_ENUMS) {
        if (!text.includes(kw) || options.length >= full.length) continue;
        const hit = options.filter((o) => full.some((v) => o === v || v.startsWith(o) || o.startsWith(v))).length;
        if (options.length && hit === 0) continue;
        return { options: [...full], open: false };
    }
    return { options, open };
};

/** 渲染前统一归一化：后端尚未更新 / 库里存着旧字段表时也不会出现空下拉、残缺下拉 */
export const normalizeSkillFields = (list: SkillField[]): SkillField[] =>
    (list || []).map((f) => {
        const options = (f.options || [])
            .map((o) => cleanSkillOption(String(o ?? '')))
            .filter((o, i, arr) => o && arr.indexOf(o) === i);
        let type = f.type;
        if (type === 'select' || type === 'radio') {
            const label = String(f.label || '');
            const known = KNOWN_ENUMS.find(([kw]) => label.includes(kw));
            if (known && options.length < known[1].length) {
                const full = known[1];
                const hit = options.filter((o) => full.some((v) => o === v || v.startsWith(o) || o.startsWith(v))).length;
                if (!options.length || hit > 0) return { ...f, type: 'select', options: [...full] };
            }
            if (options.length < 2) type = 'text';
        }
        return { ...f, type, options };
    });

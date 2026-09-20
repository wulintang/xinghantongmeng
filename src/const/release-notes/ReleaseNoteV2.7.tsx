import React from 'react';
import { Typography, Image, Space, Divider } from 'antd';

const { Title, Paragraph, Text, Link } = Typography;

const META_V2_7 = {
    title: 'v2.7 版本说明 - 兴汉同盟 · 博客人的朋友圈！',
    keywords: '兴汉同盟, 版本说明, v2.7',
    description: '兴汉同盟 v2.7 版本说明。'
}

const RELEASE_INFO_V2_7 = {
    title: 'v2.7 版本说明',
    content: (
        <>
            <Paragraph style={{ marginBottom: 16 }}>
                兴汉同盟于 2025 年 10 月 19 日发布了 v2.7 版本！该版本增加了「
                <Link href="/certificates/leileiluoluo.com">履约证书</Link>」一个新页面。前者用于展示博客在兴汉同盟的履约情况。
            </Paragraph>

            <Title level={5} style={{ marginTop: 24, marginBottom: 12, fontWeight: 'bold' }}>
                1「履约证书」功能说明
            </Title>
            <Paragraph style={{ marginBottom: 16 }}>
                「履约证书」用于展示一个博客在兴汉同盟的履约情况，若从收录之日起到现在未有断更和闭站的情况，即认为该博客在与兴汉同盟正常履约中；否则，会被认为单方面毁约。建立该页面的初衷是希望博友能以此督促自己不断更、不闭站，将博客好好写下去。
            </Paragraph>
            <Paragraph style={{ marginBottom: 16 }}>
                用户可以从博客详情页点击履约进度条来查看对应博客的履约证书。
            </Paragraph>

            <Paragraph style={{ marginBottom: 8, fontWeight: 500 }}>
                博客详情页履约进度条：
            </Paragraph>

            <div style={{ marginBottom: 14, textAlign: 'center' }}>
                <Image
                    src="/assets/images/sites/release_notes/v2.7/blog-detail-page.png"
                    alt="博客详情页履约进度条"
                    style={{ width: '60%', border: '1px solid #d9d9d9', borderRadius: 4 }}
                />
            </div>

            <Paragraph style={{ marginBottom: 8, fontWeight: 500 }}>
                履约证书：
            </Paragraph>

            <div style={{ marginBottom: 14, textAlign: 'center' }}>
                <Image
                    src="/assets/images/sites/release_notes/v2.7/performance-page.png"
                    alt="履约证书"
                    style={{ width: '60%', border: '1px solid #d9d9d9', borderRadius: 4 }}
                />
            </div>

            <Title level={5} style={{ marginTop: 24, marginBottom: 12, fontWeight: 'bold' }}>
                2 代码标签
            </Title>
            <Paragraph style={{ marginBottom: 8 }}>
                兴汉同盟前端：<Link href="https://github.com/leileiluoluo/xinghantongmeng/releases/tag/v2.7" target="_blank">xinghantongmeng</Link>
            </Paragraph>
            <Paragraph style={{ marginBottom: 16 }}>
                兴汉同盟后端：<Link href="https://github.com/leileiluoluo/xinghantongmeng/releases/tag/v2.7" target="_blank">xinghantongmeng</Link>
            </Paragraph>
        </>
    ),
    publishedAt: '2025年10月19日'
}

export { META_V2_7, RELEASE_INFO_V2_7 };

import { Meta } from '@components/common';
import CancelSubscription from '@components/subscription/CancelSubscription';
import { MetaFields } from '@types';

const meta: MetaFields = {
    title: '取消订阅 - 兴汉同盟 · 博客人的朋友圈！',
    keywords: '取消订阅, 兴汉同盟',
    description: '取消兴汉同盟邮件订阅。'
};

export default function CancelSubscriptionPage() {
    return (
        <>
            <Meta meta={meta} />
            <CancelSubscription />
        </>
    )
}
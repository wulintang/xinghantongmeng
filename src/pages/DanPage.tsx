import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Meta } from '@components/common';
import { DanSkeleton } from '@components/common/skeleton';
import { getDan, type DanItem } from '@/services/userCenter';
import { sanitizeHtml } from '@/utils/CommonUtil';

const DanPage: React.FC = () => {
    const { alias } = useParams<{ alias: string }>();
    const [loading, setLoading] = useState(true);
    const [dan, setDan] = useState<DanItem | null>(null);

    useEffect(() => {
        setLoading(true);
        getDan(alias)
            .then((r) => {
                if (r.code === 1 && r.data) setDan(r.data);
                else setDan(null);
            })
            .catch(() => setDan(null))
            .finally(() => setLoading(false));
    }, [alias]);

    if (loading) {
        return (
            <>
                <Meta />
                <DanSkeleton />
            </>
        );
    }

    const title = dan?.title || alias || '单页';
    const raw = dan?.content || '';
    const content = sanitizeHtml(raw);
    const isHtml = /<[a-z][\s\S]*>/i.test(content);

    return (
        <>
            <Meta meta={{ title: `${title} - 兴汉同盟`, keywords: title, description: title }} />
            <div className="dan-wrap">
                <div className="dan-title">{title}</div>
                {isHtml ? (
                    <div className="dan-content" dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                    <div className="dan-content">{content}</div>
                )}
            </div>
        </>
    );
};

export default DanPage;

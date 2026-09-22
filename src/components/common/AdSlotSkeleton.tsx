import React from 'react';

export default function AdSlotSkeleton({ label = '广告位', variant = 'banner' }: { label?: string; variant?: 'banner' | 'grid' }): React.JSX.Element {
    return (
        <div className={`ad-slot-skeleton ad-slot-skeleton-${variant}`}>
            <span className="ad-slot-skeleton-label">{label}</span>
        </div>
    );
}

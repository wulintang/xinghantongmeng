import React from 'react';

export default function AdSlotSkeleton({ label = '广告位' }: { label?: string }): React.JSX.Element {
    return (
        <div className="ad-slot-skeleton">
            <span className="ad-slot-skeleton-label">{label}</span>
        </div>
    );
}

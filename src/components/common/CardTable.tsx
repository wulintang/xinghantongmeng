import React, { useEffect, useState } from 'react';
import { Table, List, Card, Typography } from 'antd';
import type { TableProps } from 'antd';

/**
 * 响应式表格：桌面端渲染 antd Table（横向滚动兜底），移动端（<=768px）渲染卡片列表。
 * 解决 antd Table 在窄屏下 tbody 挤压难看、官方无内置响应式隐藏列的问题。
 * 移动端卡片行由 columns 自动推导（column.title 作标签，column.render 作值）；
 * 若传入 expandable.expandedRowRender，移动端卡片底部也会渲染该详情。
 */
function useIsMobile(): boolean {
    const [mobile, setMobile] = useState(
        typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
    );
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 768px)');
        const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return mobile;
}

export interface CardTableProps<T> {
    columns: TableProps<T>['columns'];
    dataSource: T[];
    rowKey: TableProps<T>['rowKey'];
    loading?: boolean;
    className?: string;
    expandable?: TableProps<T>['expandable'];
    pagination?: TableProps<T>['pagination'];
}

export default function CardTable<T extends Record<string, any>>(props: CardTableProps<T>) {
    const { columns, dataSource, rowKey, loading, className, expandable, pagination } = props;
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <List
                className={`${className || ''} cardtable-list`}
                loading={loading}
                dataSource={dataSource}
                rowKey={rowKey as any}
                renderItem={(item: T) => (
                    <List.Item className="cardtable-list-item">
                        <Card size="small" className="cardtable-mobile-card" bordered>
                            {(columns as any[]).map((col, idx) => {
                                const dataIndex = (col as any).dataIndex;
                                const value = dataIndex != null ? item[dataIndex] : undefined;
                                const node = col.render ? col.render(value, item, idx) : value;
                                return (
                                    <div className="cardtable-row" key={(col as any).key || dataIndex || idx}>
                                        <span className="cardtable-label">{col.title}</span>
                                        <span className="cardtable-value">{node}</span>
                                    </div>
                                );
                            })}
                            {expandable?.expandedRowRender ? (
                                <div className="cardtable-detail">
                                    {expandable.expandedRowRender(item, 0, 0, null as any)}
                                </div>
                            ) : null}
                        </Card>
                    </List.Item>
                )}
            />
        );
    }

    return (
        <Table<T>
            className={`${className || ''} user-center-table`}
            columns={columns}
            dataSource={dataSource}
            rowKey={rowKey as any}
            loading={loading}
            pagination={pagination}
            expandable={expandable}
            scroll={{ x: 'max-content' }}
        />
    );
}

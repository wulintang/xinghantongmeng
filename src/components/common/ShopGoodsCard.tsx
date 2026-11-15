import React from 'react';
import { Avatar, Button, Card, Flex, Tag, Typography } from 'antd';

import AppTooltip from '@components/common/AppTooltip';
import { cateNameFrom, type MallGoodsItem, type ShopConfig } from '@/services/shop';

const { Text, Paragraph } = Typography;

export interface ShopGoodsCardProps {
  item: MallGoodsItem;
  cfg?: ShopConfig | null;
  /** 打开详情：由调用方决定跳转方式（集市独立页 / 首页弹层） */
  onOpen: (id: number) => void;
}

/**
 * 全站唯一商品卡：集市首页、用户集市区块等所有「集市商品展示」共用同一组件，
 * 保证店铺 logo、保证金状态、详情入口、字段顺序完全一致，展示不可能再各写一套。
 */
const ShopGoodsCard: React.FC<ShopGoodsCardProps> = ({ item, cfg, onOpen }) => {
  const cateName = cateNameFrom(cfg, item.cate);
  return (
    <Card
      hoverable
      className="shop-goods-card"
      onClick={() => onOpen(item.id)}
      cover={
        item.cover ? (
          <div className="shop-goods-cover"><img src={item.cover} alt={item.title} /></div>
        ) : (
          <div className="shop-goods-ico">{cateName?.[0] || '商'}</div>
        )
      }
    >
      <Flex vertical className="u-flex-1">
        <AppTooltip title={item.title}>
          <Text strong className="shop-goods-title">{item.title}</Text>
        </AppTooltip>
        <Paragraph type="secondary" ellipsis={{ rows: 2 }} className="shop-goods-desc">
          {item.description || '暂无商品简介'}
        </Paragraph>
        <Flex justify="space-between" align="center" wrap>
          <Text className="shop-goods-price">¥{(Number(item.price) || 0).toFixed(2)}</Text>
          <Tag color={item.delivery === 'digital' ? 'cyan' : 'orange'}>
            {item.delivery === 'digital' ? '数字交付' : '实体交付'}
          </Tag>
        </Flex>
        <Flex justify="space-between" align="center" wrap>
          <Flex align="center" wrap>
            {item.shop_logo ? <Avatar size={16} src={item.shop_logo} /> : null}
            <Text type="secondary" className="shop-goods-meta">
              {item.shop_name || '店铺'} · {cateName}
            </Text>
          </Flex>
          <Tag color={Number(item.can_buy) === 0 ? 'red' : 'green'}>
            {Number(item.can_buy) === 0 ? '保证金未缴' : '保证金已缴'}
          </Tag>
        </Flex>
        <Flex justify="flex-end">
          <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); onOpen(item.id); }}>
            查看详情
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

export default ShopGoodsCard;

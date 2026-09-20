import { request } from '@/utils/request';
import { PostData } from '@/types/post';

// 后端 feed 插件聚合接口：/index.php/feed/index/posts.html
// 数据源 my_feed_post（每个站点最多 10 条），后端固定按 pub_time 倒序返回。
// 后端没有 sort / keyword / page 参数 —— 所以搜索、排序、分页全部在前端本地完成，不改后端。
const FEED_POSTS = '/index.php/feed/index/posts.html';

interface FeedResp {
  code: number;
  msg: string;
  data?: PostData[];
}

export async function getPosts(): Promise<PostData[]> {
  const r = await request<FeedResp>(FEED_POSTS);
  return r && r.code === 1 && Array.isArray(r.data) ? r.data : [];
}

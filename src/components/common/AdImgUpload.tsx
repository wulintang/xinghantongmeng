import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { getToken } from '@/utils/auth';
import { uploadAdImg } from '@/services/adpay';

interface Props {
  /** 当前图片 URL（受控值，由 Form 注入） */
  value?: string;
  /** 上传完成/移除时回传新 URL（空串表示已移除） */
  onChange?: (url: string) => void;
  /** 提示文案 */
  hint?: string;
}

/**
 * 广告图片上传组件（受控）。
 * - 点击/拖拽选择图片后直接调后端上传接口，拿到 URL 回传，不直接发 FormData 到业务接口。
 * - 支持 GIF / JPG / PNG 等常见图片格式；单图，重复选择覆盖。
 * - 与 antd Form.Item 配合：name="img" + 本组件即可，value/onChange 自动桥接。
 */
export default function AdImgUpload({ value, onChange, hint }: Props): React.JSX.Element {
  const [list, setList] = useState<UploadFile[]>(
    value ? [{ uid: '-1', name: 'ad-img', status: 'done', url: value }] : []
  );
  const [loading, setLoading] = useState(false);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const key = getToken();
    if (!key) {
      message.error('请先登录');
      return false;
    }
    const isImg = (file as File).type.startsWith('image/');
    if (!isImg) {
      message.error('只能上传图片文件（支持 GIF/JPG/PNG）');
      return false;
    }
    setLoading(true);
    uploadAdImg(key, file as File)
      .then((r) => {
        if (r.code === 1 && r.data?.url) {
          const url = r.data.url;
          setList([{ uid: (file as File).uid, name: (file as File).name, status: 'done', url }]);
          onChange?.(url);
        } else {
          message.error(r.msg || '上传失败');
        }
      })
      .catch((e) => message.error(e?.message || '上传失败'))
      .finally(() => setLoading(false));
    // 阻止 antd 默认上传（我们自己走接口）
    return false;
  };

  const handleRemove = () => {
    setList([]);
    onChange?.('');
  };

  return (
    <div>
      <Upload
        listType="picture-card"
        fileList={list}
        beforeUpload={beforeUpload}
        onRemove={handleRemove}
        accept="image/*"
        disabled={loading}
      >
        {list.length >= 1 ? null : (
          <div>
            {loading ? <UploadOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8, fontSize: 'var(--fs-sm)' }}>{loading ? '上传中' : '上传图片'}</div>
          </div>
        )}
      </Upload>
      {hint ? (
        <div style={{ color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)', marginTop: -8 }}>{hint}</div>
      ) : null}
    </div>
  );
}

import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { getToken } from '@/utils/auth';
import { uploadColumnImg } from '@/services/column';

interface Props {
  value?: string;
  onChange?: (url: string) => void;
  /** 上传提示文案 */
  hint?: string;
  /** 是否限制尺寸（默认不限制，仅校验图片类型） */
  strictSize?: { w: number; h: number };
}

/**
 * 用户专栏图片上传（图标 / 封面）：
 * 必须走上传控件，禁止填 URL（长记忆第 0.5 条图片录入铁律）。必填。
 */
export default function ColumnImgUpload({ value, onChange, hint, strictSize }: Props): React.JSX.Element {
  const [list, setList] = useState<UploadFile[]>(
    value ? [{ uid: '-1', name: 'col-img', status: 'done', url: value }] : []
  );
  const [loading, setLoading] = useState(false);

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    const key = getToken();
    if (!key) {
      message.error('请先登录');
      return false;
    }
    const isImg = (file as File).type.startsWith('image/');
    if (!isImg) {
      message.error('只能上传图片文件（支持 webp/jpg/png/gif）');
      return false;
    }
    if (strictSize) {
      const size = await new Promise<{ w: number; h: number }>((resolve) => {
        const url = URL.createObjectURL(file as File);
        const img = new Image();
        img.onload = () => {
          resolve({ w: img.naturalWidth, h: img.naturalHeight });
          URL.revokeObjectURL(url);
        };
        img.onerror = () => {
          resolve({ w: 0, h: 0 });
          URL.revokeObjectURL(url);
        };
        img.src = url;
      });
      if (size.w !== strictSize.w || size.h !== strictSize.h) {
        message.error(`图片必须为 ${strictSize.w}×${strictSize.h} 像素（当前 ${size.w}×${size.h}），请调整后上传`);
        return false;
      }
    }
    setLoading(true);
    uploadColumnImg(key, file as File)
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
    return false;
  };

  const handleRemove = () => {
    setList([]);
    onChange?.('');
  };

  return (
    <div>
      <div className="col-upload-tip">
        {hint || '点击上传图片（必填，支持 webp/jpg/png/gif）。'}
      </div>
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
            <div className="col-upload-label">{loading ? '上传中' : '上传图片'}</div>
          </div>
        )}
      </Upload>
    </div>
  );
}

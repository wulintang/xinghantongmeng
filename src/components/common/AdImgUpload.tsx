import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { getToken } from '@/utils/auth';
import { uploadAdImg } from '@/services/adpay';

interface Props {
  value?: string;
  onChange?: (url: string) => void;
  hint?: string;
  strictSize?: boolean;
}

export default function AdImgUpload({ value, onChange, hint, strictSize = true }: Props): React.JSX.Element {
  const [list, setList] = useState<UploadFile[]>(
    value ? [{ uid: '-1', name: 'ad-img', status: 'done', url: value }] : []
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
      if (size.w !== 1200 || size.h !== 120) {
        message.error(`广告图片必须为 1200×120 像素（当前 ${size.w}×${size.h}），请调整后上传`);
        return false;
      }
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
    return false;
  };

  const handleRemove = () => {
    setList([]);
    onChange?.('');
  };

  return (
    <div>
      <div className="ad-upload-tip">
        {strictSize ? '广告图片须为 1200×120 像素，优先 webp 格式；尺寸不符无法上传。' : '建议上传与广告位尺寸匹配的图片，优先 webp 格式。'}
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
            <div className="ad-upload-label">{loading ? '上传中' : '上传图片'}</div>
          </div>
        )}
      </Upload>
      {hint ? <div className="ad-upload-hint">{hint}</div> : null}
    </div>
  );
}

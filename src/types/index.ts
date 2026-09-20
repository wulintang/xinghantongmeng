export interface MetaFields {
  title?: string;
  keywords?: string;
  description?: string;
}

// 环境变量类型声明（构建期由部署平台注入，仓库内不落真实地址）
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOYOUQUAN_API_ADDRESS: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {};

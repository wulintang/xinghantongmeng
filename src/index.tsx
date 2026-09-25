import React from 'react';
import ReactDOMClient from 'react-dom/client';
import './styles.css';

import { ConfigProvider, message } from 'antd';

import App from './App.tsx';

// 全局 antd message：统一时长 6 秒、垂直居中 + 半透明笼罩（见 styles.css）
message.config({ duration: 6 });

// 半透明笼罩：有提示时全屏显示、拦截点击（点任意处立即关闭提示），置于 message 卡片之下
function ensureMsgOverlay() {
    let el = document.getElementById('global-msg-overlay');
    if (!el) {
        el = document.createElement('div');
        el.id = 'global-msg-overlay';
        el.style.cssText =
            'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:2000;pointer-events:auto;cursor:pointer;';
        // 点击页面任意处立即关闭所有提示
        el.addEventListener('click', () => {
            message.destroy();
            removeMsgOverlay();
        });
        document.body.appendChild(el);
    }
    return el;
}
function removeMsgOverlay() {
    const el = document.getElementById('global-msg-overlay');
    if (el) el.remove();
}
if (typeof MutationObserver !== 'undefined') {
    const mo = new MutationObserver(() => {
        const has = !!document.querySelector('.ant-message .ant-message-notice');
        if (has) ensureMsgOverlay();
        else removeMsgOverlay();
    });
    mo.observe(document.body, { childList: true, subtree: true });
}

const rootElement = document.getElementById('top');
if (!rootElement) {
    throw new Error('Root element not found');
}

ReactDOMClient.createRoot(rootElement).render(
    <React.StrictMode>
        <ConfigProvider
            theme={{
                token: {
                    colorBgLayout: '#ffffff',
                    zIndex: { message: 2001 },
                    // colorLink: '#000000',
                },
            }}>
            <App />
        </ConfigProvider>
    </React.StrictMode>
);


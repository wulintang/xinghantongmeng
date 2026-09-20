import React, { useEffect, useState } from 'react';
import { getSite, getLinks, type SiteConfig, type LinkItem } from '@/services/userCenter';
import { sanitizeHtml } from '@/utils/CommonUtil';

export default function SiteFooter() {
    const [site, setSite] = useState<SiteConfig | null>(null);
    const [links, setLinks] = useState<LinkItem[]>([]);

    useEffect(() => {
        Promise.all([getSite(), getLinks()])
            .then(([s, l]) => {
                if (s.code === 1 && s.data) setSite(s.data);
                if (l.code === 1 && l.data) setLinks(l.data);
            })
            .catch(() => {});
    }, []);

    const bottomLinks = links.filter((l) => l.wz === 2);
    const friendLinks = links.filter((l) => l.wz === 9);

    return (
        <footer className="site-footer">
            <div className="container">
                {bottomLinks.length > 0 && (
                    <div className="site-footer-nav">
                        {bottomLinks.map((l) => (
                            <a
                                key={l.id}
                                href={l.lianjie}
                                target={l.xin === 1 ? '_blank' : undefined}
                                rel={l.xin === 1 ? 'noreferrer' : undefined}
                            >
                                {l.name}
                            </a>
                        ))}
                    </div>
                )}

                {friendLinks.length > 0 && (
                    <div className="site-footer-friends">
                        <span className="site-footer-label">友情链接：</span>
                        {friendLinks.map((l) => (
                            <a
                                key={l.id}
                                href={l.lianjie}
                                target={l.xin === 1 ? '_blank' : undefined}
                                rel={l.xin === 1 ? 'noreferrer' : undefined}
                            >
                                {l.name}
                            </a>
                        ))}
                    </div>
                )}

                <div className="site-footer-copyright">
                    <div>{site?.title || '兴汉同盟'}</div>
                    {site?.beian && (
                        <div>
                            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
                                {site.beian}
                            </a>
                        </div>
                    )}
                    {site?.gonganbei && (
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(site.gonganbei) }} />
                    )}
                </div>
            </div>
        </footer>
    );
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getUserProfile, type MemberInfo } from '@/services/userCenter';
import { getToken } from '@/utils/auth';

interface MemberContextValue {
    info: MemberInfo | null;
    setInfo: (info: MemberInfo | null) => void;
    loading: boolean;
    refresh: () => void;
}

const MemberContext = createContext<MemberContextValue>({
    info: null,
    setInfo: () => {},
    loading: true,
    refresh: () => {},
});

export function MemberProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [info, setInfo] = useState<MemberInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(() => {
        const key = getToken();
        if (!key) {
            setInfo(null);
            setLoading(false);
            return;
        }
        getUserProfile(key)
            .then((r: any) => {
                if (r?.code === 1 && r.data) setInfo(r.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const value = useMemo<MemberContextValue>(() => ({ info, setInfo, loading, refresh }), [info, loading, refresh]);

    return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export function useMember(): MemberContextValue {
    return useContext(MemberContext);
}

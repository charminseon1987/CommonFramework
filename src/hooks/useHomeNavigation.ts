export function useHomeNavigation(setState: any) {
    return () => {
        const mx = (window as any).mx;
        setState((prev: any) => ({ ...prev, activeMenuId: null }));

        if (mx?.navigation?.navigate) {
            mx.navigation.navigate({ page: "index", params: {} });
        } else {
            window.location.href = "/";
        }
    };
}

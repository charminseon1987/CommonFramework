export function useNavigation() {
    const navigateToPage = (pageURL?: string) => {
        if (!pageURL) return;

        if (pageURL.startsWith("http") || pageURL.startsWith("/")) {
            window.location.href = pageURL;
            return;
        }

        const mx = (window as any).mx;
        mx?.navigation?.navigate({ page: pageURL });
    };

    const navigateHome = () => {
        const mx = (window as any).mx;
        mx?.navigation?.navigate({ page: "index" });
    };

    return { navigateToPage, navigateHome };
}

import { saveActiveMenuId, saveExpandedMenuIds } from "../utils/menuHelpers";
import { Dispatch, SetStateAction } from "react";
import { NavigationState } from "../types/menu.types";

export function useMenuNavigation(
    props: any,
    setState: Dispatch<SetStateAction<NavigationState>>
) {
    const navigate = (menuId: string, pageURL?: string, shouldClose = false) => {
        saveActiveMenuId(menuId);
        
        // activeMenuId state 업데이트
        setState(prev => ({
            ...prev,
            activeMenuId: menuId
        }));

        if (shouldClose) {
            saveExpandedMenuIds([]);
        }

        if (!pageURL) return;

        if (pageURL.startsWith("/") || pageURL.startsWith("http")) {
            window.location.href = pageURL;
            return;
        }

        const mx = (window as any).mx;
        if (!mx) return;

        if (mx.navigation?.navigate) {
            mx.navigation.navigate({ page: pageURL, params: {} });
        } else if (mx.ui?.openForm) {
            mx.ui.openForm(pageURL, { location: "content" });
        }

        props.onMenuClick?.canExecute && props.onMenuClick.execute();
    };

    return { navigate };
}

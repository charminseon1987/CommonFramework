import { saveActiveMenuId, saveExpandedMenuIds } from "../utils/menuHelpers";
import { Dispatch, SetStateAction } from "react";
import { NavigationState } from "../types/menu.types";

/** Resource pageURL → mx.ui.openForm용 페이지 이름 (예: ModuleName.PageName) */
function toOpenFormPageName(pageURL: string): string {
    if (!pageURL || typeof pageURL !== "string") return pageURL;
    let name = pageURL.trim();
    if (name.endsWith(".page.xml")) name = name.slice(0, -".page.xml".length);
    return name.replace(/\//g, ".");
}

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
        if (!mx?.ui?.openForm) return;

        const pageName = toOpenFormPageName(pageURL)?.trim() || "";
        if (!pageName) {
            console.warn("[useMenuNavigation] pageName is empty. Check Resource.PageUrl for menuId:", menuId);
            return;
        }

        mx.ui.openForm(pageName, {
            location: "content",
            callback: function () {
                if (props.debugMode) console.log("[useMenuNavigation] Page opened:", pageName);
            },
            error: function (error: unknown) {
                console.error("[useMenuNavigation] OpenForm error:", error);
                if (mx.ui?.error) mx.ui.error("Error opening page: " + pageName);
            }
        });

        props.onMenuClick?.canExecute && props.onMenuClick.execute();
    };

    return { navigate };
}

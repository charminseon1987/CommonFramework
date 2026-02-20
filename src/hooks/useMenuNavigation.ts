import { saveActiveMenuId, saveExpandedMenuIds } from "../utils/menuHelpers";
import { Dispatch, SetStateAction } from "react";
import { NavigationState } from "../types/menu.types";

/** pageURL → "Module/Page" 형식 정규화 (onOpenPage 마이크로플로우 파라미터용) */
function toPagePath(pageURL: string): string {
    if (!pageURL || typeof pageURL !== "string") return pageURL;
    let path = pageURL.trim();

    if (path.startsWith("/p/")) path = path.slice(3);
    else if (path.startsWith("/")) path = path.slice(1);

    if (path.endsWith(".page.xml")) path = path.slice(0, -".page.xml".length);
    path = path.replace(/\./g, "/").replace(/\/+$/, "");

    return path;
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

        console.log("[useMenuNavigation] navigate 호출", { menuId, pageURL });

        // 외부 URL만 window.location.href 사용 (URL 변경됨)
        if (pageURL.startsWith("http")) {
            window.location.href = pageURL;
            return;
        }

        const pagePath = toPagePath(pageURL)?.trim() || "";

        if (!pagePath) {
            console.warn("[useMenuNavigation] pagePath is empty. Check Resource.PageUrl for menuId:", menuId);
            props.onMenuNoURL?.canExecute && props.onMenuNoURL.execute();
            return;
        }

        console.log("[useMenuNavigation] pagePath", { pagePath });

        const mx = (window as any).mx;

        // 1) mx.navigation.navigate 시도 (일부 Mendix 버전)
        if (mx?.navigation?.navigate) {
            try {
                console.log("[useMenuNavigation] mx.navigation.navigate 시도", { pagePath });
                mx.navigation.navigate({ page: pagePath, params: {} });
                props.onMenuClick?.canExecute && props.onMenuClick.execute();
                return;
            } catch (err) {
                console.warn("[useMenuNavigation] mx.navigation.navigate 에러", err);
            }
        }

        // 2) onOpenPage Action (마이크로플로우 Decision + Show Page)
        if (props.onOpenPage?.canExecute) {
            // Attribute 방식: pageUrlToOpen이 바인딩된 경우 setValue 후 execute (action variable 매핑 실패 시 대안)
            const pageUrlToOpen = props.pageUrlToOpen as { setValue?: (v: string) => void } | undefined;
            if (pageUrlToOpen?.setValue) {
                pageUrlToOpen.setValue(pagePath);
                props.onOpenPage.execute();
            } else {
                props.onOpenPage.execute({ pageURL: pagePath });
            }
            props.onMenuClick?.canExecute && props.onMenuClick.execute();
            return;
        }

        console.error("[useMenuNavigation] 페이지 열기 실패. onOpenPage 마이크로플로우를 연결하세요.", {
            pagePath,
            onOpenPageExists: !!props.onOpenPage
        });
        if (mx?.ui?.error) mx.ui.error("Error opening page: " + pagePath);
        props.onMenuNoURL?.canExecute && props.onMenuNoURL.execute();
    };

    return { navigate };
}

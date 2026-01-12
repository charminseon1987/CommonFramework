import { useEffect, useRef, useState } from "react";
import { NavigationState, MenuItemData } from "../types/menu.types";
import {
    buildMenuTree,
    restoreMenuExpansion,
    loadExpandedMenuIds,
    loadActiveMenuId,
    expandAllMenus
} from "../utils/menuHelpers";

export function useNavigationState(menuData: MenuItemData[] | null, layout?: "vertical" | "horizontal") {
    const [state, setState] = useState<NavigationState>({
        menuTree: [],
        activeMenuId: null,
        expandedMenuIds: new Set(),
        isLoading: true,
        error: null
    });

    const isInitialLoad = useRef(true);
    const previousMenuKey = useRef<string>("");

    useEffect(() => {
        if (!menuData) return;

        const currentKey = menuData.map(m => m.guid).join(",");
        if (previousMenuKey.current === currentKey && !isInitialLoad.current) {
            return;
        }
        previousMenuKey.current = currentKey;

        try {
            let tree = buildMenuTree(menuData);
            
            // vertical layout일 때는 기본적으로 모든 메뉴를 접힌 상태로 시작
            // localStorage에 저장된 확장 상태는 있지만, 초기 렌더링은 접힌 상태
            // 호버 시 localStorage 상태로 복원됨
            if (layout === "vertical") {
                // 모든 메뉴를 접힌 상태로 시작 (기본 상태)
                tree = expandAllMenus(tree, false);
            } else {
                // horizontal layout은 기존 로직 유지
                const savedExpandedIds = loadExpandedMenuIds();
                if (savedExpandedIds.length > 0) {
                    // localStorage에 저장된 확장 상태가 있으면 우선 적용
                    tree = restoreMenuExpansion(tree, savedExpandedIds);
                }
            }

            const activeMenuId = loadActiveMenuId();

            isInitialLoad.current = false;

            setState(prev => ({
                ...prev,
                menuTree: tree,
                activeMenuId: activeMenuId ?? prev.activeMenuId,
                isLoading: false
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false
            }));
        }
    }, [menuData, layout]);

    return { state, setState };
}

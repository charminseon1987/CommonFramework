import { useEffect, useRef, useState } from "react";
import { NavigationState, MenuItemData } from "../types/menu.types";
import {
    buildMenuTree,
    restoreMenuExpansion,
    loadExpandedMenuIds,
    loadActiveMenuId,
    expandDepth0MenusWithChildren,
    getExpandedMenuIds,
    saveExpandedMenuIds
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
            const savedExpandedIds = loadExpandedMenuIds();
            
            if (savedExpandedIds.length > 0) {
                // localStorage에 저장된 확장 상태가 있으면 우선 적용
                tree = restoreMenuExpansion(tree, savedExpandedIds);
            } else if (layout === "vertical") {
                // vertical layout이고 저장된 상태가 없으면 depth-0 메뉴 중 children이 있으면 자동 펼침
                tree = expandDepth0MenusWithChildren(tree);
                // 자동 펼쳐진 메뉴 ID를 localStorage에 저장하여 상태 유지
                const expandedIds = getExpandedMenuIds(tree);
                if (expandedIds.length > 0) {
                    saveExpandedMenuIds(expandedIds);
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

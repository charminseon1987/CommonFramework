import { useEffect, useRef, useState } from "react";
import { NavigationState, MenuItemData } from "../types/menu.types";
import {
    buildMenuTree,
    restoreMenuExpansion,
    loadExpandedMenuIds,
    loadActiveMenuId
} from "../components/utils/menuHelpers";

export function useNavigationState(menuData: MenuItemData[] | null) {
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
                tree = restoreMenuExpansion(tree, savedExpandedIds);
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
    }, [menuData]);

    return { state, setState };
}

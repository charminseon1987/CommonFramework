import { useState, useEffect, useCallback } from "react";
import type { DynamicNavigationContainerProps } from "../types/widget.types";
import type { NavigationState } from "../types/menu.types";

import {
    buildMenuTree,
    toggleMenuExpand,
    expandAllMenus,
    getExpandedMenuIds,
    saveExpandedMenuIds,
    restoreMenuExpansion,
    loadExpandedMenuIds,
    saveActiveMenuId,
    loadActiveMenuId
} from "../utils/menuHelpers";
import { useMenuData } from "./useMenuData";

export const initialState: NavigationState = {
    menuTree: [],
    activeMenuId: null,
    isLoading: true,
    error: null,
    expandedMenuIds: new Set()
};

export default function useMenuState(props: DynamicNavigationContainerProps) {
    const [state, setState] = useState<NavigationState>(initialState);
    const menuData = useMenuData(props);

    useEffect(() => {
        if (!menuData) return;

        try {
            let tree = buildMenuTree(menuData);

            setState(prev => {
                const existingExpandedIds = prev.menuTree.length > 0 ? getExpandedMenuIds(prev.menuTree) : [];

                const savedExpandedIds = loadExpandedMenuIds();
                const expandedIds = existingExpandedIds.length > 0 ? existingExpandedIds : savedExpandedIds;

                if (expandedIds.length > 0) {
                    tree = restoreMenuExpansion(tree, expandedIds);
                }

                const savedActiveMenuId = loadActiveMenuId();

                return {
                    ...prev,
                    menuTree: tree,
                    activeMenuId: savedActiveMenuId ?? prev.activeMenuId,
                    isLoading: false,
                    error: null
                };
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false
            }));
        }
    }, [menuData]);

    /* 메뉴 클릭 */
    const onMenuClick = useCallback((menuId: string) => {
        setState(prev => {
            saveActiveMenuId(menuId);
            saveExpandedMenuIds(getExpandedMenuIds(prev.menuTree));

            return {
                ...prev,
                activeMenuId: menuId
            };
        });
    }, []);

    /* 확장 / 축소 */
    const onToggleExpand = useCallback((menuId: string) => {
        setState(prev => {
            const tree = toggleMenuExpand(prev.menuTree, menuId);
            saveExpandedMenuIds(getExpandedMenuIds(tree));

            return {
                ...prev,
                menuTree: tree
            };
        });
    }, []);

    const onExpandAll = useCallback(() => {
        setState(prev => {
            const tree = expandAllMenus(prev.menuTree, true);
            saveExpandedMenuIds(getExpandedMenuIds(tree));

            return {
                ...prev,
                menuTree: tree
            };
        });
    }, []);

    const onCollapseAll = useCallback(() => {
        setState(prev => {
            const tree = expandAllMenus(prev.menuTree, false);
            saveExpandedMenuIds([]);

            return {
                ...prev,
                menuTree: tree
            };
        });
    }, []);

    return {
        ...state,
        handlers: {
            onMenuClick,
            onToggleExpand,
            onExpandAll,
            onCollapseAll
        }
    };
}

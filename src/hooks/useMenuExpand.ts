import { Dispatch, SetStateAction } from "react";
import { NavigationState } from "../types/menu.types";
import {
    toggleDepth0MenuExpand,
    toggleSameDepthMenuExpand,
    expandAllMenus,
    getExpandedMenuIds,
    saveExpandedMenuIds
} from "../components/utils/menuHelpers";

export function useMenuExpand(
    setState: Dispatch<SetStateAction<NavigationState>>,
    setIsAllExpanded: Dispatch<SetStateAction<boolean>>
) {
    const toggleExpand = (menuId: string) => {   
        setIsAllExpanded(false);    
        setState((prev: NavigationState) => {
            // Vertical layout에서 같은 depth의 메뉴를 닫기 위해 toggleSameDepthMenuExpand 사용
            const newTree = toggleSameDepthMenuExpand(prev.menuTree, menuId);
            const expandedIds = getExpandedMenuIds(newTree);
            saveExpandedMenuIds(expandedIds);

            return {
                ...prev,
                menuTree: newTree
            };
        });
    };

    const toggleExpandHorizontal = (menuId: string) => {
        setIsAllExpanded(false);
        setState((prev: NavigationState) => {
            const newTree = toggleDepth0MenuExpand(prev.menuTree, menuId);
            const expandedIds = getExpandedMenuIds(newTree);
            saveExpandedMenuIds(expandedIds);

            return {
                ...prev,
                menuTree: newTree
            };
        });
    };

    const expandAll = () => {
        setIsAllExpanded(true);
        setState((prev: NavigationState) => {
            const newTree = expandAllMenus(prev.menuTree, true);
            console.log("newTree", newTree)
            const expandedIds = getExpandedMenuIds(newTree);
            saveExpandedMenuIds(expandedIds);

            return {
                ...prev,
                menuTree: newTree
            };
        });
    };

    const collapseAll = () => {
        setIsAllExpanded(false);
        setState((prev: NavigationState) => {
            const newTree = expandAllMenus(prev.menuTree, false);
            return {
                ...prev,
                menuTree: newTree
            };
        });
    };

    return {
        toggleExpand,
        toggleExpandHorizontal,
        expandAll,
        collapseAll
    };
}

import { Dispatch, SetStateAction } from "react";
import { NavigationState } from "../types/menu.types";
import {
    toggleMenuExpand,
    toggleDepth0MenuExpand,
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
            const newTree = toggleMenuExpand(prev.menuTree, menuId);
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
            const newTree = expandAllMenus(prev.menuTree, false);
            console.log("newTree", newTree)
            saveExpandedMenuIds([]);

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

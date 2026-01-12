import { Dispatch, SetStateAction } from "react";
import { NavigationState } from "../types/menu.types";
import {
    toggleDepth0MenuExpand,
    toggleSameDepthMenuExpand,
    expandAllMenus,
    getExpandedMenuIds,
    saveExpandedMenuIds,
    findMenuNode
} from "../utils/menuHelpers";

export function useMenuExpand(
    setState: Dispatch<SetStateAction<NavigationState>>,
    setIsAllExpanded: Dispatch<SetStateAction<boolean>>
) {
    const toggleExpand = (menuId: string) => {   
        setIsAllExpanded(false);    
        setState((prev: NavigationState) => {
            // 클릭한 메뉴의 depth 확인
            const targetNode = findMenuNode(prev.menuTree, menuId);
            
            // depth-0 메뉴인지 확인 (최상위 레벨에서 직접 확인)
            // targetNode가 null이어도 최상위 레벨에서 menuId를 찾아서 depth-0인지 확인
            const isDepth0 = targetNode?.depth === 0 || 
                             prev.menuTree.some(item => String(item.menuId) === String(menuId));
            
            console.log('[useMenuExpand] toggleExpand called:', { 
                menuId, 
                targetNode: targetNode ? { menuId: targetNode.menuId, depth: targetNode.depth, isExpanded: targetNode.isExpanded } : null,
                isDepth0
            });
            
            const newTree = isDepth0
                ? toggleDepth0MenuExpand(prev.menuTree, menuId) // depth-0 메뉴: 다른 depth-0 메뉴 자동 닫기
                : toggleSameDepthMenuExpand(prev.menuTree, menuId); // depth 1 이상: 같은 depth의 메뉴만 닫기
            
           
            
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

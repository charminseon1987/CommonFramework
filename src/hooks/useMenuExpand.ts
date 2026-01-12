import { Dispatch, SetStateAction } from "react";
import { NavigationState } from "../types/menu.types";
import {
    toggleDepth0MenuExpand,
    toggleSameDepthMenuExpand,
    expandAllMenus,
    getExpandedMenuIds,
    saveExpandedMenuIds,
    findMenuNode,
    getAllDescendantMenuIds,
    loadExpandedMenuIds
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
            
            console.log('[useMenuExpand] newTree depth-0 expanded states:', 
                newTree.map(item => ({ menuId: item.menuId, depth: item.depth, isExpanded: item.isExpanded }))
            );
            
            // depth-0 메뉴 클릭 시: 다른 depth-0 메뉴와 그 하위 메뉴들의 ID를 localStorage에서 제거
            if (isDepth0) {
                // 현재 localStorage에 저장된 확장된 메뉴 ID 목록 가져오기
                const currentExpandedIds = new Set(loadExpandedMenuIds().map(id => String(id)));
                
                // 다른 depth-0 메뉴들의 ID와 그 하위 메뉴들의 ID를 추출하여 제거
                prev.menuTree.forEach(item => {
                    // 클릭한 메뉴가 아닌 다른 depth-0 메뉴들
                    if (String(item.menuId) !== String(menuId)) {
                        // 해당 메뉴의 ID 제거
                        currentExpandedIds.delete(String(item.menuId));
                        // 해당 메뉴의 모든 하위 메뉴 ID 제거
                        const descendantIds = getAllDescendantMenuIds(item);
                        descendantIds.forEach(descId => {
                            currentExpandedIds.delete(String(descId));
                        });
                    }
                });
                
                // 현재 확장된 메뉴 ID 목록과 병합 (클릭한 메뉴의 확장 상태 반영)
                const newExpandedIds = getExpandedMenuIds(newTree);
                const finalExpandedIds = Array.from(new Set([...Array.from(currentExpandedIds), ...newExpandedIds]));
                
                console.log('[useMenuExpand] Removed other depth-0 menu IDs from localStorage:', {
                    removedIds: prev.menuTree
                        .filter(item => String(item.menuId) !== String(menuId))
                        .map(item => ({
                            menuId: item.menuId,
                            descendantIds: getAllDescendantMenuIds(item)
                        })),
                    finalExpandedIds
                });
                
                saveExpandedMenuIds(finalExpandedIds);
            } else {
                // depth 1 이상 메뉴는 기존 로직 사용
                const expandedIds = getExpandedMenuIds(newTree);
                saveExpandedMenuIds(expandedIds);
            }

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

// src/utils/menuHelpers.ts

import { MenuItemData, MenuTreeNode } from "../types/menu.types";

/**
 * Flat 메뉴 리스트를 트리 구조로 변환
 */
export const buildMenuTree = (flatMenu: MenuItemData[]): MenuTreeNode[] => {
    if (!flatMenu || flatMenu.length === 0) {
        return [];
    }

    // 활성화되고 표시 가능한 메뉴만 필터링 (홈 메뉴 제외)
    const activeMenus = flatMenu.filter(
        item => item.enabledTF !== false && (!item.displayYn || item.displayYn === "Y") && item.menuName !== "홈" // 홈 메뉴 항목 제외
    );

    // SortNo로 정렬
    const sortedMenus = [...activeMenus].sort((a, b) => a.sortNo - b.sortNo);

    // Map으로 변환
    const menuMap = new Map<string, MenuTreeNode>();

    sortedMenus.forEach(item => {
        // 모든 메뉴는 기본적으로 접힌 상태로 설정
        const shouldExpand = false;
        menuMap.set(item.menuId, {
            ...item,
            children: [],
            isExpanded: shouldExpand,
            level: item.depth,
            hasChildren: false,
            isVisible: true
        });
    });

    // 트리 구조 생성
    const rootItems: MenuTreeNode[] = [];

    sortedMenus.forEach(item => {
        const node = menuMap.get(item.menuId);
        if (!node) return;

        if (item.depth === 0 || !item.parentMenuId) {
            // Root 노드
            rootItems.push(node);
        } else {
            // 자식 노드
            const parent = menuMap.get(item.parentMenuId);
            if (parent) {
                parent.children.push(node);
                parent.hasChildren = true;
            } else {
                // 부모를 찾지 못하면 루트에 추가
                console.warn(`Parent not found for menu: ${item.menuId}`);
                rootItems.push(node);
            }
        }
    });

    // 각 노드의 자식을 SortNo로 정렬
    const sortChildren = (nodes: MenuTreeNode[]): void => {
        nodes.forEach(node => {
            if (node.children.length > 0) {
                node.children.sort((a, b) => a.sortNo - b.sortNo);
                sortChildren(node.children);
            }
        });
    };

    sortChildren(rootItems);

    return rootItems;
};

/**
 * 특정 메뉴의 확장 상태 토글
 */
export const toggleMenuExpand = (tree: MenuTreeNode[], menuId: string): MenuTreeNode[] => {
    return tree.map(item => {
        if (item.menuId === menuId) {
            return { ...item, isExpanded: !item.isExpanded };
        }
        if (item.children.length > 0) {
            return {
                ...item,
                children: toggleMenuExpand(item.children, menuId)
            };
        }
        return item;
    });
};

/**
 * Depth 0 메뉴의 확장 상태 토글 (다른 depth 0 메뉴는 자동으로 닫기)
 * Horizontal 레이아웃에서 사용
 * 
 * 동작 방식:
 * - tree.map이 최상위 레벨(depth-0)의 모든 메뉴를 처리
 * - 클릭한 메뉴(menuId)는 토글 (isExpanded 반전)
 * - 클릭한 메뉴를 제외한 모든 depth-0 메뉴는 isExpanded = false로 설정
 * - 하위 메뉴도 모두 닫기 (expandAllMenus로 재귀적으로 처리)
 */
export const toggleDepth0MenuExpand = (tree: MenuTreeNode[], menuId: string): MenuTreeNode[] => {
    return tree.map(item => {
        // menuId를 문자열로 변환하여 비교 (타입 불일치 방지)
        if (String(item.menuId) === String(menuId)) {
            // 클릭한 메뉴는 토글
            return { ...item, isExpanded: !item.isExpanded };
        } else {
            // 다른 depth 0 메뉴는 닫기
            // isExpanded를 false로 설정하고, 하위 메뉴도 모두 닫기
            return {
                ...item,
                isExpanded: false,
                children:
                    item.children.length > 0
                        ? expandAllMenus(item.children, false) // 하위 메뉴도 모두 닫기
                        : []
            };
        }
    });
};

/**
 * 같은 depth의 메뉴만 닫기 (depth 1 이상에서 사용)
 * 
 * 동작 방식:
 * - 클릭한 메뉴의 depth를 찾아서 같은 depth의 메뉴만 처리
 * - 클릭한 메뉴는 토글 (isExpanded 반전)
 * - 같은 depth의 다른 메뉴는 isExpanded = false로 설정
 * - 하위 메뉴도 모두 닫기
 */
export const toggleSameDepthMenuExpand = (tree: MenuTreeNode[], menuId: string): MenuTreeNode[] => {
    // 먼저 클릭한 메뉴의 depth 찾기
    const targetNode = findMenuNode(tree, menuId);
    if (!targetNode) {
        // 메뉴를 찾지 못한 경우 원본 반환
        return tree;
    }
    
    const targetDepth = targetNode.depth;
    
    // 같은 depth의 메뉴를 닫는 헬퍼 함수
    const closeSameDepthMenus = (nodes: MenuTreeNode[], currentDepth: number): MenuTreeNode[] => {
        return nodes.map(node => {
            if (currentDepth === targetDepth) {
                // 같은 depth 레벨
                // menuId를 문자열로 변환하여 비교 (타입 불일치 방지)
                if (String(node.menuId) === String(menuId)) {
                    // 클릭한 메뉴는 토글
                    return { ...node, isExpanded: !node.isExpanded };
                } else {
                    // 같은 depth의 다른 메뉴는 닫기
                    return {
                        ...node,
                        isExpanded: false,
                        children: node.children.length > 0 ? expandAllMenus(node.children, false) : []
                    };
                }
            }
            // 다른 depth 레벨은 재귀적으로 처리
            if (node.children.length > 0) {
                return {
                    ...node,
                    children: closeSameDepthMenus(node.children, currentDepth + 1)
                };
            }
            return node;
        });
    };
    
    return closeSameDepthMenus(tree, 0);
};

/**
 * 모든 메뉴 확장/축소
 */
export const expandAllMenus = (tree: MenuTreeNode[], expand: boolean): MenuTreeNode[] => {
    return tree.map(item => ({
        ...item,
        isExpanded: expand,
        children: item.children.length > 0 ? expandAllMenus(item.children, expand) : []
    }));
};

/**
 * 특정 메뉴까지의 경로 찾기
 */
export const findMenuPath = (tree: MenuTreeNode[], menuId: string, path: string[] = []): string[] | null => {
    for (const item of tree) {
        const currentPath = [...path, item.menuId];

        // menuId를 문자열로 변환하여 비교 (타입 불일치 방지)
        if (String(item.menuId) === String(menuId)) {
            return currentPath;
        }

        if (item.children.length > 0) {
            const result = findMenuPath(item.children, menuId, currentPath);
            if (result) return result;
        }
    }
    return null;
};

/**
 * 경로상의 메뉴 모두 확장
 */
export const expandMenuPath = (tree: MenuTreeNode[], path: string[]): MenuTreeNode[] => {
    return tree.map(item => {
        const shouldExpand = path.includes(item.menuId);
        return {
            ...item,
            isExpanded: shouldExpand || item.isExpanded,
            children: item.children.length > 0 ? expandMenuPath(item.children, path) : []
        };
    });
};

/**
 * 메뉴 ID로 노드 찾기
 */
export const findMenuNode = (tree: MenuTreeNode[], menuId: string): MenuTreeNode | null => {
    for (const item of tree) {
        // menuId를 문자열로 변환하여 비교 (타입 불일치 방지)
        if (String(item.menuId) === String(menuId)) {
            return item;
        }
        if (item.children.length > 0) {
            const found = findMenuNode(item.children, menuId);
            if (found) return found;
        }
    }
    return null;
};

/**
 * 메뉴 트리를 Flat 리스트로 변환
 */
export const flattenMenuTree = (tree: MenuTreeNode[]): MenuTreeNode[] => {
    const result: MenuTreeNode[] = [];

    const flatten = (nodes: MenuTreeNode[]): void => {
        nodes.forEach(node => {
            result.push(node);
            if (node.children.length > 0) {
                flatten(node.children);
            }
        });
    };

    flatten(tree);
    return result;
};

/**
 * 특정 메뉴의 모든 하위 메뉴 ID를 재귀적으로 추출
 */
export const getAllDescendantMenuIds = (node: MenuTreeNode): string[] => {
    const ids: string[] = [];
    
    const collectIds = (nodes: MenuTreeNode[]): void => {
        nodes.forEach(child => {
            ids.push(child.menuId);
            if (child.children.length > 0) {
                collectIds(child.children);
            }
        });
    };
    
    if (node.children.length > 0) {
        collectIds(node.children);
    }
    
    return ids;
};

/**
 * 확장된 메뉴 ID 목록 추출
 */
export const getExpandedMenuIds = (tree: MenuTreeNode[]): string[] => {
    const expandedIds: string[] = [];

    const collectExpanded = (nodes: MenuTreeNode[]): void => {
        nodes.forEach(node => {
            if (node.isExpanded) {
                expandedIds.push(node.menuId);
            }
            if (node.children.length > 0) {
                collectExpanded(node.children);
            }
        });
    };

    collectExpanded(tree);
    return expandedIds;
};

/**
 * 저장된 확장 상태를 메뉴 트리에 적용
 */
export const restoreMenuExpansion = (tree: MenuTreeNode[], expandedMenuIds: Set<string> | string[]): MenuTreeNode[] => {
    // Set에 저장할 때 문자열로 변환하여 일관성 유지
    const expandedSet = expandedMenuIds instanceof Set 
        ? new Set(Array.from(expandedMenuIds).map(id => String(id)))
        : new Set(expandedMenuIds.map(id => String(id)));

    return tree.map(item => {
        // 저장된 확장 상태만 적용 (depth와 무관하게 저장된 상태 사용)
        // menuId를 문자열로 변환하여 비교 (타입 불일치 방지)
        const shouldExpand = expandedSet.has(String(item.menuId));
        return {
            ...item,
            isExpanded: shouldExpand,
            children: item.children.length > 0 ? restoreMenuExpansion(item.children, expandedSet) : []
        };
    });
};

/**
 * Depth-0 메뉴 중 children이 있는 메뉴를 자동으로 펼치기
 * Vertical layout 전용으로 사용
 */
export const expandDepth0MenusWithChildren = (tree: MenuTreeNode[]): MenuTreeNode[] => {
    return tree.map(item => {
        // depth-0이고 children이 있으면 자동으로 펼치기
        if (item.depth === 0 && item.children.length > 0) {
            return {
                ...item,
                isExpanded: true,
                children: item.children // 하위 메뉴는 재귀적으로 처리하지 않음 (사용자가 직접 펼쳐야 함)
            };
        }
        return item;
    });
};

/**
 * localStorage에 확장된 메뉴 ID 목록 저장
 */
const STORAGE_KEY = "bangarlab-nav-expanded-menu-ids";

export const saveExpandedMenuIds = (expandedIds: string[]): void => {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedIds));
        }
    } catch (error) {
        console.warn("[MenuHelpers] Failed to save expanded menu IDs to localStorage:", error);
    }
};

/**
 * localStorage에서 확장된 메뉴 ID 목록 로드
 */
export const loadExpandedMenuIds = (): string[] => {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as string[];
            }
        }
    } catch (error) {
        console.warn("[MenuHelpers] Failed to load expanded menu IDs from localStorage:", error);
    }
    return [];
};

/**
 * localStorage에서 확장된 메뉴 ID 목록 삭제
 */
export const clearExpandedMenuIds = (): void => {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch (error) {
        console.warn("[MenuHelpers] Failed to clear expanded menu IDs from localStorage:", error);
    }
};

/**
 * localStorage에 활성 메뉴 ID 저장
 */
const ACTIVE_MENU_STORAGE_KEY = "bangarlab-nav-active-menu-id";

export const saveActiveMenuId = (menuId: string | null): void => {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            if (menuId) {
                localStorage.setItem(ACTIVE_MENU_STORAGE_KEY, menuId);
            } else {
                localStorage.removeItem(ACTIVE_MENU_STORAGE_KEY);
            }
        }
    } catch (error) {
        console.warn("[MenuHelpers] Failed to save active menu ID to localStorage:", error);
    }
};

/**
 * localStorage에서 활성 메뉴 ID 로드
 */
export const loadActiveMenuId = (): string | null => {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            const stored = localStorage.getItem(ACTIVE_MENU_STORAGE_KEY);
            if (stored) {
                return stored;
            }
        }
    } catch (error) {
        console.warn("[MenuHelpers] Failed to load active menu ID from localStorage:", error);
    }
    return null;
};

/**
 * localStorage에서 활성 메뉴 ID 삭제
 */
export const clearActiveMenuId = (): void => {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            localStorage.removeItem(ACTIVE_MENU_STORAGE_KEY);
        }
    } catch (error) {
        console.warn("[MenuHelpers] Failed to clear active menu ID from localStorage:", error);
    }
};
export function buildDepthMap(nodes: MenuTreeNode[], map: Record<number, MenuTreeNode[]> = {}) {
    nodes.forEach(node => {
        if (!map[node.depth]) {
            map[node.depth] = [];
        }

        map[node.depth].push(node);

        if (node.children && node.children.length > 0) {
            buildDepthMap(node.children, map);
        }
    });

    return map;
}

/**
 * localStorage에 collapsed 상태 저장
 */
const COLLAPSED_STORAGE_KEY = "bangarlab-nav-collapsed-state";

export const saveCollapsedState = (isCollapsed: boolean): void => {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(isCollapsed));
        }
    } catch (error) {
        console.warn("[MenuHelpers] Failed to save collapsed state to localStorage:", error);
    }
};

/**
 * localStorage에서 collapsed 상태 로드
 */
export const loadCollapsedState = (): boolean => {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY);
            if (stored !== null) {
                return JSON.parse(stored) as boolean;
            }
        }
    } catch (error) {
        console.warn("[MenuHelpers] Failed to load collapsed state from localStorage:", error);
    }
    return false;
};

/**
 * 호버 시 메뉴 확장 (localStorage의 확장 상태 참조하여 하위 메뉴도 확장)
 */
export const expandMenuOnHover = (tree: MenuTreeNode[], menuId: string): MenuTreeNode[] => {
    const savedExpandedIds = loadExpandedMenuIds();
    // Set에 저장할 때 문자열로 변환하여 일관성 유지
    const expandedSet = new Set(savedExpandedIds.map(id => String(id)));

    // 하위 메뉴들을 localStorage 상태에 따라 확장하는 헬퍼 함수
    const restoreChildrenExpansion = (children: MenuTreeNode[]): MenuTreeNode[] => {
        return children.map(child => ({
            ...child,
            isExpanded: expandedSet.has(String(child.menuId)),
            children: child.children.length > 0 ? restoreChildrenExpansion(child.children) : []
        }));
    };

    const expandMenuAndChildren = (nodes: MenuTreeNode[], targetId: string): MenuTreeNode[] => {
        return nodes.map(node => {
            // menuId를 문자열로 변환하여 비교 (타입 불일치 방지)
            if (String(node.menuId) === String(targetId)) {
                // 호버한 메뉴는 확장
                return {
                    ...node,
                    isExpanded: true,
                    // 하위 메뉴들도 localStorage에 저장된 확장 상태에 따라 확장
                    children: node.children.length > 0 ? restoreChildrenExpansion(node.children) : []
                };
            }
            // 하위 메뉴를 재귀적으로 처리
            if (node.children.length > 0) {
                return {
                    ...node,
                    children: expandMenuAndChildren(node.children, targetId),
                    // 현재 노드의 확장 상태는 localStorage 상태에 따라 유지
                    isExpanded: expandedSet.has(String(node.menuId)) || node.isExpanded
                };
            }
            return node;
        });
    };

    return expandMenuAndChildren(tree, menuId);
};

/**
 * 호버 해제 시 메뉴 축소 (localStorage 상태는 유지)
 */
export const collapseMenuOnHoverLeave = (tree: MenuTreeNode[], menuId: string): MenuTreeNode[] => {
    const savedExpandedIds = loadExpandedMenuIds();
    // Set에 저장할 때 문자열로 변환하여 일관성 유지
    const expandedSet = new Set(savedExpandedIds.map(id => String(id)));

    // 하위 메뉴들을 localStorage 상태에 따라 복원하는 헬퍼 함수
    const restoreChildrenExpansion = (children: MenuTreeNode[]): MenuTreeNode[] => {
        return children.map(child => ({
            ...child,
            isExpanded: expandedSet.has(String(child.menuId)),
            children: child.children.length > 0 ? restoreChildrenExpansion(child.children) : []
        }));
    };

    const collapseMenu = (nodes: MenuTreeNode[], targetId: string): MenuTreeNode[] => {
        return nodes.map(node => {
            // menuId를 문자열로 변환하여 비교 (타입 불일치 방지)
            if (String(node.menuId) === String(targetId)) {
                // 호버 해제한 메뉴만 축소 (localStorage 상태는 유지)
                return {
                    ...node,
                    isExpanded: false,
                    // 하위 메뉴는 localStorage 상태에 따라 유지
                    children: node.children.length > 0 ? restoreChildrenExpansion(node.children) : []
                };
            }
            // 하위 메뉴를 재귀적으로 처리
            if (node.children.length > 0) {
                return {
                    ...node,
                    children: collapseMenu(node.children, targetId),
                    // 현재 노드의 확장 상태는 localStorage 상태에 따라 유지
                    isExpanded: expandedSet.has(String(node.menuId)) || node.isExpanded
                };
            }
            return node;
        });
    };

    return collapseMenu(tree, menuId);
};

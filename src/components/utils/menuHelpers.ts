// src/utils/menuHelpers.ts

import { MenuItemData, MenuTreeNode } from '../types/menu.types';

/**
 * Flat 메뉴 리스트를 트리 구조로 변환
 */
export const buildMenuTree = (
  flatMenu: MenuItemData[]
): MenuTreeNode[] => {
  if (!flatMenu || flatMenu.length === 0) {
    return [];
  }

  // 활성화되고 표시 가능한 메뉴만 필터링 (홈 메뉴 제외)
  const activeMenus = flatMenu.filter(item => 
    item.enabledTF !== false && 
    (!item.displayYn || item.displayYn === 'Y') &&
    item.menuName !== '홈' // 홈 메뉴 항목 제외
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
export const toggleMenuExpand = (
  tree: MenuTreeNode[],
  menuId: string
): MenuTreeNode[] => {
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
 * 모든 메뉴 확장/축소
 */
export const expandAllMenus = (
  tree: MenuTreeNode[],
  expand: boolean
): MenuTreeNode[] => {
  return tree.map(item => ({
    ...item,
    isExpanded: expand,
    children: item.children.length > 0 
      ? expandAllMenus(item.children, expand) 
      : []
  }));
};

/**
 * 특정 메뉴까지의 경로 찾기
 */
export const findMenuPath = (
  tree: MenuTreeNode[],
  menuId: string,
  path: string[] = []
): string[] | null => {
  for (const item of tree) {
    const currentPath = [...path, item.menuId];
    
    if (item.menuId === menuId) {
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
export const expandMenuPath = (
  tree: MenuTreeNode[],
  path: string[]
): MenuTreeNode[] => {
  return tree.map(item => {
    const shouldExpand = path.includes(item.menuId);
    return {
      ...item,
      isExpanded: shouldExpand || item.isExpanded,
      children: item.children.length > 0 
        ? expandMenuPath(item.children, path) 
        : []
    };
  });
};

/**
 * 메뉴 ID로 노드 찾기
 */
export const findMenuNode = (
  tree: MenuTreeNode[],
  menuId: string
): MenuTreeNode | null => {
  for (const item of tree) {
    if (item.menuId === menuId) {
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
export const restoreMenuExpansion = (
  tree: MenuTreeNode[],
  expandedMenuIds: Set<string> | string[]
): MenuTreeNode[] => {
  const expandedSet = expandedMenuIds instanceof Set 
    ? expandedMenuIds 
    : new Set(expandedMenuIds);
  
  return tree.map(item => {
    // 저장된 확장 상태만 적용 (depth와 무관하게 저장된 상태 사용)
    const shouldExpand = expandedSet.has(item.menuId);
    return {
      ...item,
      isExpanded: shouldExpand,
      children: item.children.length > 0 
        ? restoreMenuExpansion(item.children, expandedSet) 
        : []
    };
  });
};

/**
 * localStorage에 확장된 메뉴 ID 목록 저장
 */
const STORAGE_KEY = 'bangarlab-nav-expanded-menu-ids';

export const saveExpandedMenuIds = (expandedIds: string[]): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedIds));
    }
  } catch (error) {
    console.warn('[MenuHelpers] Failed to save expanded menu IDs to localStorage:', error);
  }
};

/**
 * localStorage에서 확장된 메뉴 ID 목록 로드
 */
export const loadExpandedMenuIds = (): string[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as string[];
      }
    }
  } catch (error) {
    console.warn('[MenuHelpers] Failed to load expanded menu IDs from localStorage:', error);
  }
  return [];
};

/**
 * localStorage에서 확장된 메뉴 ID 목록 삭제
 */
export const clearExpandedMenuIds = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[MenuHelpers] Failed to clear expanded menu IDs from localStorage:', error);
  }
};

/**
 * localStorage에 활성 메뉴 ID 저장
 */
const ACTIVE_MENU_STORAGE_KEY = 'bangarlab-nav-active-menu-id';

export const saveActiveMenuId = (menuId: string | null): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (menuId) {
        localStorage.setItem(ACTIVE_MENU_STORAGE_KEY, menuId);
      } else {
        localStorage.removeItem(ACTIVE_MENU_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.warn('[MenuHelpers] Failed to save active menu ID to localStorage:', error);
  }
};

/**
 * localStorage에서 활성 메뉴 ID 로드
 */
export const loadActiveMenuId = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(ACTIVE_MENU_STORAGE_KEY);
      if (stored) {
        return stored;
      }
    }
  } catch (error) {
    console.warn('[MenuHelpers] Failed to load active menu ID from localStorage:', error);
  }
  return null;
};

/**
 * localStorage에서 활성 메뉴 ID 삭제
 */
export const clearActiveMenuId = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(ACTIVE_MENU_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[MenuHelpers] Failed to clear active menu ID from localStorage:', error);
  }
};
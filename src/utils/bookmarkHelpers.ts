// src/utils/bookmarkHelpers.ts

import { MenuTreeNode, BookmarkStructure, BookmarkStructureItem } from "../types/menu.types";

/**
 * 트리 구조를 평면 리스트로 변환 (depth 우선 순회)
 */
export function flattenBookmarkTree(tree: MenuTreeNode[]): MenuTreeNode[] {
    const result: MenuTreeNode[] = [];

    const traverse = (nodes: MenuTreeNode[]): void => {
        nodes.forEach(node => {
            result.push(node);
            if (node.children && node.children.length > 0) {
                traverse(node.children);
            }
        });
    };

    traverse(tree);
    return result;
}

/**
 * 트리 구조에서 depth 재계산
 */
export function recalculateDepth(
    tree: MenuTreeNode[],
    parentId: string | null = null,
    depth: number = 0
): MenuTreeNode[] {
    return tree.map((node, index) => {
        const newNode: MenuTreeNode = {
            ...node,
            depth,
            parentMenuId: parentId,
            sortNo: index,
            level: depth,
            children: node.children && node.children.length > 0
                ? recalculateDepth(node.children, node.menuId, depth + 1)
                : []
        };
        return newNode;
    });
}

/**
 * 트리 구조를 JSON 저장용 구조로 변환 (LeftNo, RightNo 포함)
 */
export function buildBookmarkStructure(tree: MenuTreeNode[]): BookmarkStructure {
    const items: BookmarkStructureItem[] = [];
    let counter = 1; // Nested Set Model 카운터

    /**
     * 재귀적으로 트리를 순회하며 LeftNo, RightNo 계산
     */
    const traverse = (
        nodes: MenuTreeNode[],
        parentId: string | null = null,
        sortOffset: number = 0
    ): void => {
        // SortNo로 정렬
        const sortedNodes = [...nodes].sort((a, b) => a.sortNo - b.sortNo);

        sortedNodes.forEach((node, index) => {
            const leftNo = counter++;
            const currentItemId = node.menuId;

            // pageURL이 있으면 children을 처리하지 않음 (일반 메뉴)
            // pageURL이 없고 children이 있으면 폴더로 처리
            const hasPageURL = !!node.pageURL;
            const hasChildren = !hasPageURL && node.children && node.children.length > 0;

            // 자식 노드 처리 (pageURL이 없는 경우에만)
            if (hasChildren) {
                traverse(node.children, currentItemId, 0);
            }

            const rightNo = counter++;

            const item: BookmarkStructureItem = {
                menuId: node.menuId,
                menuName: node.menuName,
                parentId: parentId,
                depth: node.depth,
                sortNo: sortOffset + index,
                leftNo: leftNo,
                rightNo: rightNo,
                isFolder: hasChildren, // pageURL이 없고 children이 있을 때만 true
                originalMenuId: hasPageURL ? node.menuId : undefined // 페이지가 있는 경우 원본 메뉴 ID
            };

            items.push(item);
        });
    };

    traverse(tree);
    return { items };
}

/**
 * 북마크 구조 유효성 검사
 */
export function validateBookmarkStructure(structure: BookmarkStructure): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!structure.items || structure.items.length === 0) {
        errors.push("북마크 항목이 없습니다.");
        return { valid: false, errors };
    }

    // 모든 항목이 고유한 menuId를 가져야 함
    const menuIds = new Set<string>();
    structure.items.forEach(item => {
        if (menuIds.has(item.menuId)) {
            errors.push(`중복된 메뉴 ID: ${item.menuId}`);
        }
        menuIds.add(item.menuId);
    });

    // parentId가 유효한지 확인 (null이거나 존재하는 menuId여야 함)
    const validMenuIds = new Set(structure.items.map(item => item.menuId));
    structure.items.forEach(item => {
        if (item.parentId !== null && !validMenuIds.has(item.parentId)) {
            errors.push(`유효하지 않은 parentId: ${item.parentId} (메뉴 ID: ${item.menuId})`);
        }
    });

    // 순환 참조 확인
    const visited = new Set<string>();
    const checkCycle = (menuId: string, path: Set<string>): boolean => {
        if (path.has(menuId)) {
            return true; // 순환 발견
        }
        if (visited.has(menuId)) {
            return false; // 이미 확인한 노드
        }

        visited.add(menuId);
        path.add(menuId);

        const item = structure.items.find(i => i.menuId === menuId);
        if (item && item.parentId) {
            return checkCycle(item.parentId, path);
        }

        path.delete(menuId);
        return false;
    };

    structure.items.forEach(item => {
        if (checkCycle(item.menuId, new Set())) {
            errors.push(`순환 참조 발견: ${item.menuId}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * 새 폴더 생성
 */
export function createFolder(
    folderName: string,
    parentId: string | null = null,
    depth: number = 0,
    sortNo: number = 0
): MenuTreeNode {
    const folderId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
        menuId: folderId,
        menuName: folderName,
        parentMenuId: parentId,
        depth,
        sortNo,
        enabledTF: true,
        displayYn: "Y",
        children: [],
        isExpanded: false,
        level: depth,
        hasChildren: false,
        isVisible: true
    };
}

/**
 * 메뉴 노드를 특정 부모 아래로 이동
 */
export function moveMenuItem(
    tree: MenuTreeNode[],
    menuId: string,
    newParentId: string | null,
    newIndex: number = 0
): MenuTreeNode[] {
    // 노드 찾기 및 제거
    let nodeToMove: MenuTreeNode | null = null;

    const removeNode = (nodes: MenuTreeNode[]): MenuTreeNode[] => {
        return nodes.filter(node => {
            if (node.menuId === menuId) {
                nodeToMove = { ...node };
                return false;
            }
            return true;
        }).map(node => ({
            ...node,
            children: removeNode(node.children)
        }));
    };

    const newTree = removeNode(tree);

    if (!nodeToMove) {
        return tree; // 노드를 찾지 못함
    }

    // TypeScript 타입 가드: nodeToMove가 null이 아님을 확인하고 타입 명시
    const nodeToMoveValue: MenuTreeNode = nodeToMove;

    // 부모 노드가 pageURL을 가지고 있으면 폴더가 아님 (이동 불가)
    if (newParentId !== null) {
        // 부모 노드 찾기
        const findParent = (nodes: MenuTreeNode[]): MenuTreeNode | null => {
            for (const nodeItem of nodes) {
                if (nodeItem.menuId === newParentId) {
                    return nodeItem;
                }
                if (nodeItem.children && nodeItem.children.length > 0) {
                    const found = findParent(nodeItem.children);
                    if (found) return found;
                }
            }
            return null;
        };

        const parentNode = findParent(newTree);
        if (parentNode && parentNode.pageURL) {
            // 부모가 pageURL을 가지고 있으면 폴더가 아님 (이동 불가)
            console.warn("페이지 URL이 있는 메뉴는 폴더가 될 수 없습니다.");
            return tree; // 변경하지 않고 원본 반환
        }
    }

    // 새 위치에 추가
    const addNode = (nodes: MenuTreeNode[], parentId: string | null, depth: number): MenuTreeNode[] => {
        if (parentId === null) {
            // 루트 레벨에 추가
            const result = [...nodes];
            const newNode: MenuTreeNode = {
                ...nodeToMoveValue,
                parentMenuId: null,
                depth: 0,
                sortNo: newIndex,
                level: 0
            };
            result.splice(newIndex, 0, newNode);
            return result.map((nodeItem, index) => ({
                ...nodeItem,
                sortNo: index,
                children: nodeItem.children.map((child, childIndex) => ({
                    ...child,
                    sortNo: childIndex,
                    depth: nodeItem.depth + 1,
                    level: nodeItem.depth + 1
                }))
            }));
        }

        return nodes.map(nodeItem => {
            if (nodeItem.menuId === parentId) {
                const children = [...nodeItem.children];
                const newNode: MenuTreeNode = {
                    ...nodeToMoveValue,
                    parentMenuId: parentId,
                    depth: depth + 1,
                    sortNo: newIndex,
                    level: depth + 1
                };
                children.splice(newIndex, 0, newNode);
                return {
                    ...nodeItem,
                    hasChildren: children.length > 0,
                    children: children.map((child, index) => ({
                        ...child,
                        sortNo: index,
                        depth: depth + 1,
                        level: depth + 1,
                        children: child.children.map((grandchild, grandIndex) => ({
                            ...grandchild,
                            sortNo: grandIndex,
                            depth: depth + 2,
                            level: depth + 2
                        }))
                    }))
                };
            }
            return {
                ...nodeItem,
                children: addNode(nodeItem.children, parentId, depth + 1)
            };
        });
    };

    return recalculateDepth(addNode(newTree, newParentId, 0));
}

/**
 * 메뉴 노드 삭제
 */
export function removeMenuItem(tree: MenuTreeNode[], menuId: string): MenuTreeNode[] {
    return tree
        .filter(node => node.menuId !== menuId)
        .map(node => ({
            ...node,
            children: removeMenuItem(node.children, menuId)
        }));
}

/**
 * 북마크 구조를 JSON 문자열로 변환
 */
export function bookmarkStructureToJson(structure: BookmarkStructure): string {
    return JSON.stringify(structure, null, 2);
}

/**
 * 메뉴들을 북마크 트리에 추가
 */
export function addMenusToTree(
    tree: MenuTreeNode[],
    menus: MenuTreeNode[],
    targetFolderId: string | null = null
): MenuTreeNode[] {
    console.log("[addMenusToTree] 받은 메뉴 개수:", menus.length);
    console.log("[addMenusToTree] 받은 메뉴 IDs:", menus.map(m => m.menuId));
    
    // 이미 북마크에 있는 메뉴 ID 수집 (폴더 포함, 문자열로 정규화)
    const existingMenuIds = new Set<string>();
    const collectMenuIds = (nodes: MenuTreeNode[]): void => {
        nodes.forEach(node => {
            // 폴더와 파일 모두 ID 수집
            existingMenuIds.add(String(node.menuId));
            if (node.children && node.children.length > 0) {
                collectMenuIds(node.children);
            }
        });
    };
    collectMenuIds(tree);

    console.log("[addMenusToTree] 기존 북마크 메뉴 IDs:", Array.from(existingMenuIds));

    // 중복되지 않은 메뉴만 필터링 (폴더도 포함)
    const menusToAdd = menus.filter(menu => {
        const menuIdStr = String(menu.menuId);
        if (existingMenuIds.has(menuIdStr)) {
            console.log(`[addMenusToTree] 필터링됨 (중복): ${menu.menuName} (${menuIdStr})`);
            return false;
        }
        return true;
    });

    console.log("[addMenusToTree] 추가할 메뉴 개수:", menusToAdd.length);
    console.log("[addMenusToTree] 추가할 메뉴 IDs:", menusToAdd.map(m => m.menuId));

    if (menusToAdd.length === 0) {
        return tree;
    }

    // 타겟 폴더 찾기
    const findNodeById = (nodes: MenuTreeNode[], id: string): MenuTreeNode | null => {
        for (const node of nodes) {
            if (node.menuId === id) {
                return node;
            }
            if (node.children && node.children.length > 0) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const targetNode = targetFolderId ? findNodeById(tree, targetFolderId) : null;

    // 타겟 노드가 실제로 폴더인지 확인 (pageURL이 없어야 함)
    const isTargetFolder = targetNode && !targetNode.pageURL && (targetNode.children || targetNode.hasChildren);

    // 타겟 폴더가 없거나 타겟이 파일이면 루트에 추가
    if (!targetFolderId || !targetNode || !isTargetFolder) {
        const newMenus = menusToAdd.map((menu, index) => {
            const isFolder = !menu.pageURL;
            return {
                ...menu,
                // 폴더인 경우 pageURL을 명시적으로 undefined로 설정
                pageURL: isFolder ? undefined : menu.pageURL,
                iconClass: menu.iconClass,
                menuName: menu.menuName,
                menuId: menu.menuId,
                parentMenuId: null,
                depth: 0,
                sortNo: tree.length + index,
                // children은 포함하지 않고 빈 폴더/파일로 추가
                children: [],
                // 폴더인 경우 hasChildren을 원본 값으로 유지
                hasChildren: isFolder ? (menu.hasChildren || false) : false,
                isExpanded: false,
                level: 0,
                isVisible: true,
                enabledTF: menu.enabledTF ?? true,
                displayYn: menu.displayYn ?? "Y"
            };
        });
        return [...tree, ...newMenus];
    }

    // 타겟 폴더에 추가
    const addToNode = (nodes: MenuTreeNode[]): MenuTreeNode[] => {
        return nodes.map(node => {
            if (node.menuId === targetFolderId) {
                const newMenus = menusToAdd.map((menu, index) => {
                    const isFolder = !menu.pageURL;
                    return {
                        ...menu,
                        // 폴더인 경우 pageURL을 명시적으로 undefined로 설정
                        pageURL: isFolder ? undefined : menu.pageURL,
                        iconClass: menu.iconClass,
                        menuName: menu.menuName,
                        menuId: menu.menuId,
                        parentMenuId: targetFolderId,
                        depth: node.depth + 1,
                        sortNo: node.children.length + index,
                        // children은 포함하지 않고 빈 폴더/파일로 추가
                        children: [],
                        // 폴더인 경우 hasChildren을 원본 값으로 유지
                        hasChildren: isFolder ? (menu.hasChildren || false) : false,
                        isExpanded: false,
                        level: node.depth + 1,
                        isVisible: true,
                        enabledTF: menu.enabledTF ?? true,
                        displayYn: menu.displayYn ?? "Y"
                    };
                });
                return {
                    ...node,
                    // 폴더 속성 보존: pageURL이 없어야 함
                    pageURL: undefined,
                    children: [...node.children, ...newMenus],
                    hasChildren: true
                };
            }
            return {
                ...node,
                children: addToNode(node.children)
            };
        });
    };

    return addToNode(tree);
}

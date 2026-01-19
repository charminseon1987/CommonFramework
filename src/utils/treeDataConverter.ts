// src/utils/treeDataConverter.ts

import { TreeItemIndex } from "react-complex-tree";
import { MenuTreeNode } from "../types/menu.types";
import {
    BookmarkTreeItem,
    BookmarkTreeItemMap,
    BOOKMARK_ROOT_ID
} from "../types/bookmarkTree.types";

/**
 * MenuTreeNode 배열을 react-complex-tree의 TreeItemMap으로 변환
 */
export function menuTreeToTreeItems(menuTree: MenuTreeNode[]): BookmarkTreeItemMap {
    const items: BookmarkTreeItemMap = {};

    // 루트 아이템 생성
    const rootChildrenIds: TreeItemIndex[] = [];

    // 재귀적으로 노드를 변환
    const convertNode = (node: MenuTreeNode, parentId: string | null): void => {
        const isFolder = !node.pageURL;
        const childrenIds: TreeItemIndex[] = [];

        // 자식 노드 먼저 처리
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                childrenIds.push(child.menuId);
                convertNode(child, node.menuId);
            });
        }

        const treeItem: BookmarkTreeItem = {
            index: node.menuId,
            isFolder,
            canMove: true,
            canRename: isFolder, // 폴더만 이름 변경 가능
            data: {
                name: node.menuName,
                parentId,
                pageURL: node.pageURL,
                iconClass: node.iconClass,
                sortNo: node.sortNo
            },
            children: isFolder ? childrenIds : undefined
        };

        items[node.menuId] = treeItem;

        // 루트 레벨 노드의 경우 루트의 children에 추가
        if (parentId === null) {
            rootChildrenIds.push(node.menuId);
        }
    };

    // 모든 루트 노드 변환
    menuTree.forEach(node => {
        convertNode(node, null);
    });

    // 루트 아이템 추가
    items[BOOKMARK_ROOT_ID] = {
        index: BOOKMARK_ROOT_ID,
        isFolder: true,
        canMove: false,
        canRename: false,
        data: {
            name: "Root",
            parentId: null,
            sortNo: 0
        },
        children: rootChildrenIds
    };

    return items;
}

/**
 * react-complex-tree의 TreeItemMap을 MenuTreeNode 배열로 변환
 */
export function treeItemsToMenuTree(
    items: BookmarkTreeItemMap,
    rootId: TreeItemIndex = BOOKMARK_ROOT_ID
): MenuTreeNode[] {
    const rootItem = items[rootId];
    if (!rootItem || !rootItem.children) {
        return [];
    }

    // 재귀적으로 MenuTreeNode로 변환
    const convertToMenuTree = (
        itemId: TreeItemIndex,
        depth: number,
        sortNo: number
    ): MenuTreeNode => {
        const item = items[itemId];
        if (!item) {
            throw new Error(`Item not found: ${itemId}`);
        }

        const children: MenuTreeNode[] = [];
        if (item.children && item.children.length > 0) {
            item.children.forEach((childId, index) => {
                children.push(convertToMenuTree(childId, depth + 1, index));
            });
        }

        return {
            menuId: String(item.index),
            menuName: item.data.name,
            parentMenuId: item.data.parentId,
            pageURL: item.data.pageURL,
            iconClass: item.data.iconClass,
            depth,
            sortNo,
            enabledTF: true,
            displayYn: "Y",
            children,
            isExpanded: false,
            level: depth,
            hasChildren: children.length > 0,
            isVisible: true
        };
    };

    return rootItem.children.map((childId, index) =>
        convertToMenuTree(childId, 0, index)
    );
}

/**
 * TreeItemMap에서 특정 아이템 삭제
 */
export function removeTreeItem(
    items: BookmarkTreeItemMap,
    itemId: TreeItemIndex
): BookmarkTreeItemMap {
    const newItems = { ...items };
    const item = newItems[itemId];

    if (!item) {
        return newItems;
    }

    // 재귀적으로 모든 자식 삭제
    const removeRecursive = (id: TreeItemIndex): void => {
        const node = newItems[id];
        if (node && node.children) {
            node.children.forEach(childId => removeRecursive(childId));
        }
        delete newItems[id];
    };

    removeRecursive(itemId);

    // 부모의 children에서 제거
    if (item.data.parentId) {
        const parent = newItems[item.data.parentId];
        if (parent && parent.children) {
            newItems[item.data.parentId] = {
                ...parent,
                children: parent.children.filter(id => id !== itemId)
            };
        }
    } else {
        // 루트의 children에서 제거
        const root = newItems[BOOKMARK_ROOT_ID];
        if (root && root.children) {
            newItems[BOOKMARK_ROOT_ID] = {
                ...root,
                children: root.children.filter(id => id !== itemId)
            };
        }
    }

    return newItems;
}

/**
 * TreeItemMap에 새 폴더 추가
 */
export function addFolderToTreeItems(
    items: BookmarkTreeItemMap,
    folderName: string,
    parentId: TreeItemIndex | null
): BookmarkTreeItemMap {
    const newItems = { ...items };
    const folderId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 부모 아이템 결정
    const actualParentId = parentId ?? BOOKMARK_ROOT_ID;
    const parent = newItems[actualParentId];

    if (!parent) {
        return newItems;
    }

    // 새 폴더 생성
    const newFolder: BookmarkTreeItem = {
        index: folderId,
        isFolder: true,
        canMove: true,
        canRename: true,
        data: {
            name: folderName,
            parentId: parentId === null ? null : String(parentId),
            sortNo: parent.children ? parent.children.length : 0
        },
        children: []
    };

    // 폴더 추가
    newItems[folderId] = newFolder;

    // 부모의 children에 추가
    newItems[actualParentId] = {
        ...parent,
        children: [...(parent.children || []), folderId]
    };

    return newItems;
}

/**
 * 아이템을 새 위치로 이동 (드래그앤드롭)
 */
export function moveTreeItems(
    items: BookmarkTreeItemMap,
    draggedIds: TreeItemIndex[],
    targetParentId: TreeItemIndex,
    targetIndex: number
): BookmarkTreeItemMap {
    const newItems = { ...items };

    // 모든 드래그된 아이템에 대해 처리
    draggedIds.forEach((draggedId, offsetIndex) => {
        const draggedItem = newItems[draggedId];
        if (!draggedItem) return;

        // 이전 부모에서 제거
        const oldParentId = draggedItem.data.parentId ?? BOOKMARK_ROOT_ID;
        const oldParent = newItems[oldParentId];
        if (oldParent && oldParent.children) {
            newItems[oldParentId] = {
                ...oldParent,
                children: oldParent.children.filter(id => id !== draggedId)
            };
        }

        // 새 부모에 추가
        const newParentId = targetParentId === BOOKMARK_ROOT_ID ? null : String(targetParentId);
        const actualNewParentId = targetParentId;
        const newParent = newItems[actualNewParentId];

        if (newParent) {
            const newChildren = [...(newParent.children || [])];
            // 같은 부모 내에서 이동할 경우 인덱스 조정
            const adjustedIndex = Math.min(targetIndex + offsetIndex, newChildren.length);
            newChildren.splice(adjustedIndex, 0, draggedId);

            newItems[actualNewParentId] = {
                ...newParent,
                children: newChildren
            };
        }

        // 드래그된 아이템의 parentId 업데이트
        newItems[draggedId] = {
            ...draggedItem,
            data: {
                ...draggedItem.data,
                parentId: newParentId
            }
        };
    });

    return newItems;
}

/**
 * 아이템 이름 변경
 */
export function renameTreeItem(
    items: BookmarkTreeItemMap,
    itemId: TreeItemIndex,
    newName: string
): BookmarkTreeItemMap {
    const item = items[itemId];
    if (!item) {
        return items;
    }

    return {
        ...items,
        [itemId]: {
            ...item,
            data: {
                ...item.data,
                name: newName
            }
        }
    };
}

/**
 * 순환 참조 검사: targetId가 draggedId의 하위 항목인지 확인
 */
export function isDescendant(
    items: BookmarkTreeItemMap,
    draggedId: TreeItemIndex,
    targetId: TreeItemIndex
): boolean {
    const checkChildren = (itemId: TreeItemIndex): boolean => {
        const item = items[itemId];
        if (!item || !item.children) return false;

        for (const childId of item.children) {
            if (childId === targetId) return true;
            if (checkChildren(childId)) return true;
        }
        return false;
    };

    return checkChildren(draggedId);
}

/**
 * 드롭 가능 여부 검사
 */
export function canDropAt(
    items: BookmarkTreeItemMap,
    draggedIds: TreeItemIndex[],
    targetId: TreeItemIndex
): boolean {
    const targetItem = items[targetId];

    // 대상이 존재하지 않으면 드롭 불가
    if (!targetItem) return false;

    // 폴더가 아닌 곳에는 드롭 불가 (루트는 예외)
    if (!targetItem.isFolder && targetId !== BOOKMARK_ROOT_ID) return false;

    // 자기 자신에게 드롭 불가
    if (draggedIds.includes(targetId)) return false;

    // 자신의 하위 항목에 드롭 불가 (순환 참조 방지)
    for (const draggedId of draggedIds) {
        if (isDescendant(items, draggedId, targetId)) return false;
    }

    return true;
}

/**
 * 메뉴 아이템들을 TreeItemMap에 추가
 */
export function addMenusToTreeItems(
    items: BookmarkTreeItemMap,
    menus: MenuTreeNode[],
    targetFolderId: TreeItemIndex | null
): BookmarkTreeItemMap {
    const newItems = { ...items };
    const actualTargetId = targetFolderId ?? BOOKMARK_ROOT_ID;
    const targetItem = newItems[actualTargetId];

    if (!targetItem) return newItems;

    // 이미 추가된 메뉴 ID 수집
    const existingMenuIds = new Set<string>();
    Object.values(newItems).forEach(item => {
        if (item.data.pageURL) {
            existingMenuIds.add(String(item.index));
        }
    });

    // 중복되지 않은 메뉴만 추가
    const menusToAdd = menus.filter(menu => {
        if (!menu.pageURL) return false;
        return !existingMenuIds.has(menu.menuId);
    });

    if (menusToAdd.length === 0) return newItems;

    const newChildrenIds: TreeItemIndex[] = [];

    menusToAdd.forEach((menu, index) => {
        const newItem: BookmarkTreeItem = {
            index: menu.menuId,
            isFolder: false,
            canMove: true,
            canRename: false,
            data: {
                name: menu.menuName,
                parentId: targetFolderId === null ? null : String(targetFolderId),
                pageURL: menu.pageURL,
                iconClass: menu.iconClass,
                sortNo: (targetItem.children?.length || 0) + index
            },
            children: undefined
        };

        newItems[menu.menuId] = newItem;
        newChildrenIds.push(menu.menuId);
    });

    // 대상 폴더의 children에 추가
    newItems[actualTargetId] = {
        ...targetItem,
        children: [...(targetItem.children || []), ...newChildrenIds]
    };

    return newItems;
}

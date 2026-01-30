// src/types/bookmarkTree.types.ts

import { TreeItem, TreeItemIndex } from "react-complex-tree";

/**
 * BookmarkTreeItem 데이터 구조
 * react-complex-tree의 TreeItem과 호환되도록 설계
 */
export interface BookmarkTreeItemData {
    name: string;
    parentId: string | null;
    pageURL?: string;
    iconClass?: string;
    sortNo: number;
}

/**
 * react-complex-tree용 TreeItem 정의
 */
export interface BookmarkTreeItem extends TreeItem<BookmarkTreeItemData> {
    index: TreeItemIndex;
    isFolder: boolean;
    canMove: boolean;
    canRename: boolean;
    data: BookmarkTreeItemData;
    children?: TreeItemIndex[];
}

/**
 * TreeItemMap 타입 - react-complex-tree에서 사용
 */
export type BookmarkTreeItemMap = Record<TreeItemIndex, BookmarkTreeItem>;

/**
 * 트리 뷰 상태
 */
export interface BookmarkTreeViewState {
    focusedItem?: TreeItemIndex;
    expandedItems: TreeItemIndex[];
    selectedItems: TreeItemIndex[];
}

/**
 * 트리 드롭 타겟 정보
 */
export interface BookmarkDropTarget {
    targetType: "item" | "between-items" | "root";
    parentItem: TreeItemIndex;
    targetItem?: TreeItemIndex;
    linearIndex?: number;
    depth: number;
}

/**
 * 트리 컨테이너 Props
 */
export interface BookmarkTreeContainerProps {
    treeItems: BookmarkTreeItemMap;
    viewState: BookmarkTreeViewState;
    onDrop: (items: BookmarkTreeItem[], target: BookmarkDropTarget) => void;
    onRename?: (item: BookmarkTreeItem, name: string) => void;
    onFocusItem?: (item: BookmarkTreeItem) => void;
    onExpandItem?: (item: BookmarkTreeItem) => void;
    onCollapseItem?: (item: BookmarkTreeItem) => void;
    onSelectItems?: (items: TreeItemIndex[]) => void;
    onRemoveItem?: (itemId: TreeItemIndex) => void;
    onAddFolder?: (parentId: TreeItemIndex | null) => void;
}

/**
 * 트리 아이템 렌더러 Props
 */
export interface BookmarkTreeItemRendererProps {
    item: BookmarkTreeItem;
    depth: number;
    isExpanded: boolean;
    isSelected: boolean;
    isFocused: boolean;
    isDragging: boolean;
    isDropTarget: boolean;
    onExpand: () => void;
    onCollapse: () => void;
    onSelect: () => void;
    onRemove: () => void;
    onAddSubFolder?: () => void;
}

/**
 * 아이콘 Props
 */
export interface BookmarkTreeIconProps {
    isExpanded?: boolean;
    isFolder?: boolean;
    className?: string;
    size?: number;
}

/**
 * 루트 아이템 ID 상수
 */
export const BOOKMARK_ROOT_ID = "bookmark-root";

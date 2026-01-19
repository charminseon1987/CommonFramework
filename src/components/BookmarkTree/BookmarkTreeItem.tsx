// src/components/BookmarkTree/BookmarkTreeItem.tsx

import { ReactElement, createElement, ReactNode } from "react";
import { TreeItem, TreeItemRenderContext, TreeItemIndex } from "react-complex-tree";
import classNames from "classnames";
import { BookmarkTreeItemData } from "../../types/bookmarkTree.types";
import {
    ChevronIcon,
    FolderIcon,
    MenuItemIcon,
    DragHandleIcon,
    DeleteIcon,
    AddIcon
} from "./BookmarkTreeIcons";

interface BookmarkTreeItemProps {
    item: TreeItem<BookmarkTreeItemData>;
    context: TreeItemRenderContext;
    children?: ReactNode;
    onRemove: (itemId: TreeItemIndex) => void;
    onAddSubFolder?: (parentId: TreeItemIndex) => void;
}

/**
 * 북마크 트리 아이템 커스텀 렌더러
 */
export function BookmarkTreeItemRenderer({
    item,
    context,
    children,
    onRemove,
    onAddSubFolder
}: BookmarkTreeItemProps): ReactElement {
    const isFolder = !item.data.pageURL;
    const hasChildren = item.children && item.children.length > 0;

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(item.index);
    };

    const handleAddSubFolderClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAddSubFolder) {
            onAddSubFolder(item.index);
        }
    };

    return (
        <div
            {...context.itemContainerWithChildrenProps}
            className={classNames("bookmark-tree-item-container", {
                "is-folder": isFolder,
                "is-expanded": context.isExpanded,
                "is-selected": context.isSelected,
                "is-focused": context.isFocused,
                "is-dragging-over": context.isDraggingOver
            })}
        >
            <div
                {...context.itemContainerWithoutChildrenProps}
                {...context.interactiveElementProps}
                className={classNames("bookmark-tree-item", {
                    "is-folder": isFolder,
                    "is-expanded": context.isExpanded,
                    "is-selected": context.isSelected,
                    "is-focused": context.isFocused,
                    "is-dragging": context.isDraggingOver
                })}
            >
                {/* 드래그 핸들 */}
                <div className="bookmark-tree-drag-handle">
                    <DragHandleIcon size={14} />
                </div>

                {/* 확장/축소 화살표 (폴더만) */}
                {isFolder && (
                    <button
                        type="button"
                        className="bookmark-tree-expand-btn"
                        onClick={e => {
                            e.stopPropagation();
                            if (context.isExpanded) {
                                context.collapseItem();
                            } else {
                                context.expandItem();
                            }
                        }}
                        aria-label={context.isExpanded ? "축소" : "확장"}
                    >
                        <ChevronIcon isExpanded={context.isExpanded} size={14} />
                    </button>
                )}

                {/* 아이콘 */}
                {isFolder ? (
                    <FolderIcon isOpen={context.isExpanded && hasChildren} size={18} />
                ) : (
                    <MenuItemIcon size={16} />
                )}

                {/* 이름 */}
                <span className="bookmark-tree-item-name">{item.data.name}</span>

                {/* 액션 버튼들 */}
                <div className="bookmark-tree-item-actions">
                    {/* 하위 폴더 추가 버튼 (폴더만) */}
                    {isFolder && onAddSubFolder && (
                        <button
                            type="button"
                            className="bookmark-tree-action-btn bookmark-tree-add-btn"
                            onClick={handleAddSubFolderClick}
                            aria-label="하위 폴더 추가"
                            title="하위 폴더 추가"
                        >
                            <AddIcon size={14} />
                        </button>
                    )}

                    {/* 삭제 버튼 */}
                    <button
                        type="button"
                        className="bookmark-tree-action-btn bookmark-tree-delete-btn"
                        onClick={handleRemoveClick}
                        aria-label="삭제"
                        title="삭제"
                    >
                        <DeleteIcon size={14} />
                    </button>
                </div>
            </div>

            {/* 자식 컨테이너 */}
            {context.isExpanded && item.children && item.children.length > 0 && (
                <div className="bookmark-tree-children">
                    {children}
                </div>
            )}
        </div>
    );
}

// src/components/BookmarkTree/BookmarkTreeContainer.tsx

import React, { ReactElement, createElement, useState, useCallback, useMemo } from "react";
import {
    ControlledTreeEnvironment,
    Tree,
    TreeItem,
    TreeItemIndex,
    TreeItemRenderContext,
    DraggingPosition,
    InteractionMode
} from "react-complex-tree";
import classNames from "classnames";
import {
    BookmarkTreeItemMap,
    BookmarkTreeItemData,
    BOOKMARK_ROOT_ID
} from "../../types/bookmarkTree.types";
import { isDescendant } from "../../utils/treeDataConverter";
import { BookmarkTreeItemRenderer } from "./BookmarkTreeItem";

interface BookmarkTreeContainerProps {
    treeItems: BookmarkTreeItemMap;
    onTreeChange: (newItems: BookmarkTreeItemMap) => void;
    onRemoveItem: (itemId: TreeItemIndex) => void;
    onAddSubFolder?: (parentId: TreeItemIndex | null) => void;
}

/**
 * react-complex-tree 기반 북마크 트리 컨테이너
 */
export function BookmarkTreeContainer({
    treeItems,
    onTreeChange,
    onRemoveItem,
    onAddSubFolder
}: BookmarkTreeContainerProps): ReactElement {
    // View state
    const [focusedItem, setFocusedItem] = useState<TreeItemIndex | undefined>();
    const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>(() => {
        // 초기에 모든 폴더를 확장
        return Object.values(treeItems)
            .filter(item => !item.data.pageURL && item.children && item.children.length > 0)
            .map(item => item.index);
    });
    const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);

    // 드래그 가능 여부 핸들러
    const canDragHandler = useCallback(
        (items: TreeItem<BookmarkTreeItemData>[]): boolean => {
            // 루트는 드래그 불가
            return items.every(item => item.index !== BOOKMARK_ROOT_ID && item.canMove !== false);
        },
        []
    );

    // 드롭 가능 여부 핸들러
    const canDropAtHandler = useCallback(
        (items: TreeItem<BookmarkTreeItemData>[], target: DraggingPosition): boolean => {
            const draggedIds = items.map(item => item.index);

            // 타겟 아이템 결정
            let targetItemId: TreeItemIndex;

            if (target.targetType === "root") {
                targetItemId = BOOKMARK_ROOT_ID;
            } else if (target.targetType === "item") {
                targetItemId = target.targetItem;
            } else {
                // between-items: 부모 아이템에 드롭
                targetItemId = target.parentItem;
            }

            const targetItem = treeItems[targetItemId];

            // 대상이 존재하지 않으면 드롭 불가
            if (!targetItem) return false;

            // 자기 자신에게 드롭 불가
            if (draggedIds.includes(targetItemId)) return false;

            // 자신의 하위 항목에 드롭 불가 (순환 참조 방지)
            for (const draggedId of draggedIds) {
                if (isDescendant(treeItems, draggedId, targetItemId)) return false;
            }

            // item 타입일 경우 폴더가 아니면 드롭 불가
            if (target.targetType === "item" && !targetItem.isFolder) {
                return false;
            }

            return true;
        },
        [treeItems]
    );

    // 드롭 핸들러
    const onDropHandler = useCallback(
        (items: TreeItem<BookmarkTreeItemData>[], target: DraggingPosition): void => {
            const newItems = { ...treeItems };
            const draggedIds = items.map(item => item.index);

            // 타겟 정보 결정
            let targetParentId: TreeItemIndex;
            let targetIndex: number;

            if (target.targetType === "root") {
                targetParentId = BOOKMARK_ROOT_ID;
                const rootItem = newItems[BOOKMARK_ROOT_ID];
                targetIndex = rootItem.children?.length || 0;
            } else if (target.targetType === "item") {
                targetParentId = target.targetItem;
                const targetItem = newItems[target.targetItem];
                targetIndex = targetItem.children?.length || 0;
            } else {
                // between-items
                targetParentId = target.parentItem;
                targetIndex = target.childIndex;
            }

            // 모든 드래그된 아이템에 대해 처리
            draggedIds.forEach((draggedId, offsetIndex) => {
                const draggedItem = newItems[draggedId];
                if (!draggedItem) return;

                // 이전 부모에서 제거
                const oldParentId = draggedItem.data.parentId ?? BOOKMARK_ROOT_ID;
                const oldParent = newItems[oldParentId];
                if (oldParent && oldParent.children) {
                    const oldIndex = oldParent.children.indexOf(draggedId);
                    newItems[oldParentId] = {
                        ...oldParent,
                        children: oldParent.children.filter(id => id !== draggedId)
                    };

                    // 같은 부모 내에서 이동하고, 이전 위치가 새 위치보다 앞에 있었다면 인덱스 조정
                    if (oldParentId === targetParentId && oldIndex < targetIndex) {
                        targetIndex--;
                    }
                }

                // 새 부모에 추가
                const newParentId = targetParentId === BOOKMARK_ROOT_ID ? null : String(targetParentId);
                const newParent = newItems[targetParentId];

                if (newParent) {
                    const newChildren = [...(newParent.children || [])];
                    const adjustedIndex = Math.min(targetIndex + offsetIndex, newChildren.length);
                    newChildren.splice(adjustedIndex, 0, draggedId);

                    newItems[targetParentId] = {
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

            onTreeChange(newItems);
        },
        [treeItems, onTreeChange]
    );

    // 폴더 확장
    const handleExpandItem = useCallback((item: TreeItem<BookmarkTreeItemData>) => {
        setExpandedItems(prev => [...prev, item.index]);
    }, []);

    // 폴더 축소
    const handleCollapseItem = useCallback((item: TreeItem<BookmarkTreeItemData>) => {
        setExpandedItems(prev => prev.filter(id => id !== item.index));
    }, []);

    // 아이템 포커스
    const handleFocusItem = useCallback((item: TreeItem<BookmarkTreeItemData>) => {
        setFocusedItem(item.index);
    }, []);

    // 아이템 선택
    const handleSelectItems = useCallback((items: TreeItemIndex[]) => {
        setSelectedItems(items);
    }, []);

    // 아이템 이름 변경
    const handleRenameItem = useCallback(
        (item: TreeItem<BookmarkTreeItemData>, name: string): void => {
            const newItems = {
                ...treeItems,
                [item.index]: {
                    ...treeItems[item.index],
                    data: {
                        ...treeItems[item.index].data,
                        name
                    }
                }
            };
            onTreeChange(newItems);
        },
        [treeItems, onTreeChange]
    );

    // 아이템 렌더러
    const renderItem = useCallback(
        ({ item, context, children }: {
            item: TreeItem<BookmarkTreeItemData>;
            context: TreeItemRenderContext;
            children: React.ReactNode;
        }) => {
            return (
                <BookmarkTreeItemRenderer
                    item={item}
                    context={context}
                    children={children}
                    onRemove={onRemoveItem}
                    onAddSubFolder={onAddSubFolder}
                />
            );
        },
        [onRemoveItem, onAddSubFolder]
    );

    // viewState 메모이제이션
    const viewState = useMemo(
        () => ({
            "bookmark-tree": {
                focusedItem,
                expandedItems,
                selectedItems
            }
        }),
        [focusedItem, expandedItems, selectedItems]
    );

    return (
        <div className="bookmark-tree-container">
            <ControlledTreeEnvironment
                items={treeItems}
                getItemTitle={item => item.data.name}
                viewState={viewState}
                canDragAndDrop={true}
                canDropOnFolder={true}
                canReorderItems={true}
                canDrag={canDragHandler}
                canDropAt={canDropAtHandler}
                onDrop={onDropHandler}
                onExpandItem={handleExpandItem}
                onCollapseItem={handleCollapseItem}
                onFocusItem={handleFocusItem}
                onSelectItems={handleSelectItems}
                onRenameItem={handleRenameItem}
                canRename={true}
                canSearch={false}
                canSearchByStartingTyping={false}
                defaultInteractionMode={InteractionMode.ClickItemToExpand}
                renderItem={renderItem}
                renderItemTitle={({ item }) => (
                    <span className="bookmark-tree-item-title">{item.data.name}</span>
                )}
                renderItemArrow={() => null}
                renderDragBetweenLine={({ draggingPosition, lineProps }) => (
                    <div
                        {...lineProps}
                        className={classNames("bookmark-tree-drop-line", {
                            "drop-line-top": draggingPosition.targetType === "between-items"
                        })}
                    />
                )}
            >
                <Tree
                    treeId="bookmark-tree"
                    rootItem={BOOKMARK_ROOT_ID}
                    treeLabel="북마크 트리"
                />
            </ControlledTreeEnvironment>
        </div>
    );
}

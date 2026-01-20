// src/components/BookmarkEditMenu.tsx

import { ReactElement, createElement, useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { MenuTreeNode } from "../types/menu.types";
import { menuTreeToTreeItems, treeItemsToMenuTree, moveTreeItems, isDescendant } from "../utils/treeDataConverter";
import { BOOKMARK_ROOT_ID } from "../types/bookmarkTree.types";
import { BookmarkTreeItemData } from "../types/bookmarkTree.types";
import { MenuAddModal } from "./MenuAddModal";
import CustomIcon from "./CustomIcon";

interface BookmarkEditMenuProps {
    menuTree: MenuTreeNode[];
    fullMenuTree?: MenuTreeNode[];
    onMoveMenuItem: (menuId: string, newParentId: string | null, newIndex: number) => void;
    onRemoveMenuItem: (menuId: string) => void;
    onCreateFolder: (folderName: string, parentId: string | null) => void;
    onAddMenus: (menus: MenuTreeNode[], targetFolderId: string | null) => void;
    onSave: () => void;
    onCancel: () => void;
    hasChanges: boolean;
    onUpdateTree?: (newTree: MenuTreeNode[]) => void;
}

export function BookmarkEditMenu({
    menuTree,
    fullMenuTree = [],
    onMoveMenuItem,
    onRemoveMenuItem,
    onCreateFolder,
    onAddMenus,
    onSave,
    onCancel,
    hasChanges,
    onUpdateTree
}: BookmarkEditMenuProps): ReactElement {
    const [newFolderName, setNewFolderName] = useState("");
    const [showFolderInput, setShowFolderInput] = useState(false);
    const [folderParentId, setFolderParentId] = useState<string | null>(null);
    const [isMenuAddModalOpen, setIsMenuAddModalOpen] = useState(false);
    const [menuAddTargetFolderId, setMenuAddTargetFolderId] = useState<string | null>(null);

    // MenuTreeNode를 TreeItemMap으로 변환
    const treeItems = useMemo(() => menuTreeToTreeItems(menuTree), [menuTree]);

    // View state
    const [focusedItem, setFocusedItem] = useState<TreeItemIndex | undefined>();
    const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>(() => {
        return Object.values(treeItems)
            .filter(item => !item.data.pageURL && item.children && item.children.length > 0)
            .map(item => item.index);
    });
    const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);
    const previousTreeItemsRef = useRef(treeItems);

    // treeItems가 변경되면 expandedItems 업데이트
    useEffect(() => {
        // treeItems 참조가 같으면 스킵 (무한 루프 방지)
        if (previousTreeItemsRef.current === treeItems) {
            return;
        }

        previousTreeItemsRef.current = treeItems;

        const newExpandedItems = Object.values(treeItems)
            .filter(item => !item.data.pageURL && item.children && item.children.length > 0)
            .map(item => item.index);
        
        setExpandedItems(prev => {
            const newSet = new Set([...prev, ...newExpandedItems]);
            const newArray = Array.from(newSet);
            // 이전 값과 같으면 업데이트하지 않음
            if (prev.length === newArray.length && prev.every((id, idx) => id === newArray[idx])) {
                return prev;
            }
            return newArray;
        });
    }, [treeItems]);

    // 드래그 가능 여부 핸들러
    const canDragHandler = useCallback(
        (items: TreeItem<BookmarkTreeItemData>[]): boolean => {
            return items.every(item => item.index !== BOOKMARK_ROOT_ID && item.canMove !== false);
        },
        []
    );

    // 드롭 가능 여부 핸들러
    const canDropAtHandler = useCallback(
        (items: TreeItem<BookmarkTreeItemData>[], target: DraggingPosition): boolean => {
            const draggedIds = items.map(item => item.index);

            let targetItemId: TreeItemIndex;
            if (target.targetType === "root") {
                targetItemId = BOOKMARK_ROOT_ID;
            } else if (target.targetType === "item") {
                targetItemId = target.targetItem;
            } else {
                targetItemId = target.parentItem;
            }

            const targetItem = treeItems[targetItemId];
            if (!targetItem) return false;
            if (draggedIds.includes(targetItemId)) return false;

            // 순환 참조 방지
            for (const draggedId of draggedIds) {
                if (isDescendant(treeItems, draggedId, targetItemId)) return false;
            }

            // 폴더가 아닌 항목에는 드롭할 수 없음
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
            const draggedIds = items.map(item => item.index);

            let targetParentId: TreeItemIndex;
            let targetIndex: number;

            if (target.targetType === "root") {
                targetParentId = BOOKMARK_ROOT_ID;
                const rootItem = treeItems[BOOKMARK_ROOT_ID];
                targetIndex = rootItem.children?.length || 0;
            } else if (target.targetType === "item") {
                targetParentId = target.targetItem;
                const targetItem = treeItems[target.targetItem];
                targetIndex = targetItem.children?.length || 0;
            } else {
                targetParentId = target.parentItem;
                targetIndex = target.childIndex;
            }

            // moveTreeItems를 사용하여 TreeItemMap 업데이트
            const updatedTreeItems = moveTreeItems(treeItems, draggedIds, targetParentId, targetIndex);
            
            // TreeItemMap을 MenuTreeNode로 변환
            const updatedMenuTree = treeItemsToMenuTree(updatedTreeItems);
            
            // onUpdateTree가 있으면 사용, 없으면 기존 방식 사용
            if (onUpdateTree) {
                onUpdateTree(updatedMenuTree);
            } else {
                // 기존 방식: 첫 번째 아이템 기준으로 onMoveMenuItem 호출
                const firstDraggedId = draggedIds[0];
                const draggedItem = treeItems[firstDraggedId];
                if (draggedItem) {
                    const newParentId = targetParentId === BOOKMARK_ROOT_ID ? null : String(targetParentId);
                    onMoveMenuItem(String(firstDraggedId), newParentId, targetIndex);
                }
            }
        },
        [treeItems, onMoveMenuItem, onUpdateTree]
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
            // pageURL이 없으면 폴더이므로 이름 변경 가능
            if (!item.data.pageURL) {
                onCreateFolder(name, item.data.parentId);
            }
        },
        [onCreateFolder]
    );

    // 폴더 생성 핸들러
    const handleCreateFolderClick = useCallback((parentId: string | null = null) => {
        setFolderParentId(parentId);
        setShowFolderInput(true);
        setNewFolderName("");
    }, []);

    const handleFolderSubmit = useCallback(() => {
        if (newFolderName.trim()) {
            onCreateFolder(newFolderName.trim(), folderParentId);
            setNewFolderName("");
            setShowFolderInput(false);
            setFolderParentId(null);
        }
    }, [newFolderName, folderParentId, onCreateFolder]);

    const handleFolderCancel = useCallback(() => {
        setNewFolderName("");
        setShowFolderInput(false);
        setFolderParentId(null);
    }, []);

    // 메뉴 추가 모달 열기
    const handleOpenMenuAddModal = useCallback((targetFolderId: string | null = null) => {
        setMenuAddTargetFolderId(targetFolderId);
        setIsMenuAddModalOpen(true);
    }, []);

    // 메뉴 추가 모달 닫기
    const handleCloseMenuAddModal = useCallback(() => {
        setIsMenuAddModalOpen(false);
        setMenuAddTargetFolderId(null);
    }, []);

    // 메뉴 추가 처리
    const handleAddMenus = useCallback(
        (menus: MenuTreeNode[], targetFolderId: string | null) => {
            onAddMenus(menus, targetFolderId);
            handleCloseMenuAddModal();
        },
        [onAddMenus, handleCloseMenuAddModal]
    );

    // 아이템 삭제
    const handleRemoveItem = useCallback(
        (itemId: TreeItemIndex) => {
            onRemoveMenuItem(String(itemId));
        },
        [onRemoveMenuItem]
    );

    // 이미 북마크된 메뉴 ID 수집 (폴더와 파일 모두 포함)
    const bookmarkedMenuIds = useMemo(() => {
        const ids = new Set<string>();
        const collectIds = (nodes: MenuTreeNode[]): void => {
            nodes.forEach(node => {
                // 폴더와 파일 모두 북마크된 메뉴 ID에 추가
                ids.add(node.menuId);
                if (node.children && node.children.length > 0) {
                    collectIds(node.children);
                }
            });
        };
        collectIds(menuTree);
        return ids;
    }, [menuTree]);

    // 타겟 폴더 이름 찾기
    const targetFolderName = useMemo(() => {
        if (!menuAddTargetFolderId) return undefined;
        const findNode = (nodes: MenuTreeNode[]): MenuTreeNode | null => {
            for (const node of nodes) {
                if (node.menuId === menuAddTargetFolderId) {
                    return node;
                }
                if (node.children && node.children.length > 0) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
            return null;
        };
        const node = findNode(menuTree);
        return node?.menuName;
    }, [menuAddTargetFolderId, menuTree]);

    // 아이템 렌더러
    const renderItem = useCallback(
        ({ item, context, children }: {
            item: TreeItem<BookmarkTreeItemData>;
            context: TreeItemRenderContext;
            children: React.ReactNode;
        }) => {
            const { isExpanded } = context;
            // pageURL이 있으면 무조건 파일, 없으면 폴더
            const hasPageURL = !!item.data.pageURL;
            const isFolder = !hasPageURL; // pageURL이 없으면 폴더, 있으면 파일

            return (
                <div
                    {...context.itemContainerWithChildrenProps}
                    className={classNames("bookmark-edit-item", {
                        folder: isFolder,
                        "is-dragging-over": context.isDraggingOver
                    })}
                >
                    <div
                        {...context.itemContainerWithoutChildrenProps}
                        {...context.interactiveElementProps}
                        className="bookmark-edit-item-content"
                    >
                        <div className="bookmark-edit-item-icon">
                            {isFolder ? (
                                <CustomIcon type={item.children && item.children.length > 0 ? "folder" : "emptyFolder"} isOpen={isExpanded} />
                            ) : (
                                <CustomIcon type="file" fileType={hasPageURL ? item.data.pageURL?.split(".").pop()?.toLowerCase() : undefined} />
                            )}
                            <span className="bookmark-edit-item-name">{item.data.name}</span>
                            <button
                                type="button"
                                className="mx-button mx-button-default mx-name-bookmarkRemove bookmark-edit-remove-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveItem(item.index);
                                }}
                                aria-label="삭제"
                            >
                                ×
                            </button>
                        </div>

                        {isFolder && (
                            <button
                                type="button"
                                className="mx-button mx-button-default mx-name-bookmarkAddSubFolder bookmark-edit-add-folder-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateFolderClick(String(item.index));
                                }}
                                aria-label="하위 폴더 추가"
                            >
                                +
                            </button>
                        )}
                    </div>
                    {children}
                </div>
            );
        },
        [handleCreateFolderClick, handleRemoveItem]
    );

    // viewState 메모이제이션
    const viewState = useMemo(
        () => ({
            "bookmark-edit-tree": {
                focusedItem,
                expandedItems,
                selectedItems
            }
        }),
        [focusedItem, expandedItems, selectedItems]
    );

    return (
        <div className="bookmark-edit-menu">
            <div className="bookmark-edit-header">
                <h3>북마크 편집</h3>
                <div className="bookmark-edit-header-buttons">
                    <button
                        type="button"
                        className="mx-button mx-button-primary mx-name-bookmarkAddMenu"
                        onClick={() => handleOpenMenuAddModal(null)}
                        style = {{marginLeft: '26px', marginRight: '13px'}}
                    >
                        메뉴 추가
                    </button>
                    <button
                        type="button"
                        className="mx-button mx-button-default mx-name-bookmarkCreateFolder"
                        onClick={() => handleCreateFolderClick(null)}
                    >
                        새 폴더
                    </button>
                </div>
            </div>

            {showFolderInput && (
                <div className="bookmark-edit-folder-input" style={{color: 'black'}}>
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        placeholder="폴더 이름 입력"
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                handleFolderSubmit();
                            } else if (e.key === "Escape") {
                                handleFolderCancel();
                            }
                        }}
                        autoFocus
                    />
                    <button type="button" className="mx-button mx-button-default" onClick={handleFolderSubmit}>
                        확인
                    </button>
                    <button type="button" className="mx-button mx-button-default" onClick={handleFolderCancel}>
                        취소
                    </button>
                </div>
            )}

            <div className="bookmark-edit-tree-container">
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
                        <span className="bookmark-edit-item-title">{item.data.name}</span>
                    )}
                    renderItemArrow={() => null}
                >
                    <Tree
                        treeId="bookmark-edit-tree"
                        rootItem={BOOKMARK_ROOT_ID}
                        treeLabel="북마크 편집 트리"
                    />
                </ControlledTreeEnvironment>
            </div>

            <div className="bookmark-edit-footer"
               
            >
                <button
                    type="button"
                    className="mx-button mx-button-default mx-name-bookmarkCancel"
                    onClick={onCancel}
                    style={{marginRight: '10px', marginLeft: '70px'}}
                >
                    취소
                </button>
                <button
                    type="button"
                    className={classNames("mx-button mx-button-primary mx-name-bookmarkSave", {
                        disabled: !hasChanges
                    })}
                    onClick={onSave}
                    disabled={!hasChanges}
                >
                    저장
                </button>
            </div>

            {isMenuAddModalOpen && (
                <MenuAddModal
                    isOpen={isMenuAddModalOpen}
                    onClose={handleCloseMenuAddModal}
                    fullMenuTree={fullMenuTree}
                    bookmarkedMenuIds={bookmarkedMenuIds}
                    onAddMenus={handleAddMenus}
                    targetFolderId={menuAddTargetFolderId}
                    targetFolderName={targetFolderName}
                />
            )}
        </div>
    );
}

// src/components/BookmarkEditModal.tsx

import { ReactElement, createElement, useState, useCallback, useEffect, useMemo } from "react";
import classNames from "classnames";
import { MenuTreeNode } from "../types/menu.types";
import { BookmarkEditMenu } from "./BookmarkEditMenu";
import { MenuTreeSelector } from "./MenuTreeSelector";

interface BookmarkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    menuTree: MenuTreeNode[];
    fullMenuTree: MenuTreeNode[];
    onMoveMenuItem: (menuId: string, newParentId: string | null, newIndex: number) => void;
    onRemoveMenuItem: (menuId: string) => void;
    onCreateFolder: (folderName: string, parentId: string | null) => void;
    onAddMenus: (menus: MenuTreeNode[], targetFolderId: string | null) => void;
    onSave: () => void;
    onCancel: () => void;
    hasChanges: boolean;
    onUpdateTree?: (newTree: MenuTreeNode[]) => void;
}

type ViewMode = "edit" | "addMenu";

export function BookmarkEditModal({
    isOpen,
    onClose,
    menuTree,
    fullMenuTree,
    onMoveMenuItem,
    onRemoveMenuItem,
    onCreateFolder,
    onAddMenus,
    onSave,
    onCancel,
    hasChanges,
    onUpdateTree
}: BookmarkEditModalProps): ReactElement | null {
    const [viewMode, setViewMode] = useState<ViewMode>("edit");
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
    
    // 메뉴 추가 모드 관련 상태
    const [selectedMenuIds, setSelectedMenuIds] = useState<Set<string>>(new Set());
    const [selectedMenus, setSelectedMenus] = useState<Map<string, MenuTreeNode>>(new Map());
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    
    // 모달 위치 및 드래그 상태
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 276, y: 82 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // 이미 북마크된 메뉴 ID 수집
    const bookmarkedMenuIds = useMemo(() => {
        const ids = new Set<string>();
        const collectIds = (nodes: MenuTreeNode[]): void => {
            nodes.forEach(node => {
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
        if (!targetFolderId) return undefined;
        const findNode = (nodes: MenuTreeNode[]): MenuTreeNode | null => {
            for (const node of nodes) {
                if (node.menuId === targetFolderId) {
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
    }, [targetFolderId, menuTree]);

    // 모든 노드를 재귀적으로 확장하는 함수
    const expandAllNodes = useCallback((nodes: MenuTreeNode[], expandedSet: Set<string>): void => {
        nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                expandedSet.add(node.menuId);
                expandAllNodes(node.children, expandedSet);
            }
        });
    }, []);

    // 모달이 열릴 때마다 상태 초기화
    useEffect(() => {
        if (isOpen) {
            setViewMode("edit");
            setTargetFolderId(null);
            setSelectedMenuIds(new Set());
            setSelectedMenus(new Map());
            // 모든 노드를 재귀적으로 확장
            const allExpandedIds = new Set<string>();
            expandAllNodes(fullMenuTree, allExpandedIds);
            setExpandedIds(allExpandedIds);
            // 모달 위치 초기화
            setPosition({ x: 276, y: 82 });
        }
    }, [isOpen, fullMenuTree, expandAllNodes]);

    // 메뉴 추가 모드로 전환
    const handleOpenMenuAdd = useCallback((folderId: string | null = null) => {
        setTargetFolderId(folderId);
        setViewMode("addMenu");
        // 메뉴 추가 모드로 전환 시 선택 상태 초기화
        setSelectedMenuIds(new Set());
        setSelectedMenus(new Map());
    }, []);

    // 편집 모드로 돌아가기
    const handleBackToEdit = useCallback(() => {
        setViewMode("edit");
        setTargetFolderId(null);
        setSelectedMenuIds(new Set());
        setSelectedMenus(new Map());
    }, []);

    // 메뉴 선택/해제 토글
    const handleToggleSelection = useCallback((menuId: string, menu: MenuTreeNode) => {
        setSelectedMenuIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(menuId)) {
                newSet.delete(menuId);
            } else {
                newSet.add(menuId);
            }
            return newSet;
        });

        setSelectedMenus(prev => {
            const newMap = new Map(prev);
            if (newMap.has(menuId)) {
                newMap.delete(menuId);
            } else {
                newMap.set(menuId, menu);
            }
            return newMap;
        });
    }, []);

    // 노드 확장/축소 토글
    const handleToggleExpand = useCallback((menuId: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(menuId)) {
                newSet.delete(menuId);
            } else {
                newSet.add(menuId);
            }
            return newSet;
        });
    }, []);

    // 메뉴 추가 처리
    const handleAddMenus = useCallback(() => {
        const menusToAdd = Array.from(selectedMenuIds)
            .map(menuId => selectedMenus.get(menuId))
            .filter((menu): menu is MenuTreeNode => menu !== undefined);
        
        if (menusToAdd.length > 0) {
            onAddMenus(menusToAdd, targetFolderId);
            // 메뉴 추가 후 편집 모드로 돌아가기
            handleBackToEdit();
        }
    }, [selectedMenus, selectedMenuIds, targetFolderId, onAddMenus, handleBackToEdit]);

    // 모달 닫기 처리
    const handleClose = useCallback(() => {
        if (viewMode === "addMenu") {
            // 메뉴 추가 모드에서는 편집 모드로 돌아가기
            handleBackToEdit();
        } else {
            // 편집 모드에서는 모달 닫기
            onCancel();
            onClose();
        }
    }, [viewMode, onCancel, onClose, handleBackToEdit]);

    // ESC 키로 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                handleClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleClose]);

    // 드래그 시작 핸들러
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // close 버튼 클릭 시 드래그 시작하지 않음
        if ((e.target as HTMLElement).closest('.close')) {
            return;
        }
        
        setIsDragging(true);
        // 마우스 위치와 모달의 현재 위치를 기준으로 오프셋 계산
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    }, [position]);

    // 드래그 중 및 종료 이벤트 처리
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (!isOpen) {
        return null;
    }

    const selectedCount = selectedMenuIds.size;
    const modalTitle = viewMode === "edit" ? "북마크 편집" : "메뉴 추가";

    return (
        <div className="bookmark-modal-wrapper">
            <div className="mx-underlay">
                <div 
                    className="modal-dialog mx-dialog"
                    style={{ left: `${position.x}px`, top: `${position.y}px`, borderRadius: '20px' }}
                >
                    <div className="modal-content mx-window-content"
                    style={{ width: '500px', height: '700px', backgroundColor: 'aliceblue' }}
                    >
                        {/* Header */}
                        <div 
                            className="modal-header mx-window-header"
                            onMouseDown={handleMouseDown}
                            style={{backgroundColor:'cadetblue'}}
                        >
                            <h3 className="modal-title">{modalTitle}</h3>
                            <button
                                type="button"
                                className="close"
                                onClick={handleClose}
                                aria-label="닫기"
                            >
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body mx-window-body">
                            {viewMode === "edit" ? (
                                <BookmarkEditMenu
                                    menuTree={menuTree}
                                    onMoveMenuItem={onMoveMenuItem}
                                    onRemoveMenuItem={onRemoveMenuItem}
                                    onCreateFolder={onCreateFolder}
                                    onSave={onSave}
                                    onCancel={onCancel}
                                    hasChanges={hasChanges}
                                    onUpdateTree={onUpdateTree}
                                    onOpenMenuAdd={handleOpenMenuAdd}
                                />
                            ) : (
                                <div className="bookmark-edit-menu-add-mode">
                                    {/* Target Folder Indicator */}
                                    {targetFolderId && targetFolderName && (
                                        <div className="menu-add-modal-target">
                                            <span className="target-label">추가 위치:</span>
                                            <span className="target-folder-name">{targetFolderName}</span>
                                        </div>
                                    )}

                                    {/* Menu Tree Selector */}
                                    <div className="menu-add-tree-container">
                                        <ul className="menu-tree-selector">
                                            <MenuTreeSelector
                                                menuItems={fullMenuTree}
                                                selectedMenuIds={selectedMenuIds}
                                                bookmarkedMenuIds={bookmarkedMenuIds}
                                                onToggleSelection={handleToggleSelection}
                                                expandedIds={expandedIds}
                                                onToggleExpand={handleToggleExpand}
                                            />
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - 메뉴 추가 모드일 때만 표시 */}
                        {viewMode === "addMenu" && (
                            <div className="modal-footer mx-dialog-footer">
                                <button
                                    type="button"
                                    className="mx-button mx-button-default"
                                    onClick={handleBackToEdit}
                                    style={{ marginRight: '10px' }}
                                >
                                    뒤로
                                </button>
                                <button
                                    type="button"
                                    className={classNames("mx-button mx-button-primary", {
                                        disabled: selectedCount === 0
                                    })}
                                    onClick={handleAddMenus}
                                    disabled={selectedCount === 0}
                                >
                                    추가 {selectedCount > 0 && `(${selectedCount})`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

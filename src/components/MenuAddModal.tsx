// src/components/MenuAddModal.tsx

import { ReactElement, createElement, useState, useCallback, useEffect } from "react";
import classNames from "classnames";
import { MenuTreeNode } from "../types/menu.types";
import { MenuTreeSelector } from "./MenuTreeSelector";

interface MenuAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    fullMenuTree: MenuTreeNode[];
    bookmarkedMenuIds: Set<string>;
    onAddMenus: (menus: MenuTreeNode[], targetFolderId: string | null) => void;
    targetFolderId: string | null;
    targetFolderName?: string;
}

export function MenuAddModal({
    isOpen,
    onClose,
    fullMenuTree,
    bookmarkedMenuIds,
    onAddMenus,
    targetFolderId,
    targetFolderName
}: MenuAddModalProps): ReactElement | null {
    // 선택된 메뉴 ID와 메뉴 데이터 저장
    const [selectedMenuIds, setSelectedMenuIds] = useState<Set<string>>(new Set());
    const [selectedMenus, setSelectedMenus] = useState<Map<string, MenuTreeNode>>(new Map());
    // 확장된 노드 ID
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    // 모달 위치 및 드래그 상태
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 276, y: 82 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

    // 추가 버튼 클릭
    const handleAdd = useCallback(() => {
        // selectedMenuIds와 selectedMenus를 동기화하여 정확한 메뉴만 전달
        const menusToAdd = Array.from(selectedMenuIds)
            .map(menuId => selectedMenus.get(menuId))
            .filter((menu): menu is MenuTreeNode => menu !== undefined);
        
        console.log("[MenuAddModal] 선택된 메뉴 개수:", selectedMenuIds.size);
        console.log("[MenuAddModal] 전달할 메뉴 개수:", menusToAdd.length);
        console.log("[MenuAddModal] 전달할 메뉴 IDs:", menusToAdd.map(m => m.menuId));
        
        if (menusToAdd.length > 0) {
            onAddMenus(menusToAdd, targetFolderId);
            onClose();
        }
    }, [selectedMenus, selectedMenuIds, targetFolderId, onAddMenus, onClose]);


    // ESC 키로 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

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

    return (
        <div className="bookmark-modal-wrapper">
            <div className="mx-underlay">
                <div 
                    className="modal-dialog mx-dialog"
                    style={{ left: `${position.x}px`, top: `${position.y}px`, borderRadius: '20px' }}
                >
                    <div className="modal-content mx-window-content">
                        {/* Header */}
                        <div 
                            className="modal-header mx-window-header"
                            onMouseDown={handleMouseDown}
                        >
                            <h3 className="modal-title">메뉴 추가</h3>
                            <button
                                type="button"
                                className="close"
                                onClick={onClose}
                                aria-label="닫기"
                            >
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>

                        {/* Target Folder Indicator */}
                        {targetFolderId && targetFolderName && (
                            <div className="menu-add-modal-target">
                                <span className="target-label">추가 위치:</span>
                                <span className="target-folder-name">{targetFolderName}</span>
                            </div>
                        )}

                        {/* Body - Menu Tree */}
                        <div className="modal-body mx-window-body">
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

                        {/* Footer */}
                        <div className="modal-footer mx-dialog-footer">
                            <button
                                type="button"
                                className="mx-button mx-button-default"
                                onClick={onClose}
                                style = {{marginRight: '10px'}}
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                className={classNames("mx-button mx-button-primary", {
                                    disabled: selectedCount === 0
                                })}
                                onClick={handleAdd}
                                disabled={selectedCount === 0}
                            >
                                추가 {selectedCount > 0 && `(${selectedCount})`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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

    // 오버레이 클릭 (배경 클릭 시 닫기)
    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

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

    if (!isOpen) {
        return null;
    }

    const selectedCount = selectedMenuIds.size;

    return (
        <div className="menu-add-modal-overlay" onClick={handleOverlayClick}>
            <div className="menu-add-modal">
                {/* Header */}
                <div className="menu-add-modal-header">
                    <h3>메뉴 추가</h3>
                    <button
                        type="button"
                        className="menu-add-modal-close-btn"
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                        </svg>
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
                <div className="menu-add-modal-body">
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
                <div className="menu-add-modal-footer">
                    <button
                        type="button"
                        className="menu-add-modal-cancel-btn"
                        onClick={onClose}
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        className={classNames("menu-add-modal-submit-btn", {
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
    );
}

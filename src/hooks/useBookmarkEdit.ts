// src/hooks/useBookmarkEdit.ts

import { useState, useCallback, useEffect, useRef } from "react";
import { MenuTreeNode } from "../types/menu.types";
import {
    recalculateDepth,
    buildBookmarkStructure,
    validateBookmarkStructure,
    bookmarkStructureToJson,
    createFolder,
    moveMenuItem,
    removeMenuItem,
    addMenusToTree
} from "../utils/bookmarkHelpers";
import { ActionValue } from "mendix";

interface UseBookmarkEditOptions {
    initialTree: MenuTreeNode[];
    onSave?: ActionValue;
}

export function useBookmarkEdit({ initialTree, onSave }: UseBookmarkEditOptions) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedTree, setEditedTree] = useState<MenuTreeNode[]>(initialTree);
    const [hasChanges, setHasChanges] = useState(false);
    const previousInitialTreeRef = useRef<MenuTreeNode[]>(initialTree);

    // initialTree가 변경되면 editedTree도 업데이트 (편집 모드가 아닐 때만)
    useEffect(() => {
        // 배열 참조가 같으면 스킵 (무한 루프 방지)
        if (previousInitialTreeRef.current === initialTree) {
            return;
        }

        // 배열 길이와 내용이 같으면 스킵
        const isSameTree = 
            previousInitialTreeRef.current.length === initialTree.length &&
            previousInitialTreeRef.current.every((item, index) => 
                item.menuId === initialTree[index]?.menuId
            );

        if (isSameTree) {
            previousInitialTreeRef.current = initialTree;
            return;
        }

        previousInitialTreeRef.current = initialTree;

        if (!isEditMode) {
            setEditedTree(initialTree);
            setHasChanges(false);
        }
    }, [initialTree, isEditMode]);

    // 편집 모드 토글
    const toggleEditMode = useCallback(() => {
        if (isEditMode) {
            // 편집 모드 종료 시 원본으로 복원
            setEditedTree(initialTree);
            setHasChanges(false);
        }
        setIsEditMode(prev => !prev);
    }, [isEditMode, initialTree]);

    // 트리 업데이트
    const updateTree = useCallback((newTree: MenuTreeNode[]) => {
        const recalculatedTree = recalculateDepth(newTree);
        setEditedTree(recalculatedTree);
        setHasChanges(true);
    }, []);

    // 메뉴 이동
    const handleMoveMenuItem = useCallback(
        (menuId: string, newParentId: string | null, newIndex: number = 0) => {
            const newTree = moveMenuItem(editedTree, menuId, newParentId, newIndex);
            updateTree(newTree);
        },
        [editedTree, updateTree]
    );

    // 메뉴 삭제
    const handleRemoveMenuItem = useCallback(
        (menuId: string) => {
            const newTree = removeMenuItem(editedTree, menuId);
            updateTree(newTree);
        },
        [editedTree, updateTree]
    );

    // 폴더 생성
    const handleCreateFolder = useCallback(
        (folderName: string, parentId: string | null = null) => {
            const parentNode = parentId
                ? findNodeById(editedTree, parentId)
                : null;

            const depth = parentNode ? parentNode.depth + 1 : 0;
            const sortNo = parentNode
                ? parentNode.children.length
                : editedTree.length;

            const newFolder = createFolder(folderName, parentId, depth, sortNo);

            if (parentId && parentNode) {
                // 부모 노드의 children에 추가
                const updatedTree = editedTree.map(node =>
                    node.menuId === parentId
                        ? {
                              ...node,
                              children: [...node.children, newFolder],
                              hasChildren: true
                          }
                        : node
                );
                updateTree(updatedTree);
            } else {
                // 루트 레벨에 추가
                updateTree([...editedTree, newFolder]);
            }
        },
        [editedTree, updateTree]
    );

    // 노드 찾기 헬퍼
    const findNodeById = (tree: MenuTreeNode[], id: string): MenuTreeNode | null => {
        for (const node of tree) {
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

    // 저장
    const handleSave = useCallback(() => {
        const structure = buildBookmarkStructure(editedTree);
        const validation = validateBookmarkStructure(structure);

        if (!validation.valid) {
            console.error("북마크 구조 유효성 검사 실패:", validation.errors);
            return false;
        }

        const jsonString = bookmarkStructureToJson(structure);

        // 디버깅: JSON 문자열 출력
        console.log("[BookmarkEdit] JSON to save:", jsonString);

        // localStorage에 저장
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                localStorage.setItem("bangarlab-bookmark-json", jsonString);
                console.log("[BookmarkEdit] JSON saved to localStorage");
            }
        } catch (error) {
            console.warn("[BookmarkEdit] Failed to save to localStorage:", error);
        }

        // Mendix Action 호출
        // 참고: Mendix ActionValue.execute()는 파라미터를 직접 받지 않습니다.
        // JSON 문자열은 localStorage에 저장되었으므로, Microflow/Nanoflow에서
        // JavaScript Action을 통해 읽어올 수 있습니다.
        if (onSave && onSave.canExecute) {
            onSave.execute();
            setHasChanges(false);
            // 저장 성공 시 편집 모드 자동 종료
            setIsEditMode(false);
            return true;
        }

        return false;
    }, [editedTree, onSave]);

    // 메뉴 추가
    const handleAddMenus = useCallback(
        (menus: MenuTreeNode[], targetFolderId: string | null = null) => {
            const newTree = addMenusToTree(editedTree, menus, targetFolderId);
            updateTree(newTree);
        },
        [editedTree, updateTree]
    );

    // 취소
    const handleCancel = useCallback(() => {
        setEditedTree(initialTree);
        setHasChanges(false);
        setIsEditMode(false);
    }, [initialTree]);

    return {
        isEditMode,
        editedTree,
        hasChanges,
        toggleEditMode,
        handleMoveMenuItem,
        handleRemoveMenuItem,
        handleCreateFolder,
        handleAddMenus,
        handleSave,
        handleCancel,
        updateTree
    };
}

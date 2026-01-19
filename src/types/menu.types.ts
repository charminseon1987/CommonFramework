// types/menu.types.ts

/**
 * Mendix로부터 받는 메뉴 데이터 구조
 */
export interface MenuItemData {
    // SyMenu Entity 속성
    menuId: string;
    menuName: string;
    description?: string;
    parentMenuId: string | null;
    depth: number;
    sortNo: number;
    leftNo?: number;
    rightNo?: number;
    displayYn?: string;
    enabledTF: boolean;

    // SyResource 속성 (Association을 통해)
    resourceName?: string;
    resourceType?: string;
    pageURL?: string;
    iconClass?: string;
    resourceEnabledTF?: boolean;

    // 이미지 정보 (System.Image association을 통해)
    imageInfo?: ImageInfo;

    // Mendix Object
    guid?: string;
}

/**
 * 트리 구조로 변환된 메뉴 노드
 */
export interface MenuTreeNode extends MenuItemData {
    children: MenuTreeNode[];
    isExpanded: boolean;
    level: number;
    hasChildren: boolean;
    isVisible: boolean;
}

/**
 * Widget 내부 상태
 */
export interface NavigationState {
    menuTree: MenuTreeNode[];
    activeMenuId: string | null;
    expandedMenuIds: Set<string>;
    isLoading: boolean;
    error: string | null;
}

/**
 * 레이아웃 타입
 */
export type NavigationLayout = "vertical" | "horizontal" | "topbar_fullwidth";
export type NavigationPosition = "left" | "top";

/**
 * 리소스 타입
 */
export type ResourceType = "PAGE" | "MICROFLOW" | "URL" | "REPORT";

/**
 * 권한 액션 타입
 */
export type ActionType = "VIEW" | "CREATE" | "EDIT" | "DELETE";

/**
 * 메뉴 이벤트 타입
 */
export interface MenuClickEvent {
    menuId: string;
    menuName: string;
    pageURL?: string;
    resourceType?: string;
    hasChildren: boolean;
}

/**
 * 캐시 데이터 구조
 */
export interface MenuCache {
    data: MenuTreeNode[];
    timestamp: number;
    userId: string;
}

/**
 * Mendix System.Image 엔티티의 이미지 정보
 */
export interface ImageInfo {
    guid: string;
    changedDate: number;
    name: string;
    publicThumbnailPath?: string; // PublicThumbnailPath가 있으면 우선 사용
}

/**
 * 북마크 편집 모드 상태
 */
export type BookmarkEditMode = "view" | "edit";

/**
 * 북마크 구조 JSON 저장용 타입
 */
export interface BookmarkStructure {
    items: BookmarkStructureItem[];
}

/**
 * 북마크 구조 항목
 */
export interface BookmarkStructureItem {
    menuId: string;
    menuName: string;
    parentId: string | null;
    depth: number;
    sortNo: number;
    leftNo: number; // Nested Set Model 좌측 번호 (위젯에서 계산)
    rightNo: number; // Nested Set Model 우측 번호 (위젯에서 계산)
    isFolder?: boolean;
    originalMenuId?: string; // 원본 메뉴 ID (폴더가 아닌 경우)
}

/**
 * 북마크 폴더 생성용 타입
 */
export interface BookmarkFolder {
    folderId: string;
    folderName: string;
    parentId: string | null;
    depth: number;
    sortNo: number;
}
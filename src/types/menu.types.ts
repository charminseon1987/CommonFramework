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
export type NavigationLayout = "vertical" | "horizontal";
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

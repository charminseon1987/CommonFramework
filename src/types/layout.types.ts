import type { MenuItemData } from "./menu.types";

export interface NavigationLayoutProps {
    menuTree: MenuItemData[];
    activeMenuId: string | null;
    handlers: {
        onMenuClick: (menuId: string, pageURL?: string) => void;
        onToggleExpand: (menuId: string) => void;
        onExpandAll: () => void;
        onCollapseAll: () => void;
    };
    onHomeClick: () => void;
    props: any; // Mendix widget props (layout, depth, etc)
    cssVariables: React.CSSProperties;
}

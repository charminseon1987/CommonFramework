import { createElement } from "react";
import HorizontalNavigationMenu from "./Horizontal/HorizontalNavigationMenu";
import { MenuTreeNode } from "src/types/menu.types";


interface Props {
    menuTree: MenuTreeNode[];
    activeMenuId: string | null;
    handlers: {
        onMenuClick: (menuId: string, pageURL?: string) => void;
        onToggleExpand: (menuId: string) => void;
    };
}

export default function TopbarFullwidthNavigation({ menuTree, activeMenuId, handlers }: Props) {
    return (
        <HorizontalNavigationMenu
            menuItems={menuTree}
            activeMenuId={activeMenuId}
            onHorizontalMenuClick={handlers.onMenuClick}
            onToggleExpand={handlers.onToggleExpand}
            depth={0}
            maxDepth={2}
            showDepthIndicator={false}
            layout="horizontal"
        />
    );
}

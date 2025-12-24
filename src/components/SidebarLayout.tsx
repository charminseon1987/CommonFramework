import { NavigationMenu } from "../components/NavigationMenu";
import { NavigationHeader } from "./NavigationHeader";
import { ReactElement, createElement } from "react";
import { CollapseButton } from "./CollapseButton";
import { MenuTreeNode } from "src/types/menu.types";

interface SidebarLayoutProps {
    menuTree: MenuTreeNode[];
    activeMenuId: string | null;

    collapsible: boolean;
    collapsed: boolean;

    onMenuClick: (menuId: string, pageURL?: string) => void;
    onToggleExpand: (menuId: string) => void;

    onHomeClick: () => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onToggleCollapse: () => void;
}

export function SidebarLayout(props: SidebarLayoutProps): ReactElement {
    return (
        <aside className="nav-sidebar">
            <NavigationHeader
                onHomeClick={props.onHomeClick}
                onExpandAll={props.onExpandAll}
                onCollapseAll={props.onCollapseAll}
            />

            <NavigationMenu
                menuItems={props.menuTree}
                activeMenuId={props.activeMenuId}
                onMenuClick={props.onMenuClick}
                onToggleExpand={props.onToggleExpand}
                depth={0}
            />

            {props.collapsible && <CollapseButton collapsed={props.collapsed} onToggle={props.onToggleCollapse} />}
        </aside>
    );
}

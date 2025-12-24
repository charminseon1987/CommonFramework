// src/BangarlabDynamicNavigation.tsx
import { ReactElement, createElement, useState } from "react";
import { DynamicNavigationContainerProps } from "./types/widget.types";
import "./ui/DynamicNavigation.scss";
import useMenuState from "./hooks/useMenuState";
import { useNavigation } from "./hooks/useNavigation";
import { Error } from "./components/Error";
import { Loading } from "./components/Loading";
import { SidebarLayout } from "./components/SidebarLayout";
import HorizontalNavigationMenu from "./components/Horizontal/HorizontalNavigationMenu";
import TopbarFullwidthNavigation from "./components/TopbarFullwidthNavigation";

export function DynamicNavigation(props: DynamicNavigationContainerProps): ReactElement {
    const { menuTree, activeMenuId, isLoading, error, handlers } = useMenuState(props);
    const { navigateToPage, navigateHome } = useNavigation();
    const [collapsed, setCollapsed] = useState(false);
    if (isLoading) {
        return <Loading />;
    }
    if (error) {
        return <Error message={error} />;
    }
    const cssVariables = {
        "--theme-color": props.themeColor,
        "--animation-duration": `${props.animationDuration}ms`,
        "--sidebar-width": props.sidebarWidth,
        "--topbar-height": props.topbarHeight
    } as React.CSSProperties;

    const layoutProps = {
        menuTree,
        activeMenuId,
        handlers,
        onHomeClick: navigateHome,
        props,
        cssVariables
    };

    if (props.layout === "vertical") {
        {
            return (
                <SidebarLayout
                    menuTree={menuTree}
                    activeMenuId={activeMenuId}
                    collapsible={props.collapsible}
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(prev => !prev)}
                    onMenuClick={(id, url) => {
                        handlers.onMenuClick(id);
                        navigateToPage(url);
                    }}
                    onToggleExpand={handlers.onToggleExpand}
                    onHomeClick={navigateHome}
                    onExpandAll={handlers.onExpandAll}
                    onCollapseAll={handlers.onCollapseAll}
                />
            );
        }
    }
    if (props.layout === "horizontal") {
        return (
            <HorizontalNavigationMenu
                menuItems={menuTree}
                activeMenuId={activeMenuId}
                onHorizontalMenuClick={(menuId, pageURL) => {
                    handlers.onMenuClick(menuId);
                    if (pageURL) {
                        navigateToPage(pageURL);
                    }
                }}
                onToggleExpand={handlers.onToggleExpand}
                depth={0}
                maxDepth={2}
                showDepthIndicator={props.showDepthIndicator ?? false}
                layout="horizontal"
            />
        );
    }
    if (props.layout === "topbar_fullwidth") {
        return <TopbarFullwidthNavigation {...layoutProps} />;
    } else {
        return (
            <SidebarLayout
                menuTree={menuTree}
                activeMenuId={activeMenuId}
                collapsible={props.collapsible}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(prev => !prev)}
                onMenuClick={(id, url) => {
                    handlers.onMenuClick(id);
                    navigateToPage(url);
                }}
                onToggleExpand={handlers.onToggleExpand}
                onHomeClick={navigateHome}
                onExpandAll={handlers.onExpandAll}
                onCollapseAll={handlers.onCollapseAll}
            />
        );
    }
}

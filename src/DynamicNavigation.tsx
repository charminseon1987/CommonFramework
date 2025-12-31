// src/BangarlabDynamicNavigation.tsx
import { ReactElement, createElement, useState } from "react";
import classNames from "classnames";
import { DynamicNavigationContainerProps } from "./types/widget.types";
import { NavigationMenu } from "./components/NavigationMenu";
import { HorizontalNavigationMenu } from "./components/Horizontal/HorizontalNavigationMenu";
import { useMenuData } from "./hooks/useMenuData";
import { useNavigationState } from "./hooks/useNavigationState";

import "./ui/DynamicNavigation.scss";
import { FullMenu } from "./components/FullMenu";
import { useMenuPositions } from "./hooks/useMenuPositions";
import { useMenuExpand } from "./hooks/useMenuExpand";
import { useMenuNavigation } from "./hooks/useMenuNavigation";
import { useHomeNavigation } from "./hooks/useHomeNavigation";

export function DynamicNavigation(props: DynamicNavigationContainerProps): ReactElement {
    /* ------------------------------------------------------------------
     * 데이터 & 상태
     * ------------------------------------------------------------------ */
    const menuData = useMenuData(props);
    const { state, setState } = useNavigationState(menuData);

    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    /* ------------------------------------------------------------------
     * hooks
     * ------------------------------------------------------------------ */
    const { toggleExpand, toggleExpandHorizontal, expandAll, collapseAll } = useMenuExpand(setState, setIsAllExpanded);

    const { navigate } = useMenuNavigation(props);
    const handleHomeClick = useHomeNavigation(setState);

    const menuPositions = useMenuPositions(isAllExpanded);

    /* ------------------------------------------------------------------
     * handlers
     * ------------------------------------------------------------------ */
    const handleMenuClickWrapper = (menuId: string, pageURL: string | undefined, hasChildren: boolean) => {
        // children 있는 메뉴는 페이지 이동 안 함
        if (hasChildren) return;

        handleMenuClick(menuId, pageURL);
    };
    const handleMenuClick = (menuId: string, pageURL?: string) => {
        navigate(menuId, pageURL);
    };

    const handleHorizontalMenuClick = (menuId: string, pageURL?: string, hasChildren?: boolean) => {
        if (hasChildren) {
            toggleExpandHorizontal(menuId);
            return;
        }
        navigate(menuId, pageURL);
    };

    const handleToggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    const handleExpandAll = () => {
        expandAll();
        setIsAllExpanded(true);
        setIsCollapsed(true);
    };

    const handleCollapseAll = () => {
        collapseAll();
        setIsAllExpanded(false);
    };

    /* ------------------------------------------------------------------
     * 클래스
     * ------------------------------------------------------------------ */
    const containerClasses = classNames(
        "bangarlab-navigation",
        `layout-${props.layout}`,
        {
            collapsed: isCollapsed,
            "show-depth": props.showDepthIndicator
        },
        props.customClass
    );

    /* ==================================================================
     * HORIZONTAL (TOPBAR)
     * ================================================================== */
    if (props.layout === "horizontal") {
        return (
            <div className={containerClasses}>
                <header className="nav-topbar" role="navigation">
                    <div className="nav-topbar-inner">
                        {/* 왼쪽 : 홈 */}
                        <div className="nav-topbar-left">
                            <button className="nav-title nav-title-button" onClick={handleHomeClick} type="button">
                                홈
                            </button>
                        </div>

                        {/* 중앙 : depth 0 메뉴 */}
                        <nav className="nav-topbar-center">
                            <HorizontalNavigationMenu
                                menuItems={state.menuTree}
                                activeMenuId={state.activeMenuId}
                                onHorizontalMenuClick={handleHorizontalMenuClick}
                                onToggleExpand={toggleExpandHorizontal}
                                onToggleExpandNormal={toggleExpand}
                                depth={0}
                                maxDepth={props.maxDepth}
                                showDepthIndicator={props.showDepthIndicator}
                            />
                        </nav>

                        {/* 오른쪽 : 전체 펼치기 */}
                        <div className="nav-topbar-right">
                            <button
                                className={classNames("hamburger-btn", {
                                    "is-open": isAllExpanded
                                })}
                                onClick={() => setIsAllExpanded(prev => !prev)}
                                type="button"
                            >
                                <span className="hamburger-line" />
                                <span className="hamburger-line" />
                                <span className="hamburger-line" />
                            </button>
                        </div>
                    </div>

                    {/* ===============================
                     * Mega / Full Menu
                     * =============================== */}
                    {isAllExpanded && (
                        <FullMenu
                            menuTree={state.menuTree}
                            isOpen={isAllExpanded}
                            activeMenuId={state.activeMenuId}
                            menuPositions={menuPositions}
                            isAllExpanded={isAllExpanded}
                            onMenuClick={(menuId, pageURL) => {
                                handleHorizontalMenuClick(menuId, pageURL, false);
                            }}
                        />
                    )}
                </header>
            </div>
        );
    }

    /* ==================================================================
     * VERTICAL (SIDEBAR)
     * ================================================================== */
    return (
        <div className={containerClasses}>
            <aside className="nav-sidebar" role="navigation">
                {/* 헤더 */}
                <div className="nav-header">
                    <button className="nav-title nav-title-button" onClick={handleHomeClick} type="button">
                        홈
                    </button>

                    <div className="nav-controls">
                        <button className="nav-control-btn expand-all" onClick={handleExpandAll} type="button" />
                        <button className="nav-control-btn collapse-all" onClick={handleCollapseAll} type="button" />
                    </div>
                </div>

                {/* 메뉴 */}
                <nav className="nav-content">
                    <NavigationMenu
                        menuItems={state.menuTree}
                        activeMenuId={state.activeMenuId}
                        onMenuClick={handleMenuClickWrapper}
                        onToggleExpand={toggleExpand}
                        depth={0}
                        maxDepth={props.maxDepth}
                        showDepthIndicator={props.showDepthIndicator}
                    />
                </nav>

                {/* 접기 버튼 */}
                {props.collapsible && (
                    <button className="nav-toggle-btn" onClick={handleToggleCollapse} type="button">
                        <span className="nav-toggle-icon" />
                    </button>
                )}
            </aside>
        </div>
    );
}

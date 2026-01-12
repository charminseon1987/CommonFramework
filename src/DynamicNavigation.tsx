// src/BangarlabDynamicNavigation.tsx
import { ReactElement, createElement, useState, useEffect } from "react";
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
import useUserData from "./hooks/useUserData";
import { UserInformation } from "./components/UserInformation";
import { loadCollapsedState, saveCollapsedState } from "./utils/menuHelpers";
import HamburgerButton from "./components/HamburgerButton";
import LogoutButton from "./components/LogoutButton";
import NavigationTab, { NavigationTabKey } from "./components/NavigationTab";

export function DynamicNavigation(props: DynamicNavigationContainerProps): ReactElement {
    /* ------------------------------------------------------------------
     * 데이터 & 상태
     * ------------------------------------------------------------------ */
    const [activeTab, setActiveTab] = useState<NavigationTabKey>("all");
    const menuData = useMenuData(props, activeTab);
    const { state, setState } = useNavigationState(menuData, props.layout);
    // User domain
    const userData = useUserData(props);
    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    /* ------------------------------------------------------------------
     * hooks
     * ------------------------------------------------------------------ */
    // const { toggleExpand, toggleExpandHorizontal, expandAll, collapseAll } = useMenuExpand(setState, setIsAllExpanded);
    const { toggleExpand, toggleExpandHorizontal } = useMenuExpand(setState, setIsAllExpanded);

    const { navigate } = useMenuNavigation(props);
    const homeNavigationHandler = useHomeNavigation(setState);

    // 홈 버튼 클릭 핸들러 (collapsed 상태 유지)
    const handleHomeClick = () => {
        // 홈 버튼 클릭 시 현재 collapsed 상태를 localStorage에 저장
        // 페이지가 다시 렌더링되어도 동일한 collapsed 상태가 복원됨
        if (props.layout === "vertical") {
            saveCollapsedState(isCollapsed);
        }
        homeNavigationHandler();
    };

    const menuPositions = useMenuPositions(isAllExpanded);

    /* ------------------------------------------------------------------
     * collapsed 상태 복원 (localStorage에서 저장된 상태 복원)
     * ------------------------------------------------------------------ */
    useEffect(() => {
        if (props.layout === "vertical") {
            // localStorage에서 저장된 collapsed 상태 복원 (값이 없으면 false)
            const savedCollapsedState = loadCollapsedState();
            setIsCollapsed(savedCollapsedState);
        }
    }, [props.layout]);
    const handleUncollapse = () => {
        setIsCollapsed(false);
        saveCollapsedState(false);
    };
    /* ------------------------------------------------------------------
     * 레이아웃 스타일 주입 (15:85 비율)
     * ------------------------------------------------------------------ */
    useEffect(() => {
        if (props.layout === "vertical") {
            // 부모 컨테이너 찾기
            const container = document.querySelector(".mx-scrollcontainer-wrapper") as HTMLElement;
            if (container) {
                container.style.display = "flex";
                container.style.flexDirection = "row";
                container.style.height = "100vh";
                container.style.overflow = "hidden";
                container.style.width = "100%";
            }

            // 페이지 콘텐츠 영역
            const placeholder = document.querySelector(".mx-scrollcontainer-wrapper > .mx-placeholder") as HTMLElement;
            if (placeholder) {
                placeholder.style.width = "85%";
                placeholder.style.maxWidth = "85%";
                placeholder.style.minWidth = "85%";
                placeholder.style.overflow = "auto";
                placeholder.style.flexShrink = "0";
                placeholder.style.flexGrow = "0";
                placeholder.style.paddingTop = "72px"; // nav-header 높이만큼 여백 추가
            }
        }
    }, [props.layout]);

    /* ------------------------------------------------------------------
     * handlers
     * ------------------------------------------------------------------ */
    const handleToggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            saveCollapsedState(next);
            return next;
        });
    };
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

    // const handleExpandAll = () => {
    //     expandAll();
    //     setIsAllExpanded(true);
    // };

    // const handleCollapseAll = () => {
    //     collapseAll();
    //     setIsAllExpanded(false);
    // };

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

                        {/* 오른쪽 : 로그아웃 및 전체 펼치기 */}
                        <div className="nav-topbar-right">
                            {props.onLogout && (
                                <LogoutButton className="nav-logout-btn-horizontal" onLogout={props.onLogout} />
                            )}
                            <HamburgerButton isOpen={isAllExpanded} onClick={() => setIsAllExpanded(prev => !prev)} />
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
        <div>
            <div className={containerClasses}>
                <div className="nav-header">
                    {props.collapsible && <HamburgerButton onClick={handleToggleCollapse} />}
                    <button className="nav-title nav-title-button" onClick={handleHomeClick} type="button">
                        홈
                    </button>

                    <UserInformation user={userData?.[0]} />
                    {/* <div className="nav-controls">
                        <button className="nav-control-btn expand-all" onClick={handleExpandAll} type="button" />
                        <button className="nav-control-btn collapse-all" onClick={handleCollapseAll} type="button" />
                    </div> */}
                </div>

                <aside className="nav-sidebar" role="navigation">
                    <NavigationTab value={activeTab} onChange={setActiveTab} />
                    <nav className="nav-content">
                        <NavigationMenu
                            menuItems={state.menuTree}
                            activeMenuId={state.activeMenuId}
                            onMenuClick={handleMenuClickWrapper}
                            onToggleExpand={toggleExpand}
                            depth={0}
                            maxDepth={props.maxDepth}
                            showDepthIndicator={props.showDepthIndicator}
                            isCollapsed={isCollapsed}
                            onUncollapse={handleUncollapse}
                        />
                        <LogoutButton className="nav-logout-btn" onLogout={props.onLogout} />
                    </nav>
                </aside>
            </div>
        </div>
    );
}

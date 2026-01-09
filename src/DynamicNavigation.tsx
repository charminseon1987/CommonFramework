// src/BangarlabDynamicNavigation.tsx
import { ReactElement, createElement, useState, useEffect, useRef } from "react";
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
import { loadCollapsedState, saveCollapsedState } from "./utils/menuHelpers";
import HamburgerButton from "./components/HamburgerButton";
import LogoutButton from "./components/LogoutButton";
import NavigationTab, { NavigationTabKey } from "./components/NavigationTab";
// import logoImage from "./assets/logo.png";

export function DynamicNavigation(props: DynamicNavigationContainerProps): ReactElement {
    /* ------------------------------------------------------------------
     * 데이터 & 상태
     * ------------------------------------------------------------------ */
    // const userData = useUserData(props);
    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<NavigationTabKey>("all");
    const originalAriaExpandedRef = useRef<string | null>(null);
    const originalCollapsedStateRef = useRef<boolean | null>(null);
    
    const menuData = useMenuData(props, activeTab);
    const { state, setState } = useNavigationState(menuData);
    console.log("menuData", menuData);
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
            
            let clickHandler: ((e: MouseEvent) => void) | null = null;
            let buttonElement: HTMLButtonElement | null = null;
            
            // 호버 전 초기 collapsed 상태 저장 - 실제 DOM 상태 확인
            // DOM이 준비된 후 실제 상태를 확인하여 저장
            const timeoutId = setTimeout(() => {
                if (originalCollapsedStateRef.current === null) {
                    const button = findSidebarToggleButton();
                    const scrollContainer = findScrollContainer();
                    
                    let actualCollapsedState = true; // 기본값: collapsed 상태
                    
                    // 버튼의 aria-expanded 속성 확인
                    if (button) {
                        const ariaExpanded = button.getAttribute("aria-expanded");
                        // aria-expanded="false"이면 collapsed 상태(true)
                        // aria-expanded="true"이면 expanded 상태(false)
                        if (ariaExpanded === "true") {
                            actualCollapsedState = false;
                        } else {
                            actualCollapsedState = true;
                        }
                        console.log("버튼 aria-expanded 확인:", ariaExpanded, "=> collapsed:", actualCollapsedState);
                    }
                    
                    // 스크롤 컨테이너의 mx-scrollcontainer-open 클래스 확인
                    if (scrollContainer) {
                        const hasOpenClass = scrollContainer.classList.contains('mx-scrollcontainer-open');
                        // mx-scrollcontainer-open 클래스가 없으면 collapsed 상태(true)
                        // mx-scrollcontainer-open 클래스가 있으면 expanded 상태(false)
                        if (hasOpenClass) {
                            actualCollapsedState = false;
                        } else {
                            actualCollapsedState = true;
                        }
                        console.log("스크롤 컨테이너 클래스 확인:", hasOpenClass, "=> collapsed:", actualCollapsedState);
                    }
                    
                    // 버튼과 스크롤 컨테이너를 모두 찾지 못한 경우 localStorage 값 사용
                    if (!button && !scrollContainer) {
                        actualCollapsedState = savedCollapsedState !== null && savedCollapsedState !== undefined ? savedCollapsedState : true;
                        console.log("DOM 요소를 찾지 못해 localStorage 값 사용:", actualCollapsedState);
                    }
                    
                    originalCollapsedStateRef.current = actualCollapsedState;
                    console.log("호버 전 초기 collapsed 상태 저장 (실제 DOM 상태 확인):", originalCollapsedStateRef.current);
                }
                
                // 토글바 버튼 클릭 이벤트 리스너 추가 (토글 기능)
                buttonElement = findSidebarToggleButton();
                if (buttonElement) {
                    clickHandler = (e: MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("토글바 버튼 클릭 - 토글 기능 실행");
                        
                        // 현재 상태를 확인하고 토글
                        // isCollapsed가 true이면 false로, false이면 true로 변경
                        setIsCollapsed(prevCollapsed => {
                            const newCollapsed = !prevCollapsed;
                            console.log("토글: isCollapsed", prevCollapsed, "=>", newCollapsed);
                            
                            // localStorage에 새 상태 저장
                            saveCollapsedState(newCollapsed);
                            
                            // originalCollapsedStateRef도 업데이트 (호버 해제 시 올바른 상태로 복원)
                            originalCollapsedStateRef.current = newCollapsed;
                            
                            // 스크롤 컨테이너 클래스 토글
                            const scrollContainer = findScrollContainer();
                            if (scrollContainer) {
                                if (newCollapsed) {
                                    scrollContainer.classList.remove('mx-scrollcontainer-open');
                                    console.log("mx-scrollcontainer-open 클래스 제거 (접힘)");
                                } else {
                                    scrollContainer.classList.add('mx-scrollcontainer-open');
                                    console.log("mx-scrollcontainer-open 클래스 추가 (펼침)");
                                }
                            }
                            
                            // aria-expanded 속성 토글
                            if (buttonElement) {
                                buttonElement.setAttribute("aria-expanded", newCollapsed ? "false" : "true");
                                console.log("aria-expanded 설정:", newCollapsed ? "false" : "true");
                            }
                            
                            return newCollapsed;
                        });
                    };
                    
                    buttonElement.addEventListener('click', clickHandler, true); // capture phase에서 처리
                }
            }, 100); // DOM이 준비될 때까지 약간의 지연
            
            // cleanup 함수
            return () => {
                clearTimeout(timeoutId);
                if (buttonElement && clickHandler) {
                    buttonElement.removeEventListener('click', clickHandler, true);
                }
            };
        }
    }, [props.layout]);

    /* ------------------------------------------------------------------
     * 사이드바 호버 시 sidebarToggle3 버튼의 aria-expanded 제어
     * ------------------------------------------------------------------ */
    const findSidebarToggleButton = (): HTMLButtonElement | null => {
        // 여러 방법으로 버튼 찾기 시도
        const selectors = [
            'button[data-button-id="l.Atlas_Core.Atlas_Default.sidebarToggle3"]',
            'button.mx-name-sidebarToggle3',
            'button[class*="sidebarToggle3"]',
            'button[aria-controls*="toggleable"]',
            'button.toggle-btn[aria-haspopup="menu"]'
        ];

        for (const selector of selectors) {
            const button = document.querySelector<HTMLButtonElement>(selector);
            if (button) {
                return button;
            }
        }

        // 모든 버튼을 순회하며 sidebarToggle3가 포함된 버튼 찾기
        const allButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
        for (const button of allButtons) {
            const className = button.className || '';
            const dataButtonId = button.getAttribute('data-button-id') || '';
            if (className.includes('sidebarToggle3') || dataButtonId.includes('sidebarToggle3')) {
                return button;
            }
        }

        return null;
    };

    const findScrollContainer = (): HTMLElement | null => {
        // mx-scrollcontainer 요소 찾기
        const containers = document.querySelectorAll<HTMLElement>('.mx-scrollcontainer');
        for (const container of Array.from(containers)) {
            // aria-controls에 toggleable이 포함된 컨테이너 찾기
            const button = findSidebarToggleButton();
            if (button) {
                const ariaControls = button.getAttribute('aria-controls');
                if (ariaControls && container.id === ariaControls) {
                    return container;
                }
            }
            // 또는 sidebarToggle3 버튼과 관련된 컨테이너 찾기
            if (container.classList.contains('mx-scrollcontainer-horizontal') && 
                container.classList.contains('mx-scrollcontainer-fixed')) {
                return container;
            }
        }
        return null;
    };

    const handleSidebarMouseEnter = () => {
        console.log("사이드바 호버 시작");
        console.log("현재 isCollapsed 상태:", isCollapsed);
        console.log("저장된 원래 collapsed 상태:", originalCollapsedStateRef.current);
        
        // 원래 collapsed 상태가 저장되지 않았을 경우 안전장치 (이미 useEffect에서 저장되어야 함)
        if (originalCollapsedStateRef.current === null) {
            // 안전장치: 현재 상태를 저장 (null이면 true로 저장)
            originalCollapsedStateRef.current = isCollapsed !== null && isCollapsed !== undefined ? isCollapsed : true;
            console.log("안전장치: 원래 collapsed 상태 저장 (null이면 true):", originalCollapsedStateRef.current);
        }
        
        // 사이드바 펼치기 (collapsed 상태인 경우에만)
        if (isCollapsed) {
            setIsCollapsed(false);
            console.log("사이드바 펼침 (isCollapsed: false로 변경)");
        } else {
            console.log("사이드바가 이미 펼쳐져 있음 (isCollapsed가 이미 false)");
        }
        
        // 약간의 지연을 두고 버튼과 스크롤 컨테이너 찾기 (동적 생성 대응)
        setTimeout(() => {
            const button = findSidebarToggleButton();
            const scrollContainer = findScrollContainer();
            
            if (button) {
                console.log("버튼 찾음:", button);
                // 원래 값 저장 (한 번만 저장)
                if (originalAriaExpandedRef.current === null) {
                    originalAriaExpandedRef.current = button.getAttribute("aria-expanded");
                    console.log("원래 aria-expanded 값 저장:", originalAriaExpandedRef.current);
                }
                // aria-expanded를 true로 설정
                button.setAttribute("aria-expanded", "true");
                console.log("aria-expanded를 true로 설정 완료");
            } else {
                console.warn("sidebarToggle3 버튼을 찾을 수 없습니다.");
            }
            
            // mx-scrollcontainer-open 클래스 추가
            if (scrollContainer) {
                console.log("스크롤 컨테이너 찾음:", scrollContainer);
                if (!scrollContainer.classList.contains('mx-scrollcontainer-open')) {
                    scrollContainer.classList.add('mx-scrollcontainer-open');
                    console.log("mx-scrollcontainer-open 클래스 추가 완료");
                } else {
                    console.log("mx-scrollcontainer-open 클래스가 이미 있음");
                }
            } else {
                console.warn("스크롤 컨테이너를 찾을 수 없습니다.");
            }
        }, 10);
    };

    const handleSidebarMouseLeave = () => {
        console.log("사이드바 호버 종료");
        console.log("현재 isCollapsed 상태:", isCollapsed);
        console.log("저장된 원래 collapsed 상태:", originalCollapsedStateRef.current);
        console.log("저장된 원래 collapsed 상태 타입:", typeof originalCollapsedStateRef.current);
        console.log("저장된 원래 collapsed 상태 === true:", originalCollapsedStateRef.current === true);
        console.log("저장된 원래 collapsed 상태 === false:", originalCollapsedStateRef.current === false);
        
        const button = findSidebarToggleButton();
        const scrollContainer = findScrollContainer();
        
        // 원래 collapsed 상태로 복원
        if (originalCollapsedStateRef.current !== null) {
            const shouldBeCollapsed = originalCollapsedStateRef.current;
            console.log("복원할 상태 (shouldBeCollapsed):", shouldBeCollapsed);
            setIsCollapsed(shouldBeCollapsed);
            console.log("사이드바를 원래 상태로 복원 (isCollapsed:", shouldBeCollapsed, ")");
            
            // mx-scrollcontainer-open 클래스 제거/유지 (원래 상태에 따라)
            if (scrollContainer) {
                if (shouldBeCollapsed === true) {
                    // 원래 collapsed 상태였으면 클래스 제거
                    scrollContainer.classList.remove('mx-scrollcontainer-open');
                    console.log("원래 상태가 접혀진 상태(true)였으므로 mx-scrollcontainer-open 클래스 제거 완료");
                } else {
                    // 원래 펼쳐진 상태였으면 클래스 유지
                    if (!scrollContainer.classList.contains('mx-scrollcontainer-open')) {
                        scrollContainer.classList.add('mx-scrollcontainer-open');
                    }
                    console.log("원래 상태가 펼쳐진 상태(false)였으므로 mx-scrollcontainer-open 클래스 유지");
                }
            }
        } else {
            console.log("원래 collapsed 상태가 저장되지 않아 복원하지 않음");
        }
        
        if (button) {
            // 원래 값으로 복원
            if (originalAriaExpandedRef.current === null) {
                // 원래 속성이 없었던 경우 제거
                button.removeAttribute("aria-expanded");
                console.log("aria-expanded 속성 제거");
            } else {
                // 원래 값으로 복원
                button.setAttribute("aria-expanded", originalAriaExpandedRef.current);
                console.log("aria-expanded를 원래 값으로 복원:", originalAriaExpandedRef.current);
            }
        }
        
        // ref 초기화 (다음 호버를 위해)
        originalCollapsedStateRef.current = null;
        originalAriaExpandedRef.current = null;
        console.log("ref 초기화 완료");
    };

    const handleUncollapse = () => {
        setIsCollapsed(false);
        saveCollapsedState(false);
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
                                {/* <img src={logoImage} alt="logo" /> */}
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
     * TOPBAR FULLWIDTH
     * ================================================================== */

    if (props.layout === "topbar_fullwidth") {
        return (
            <div className={containerClasses}>
                <header className="nav-topbar" role="navigation">
                    <div className="nav-topbar-inner">
                        {/* 왼쪽 : 홈 */}
                        <div className="nav-topbar-left">
                            <button className="nav-title nav-title-button" onClick={handleHomeClick} type="button">
                                {/* <img src={logoImage} alt="logo" /> */}
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
                <aside 
                    className={classNames("nav-sidebar", { collapsed: isCollapsed })} 
                    role="navigation"
                    onMouseEnter={handleSidebarMouseEnter}
                    onMouseLeave={handleSidebarMouseLeave}
                >
                    <NavigationTab value={activeTab} onChange={setActiveTab} />
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

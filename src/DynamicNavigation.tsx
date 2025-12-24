// src/BangarlabDynamicNavigation.tsx
import { ReactElement, createElement, useState, useEffect, useCallback, useRef } from "react";
import { ValueStatus } from "mendix";
import classNames from "classnames";

import { DynamicNavigationContainerProps } from "./components/types/widget.types";
import { NavigationMenu } from "./components/NavigationMenu";
import { HorizontalNavigationMenu } from "./components/Horizontal/HorizontalNavigationMenu";
import { MenuItemData, NavigationState } from "./components/types/menu.types";
import { buildMenuTree, toggleMenuExpand, 
    expandAllMenus, getExpandedMenuIds, 
    saveExpandedMenuIds, restoreMenuExpansion, 
    loadExpandedMenuIds, saveActiveMenuId, loadActiveMenuId } from "./components/utils/menuHelpers";



import "./ui/DynamicNavigation.scss";


export function DynamicNavigation(props: DynamicNavigationContainerProps): ReactElement {
    // State
    const [state, setState] = useState<NavigationState>({
        menuTree: [],
        activeMenuId: null,
        expandedMenuIds: new Set(),
        isLoading: true,
        error: null
    });

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const isInitialLoad = useRef(true);
    const previousMenuDataRef = useRef<string>(''); // 메뉴 데이터 변경 추적

    // Mendix 데이터를 MenuItemData로 변환
    const convertToMenuData = useCallback((items: any[]): MenuItemData[] => {
        return items.map(item => {
            const menuId = props.menuId.get(item).value || "";
            const menuName = (props.menuName.get(item).value || "").trim();
            const parentMenuId = props.parentMenuId.get(item).value || null;
            const depth = Number(props.menuDepth.get(item).value) || 0;
            const sortNo = Number(props.sortNo.get(item).value) || 0;
            const displayYn = props.displayYn ? props.displayYn.get(item).value : "Y";
            const enabledTF = props.enabledTF ? props.enabledTF.get(item).value !== false : true;
            const resourceName = props.resourceName ? props.resourceName.get(item).value : undefined;
            const resourceType = props.resourceType ? props.resourceType.get(item).value : undefined;
            const pageURL = props.pageURL ? props.pageURL.get(item).value : undefined;
            const iconClass = props.iconClass ? (props.iconClass.get(item).value || '').trim() : undefined;
            const resourceEnabledTF = props.resourceEnabledTF ? props.resourceEnabledTF.get(item).value : undefined;

            return {
                menuId,
                menuName,
                description: undefined,
                parentMenuId,
                depth,
                sortNo,
                leftNo: props.leftNo ? Number(props.leftNo.get(item).value) : undefined,
                rightNo: props.rightNo ? Number(props.rightNo.get(item).value) : undefined,
                displayYn,
                enabledTF,
                resourceName,
                resourceType,
                pageURL,
                iconClass,
                resourceEnabledTF,
                guid: item.id
            };
        });
    }, [props]);

    // 메뉴 데이터 로드
    useEffect(() => {
        if (props.menuDataSource.status !== ValueStatus.Available) {
            return;
        }

        const items = props.menuDataSource.items;
        if (!items || items.length === 0) {
            setState(prev => ({
                ...prev,
                menuTree: [],
                isLoading: false
            }));
            return;
        }

        // 메뉴 데이터가 실제로 변경되었는지 확인 (불필요한 재빌드 방지)
        const currentMenuDataKey = items.map(item => item.id).join(',');
        if (previousMenuDataRef.current === currentMenuDataKey && !isInitialLoad.current) {
            // 메뉴 데이터가 변경되지 않았으면 재빌드하지 않음
            return;
        }
        previousMenuDataRef.current = currentMenuDataKey;

        try {
            // 데이터 변환
            const menuData = convertToMenuData(items);
            // 트리 구조 생성
            let tree = buildMenuTree(menuData);
            
            // 확장 상태 복원
            setState(prev => {
                // 1순위: 기존 메뉴 트리에서 확장된 메뉴 ID 추출 (리렌더링 시 유지)
                const existingExpandedIds = prev.menuTree.length > 0 
                    ? getExpandedMenuIds(prev.menuTree)
                    : [];
                
                // 2순위: localStorage에서 저장된 확장 상태 복원
                // - 처음 로드가 아니거나 localStorage에 저장된 상태가 있으면 복원
                const savedExpandedIdsFromStorage = loadExpandedMenuIds();
                const savedExpandedIds = existingExpandedIds.length > 0 
                    ? existingExpandedIds 
                    : (savedExpandedIdsFromStorage.length > 0 ? savedExpandedIdsFromStorage : []);
                
                // 확장 상태 복원
                if (savedExpandedIds.length > 0) {
                    tree = restoreMenuExpansion(tree, savedExpandedIds);
                }
                
                // localStorage에서 저장된 활성 메뉴 ID 복원 (항상 복원)
                const savedActiveMenuId = loadActiveMenuId();
                
                // 처음 로드 완료 표시
                if (isInitialLoad.current) {
                    isInitialLoad.current = false;
                }
                
                return {
                    ...prev,
                    menuTree: tree,
                    activeMenuId: savedActiveMenuId || prev.activeMenuId,
                    isLoading: false
                };
            });

        } catch (error) {
            console.error("[BangarlabNav] Error loading menu:", error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false
            }));
        }
    }, [props.menuDataSource.status, convertToMenuData]);

    // 메뉴 클릭 핸들러 (메뉴명 클릭 시 - 페이지 이동만, 메뉴 트리 변경 없음)
    const handleMenuClick = useCallback((
        menuId: string,
        pageURL: string | undefined,
    ) => {
        // 페이지 이동 전에 현재 확장 상태와 활성 메뉴를 localStorage에 저장
        setState(prev => {
            // 현재 확장 상태 저장
            const expandedIds = getExpandedMenuIds(prev.menuTree);
            saveExpandedMenuIds(expandedIds);
            
            // 활성 메뉴 ID 저장
            saveActiveMenuId(menuId);
            
            return {
                ...prev,
                activeMenuId: menuId,
                menuTree: prev.menuTree // 명시적으로 menuTree 유지
                // 주의: menuTree는 변경하지 않음 - 메뉴명 클릭 시 확장/축소 없음
            };
        });

        // 페이지 URL이 있으면 해당 페이지로 이동
        if (pageURL) {
            try {
                // URL 형식인 경우 직접 이동
                if (pageURL.startsWith('http://') || pageURL.startsWith('https://') || pageURL.startsWith('/')) {
                    window.location.href = pageURL;
                }
                // Mendix 페이지 이름인 경우 mx API 사용
                else {
                    const mx = (window as any).mx;

                    if (!mx) {
                        console.error('[Widget] Mendix API (mx) is not available');
                        return;
                    }

                    // Option 1: Mendix 9.12+ Navigation API (페이지 리로드 없이 이동)
                    if (mx.navigation && typeof mx.navigation.navigate === 'function') {
                        mx.navigation.navigate({
                            page: pageURL,
                            params: {}
                        });
                    }
                    // Option 2: Legacy mx.ui.openForm API
                    else if (mx.ui && typeof mx.ui.openForm === 'function') {
                        mx.ui.openForm(pageURL, {
                            location: "content",
                            callback: function() {
                                if (props.debugMode) {
                                    console.log('[Widget] Page opened successfully');
                                }
                            },
                            error: function(error: Error) {
                                console.error('[Widget] Failed to open page:', error);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('[Widget] Navigation error:', error);
                if (props.debugMode) {
                    console.error('[Widget] Navigation error details:', {
                        error,
                        pageURL
                    });
                }
            }
        }

        // Mendix 액션 실행
        if (props.onMenuClick && props.onMenuClick.canExecute) {
            props.onMenuClick.execute();
        }
    }, [props]);

    // 메뉴 클릭 핸들러 (메뉴명 클릭 시 - 페이지 이동만, 메뉴 트리 변경 없음)
    const handleHorizontalMenuClick = useCallback((
        menuId: string,
        pageURL: string | undefined,
        hasChildren: boolean,
        depth: number
    ) => {
        // 마지막 depth에서 페이지 이동 시 모든 메뉴 접기
        // depth는 0부터 시작하므로, depth === maxDepth - 1이거나 자식이 없는 경우가 마지막 depth
        const isLastDepth = depth >= props.maxDepth - 1 || !hasChildren;
        
        // 페이지 이동 전에 현재 확장 상태와 활성 메뉴를 localStorage에 저장
        setState(prev => {
            // 현재 확장 상태 저장
            const expandedIds = getExpandedMenuIds(prev.menuTree);
            saveExpandedMenuIds(expandedIds);
            
            // 활성 메뉴 ID 저장
            saveActiveMenuId(menuId);
            
            // 마지막 depth에서 페이지 이동 시 모든 메뉴 접기
            let newTree = prev.menuTree;
            if (isLastDepth && pageURL) {
                newTree = expandAllMenus(prev.menuTree, false);
                saveExpandedMenuIds([]);
            }
            
            return {
                ...prev,
                activeMenuId: menuId,
                menuTree: newTree
            };
        });

        // 페이지 URL이 있으면 해당 페이지로 이동
        if (pageURL) {
            try {
                // URL 형식인 경우 직접 이동
                if (pageURL.startsWith('http://') || pageURL.startsWith('https://') || pageURL.startsWith('/')) {
                    window.location.href = pageURL;
                }
                // Mendix 페이지 이름인 경우 mx API 사용
                else {
                    const mx = (window as any).mx;

                    if (!mx) {
                        console.error('[Widget] Mendix API (mx) is not available');
                        return;
                    }

                    // Option 1: Mendix 9.12+ Navigation API (페이지 리로드 없이 이동)
                    if (mx.navigation && typeof mx.navigation.navigate === 'function') {
                        mx.navigation.navigate({
                            page: pageURL,
                            params: {}
                        });
                    }
                    // Option 2: Legacy mx.ui.openForm API
                    else if (mx.ui && typeof mx.ui.openForm === 'function') {
                        mx.ui.openForm(pageURL, {
                            location: "content",
                            callback: function() {
                                if (props.debugMode) {
                                    console.log('[Widget] Page opened successfully');
                                }
                            },
                            error: function(error: Error) {
                                console.error('[Widget] Failed to open page:', error);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('[Widget] Navigation error:', error);
                if (props.debugMode) {
                    console.error('[Widget] Navigation error details:', {
                        error,
                        pageURL
                    });
                }
            }
        }

        // Mendix 액션 실행
        if (props.onMenuClick && props.onMenuClick.canExecute) {
            props.onMenuClick.execute();
        }
    }, [props]);

    // 메뉴 확장/축소 토글
    const handleToggleExpand = useCallback((menuId: string) => {
        setState(prev => {
            const newTree = toggleMenuExpand(prev.menuTree, menuId);
            // 확장 상태를 localStorage에 저장
            const expandedIds = getExpandedMenuIds(newTree);
            saveExpandedMenuIds(expandedIds);
            
            return {
                ...prev,
                menuTree: newTree
            };
        });
    }, [props.debugMode]);

    // 사이드바 토글
    const handleToggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, [props.debugMode]);

    // 햄버거 버튼으로 모든 메뉴 펼치기/접기 토글
    const handleToggleMenuDropdown = useCallback(() => {
        setIsAllExpanded(prev => {
            const willExpand = !prev;

            setState(currentState => {
                const newTree = expandAllMenus(currentState.menuTree, willExpand);
                const expandedIds = getExpandedMenuIds(newTree);
                saveExpandedMenuIds(expandedIds);

                return {
                    ...currentState,
                    menuTree: newTree
                };
            });

            return willExpand;
        });
    }, []);

    // 모두 확장
    const handleExpandAll = useCallback(() => {
        setState(prev => {
            const newTree = expandAllMenus(prev.menuTree, true);
            
            // 확장 상태를 localStorage에 저장
            const expandedIds = getExpandedMenuIds(newTree);
            saveExpandedMenuIds(expandedIds);
            
            return {
                ...prev,
                menuTree: newTree
            };
        });
    }, [props.debugMode]);

    // 모두 축소
    const handleCollapseAll = useCallback(() => {
        setState(prev => {
            const newTree = expandAllMenus(prev.menuTree, false);
            
            // 확장 상태를 localStorage에 저장
            const expandedIds = getExpandedMenuIds(newTree);
            saveExpandedMenuIds(expandedIds);
            
            return {
                ...prev,
                menuTree: newTree
            };
        });
    }, [props.debugMode]);

    // 홈 클릭 핸들러 (처음 페이지로 돌아가기)
    const handleHomeClick = useCallback(() => {
        try {
            const mx = (window as any).mx;

            if (!mx) {
                console.error('[Widget] Mendix API (mx) is not available');
                return;
            }

            // 활성 메뉴 초기화
            setState(prev => ({
                ...prev,
                activeMenuId: null
            }));
            saveActiveMenuId(null);

            // Mendix 홈 페이지로 이동
            // Option 1: Mendix 9.12+ Navigation API
            if (mx.navigation && typeof mx.navigation.navigate === 'function') {
                mx.navigation.navigate({
                    page: 'index',
                    params: {}
                });
            }
            // Option 2: Legacy mx.ui.openForm API
            else if (mx.ui && typeof mx.ui.openForm === 'function') {
                mx.ui.openForm('index', {
                    location: "content",
                    callback: function() {
                        if (props.debugMode) {
                            console.log('[Widget] Home page opened successfully');
                        }
                    },
                    error: function(error: Error) {
                        console.error('[Widget] Failed to open home page:', error);
                    }
                });
            }
            // Option 3: 직접 URL 이동
            else {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('[Widget] Home navigation error:', error);
            // 폴백: 루트 경로로 이동
            window.location.href = '/';
        }
    }, [props.debugMode]);

    // CSS 변수
    const cssVariables = {
        "--theme-color": props.themeColor,
        "--animation-duration": `${props.animationDuration}ms`,
        "--sidebar-width": props.sidebarWidth,
        "--topbar-height": props.topbarHeight
    } as React.CSSProperties;

    // 로딩 상태
    if (state.isLoading) {
        return (
            <div className="bangarlab-navigation loading" style={cssVariables}>
                <div className="loading-spinner">
                    <div className="spinner" aria-label="Loading"></div>
                    <p>메뉴를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (state.error) {
        return (
            <div className="bangarlab-navigation error" style={cssVariables}>
                <div className="error-message">
                    <p>메뉴를 불러오는 중 오류가 발생했습니다.</p>
                    <small>{state.error}</small>
                </div>
            </div>
        );
    }

    // 레이아웃 클래스
    const containerClasses = classNames(
        "bangarlab-navigation",
        `layout-${props.layout}`,
        {
            collapsed: isCollapsed,
            "show-depth": props.showDepthIndicator
        },
        props.customClass
    );

    // 좌측 레이아웃 (세로형)
    if (props.layout === "vertical") {
        return (
            <div className={containerClasses} style={cssVariables}>
                <aside className="nav-sidebar" role="navigation" aria-label="Main navigation">
                    {/* 헤더 */}
                    <div className="nav-header">
                        <button
                            className="nav-title nav-title-button"
                            onClick={handleHomeClick}
                            title="홈으로 이동"
                            aria-label="홈으로 이동"
                            type="button"
                        >
                            홈
                        </button>
                        
                        {/* 컨트롤 버튼 */}
                        <div className="nav-controls">
                            <button 
                                className="nav-control-btn expand-all"
                                onClick={handleExpandAll}
                                title="모두 펼치기"
                                aria-label="모두 펼치기"
                                type="button"
                            >
                                <span className="sr-only">모두 펼치기</span>
                            </button>
                            <button 
                                className="nav-control-btn collapse-all"
                                onClick={handleCollapseAll}
                                title="모두 접기"
                                aria-label="모두 접기"
                                type="button"
                            >
                                <span className="sr-only">모두 접기</span>
                            </button>
                        </div>
                    </div>

                    {/* 메뉴 */}
                    <nav className="nav-content">
                        <NavigationMenu
                            menuItems={state.menuTree}
                            activeMenuId={state.activeMenuId}
                            onMenuClick={handleMenuClick}
                            onToggleExpand={handleToggleExpand}
                            depth={0}
                            maxDepth={props.maxDepth}
                            showDepthIndicator={props.showDepthIndicator}
                        />
                    </nav>
                    

                    {/* 토글 버튼  */}
                    {props.collapsible && (
                        <button 
                            className="nav-toggle-btn"
                            onClick={handleToggleCollapse}
                            title={isCollapsed ? "사이드바 넓히기" : "사이드바 줄이기"}
                            aria-label={isCollapsed ? "사이드바 넓히기" : "사이드바 줄이기"}
                            type="button"
                        >
                            <svg 
                                width="12" 
                                height="12" 
                                viewBox="0 0 12 12" 
                                fill="currentColor"
                                className="nav-toggle-icon"
                            >
                                {isCollapsed ? (
                                    <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                ) : (
                                    <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                )}
                            </svg>
                        </button>
                    )}
                    
                </aside>
            </div>
        );
    }

    // 상단 레이아웃 (가로형) - 새로 추가
    // if (props.layout === "horizontal" && props.position === "top") {
        
        
    //     return (
    //         <div className={containerClasses} style={cssVariables}>
    //             <HorizontalNavigationMenu
    //                 menuItems={state.menuTree}
    //                 activeMenuId={state.activeMenuId}
    //                 onMenuClick={handleMenuClick}
    //                 onToggleExpand={handleToggleExpand}
    //                 depth={0}
    //                 maxDepth={props.maxDepth}
    //                 showDepthIndicator={props.showDepthIndicator}
                    
                
    //             />
    //         </div>
    //     );
    // }
    // Horizontal (Topbar)
    if (props.layout === "horizontal") {
        return (
            <div className={containerClasses} style={cssVariables}>
                <header className="nav-topbar" role="navigation" aria-label="Main navigation">
                    <div className="nav-topbar-inner">
                        {/* 왼쪽: 홈 버튼 */}
                        <div className="nav-topbar-left">
                            <button
                                className="nav-title nav-title-button"
                                onClick={handleHomeClick}
                                title="홈으로 이동"
                                aria-label="홈으로 이동"
                                type="button"
                            >
                                홈
                            </button>
                        </div>
    
                        {/* 중앙: 메뉴 */}
                        <nav className="nav-topbar-center">
                            <HorizontalNavigationMenu
                                menuItems={state.menuTree}
                                activeMenuId={state.activeMenuId}
                                onHorizontalMenuClick={handleHorizontalMenuClick}
                                onToggleExpand={handleToggleExpand}
                                depth={0}
                                maxDepth={props.maxDepth}
                                showDepthIndicator={props.showDepthIndicator}
                            />
                        </nav>
    
                        {/* 오른쪽: 컨트롤 버튼 (햄버거 아이콘) */}
                        <div className="nav-topbar-right">
                            {/* 컨트롤 버튼 */}
                            <div className="nav-controls">
                                <button
                                    className={classNames("nav-control-btn hamburger-btn", {
                                        "is-open": isAllExpanded
                                    })}
                                    onClick={handleToggleMenuDropdown}
                                    title={isAllExpanded ? "모두 접기" : "모두 펼치기"}
                                    aria-label={isAllExpanded ? "모두 접기" : "모두 펼치기"}
                                    type="button"
                                >
                                    <span className="hamburger-line"></span>
                                    <span className="hamburger-line"></span>
                                    <span className="hamburger-line"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            </div>
        );
    }

    if (props.layout === "topbar_fullwidth") {
        return (
            <div className={containerClasses} style={cssVariables}>
                <header className="nav-topbar" role="navigation" aria-label="Main navigation">
                    <div className="nav-topbar-inner">
                        {/* 왼쪽: 홈 버튼 */}
                        <div className="nav-topbar-left">
                            <button
                                className="nav-title nav-title-button"
                                onClick={handleHomeClick}
                                title="홈으로 이동"
                                aria-label="홈으로 이동"
                                type="button"
                            >
                                홈
                            </button>
                        </div>
    
                        {/* 중앙: 메뉴 */}
                        <nav className="nav-topbar-center">
                            <HorizontalNavigationMenu
                                menuItems={state.menuTree}
                                activeMenuId={state.activeMenuId}
                                onHorizontalMenuClick={handleHorizontalMenuClick}
                                onToggleExpand={handleToggleExpand}
                                depth={0}
                                maxDepth={props.maxDepth}
                                showDepthIndicator={props.showDepthIndicator}
                            />
                        </nav>
    
                        {/* 오른쪽: 컨트롤 버튼 (햄버거 아이콘) */}
                        <div className="nav-topbar-right">
                            {/* 컨트롤 버튼 */}
                            <div className="nav-controls">
                                <button
                                    className={classNames("nav-control-btn hamburger-btn", {
                                        "is-open": isAllExpanded
                                    })}
                                    onClick={handleToggleMenuDropdown}
                                    title={isAllExpanded ? "모두 접기" : "모두 펼치기"}
                                    aria-label={isAllExpanded ? "모두 접기" : "모두 펼치기"}
                                    type="button"
                                >
                                    <span className="hamburger-line"></span>
                                    <span className="hamburger-line"></span>
                                    <span className="hamburger-line"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            </div>
        );
    }


    // 기본 레이아웃
    return (
        <div className={containerClasses} style={cssVariables}>
            <NavigationMenu
                menuItems={state.menuTree}
                activeMenuId={state.activeMenuId}
                onMenuClick={handleMenuClick}
                onToggleExpand={handleToggleExpand}
                depth={0}
                maxDepth={props.maxDepth}
                showDepthIndicator={props.showDepthIndicator}
                
            />
        </div>
    );
}
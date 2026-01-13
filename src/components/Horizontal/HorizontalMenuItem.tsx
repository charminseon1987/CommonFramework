// src/components/horizontal/HorizontalMenuItem.tsx

import { ReactElement, createElement, useState, useEffect } from "react";
import classNames from "classnames";
import { MenuTreeNode } from "../../types/menu.types";
import { buildMendixImageUrl, buildMendixImageUrlAsync } from "../../utils/imageUtils";

interface HorizontalMenuItemProps {
    item: MenuTreeNode;
    isActive: boolean;
    activeMenuId: string | null;
    onHorizontalMenuClick: (menuId: string, pageURL: string | undefined, hasChildren: boolean, depth: number) => void;
    onToggleExpand: (menuId: string) => void;
    onToggleExpandNormal?: (menuId: string) => void;
    depth: number;
    maxDepth: number;
    showDepthIndicator: boolean;
    layout?: "vertical" | "horizontal";
}

export function HorizontalMenuItem({
    item,
    isActive,
    activeMenuId,
    onHorizontalMenuClick,
    onToggleExpand,
    onToggleExpandNormal,
    depth,
    maxDepth,
    showDepthIndicator,
    layout = "horizontal"
}: HorizontalMenuItemProps): ReactElement {
    const hasChildren = item.children && item.children.length > 0;
    const canExpand = hasChildren && depth < maxDepth;

    // 이미지 URL을 state로 관리
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // 이미지 URL 비동기 로드
    useEffect(() => {
        if (item.imageInfo && item.imageInfo.guid) {
            let isMounted = true;

            const loadImageUrl = async () => {
                try {
                    const url = await buildMendixImageUrlAsync(item.imageInfo!, true);
                    if (isMounted && url) {
                        setImageUrl(url);
                    }
                } catch (error) {
                    console.warn("[HorizontalMenuItem] Failed to load image URL:", error);
                    if (isMounted) {
                        // 에러 발생 시 동기 함수로 fallback
                        const fallbackUrl = buildMendixImageUrl(item.imageInfo!, true);
                        if (fallbackUrl) {
                            setImageUrl(fallbackUrl);
                        }
                    }
                }
            };

            loadImageUrl();

            return () => {
                isMounted = false;
            };
        } else {
            // 이미지가 없으면 state 초기화
            setImageUrl(null);
        }
    }, [item.imageInfo?.guid]);

    // 메뉴 클릭 핸들러
    const handleHorizontalMenuClick = (e: React.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        onHorizontalMenuClick(item.menuId, item.pageURL, hasChildren, depth);
    };
    // 화살표 버튼 클릭 핸들러 (확장/축소만)
    const handleArrowClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        if (canExpand) {
            // depth 0일 때는 Horizontal 전용 토글 (다른 depth 0 메뉴 닫기)
            // depth 1 이상일 때는 일반 토글 (해당 메뉴만 토글)
            if (depth === 0) {
                onToggleExpand(item.menuId);
            } else if (onToggleExpandNormal) {
                onToggleExpandNormal(item.menuId);
            }
        }
    };

    const itemClasses = classNames("horizontal-menu-item", `depth-${depth}`, {
        active: isActive,
        "has-children": hasChildren,
        expanded: item.isExpanded // 👈 확장 상태 클래스 추가
    });

    // nav-item-content 클릭 핸들러 (아이콘 영역 클릭 시에도 메뉴 클릭 동작)
    const handleContentClick = (e: React.MouseEvent): void => {
        // 화살표 버튼 클릭이 아닐 때만 메뉴 클릭 처리
        const target = e.target as HTMLElement;
        if (!target.closest(".horizontal-menu-item-arrow")) {
            // pageURL이 있으면 페이지 이동 우선 처리
            if (item.pageURL) {
                handleHorizontalMenuClick(e);
            } else if (canExpand && depth >= 1 && onToggleExpandNormal) {
                // pageURL이 없고 depth >= 1이고 확장 가능한 경우 확장/축소 처리
                e.preventDefault();
                e.stopPropagation();
                onToggleExpandNormal(item.menuId);
            } else {
                // depth === 0이거나 확장 불가능한 경우 기존 동작 (페이지 이동 또는 depth-0 확장)
                handleHorizontalMenuClick(e);
            }
        }
    };

    const handleContentKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            // pageURL이 있으면 페이지 이동 우선 처리
            if (item.pageURL) {
                handleHorizontalMenuClick(e as any);
            } else if (canExpand && depth >= 1 && onToggleExpandNormal) {
                // pageURL이 없고 depth >= 1이고 확장 가능한 경우 확장/축소 처리
                onToggleExpandNormal(item.menuId);
            } else {
                // depth === 0이거나 확장 불가능한 경우 기존 동작
                handleHorizontalMenuClick(e as any);
            }
        }
    };

    return (
        <li className={itemClasses} data-menu-id={item.menuId}>
            <div
                className="horizontal-menu-item-content"
                onClick={handleContentClick}
                onKeyDown={handleContentKeyDown}
                role="button"
                tabIndex={0}
                aria-label={item.menuName}
            >
                {/* 아이콘 */}
                {item.iconClass && item.iconClass.trim() !== "" && (
                    <span className="nav-icon" aria-hidden="true">
                        <i className={item.iconClass}></i>
                    </span>
                )}

                {/* 이미지 */}
                {item.imageInfo && item.imageInfo.guid && imageUrl && (
                    <div className="mx-image-viewer mx-image-viewer-responsive mx-name-nav-image" aria-hidden="true">
                        <img className="img-thumbnail" alt="" src={imageUrl} />
                    </div>
                )}

                {/* 메뉴명 */}
                <span className="horizontal-menu-item-label" title={item.menuName || ""}>
                    {item.menuName || "메뉴"}
                </span>
                {/* 확장 화살표 버튼 */}
                {hasChildren && (
                    <button
                        type="button"
                        className={classNames("horizontal-menu-item-arrow", {
                            expanded: item.isExpanded,
                            collapsed: !item.isExpanded
                        })}
                        onClick={handleArrowClick}
                        aria-expanded={item.isExpanded}
                        aria-label={item.isExpanded ? "메뉴 접기" : "메뉴 펼치기"}
                        aria-hidden="false"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M6 9L1 4h10z" />
                        </svg>
                    </button>
                )}
                {/* Depth 표시 (개발용) */}
                {showDepthIndicator && (
                    <span className="horizontal-menu-item-depth-indicator" aria-label={`Depth ${depth}`}>
                        D{depth}
                    </span>
                )}
            </div>
            {/* 자식 메뉴 - 렌더링 조건 확인 */}
            {canExpand && item.isExpanded && item.children.length > 0 && (
                <ul className={`horizontal-menu-item-submenu depth-${depth + 1}`} role="menu">
                    {depth === 0 && <a>{item.menuName}</a>}
                    {item.children.map(child => (
                        <HorizontalMenuItem
                            key={child.menuId}
                            item={child}
                            isActive={activeMenuId === child.menuId}
                            activeMenuId={activeMenuId}
                            onHorizontalMenuClick={onHorizontalMenuClick}
                            onToggleExpand={onToggleExpand}
                            onToggleExpandNormal={onToggleExpandNormal}
                            depth={depth + 1}
                            maxDepth={maxDepth}
                            showDepthIndicator={showDepthIndicator}
                            layout={layout}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

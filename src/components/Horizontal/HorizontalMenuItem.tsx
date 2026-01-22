// src/components/horizontal/HorizontalMenuItem.tsx

import { ReactElement, createElement, useState, useEffect } from "react";
import classNames from "classnames";
import { MenuTreeNode } from "../../types/menu.types";
import { buildMendixImageUrl, buildMendixImageUrlAsync } from "../../utils/imageUtils";
import CustomIcon from "../CustomIcon";

interface HorizontalMenuItemProps {
    item: MenuTreeNode;
    isActive: boolean;
    activeMenuId: string | null;
    onHorizontalMenuClick: (menuId: string, pageURL: string | undefined, hasChildren: boolean, depth: number) => void;
    onToggleExpand?: (menuId: string) => void;
    onToggleExpandNormal?: (menuId: string) => void;
    onToggleExpandAllChildren?: (menuId: string) => void;
    depth: number;
    maxDepth: number;
    showDepthIndicator: boolean;
    layout?: "vertical" | "horizontal" | "horizontal-full";
}

export function HorizontalMenuItem({
    item,
    isActive,
    activeMenuId,
    onHorizontalMenuClick,
    onToggleExpand,
    onToggleExpandNormal,
    onToggleExpandAllChildren,
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

        if (!canExpand) return;

        // ✅ FULL WIDTH
        if (layout === "horizontal-full") {
            onToggleExpandAllChildren?.(item.menuId);
            return;
        }

        // ✅ NORMAL HORIZONTAL
        if (depth === 0 && onToggleExpand) {
            onToggleExpand?.(item.menuId);
        } else {
            onToggleExpandNormal?.(item.menuId);
        }
    };

    const itemClasses = classNames("horizontal-menu-item", `depth-${depth}`, {
        active: isActive,
        "has-children": hasChildren,
        expanded: item.isExpanded // 👈 확장 상태 클래스 추가
    });

    // 아이콘과 이미지 존재 여부 확인
    const hasIcon = item.iconClass && item.iconClass.trim() !== "";
    // 이미지가 실제로 유효한 URL을 가지고 있는지 확인
    const hasImage = item.imageInfo && item.imageInfo.guid && imageUrl && imageUrl.trim() !== "";
    // 기본 아이콘 표시 여부 (iconClass와 imageInfo가 모두 없을 때)
    const shouldShowDefaultIcon = !hasIcon && !hasImage;
    const hasAnyIcon = hasIcon || hasImage || shouldShowDefaultIcon;

    // nav-item-content 클릭 핸들러 (아이콘 영역 클릭 시에도 메뉴 클릭 동작)
    const handleContentClick = (e: React.MouseEvent): void => {
        // 화살표 버튼 클릭이 아닐 때만 처리
        const target = e.target as HTMLElement;
        if (target.closest(".horizontal-menu-item-arrow")) {
            return; // 화살표 버튼 클릭은 handleArrowClick에서 처리
        }

        // depth 0이고 자식이 있는 경우: 토글 기능 추가
        if (depth === 0 && hasChildren) {
            e.preventDefault();
            e.stopPropagation();

            if (layout === "horizontal-full") {
                onToggleExpandAllChildren?.(item.menuId);
            } else {
                onToggleExpand?.(item.menuId);
            }
            return;
        }
        console.log("CLICK", {
            menuId: item.menuId,
            depth,
            hasChildren,
            layout,
            hasToggleExpand: !!onToggleExpand,
            hasToggleAll: !!onToggleExpandAllChildren
        });
        // 그 외의 경우: 기존 동작 (페이지 이동 또는 하위 메뉴 처리)
        handleHorizontalMenuClick(e);
    };

    const handleContentKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            // depth 0이고 자식이 있는 경우: 토글 기능 추가
            if (depth === 0 && hasChildren && onToggleExpand) {
                onToggleExpand(item.menuId);
            } else {
                handleHorizontalMenuClick(e as any);
            }
        }
    };

    return (
        <li className={itemClasses} data-menu-id={item.menuId}>
            <div
                className={classNames("horizontal-menu-item-content", {
                    "no-icon": !hasAnyIcon,
                    "has-icon": hasAnyIcon
                })}
                onClick={handleContentClick}
                onKeyDown={handleContentKeyDown}
                role="button"
                tabIndex={0}
                aria-label={item.menuName}
            >
                {/* 아이콘 (우선순위 1: iconClass) */}
                {item.iconClass && item.iconClass.trim() !== "" && (
                    <span className="nav-icon" aria-hidden="true">
                        <i className={item.iconClass}></i>
                    </span>
                )}

                {/* 이미지 (우선순위 2: imageInfo) */}
                {item.imageInfo && item.imageInfo.guid && imageUrl && (
                    <div className="mx-image-viewer mx-image-viewer-responsive mx-name-image1" aria-hidden="true">
                        <img className="img-thumbnail" alt="" src={imageUrl} />
                    </div>
                )}

                {/* 기본 아이콘 (우선순위 3: iconClass와 imageInfo가 모두 없을 때) */}
                {shouldShowDefaultIcon && (
                    <span className="nav-icon" aria-hidden="true">
                        {item.pageURL ? (
                            <CustomIcon 
                                type="file" 
                                fileType={item.pageURL.split(".").pop()?.toLowerCase()} 
                            />
                        ) : hasChildren ? (
                            <CustomIcon 
                                type="folder" 
                                isOpen={item.isExpanded} 
                            />
                        ) : (
                            <CustomIcon type="emptyFolder" />
                        )}
                    </span>
                )}

                {/* 메뉴명 */}
                <span className="horizontal-menu-item-label" title={item.menuName || ""} onClick={handleArrowClick}>
                    {item.menuName || "메뉴"}
                </span>
                {/* 확장 화살표 버튼 */}
                {canExpand && (
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
                        {layout === "horizontal" && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M6 9L1 4h10z" />
                            </svg>
                        )}
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

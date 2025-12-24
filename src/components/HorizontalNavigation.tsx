// src/components/HorizontalNavigation.tsx

import { ReactElement, createElement, useState, useCallback } from "react";
import classNames from "classnames";
import { MenuTreeNode } from "../types/menu.types";
import { HorizontalMenuItem } from "./Horizontal/HorizontalMenuItem";
import "../ui/HorizontalNavigation.scss";

interface HorizontalNavigationProps {
  menuTree: MenuTreeNode[];
  activeMenuId: string | null;
  onHorizontalMenuClick: (menuId: string, pageURL: string | undefined, hasChildren: boolean, depth: number) => void;
  onToggleExpand: (menuId: string) => void;
  onHomeClick: () => void;
  maxDepth: number;
  showDepthIndicator: boolean;
  themeColor: string;
}

export function HorizontalNavigation({
  menuTree,
  activeMenuId,
  onHorizontalMenuClick,
  onToggleExpand,
  onHomeClick,
  maxDepth,
  showDepthIndicator,
  themeColor
}: HorizontalNavigationProps): ReactElement {
  // 모바일 메뉴 토글 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 모바일 메뉴 토글
  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // 메뉴 클릭으로 토글 (열기/닫기)
  const handleMenuToggle = useCallback((menuId: string) => {
    onToggleExpand(menuId);
  }, [onToggleExpand]);
  

  return (
    <nav
      className="horizontal-navigation"
      role="navigation"
      aria-label="Main navigation"
      style={{ "--theme-color": themeColor } as React.CSSProperties}
    >
      <div className="horizontal-nav-container">
        {/* 헤더 (홈 버튼) */}
        <div className="horizontal-nav-header">
          <button
            className="home-button"
            onClick={onHomeClick}
            title="홈으로 이동"
            aria-label="홈으로 이동"
            type="button"
          > 홈
            {/* <span className="home-icon">🏠</span>
            <span className="home-text">홈</span> */}
          </button>
        </div>

        {/* 메인 메뉴 (Depth 0) */}
        <ul
          className={classNames("horizontal-menu", {
            "mobile-open": isMobileMenuOpen
          })}
          role="menubar"
        >
          {menuTree.map(item => (
            <HorizontalMenuItem
              key={item.menuId}
              item={item}
              isActive={activeMenuId === item.menuId}
              activeMenuId={activeMenuId}
              onHorizontalMenuClick={onHorizontalMenuClick}
              onToggleExpand={handleMenuToggle}
              depth={0}
              maxDepth={maxDepth}
              showDepthIndicator={showDepthIndicator}
            />
          ))}
        </ul>

        {/* 모바일 토글 버튼 */}
        <div className="horizontal-nav-controls">
          <button
            className="mobile-menu-toggle"
            onClick={handleToggleMobileMenu}
            aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isMobileMenuOpen}
            type="button"
          >
            <span className="menu-icon">
              {isMobileMenuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
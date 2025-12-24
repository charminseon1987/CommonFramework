// src/components/horizontal/HorizontalMenuItem.tsx

import { ReactElement, createElement } from "react";
import classNames from "classnames";
import { MenuTreeNode } from "../../types/menu.types";


interface HorizontalMenuItemProps {
  item: MenuTreeNode;
  isActive: boolean;
  activeMenuId: string | null;
  onHorizontalMenuClick: (menuId: string, pageURL: string | undefined, hasChildren: boolean, depth: number) => void;
  onToggleExpand: (menuId: string) => void;
  depth: number;
  maxDepth: number;
  showDepthIndicator: boolean;
  layout?: 'vertical' | 'horizontal';
}

export function HorizontalMenuItem({
  item,
  isActive,
  activeMenuId,
  onHorizontalMenuClick,
  onToggleExpand,
  depth,
  maxDepth,
  showDepthIndicator,
  layout = 'horizontal'
}: HorizontalMenuItemProps): ReactElement {
  const hasChildren = item.children && item.children.length > 0;
  const canExpand = hasChildren && depth < maxDepth;


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
      onToggleExpand(item.menuId);
    }
  };

  const itemClasses = classNames(
    'horizontal-menu-item',
    `depth-${depth}`,
    {
      'active': isActive,
      'has-children': hasChildren,
      'expanded': item.isExpanded // 👈 확장 상태 클래스 추가
    }
  );

  // nav-item-content 클릭 핸들러 (아이콘 영역 클릭 시에도 메뉴 클릭 동작)
  const handleContentClick = (e: React.MouseEvent): void => {
    // 화살표 버튼 클릭이 아닐 때만 메뉴 클릭 처리
    const target = e.target as HTMLElement;
    if (!target.closest('.horizontal-menu-item-arrow')) {
      handleHorizontalMenuClick(e);
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleHorizontalMenuClick(e as any);
    }
  };
  // Horizontal Top Bar 렌더링 (depth 0일 때만)
    console.log('layout', layout)
 
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
          {item.iconClass && item.iconClass.trim() !== '' && (
          <span className="nav-icon" aria-hidden="true">
            <i className={item.iconClass}></i>
          </span>
        )}
        {/* 메뉴명 */}
        <span className="horizontal-menu-item-label" title={item.menuName || ''}>
          {item.menuName || '메뉴'}
        </span>
        {/* 확장 화살표 버튼 */}
        {canExpand && (
          <button
            type="button"
            className={classNames('horizontal-menu-item-arrow', {
              'expanded': item.isExpanded,
              'collapsed': !item.isExpanded
            })}
            onClick={handleArrowClick}
            aria-expanded={item.isExpanded}
            aria-label={item.isExpanded ? '메뉴 접기' : '메뉴 펼치기'}
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
            {depth === 0 &&  <a>{item.menuName}</a>}
            {item.children.map(child => (
              <HorizontalMenuItem 
              key={child.menuId} 
              item={child} 
              isActive={activeMenuId === child.menuId} 
                activeMenuId={activeMenuId} 
                onHorizontalMenuClick={onHorizontalMenuClick} 
                onToggleExpand={onToggleExpand} 
                depth={depth + 1} 
                maxDepth={maxDepth} 
                showDepthIndicator={showDepthIndicator} 
                layout={layout} />
            ))}
          </ul>
        
        )}
      </li>
    );
}











            

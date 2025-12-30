// src/components/MenuItem.tsx

import { ReactElement, createElement } from 'react';
import classNames from 'classnames';
import { MenuTreeNode } from '../types/menu.types';

interface MenuItemProps {
  item: MenuTreeNode;
  isActive: boolean;
  activeMenuId: string | null;
  onMenuClick: (menuId: string, pageURL: string | undefined, hasChildren: boolean, depth: number) => void;
  onToggleExpand: (menuId: string) => void;
  depth: number;
  maxDepth: number;
  showDepthIndicator: boolean;
  layout?: 'vertical' | 'horizontal';
}

export function MenuItem({
  item,
  isActive,
  activeMenuId,
  onMenuClick,
  onToggleExpand,
  depth,
  maxDepth,
  showDepthIndicator,
  layout = 'vertical'
}: MenuItemProps): ReactElement {
  const hasChildren = item.children && item.children.length > 0;
  const canExpand = hasChildren && depth < maxDepth;

    // 메뉴명 클릭 핸들러 (메뉴 클릭만, 확장/축소는 하지 않음)
    const handleMenuClick = (e: React.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        onMenuClick(item.menuId, item.pageURL, hasChildren, depth);
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
    'nav-item',
    `depth-${depth}`,
    {
      'active': isActive,
      'expanded': item.isExpanded,
      'has-children': hasChildren
    }
  );

  // nav-item-content 클릭 핸들러 (아이콘 영역 클릭 시에도 메뉴 클릭 동작)
  const handleContentClick = (e: React.MouseEvent): void => {
    // 화살표 버튼 클릭이 아닐 때만 메뉴 클릭 처리
    const target = e.target as HTMLElement;
    if (!target.closest('.nav-arrow')) {
      handleMenuClick(e);
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleMenuClick(e as any);
    }
  };

  return (
    <li className={itemClasses} data-menu-id={item.menuId}>
      {/* nav-item-content div에 클릭 이벤트 추가 (아이콘 클릭 시에도 동작) */}
      <div 
        className="nav-item-content" 
        data-menu-name={item.menuName}
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

        {/* 메뉴명 - aria-expanded 속성 없음 (확장/축소와 무관) */}
        <span 
          className="nav-label" 
          title={item.menuName || ''}
        >
          {item.menuName || '메뉴'}
        </span>

        {/* 확장 화살표 버튼 */}
        {canExpand && (
          <button
            type="button"
            className={classNames('nav-arrow', {
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
          <span className="nav-depth-indicator" aria-label={`Depth ${depth}`}>
            D{depth}
          </span>
        )}
      </div>

      {/* 자식 메뉴 - 렌더링 조건 확인 */}
      {canExpand && item.isExpanded && item.children.length > 0 && (
        <ul className={`nav-submenu depth-${depth + 1}`} role="menu">
          {item.children.map(child => (
            <MenuItem
              key={child.menuId}
              item={child}
              isActive={activeMenuId === child.menuId}
              activeMenuId={activeMenuId}
              onMenuClick={onMenuClick}
              onToggleExpand={onToggleExpand}
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
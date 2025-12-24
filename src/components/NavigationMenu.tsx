// src/components/NavigationMenu.tsx

import { ReactElement, createElement } from 'react';
import { MenuItem } from './MenuItem';
import { MenuTreeNode } from '../types/menu.types';

interface NavigationMenuProps {
  menuItems: MenuTreeNode[];
  activeMenuId: string | null;
  onMenuClick: (menuId: string, pageName: string | undefined, hasChildren: boolean, depth: number) => void;
  onToggleExpand: (menuId: string) => void;
  depth?: number;
  maxDepth?: number;
  showDepthIndicator?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export function NavigationMenu({
  menuItems,
  activeMenuId,
  onMenuClick,
  onToggleExpand,
  depth = 0,
  maxDepth = 2,
  showDepthIndicator = false,
  layout = 'vertical'
}: NavigationMenuProps): ReactElement {
  if (!menuItems || menuItems.length === 0) {
    return (
      <div className="nav-empty-state" role="status">
        <p>사용 가능한 메뉴가 없습니다.</p>
      </div>
    );
  }

  // // Horizontal Top Bar 렌더링 (depth 0일 때만)
  // if (layout === 'horizontal' && depth === 0) {
  //   return (
  //     <nav className="horizontal-navigation" role="navigation" aria-label="Main navigation">
  //       <ul className="horizontal-menu" role="menubar">
  //         {menuItems.map(item => (
  //           <MenuItem
  //             key={item.menuId}
  //             item={item}
  //             isActive={activeMenuId === item.menuId}
  //             activeMenuId={activeMenuId}
  //             onMenuClick={onMenuClick}
  //             onToggleExpand={onToggleExpand}
  //             depth={depth}
  //             maxDepth={maxDepth}
  //             showDepthIndicator={showDepthIndicator}
  //             layout={layout}
  //           />
  //         ))}
  //       </ul>
  //     </nav>
  //   );
  // }

  // Vertical 또는 Horizontal의 서브메뉴 (depth 1+)
  return (
    <ul className={`nav-menu depth-${depth}`} role="menu">
      {menuItems.map(item => (
        <MenuItem
          key={item.menuId}
          item={item}
          isActive={activeMenuId === item.menuId}
          activeMenuId={activeMenuId}
          onMenuClick={onMenuClick}
          onToggleExpand={onToggleExpand}
          depth={depth}
          maxDepth={maxDepth}
          showDepthIndicator={showDepthIndicator}
          layout={layout}
        />
      ))}
    </ul>
  );
}
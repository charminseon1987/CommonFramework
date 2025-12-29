// src/components/horizontal/HorizontalNavigationMenu.tsx

import { ReactElement, createElement } from "react";
import { MenuTreeNode } from "../types/menu.types";
import { HorizontalMenuItem } from "./HorizontalMenuItem";

interface HorizontalNavigationMenuProps {
  menuItems: MenuTreeNode[];
  activeMenuId: string | null;
  onHorizontalMenuClick: (menuId: string, pageURL: string | undefined, hasChildren: boolean, depth: number) => void;
  onToggleExpand: (menuId: string) => void;
  onToggleExpandNormal?: (menuId: string) => void;
  depth: number;
  maxDepth: number;
  showDepthIndicator: boolean;
  layout?: 'vertical' | 'horizontal';
}

export function HorizontalNavigationMenu({
  menuItems,
  activeMenuId,
  onHorizontalMenuClick,
  onToggleExpand,
  onToggleExpandNormal,
  depth=0,
  maxDepth=2,
  showDepthIndicator=false,
  layout = 'horizontal'
}: HorizontalNavigationMenuProps): ReactElement {
  if (!menuItems || menuItems.length === 0) {
    return (
      <div className="nav-empty-state" role="status">
        <p>사용 가능한 메뉴가 없습니다.</p>
      </div>
    );
  }


 
  //Horizontal 의 서브메뉴 (depth 1+)
  return (
  
   <ul className={`horizontal-menu-depth-${depth}`} role="menu">
    {menuItems.map(item=>(
      <HorizontalMenuItem
        key={item.menuId}
        item={item}
        isActive={activeMenuId === item.menuId}
        activeMenuId={activeMenuId}
        onHorizontalMenuClick={onHorizontalMenuClick}
        onToggleExpand={onToggleExpand}
        onToggleExpandNormal={onToggleExpandNormal}
        depth={depth}
        maxDepth={maxDepth}
        showDepthIndicator={showDepthIndicator}
        layout={layout} />
    ))}
    </ul>
  
  );
}
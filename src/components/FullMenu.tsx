import { ReactElement, createElement } from "react";
import { MenuTreeNode } from "../types/menu.types";
import SubMenuTree from "./SubMenuTree";
interface MegaMenuProps {
    menuTree: MenuTreeNode[];
    isOpen: boolean;
    activeMenuId: string | null;
    menuPositions?: { [key: string]: number };
    isAllExpanded: boolean;
    onMenuClick: (menuId: string, pageURL?: string, depth?: number) => void;
}

export function FullMenu({
    menuTree,
    isOpen,
    activeMenuId,
    menuPositions = {},
    isAllExpanded,
    onMenuClick
}: MegaMenuProps): ReactElement | null {
    if (!isOpen) return null;

    return (
        <div className="mega-menu">
            <div className="mega-submenu-area">
                {menuTree.map(menu => {
                    const shouldShow = isAllExpanded && !menu.isExpanded;
                    if (!shouldShow || !menu.children?.length) return null;

                    return (
                        <div
                            key={menu.menuId}
                            className="mega-submenu-column"
                            style={{
                                position: "absolute",
                                left: `${menuPositions[menu.menuId] || 0}px`,
                                top: 0
                            }}
                        >
                            <SubMenuTree
                                nodes={menu.children}
                                activeMenuId={activeMenuId}
                                depth={menu.depth}
                                onMenuClick={onMenuClick}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

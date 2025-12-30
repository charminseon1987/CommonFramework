import { ReactElement, createElement } from "react";
import { MenuTreeNode } from "../types/menu.types";
import SubMenuTree from "./SubMenuTree";
interface MegaMenuProps {
    menuTree: MenuTreeNode[];
    isOpen: boolean;
    activeMenuId: string | null;
    onMenuClick: (menuId: string, pageURL?: string, depth?: number) => void;
}

export function MegaMenu({ menuTree, isOpen, activeMenuId, onMenuClick }: MegaMenuProps): ReactElement | null {
    if (!isOpen) return null;

    // 👉 depth 0 = 홈 옆에 나란히 나올 메뉴들
    const depth1Menus = menuTree.flatMap(m => m ?? []);

    return (
        <div className="mega-menu">
            {/* <ul className="mega-menu-depth-0" role="menu">
                {depth1Menus.map(menu => (
                    <li
                        key={menu.menuId}
                        className={classNames("horizontal-menu-item", "depth-0", {
                            active: activeMenuId === menu.menuId,
                            expanded: menu.isExpanded
                        })}
                        data-menu-id={menu.menuId}
                    >
                        <div
                            className="horizontal-menu-item-content"
                            role="button"
                            tabIndex={0}
                            onClick={() => onMenuClick(menu.menuId, menu.pageURL, 1)}
                        >
                            {menu.iconClass && (
                                <span className="nav-icon" aria-hidden="true">
                                    <i className={menu.iconClass} />
                                </span>
                            )}
                            <span className="horizontal-menu-item-label">{menu.menuName}</span>
                        </div>
                    </li>
                ))}
            </ul> */}
            <div className="mega-submenu-area">
                {depth1Menus.map(menu =>
                    menu.isExpanded && menu.children?.length ? (
                        <SubMenuTree
                            key={menu.menuId}
                            nodes={menu.children}
                            activeMenuId={activeMenuId}
                            depth={2}
                            onMenuClick={onMenuClick}
                        />
                    ) : null
                )}
            </div>
        </div>
    );
}

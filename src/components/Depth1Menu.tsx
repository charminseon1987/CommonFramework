import { createElement } from "react";
import { MenuTreeNode } from "../types/menu.types";
import classNames from "classnames";

interface Depth1MenuProps {
    menuTree: MenuTreeNode[];
    activeMenuId: string | null;
    onMenuClick: (menuId: string, pageURL?: string, depth?: number) => void;
}

export function Depth1Menu({ menuTree, activeMenuId, onMenuClick }: Depth1MenuProps) {
    // depth 1 = depth 0의 children
    const depth1Menus = menuTree.flatMap(root => root ?? []);

    if (!depth1Menus.length) return null;

    return (
        <ul className="horizontal-menu horizontal-menu-depth-0" role="menubar">
            {depth1Menus.map(menu => {
                const isActive = activeMenuId === menu.menuId;

                return (
                    <li
                        key={menu.menuId}
                        className={classNames("horizontal-menu-item", "depth-0", { active: isActive })}
                        data-menu-id={menu.menuId}
                        role="none"
                    >
                        <div
                            className="horizontal-menu-item-content"
                            role="menuitem"
                            tabIndex={0}
                            aria-current={isActive ? "page" : undefined}
                            onClick={() => onMenuClick(menu.menuId, menu.pageURL, menu.depth ?? 0)}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    onMenuClick(menu.menuId, menu.pageURL, menu.depth ?? 1);
                                }
                            }}
                        >
                            {/* 아이콘 */}
                            {menu.iconClass && (
                                <span className="nav-icon" aria-hidden="true">
                                    <i className={menu.iconClass} />
                                </span>
                            )}

                            {/* 메뉴명 */}
                            <span className="horizontal-menu-item-label" title={menu.menuName}>
                                {menu.menuName}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

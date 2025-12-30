import { ReactElement, createElement } from "react";
import { MenuTreeNode } from "../types/menu.types";
import classNames from "classnames";
interface SubMenuTreeProps {
    nodes: MenuTreeNode[];
    activeMenuId: string | null;
    depth: number;
    onMenuClick: (menuId: string, pageURL?: string, depth?: number) => void;
}

export default function SubMenuTree({ nodes, activeMenuId, depth, onMenuClick }: SubMenuTreeProps): ReactElement {
    return (
        <ul className={classNames("mega-submenu", `depth-${depth}`)} role="menu">
            {nodes.map(node => {
                const hasChildren = node.children && node.children.length > 0;

                return (
                    <li
                        key={node.menuId}
                        className={classNames("mega-submenu", `depth-${depth}`, {
                            active: activeMenuId === node.menuId,
                            expanded: node.isExpanded,
                            "has-children": hasChildren
                        })}
                        data-menu-id={node.menuId}
                    >
                        <div
                            className="mega-submenu-item"
                            role="button"
                            tabIndex={0}
                            onClick={() => onMenuClick(node.menuId, node.pageURL, depth)}
                        >
                            {node.iconClass && (
                                <span className="nav-icon" aria-hidden="true">
                                    <i className={node.iconClass} />
                                </span>
                            )}
                            <span className="mega-submenu-item">{node.menuName}</span>
                        </div>

                        {/* recursive */}
                        {hasChildren && node.isExpanded && (
                            <SubMenuTree
                                nodes={node.children!}
                                activeMenuId={activeMenuId}
                                depth={depth + 1}
                                onMenuClick={onMenuClick}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

// src/components/MenuTreeSelector.tsx

import { ReactElement, createElement, Fragment } from "react";
import classNames from "classnames";
import { MenuTreeNode } from "../types/menu.types";
import { StarToggleIcon } from "./StarToggleIcon";

interface MenuTreeSelectorProps {
    menuItems: MenuTreeNode[];
    selectedMenuIds: Set<string>;
    bookmarkedMenuIds: Set<string>;
    onToggleSelection: (menuId: string, menu: MenuTreeNode) => void;
    expandedIds: Set<string>;
    onToggleExpand: (menuId: string) => void;
    depth?: number;
}

export function MenuTreeSelector({
    menuItems,
    selectedMenuIds,
    bookmarkedMenuIds,
    onToggleSelection,
    expandedIds,
    onToggleExpand,
    depth = 0
}: MenuTreeSelectorProps): ReactElement {
    const renderMenuItem = (item: MenuTreeNode): ReactElement => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedIds.has(item.menuId);
        const isSelected = selectedMenuIds.has(item.menuId);
        const isBookmarked = bookmarkedMenuIds.has(item.menuId);
        const hasPageURL = !!item.pageURL;

        return (
            <li
                key={item.menuId}
                className={classNames("menu-tree-selector-item", `depth-${depth}`)}
            >
                <div
                    className={classNames("menu-tree-selector-content", {
                        "is-folder": !hasPageURL && hasChildren,
                        "is-bookmarked": isBookmarked
                    })}
                >
                    {/* Expand/Collapse Button */}
                    {hasChildren ? (
                        <button
                            type="button"
                            className={classNames("menu-tree-selector-expand-btn", {
                                expanded: isExpanded
                            })}
                            onClick={() => onToggleExpand(item.menuId)}
                            aria-label={isExpanded ? "접기" : "펼치기"}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                            </svg>
                        </button>
                    ) : (
                        <span className="menu-tree-selector-expand-placeholder" />
                    )}

                    {/* Star Toggle Icon - 모든 항목에 표시 */}
                    <StarToggleIcon
                        isSelected={isSelected}
                        isBookmarked={isBookmarked}
                        onClick={() => onToggleSelection(item.menuId, item)}
                    />

                    {/* Menu Name */}
                    <span
                        className={classNames("menu-tree-selector-name", {
                            bookmarked: isBookmarked
                        })}
                        onClick={() => {
                            if (!isBookmarked) {
                                onToggleSelection(item.menuId, item);
                            }
                        }}
                    >
                        {item.menuName}
                    </span>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <ul className="menu-tree-selector-children">
                        <MenuTreeSelector
                            menuItems={item.children}
                            selectedMenuIds={selectedMenuIds}
                            bookmarkedMenuIds={bookmarkedMenuIds}
                            onToggleSelection={onToggleSelection}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            depth={depth + 1}
                        />
                    </ul>
                )}
            </li>
        );
    };

    return (
        <Fragment>
            {menuItems.map(item => renderMenuItem(item))}
        </Fragment>
    );
}

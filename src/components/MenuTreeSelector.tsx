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
                        "is-bookmarked": isBookmarked,
                        "is-selected": isSelected
                    })}
                >
                    {/* Star Toggle Icon - 모든 항목에 표시 */}
                    <StarToggleIcon
                        isSelected={isSelected}
                        isBookmarked={isBookmarked}
                        onClick={() => {
                            // 북마크된 메뉴나 선택된 메뉴는 클릭 불가
                            if (!isBookmarked && !isSelected) {
                                onToggleSelection(item.menuId, item);
                            }
                        }}
                    />

                    {/* Menu Name */}
                    <span
                        className={classNames("menu-tree-selector-name", {
                            bookmarked: isBookmarked,
                            selected: isSelected
                        })}
                        onClick={() => {
                            // 북마크된 메뉴나 선택된 메뉴는 클릭 불가
                            if (!isBookmarked && !isSelected) {
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

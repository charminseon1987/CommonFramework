import { useEffect, useState, useRef } from "react";
import { ValueStatus, ObjectItem } from "mendix";
import { DynamicNavigationContainerProps } from "../types/widget.types";
import { MenuItemData } from "../types/menu.types";
import getMenuSource from "src/utils/getMenuSource";
import buildMenuData from "src/utils/buildMenuData";
import { buildResourceMap } from "src/utils/buildResourceMap";
import buildIconMap from "src/utils/buildIconMap";

export type MenuSourceItem = ObjectItem;

export function useMenuData(props: DynamicNavigationContainerProps, mode: "all" | "bookmark"): MenuItemData[] | null {
    const { menuDataSource, Resource, Icon, bookmark } = props;

    const [menuData, setMenuData] = useState<MenuItemData[] | null>(null);
    const previousMenuDataRef = useRef<MenuItemData[] | null>(null);

    useEffect(() => {
        if (!menuDataSource || menuDataSource.status !== ValueStatus.Available) return;

        const sourceItems = getMenuSource(mode, menuDataSource.items, bookmark?.items);
        const resourceMap = buildResourceMap(Resource);
        const iconImageMap = buildIconMap(Icon);

        const previousIconClassMap = new Map<string, string>();
        previousMenuDataRef.current?.forEach(item => {
            if (item.iconClass) {
                previousIconClassMap.set(item.menuId, item.iconClass);
            }
        });

        const result = buildMenuData(sourceItems, resourceMap, iconImageMap);

        setMenuData(result);
        previousMenuDataRef.current = result;
    }, [
        mode,
        menuDataSource?.status,
        menuDataSource?.items,
        bookmark?.items,
        Resource?.status,
        Resource?.items,
        Icon?.status,
        Icon?.items
    ]);

    return menuData;
}

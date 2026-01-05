import { useEffect, useState } from "react";
import { ValueStatus } from "mendix";
import { DynamicNavigationContainerProps } from "../types/widget.types";
import { MenuItemData } from "../types/menu.types";
import getMxAttributes from "src/components/utils/mxHelper";
import { ObjectItem } from "mendix";

/** Association value → GUID */
function getAssociatedGuid(value: any): string | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] ?? null;
    return value;
}

export function useMenuData(props: DynamicNavigationContainerProps): MenuItemData[] | null {
    const { menuDataSource, Resource } = props;
    const [menuData, setMenuData] = useState<MenuItemData[] | null>(null);

    useEffect(() => {
        if (menuDataSource.status !== ValueStatus.Available || Resource?.status !== ValueStatus.Available) {
            return;
        }

        /** Resource GUID → attributes */
        const resourceMap = new Map<string, Record<string, { value: any }>>();

        Resource.items?.forEach((resource: ObjectItem) => {
            resourceMap.set(resource.id, getMxAttributes(resource));
        });

        const result: MenuItemData[] =
            menuDataSource.items?.map((menu: ObjectItem) => {
                const attrs = getMxAttributes(menu);

                const resourceGuid = getAssociatedGuid(attrs["PortalModule.SyMenu_SyResource"]?.value);

                const resourceAttrs = resourceGuid ? resourceMap.get(resourceGuid) : undefined;

                return {
                    menuId: String(attrs.MenuId?.value ?? ""),
                    menuName: String(attrs.MenuName?.value ?? ""),
                    parentMenuId: attrs.ParentId?.value ?? null,
                    depth: Number(attrs.Depth?.value ?? 0),
                    sortNo: Number(attrs.SortNo?.value ?? 0),
                    displayYn: attrs.DisplayYn?.value ?? "Y",
                    enabledTF: attrs.EnableTF?.value !== false,

                    // 🔗 Resource에서 가져오는 값
                    pageURL: resourceAttrs?.PageUrl?.value,
                    resourceName: resourceAttrs?.ResourceName?.value,
                    resourceType: resourceAttrs?.ResourceType?.value,

                    guid: menu.id
                };
            }) ?? [];

        setMenuData(result);
    }, [menuDataSource.status, menuDataSource.items, Resource?.status, Resource?.items]);

    return menuData;
}

import { MenuItemData, ImageInfo } from "src/types/menu.types";
import getMxAttributes from "./mxHelper";
import { ObjectItem } from "mendix";

/** Association value → GUID */
function getAssociatedGuid(value: any): string | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] ?? null;
    return value;
}

export default function buildMenuData(
    menus: ObjectItem[],
    resourceMap: Map<string, Record<string, { value: any }>>,
    iconImageMap?: Map<string, ImageInfo>
): MenuItemData[] {
    return menus.map(menu => {
        const attrs = getMxAttributes(menu);

        const resourceGuid = getAssociatedGuid(attrs["PortalModule.SyMenu_SyResource"]?.value);
        const resourceAttrs = resourceGuid ? resourceMap.get(resourceGuid) : undefined;

        const iconGuid = getAssociatedGuid(attrs["PortalModule.SyMenu_Icon"]?.value || attrs["SyMenu_Icon"]?.value);

        const imageInfo = iconGuid && iconImageMap ? iconImageMap.get(String(iconGuid)) : undefined;

        return {
            menuId: String(attrs.MenuId?.value ?? ""),
            menuName: String(attrs.MenuName?.value ?? ""),
            parentMenuId: attrs.ParentId?.value ?? null,
            depth: Number(attrs.Depth?.value ?? 0),
            sortNo: Number(attrs.SortNo?.value ?? 0),
            displayYn: attrs.DisplayYn?.value ?? "Y",
            enabledTF: attrs.EnableTF?.value !== false,

            pageURL: resourceAttrs?.PageUrl?.value,
            resourceName: resourceAttrs?.ResourceName?.value,
            resourceType: resourceAttrs?.ResourceType?.value,
            iconClass: resourceAttrs?.IconClass?.value,

            imageInfo,
            guid: menu.id
        };
    });
}

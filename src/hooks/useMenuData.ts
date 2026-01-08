import { useEffect, useState } from "react";
import { ValueStatus } from "mendix";
import { DynamicNavigationContainerProps } from "../types/widget.types";
import { MenuItemData, ImageInfo } from "../types/menu.types";
import getMxAttributes from "src/components/utils/mxHelper";

/** Association value → GUID */
function getAssociatedGuid(value: any): string | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] ?? null;
    return value;
}

/** System.Image 또는 Icon 엔티티에서 이미지 정보 추출 */
function extractImageInfo(imageObj: any): ImageInfo | undefined {
    if (!imageObj) return undefined;

    try {
        const imageAttrs = getMxAttributes(imageObj);
        const guid = imageObj.id;

        // ChangedDate와 changedDate 모두 지원 (대소문자 처리)
        const changedDate = imageAttrs.ChangedDate?.value ?? imageAttrs.changedDate?.value;

        // Name 속성 (대문자 N)
        const name = imageAttrs.Name?.value;

        // PublicThumbnailPath 속성 (있으면 우선 사용)
        const publicThumbnailPath = imageAttrs.PublicThumbnailPath?.value || imageAttrs.publicThumbnailPath?.value;

        // GUID는 필수, ChangedDate와 Name은 선택적 (없어도 URL 생성 가능)
        if (guid) {
            return {
                guid: String(guid),
                changedDate: changedDate !== undefined ? Number(changedDate) : 0,
                name: name ? String(name) : "",
                publicThumbnailPath: publicThumbnailPath ? String(publicThumbnailPath) : undefined
            };
        }
    } catch (error) {
        console.warn("Failed to extract image info:", error, imageObj);
    }

    return undefined;
}

export function useMenuData(props: DynamicNavigationContainerProps): MenuItemData[] | null {
    const { menuDataSource, Resource, Icon } = props;
    const [menuData, setMenuData] = useState<MenuItemData[] | null>(null);
    console.log("icon", Icon);
    useEffect(() => {
        // 메뉴 데이터소스와 Resource가 사용 가능한지 확인
        if (menuDataSource.status !== ValueStatus.Available || Resource?.status !== ValueStatus.Available) {
            // 데이터가 아직 로드되지 않았으면 기존 데이터 유지 (새로고침 시 이미지 유지)
            if (menuDataSource.status === ValueStatus.Loading || Resource?.status === ValueStatus.Loading) {
                return;
            }
            // 에러 상태가 아니면 기존 데이터 유지
            return;
        }

        try {
            /** Resource GUID → attributes */
            const resourceMap = new Map<string, Record<string, { value: any }>>();

            if (Resource.items && Array.isArray(Resource.items)) {
                Resource.items.forEach(resource => {
                    try {
                        if (resource && resource.id) {
                            resourceMap.set(resource.id, getMxAttributes(resource));
                        }
                    } catch (error) {
                        console.warn("[Resource] Failed to process resource:", resource?.id, error);
                    }
                });
            }

            const result: MenuItemData[] =
                menuDataSource.items?.map(menu => {
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
                        pageURL: resourceAttrs?.PageUrl?.value,
                        resourceName: resourceAttrs?.ResourceName?.value,
                        resourceType: resourceAttrs?.ResourceType?.value,
                        iconClass: resourceAttrs?.IconClass?.value,

                        imageInfo: undefined,

                        guid: menu.id
                    };
                }) ?? [];

            setMenuData(result);
        } catch (error) {
            console.error("[MenuData] Error processing menu data:", error);
            // 에러가 발생해도 기존 데이터는 유지 (새로고침 시 이미지 유지)
        }
    }, [menuDataSource.status, menuDataSource.items, Resource?.status, Resource?.items]);

    useEffect(() => {
        if (Icon?.status !== ValueStatus.Available || !Icon.items || !menuData) {
            return;
        }

        const iconImageMap = new Map<string, ImageInfo>();

        Icon.items.forEach(icon => {
            const imageInfo = extractImageInfo(icon);
            console.log("imageInfo", imageInfo)
            console.log("icon", icon)
            if (imageInfo?.guid) {
                iconImageMap.set(String(icon.id), imageInfo);
            }
        });

        setMenuData(prev => {
            if (!prev) return prev;

            return prev.map(menu => {
                const attrs = getMxAttributes(menu);

                const iconGuid = getAssociatedGuid(
                    attrs["PortalModule.SyMenu_Icon"]?.value || attrs["SyMenu_Icon"]?.value || attrs["Icon"]?.value
                );

                if (iconGuid && iconImageMap.has(String(iconGuid))) {
                    return {
                        ...menu,
                        imageInfo: iconImageMap.get(String(iconGuid))
                    };
                }

                return menu;
            });
        });
    }, [Icon?.status, Icon?.items]);

    return menuData;
}

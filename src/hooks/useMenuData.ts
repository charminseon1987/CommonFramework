import { useEffect, useState, useRef } from "react";
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
    // 이전 menuData를 저장하여 iconClass 보존
    const previousMenuDataRef = useRef<MenuItemData[] | null>(null);

    useEffect(() => {
        // 메뉴 데이터소스가 사용 가능한지 확인 (Resource는 선택적)
        if (menuDataSource.status !== ValueStatus.Available) {
            // 메뉴 데이터가 로딩 중이면 기존 데이터 유지
            if (menuDataSource.status === ValueStatus.Loading) {
                return;
            }
            // 에러 상태가 아니면 기존 데이터 유지
            return;
        }

        // Resource가 있지만 아직 로딩 중이면 기존 데이터 유지 (iconClass 보존)
        if (Resource && Resource.status === ValueStatus.Loading) {
            return;
        }

        try {
            /** Resource GUID → attributes */
            const resourceMap = new Map<string, Record<string, { value: any }>>();

            if (Resource && Resource.items && Array.isArray(Resource.items)) {
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

            /** Icon GUID → ImageInfo */
            const iconImageMap = new Map<string, ImageInfo>();

            // Icon 데이터소스가 사용 가능하면 처리 (없어도 계속 진행)
            if (Icon?.status === ValueStatus.Available && Icon.items && Array.isArray(Icon.items)) {
                console.debug("[Icon] Icon datasource available, items count:", Icon.items.length);

                Icon.items.forEach(icon => {
                    try {
                        if (!icon || !icon.id) {
                            return;
                        }

                        // Icon 엔티티 자체가 System.Image를 상속하거나 직접 이미지 정보를 포함
                        // Icon 엔티티를 직접 extractImageInfo로 처리
                        const imageInfo = extractImageInfo(icon);

                        if (imageInfo && imageInfo.guid) {
                            // Icon ID를 문자열로 정규화하여 저장
                            const iconIdStr = String(icon.id);
                            iconImageMap.set(iconIdStr, imageInfo);
                            console.debug("[Icon] Successfully mapped Icon:", iconIdStr, "to ImageInfo:", imageInfo);
                        } else {
                            // 디버깅: 이미지 정보 추출 실패
                            const iconAttrs = getMxAttributes(icon);
                            const allAttrKeys = Object.keys(iconAttrs);
                            console.debug(
                                "[Icon] Failed to extract image info from Icon:",
                                icon.id,
                                "Available attributes:",
                                allAttrKeys
                            );
                        }
                    } catch (error) {
                        console.warn("[Icon] Error processing icon:", icon?.id, error);
                    }
                });

                console.debug(
                    "[Icon] Icon map size after processing:",
                    iconImageMap.size,
                    "Icon IDs:",
                    Array.from(iconImageMap.keys())
                );
            } else if (Icon) {
                // Icon 데이터소스가 있지만 아직 로드되지 않았거나 사용 불가
                console.debug("[Icon] Icon datasource status:", Icon.status, "Items:", Icon.items?.length ?? 0);
            }

            // 이전 menuData에서 menuId별 iconClass 맵 생성 (보존용)
            const previousIconClassMap = new Map<string, string>();
            if (previousMenuDataRef.current) {
                previousMenuDataRef.current.forEach(item => {
                    if (item.iconClass && item.iconClass.trim() !== "") {
                        previousIconClassMap.set(item.menuId, item.iconClass);
                    }
                });
            }

            const result =
                menuDataSource.items?.map(menu => {
                    try {
                        const attrs = getMxAttributes(menu);

                        const resourceGuid = getAssociatedGuid(attrs["PortalModule.SyMenu_SyResource"]?.value);

                        const resourceAttrs = resourceGuid ? resourceMap.get(resourceGuid) : undefined;

                        // 이미지 정보 추출 (여러 fallback 경로 시도)
                        let imageInfo: ImageInfo | undefined = undefined;

                        try {
                            // 1. Icon association을 통해 Icon GUID 찾기
                            const iconGuid = getAssociatedGuid(
                                attrs["PortalModule.SyMenu_Icon"]?.value ||
                                attrs["SyMenu_Icon"]?.value ||
                                attrs["Icon"]?.value ||
                                attrs["MenuIcon"]?.value
                            );

                            // 2. Icon Map에서 이미지 정보 조회
                            if (iconGuid) {
                                // Icon GUID를 문자열로 정규화하여 조회
                                const iconGuidStr = String(iconGuid);
                                if (iconImageMap.has(iconGuidStr)) {
                                    imageInfo = iconImageMap.get(iconGuidStr);
                                } else {
                                    // 타입 불일치 디버깅: Map의 키들과 비교
                                    const mapKeys = Array.from(iconImageMap.keys());
                                    const matchingKey = mapKeys.find(
                                        key => String(key) === iconGuidStr || key === iconGuid
                                    );
                                    if (matchingKey) {
                                        console.debug(
                                            "[Client] Found matching key with different type:",
                                            matchingKey,
                                            "Using it..."
                                        );
                                        imageInfo = iconImageMap.get(matchingKey);
                                    } else if (Icon?.status === ValueStatus.Available) {
                                        // Icon 데이터소스가 사용 가능한데 Map에 없으면 디버깅 로그만 출력 (에러 아님)
                                        console.debug(
                                            "[Client] Icon GUID found but not in map:",
                                            iconGuidStr,
                                            "Available Icon IDs:",
                                            Array.from(iconImageMap.keys())
                                        );
                                    }
                                }
                            }

                            // 3. Icon이 없거나 Icon Map에 없는 경우, 직접 이미지 association 확인
                            if (!imageInfo) {
                                const imageObj =
                                    attrs["System.Image"]?.value ||
                                    attrs["Image"]?.value ||
                                    attrs["PortalModule.SyMenu_Image"]?.value ||
                                    attrs["SyMenu_Image"]?.value ||
                                    resourceAttrs?.["System.Image"]?.value ||
                                    resourceAttrs?.["Image"]?.value;

                                if (imageObj) {
                                    try {
                                        // 이미지 객체가 직접 전달된 경우
                                        if (typeof imageObj === "object" && imageObj.id) {
                                            imageInfo = extractImageInfo(imageObj);
                                            if (!imageInfo) {
                                                // GUID만 있는 경우 fallback 시도
                                                const imageGuid = imageObj.id ? String(imageObj.id) : null;
                                                if (imageGuid) {
                                                    imageInfo = {
                                                        guid: imageGuid,
                                                        changedDate: 0,
                                                        name: ""
                                                    };
                                                }
                                            }
                                        } else {
                                            // GUID만 있는 경우 (fallback)
                                            const imageGuid = getAssociatedGuid(imageObj);
                                            if (imageGuid) {
                                                imageInfo = {
                                                    guid: String(imageGuid),
                                                    changedDate: 0,
                                                    name: ""
                                                };
                                            }
                                        }
                                    } catch (error) {
                                        console.warn("[Image] Error extracting image info from imageObj:", error);
                                        // GUID만 추출 시도
                                        try {
                                            const imageGuid = getAssociatedGuid(imageObj);
                                            if (imageGuid) {
                                                imageInfo = {
                                                    guid: String(imageGuid),
                                                    changedDate: 0,
                                                    name: ""
                                                };
                                            }
                                        } catch (fallbackError) {
                                            console.warn(
                                                "[Image] Fallback GUID extraction also failed:",
                                                fallbackError
                                            );
                                        }
                                    }
                                }
                            }

                            // 디버깅: 최종 이미지 정보 확인
                            if (imageInfo) {
                                console.debug(
                                    "[Image] Image info found for menu:",
                                    attrs.MenuName?.value,
                                    "GUID:",
                                    imageInfo.guid
                                );
                            }
                        } catch (error) {
                            console.warn(
                                "[Image] Error during image info extraction for menu:",
                                attrs.MenuName?.value,
                                error
                            );
                            // 에러가 발생해도 계속 진행 (이미지가 없어도 메뉴는 표시)
                        }

                        // iconClass 안전 처리: Resource에서 가져오거나, 없으면 이전 값 보존
                        const menuId = String(attrs.MenuId?.value ?? "");
                        let iconClass: string | undefined = undefined;

                        if (Resource?.status === ValueStatus.Available && resourceAttrs?.IconClass?.value) {
                            // Resource가 로드되었고 IconClass가 있으면 사용
                            const resourceIconClass = resourceAttrs.IconClass.value;
                            iconClass = resourceIconClass && String(resourceIconClass).trim() !== ""
                                ? String(resourceIconClass).trim()
                                : undefined;
                        }

                        // Resource에서 iconClass를 가져오지 못했으면 이전 값 보존
                        if (!iconClass && previousIconClassMap.has(menuId)) {
                            iconClass = previousIconClassMap.get(menuId);
                        }

                        return {
                            menuId: menuId,
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
                            iconClass: iconClass,

                            imageInfo: undefined,

                            guid: menu.id
                        };
                    } catch (error) {
                        console.warn("[MenuData] Error processing menu item:", menu?.id, error);
                        return null;
                    }
                }).filter(item => item !== null) as MenuItemData[] ?? [];

            // menuData 업데이트 및 이전 데이터 참조 업데이트
            setMenuData(result);
            previousMenuDataRef.current = result;
        } catch (error) {
            console.error("[MenuData] Error processing menu data:", error);
            // 에러가 발생해도 기존 데이터는 유지 (새로고침 시 이미지 유지)
        }
    }, [menuDataSource.status, menuDataSource.items, Resource?.status, Resource?.items]);


    return menuData;
}

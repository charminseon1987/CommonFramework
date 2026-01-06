import { useEffect, useState } from "react";
import { ValueStatus } from "mendix";
import { DynamicNavigationContainerProps } from "../types/widget.types";
import { MenuItemData, ImageInfo } from "../types/menu.types";

/** Mendix 내부 attribute 추출 */
function getMxAttributes(item: any): Record<string, { value: any }> {
    const symbol = Object.getOwnPropertySymbols(item).find(sym => sym.toString().includes("mxObject"));

    return symbol ? item[symbol]?._jsonData?.attributes ?? {} : {};
}

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
        const changedDate = 
            imageAttrs.ChangedDate?.value ?? 
            imageAttrs.changedDate?.value;
        
        // Name 속성 (대문자 N)
        const name = imageAttrs.Name?.value;
        
        // PublicThumbnailPath 속성 (있으면 우선 사용)
        const publicThumbnailPath = 
            imageAttrs.PublicThumbnailPath?.value ||
            imageAttrs.publicThumbnailPath?.value;
        
        // GUID는 필수, ChangedDate와 Name은 선택적 (없어도 URL 생성 가능)
        if (guid) {
            return {
                guid: String(guid),
                changedDate: changedDate !== undefined ? Number(changedDate) : 0,
                name: name ? String(name) : '',
                publicThumbnailPath: publicThumbnailPath ? String(publicThumbnailPath) : undefined
            };
        }
    } catch (error) {
        console.warn('Failed to extract image info:', error, imageObj);
    }
    
    return undefined;
}

export function useMenuData(props: DynamicNavigationContainerProps): MenuItemData[] | null {
    const { menuDataSource, Resource, Icon } = props;
    const [menuData, setMenuData] = useState<MenuItemData[] | null>(null);

    useEffect(() => {
        if (menuDataSource.status !== ValueStatus.Available || Resource?.status !== ValueStatus.Available) {
            return;
        }

        /** Resource GUID → attributes */
        const resourceMap = new Map<string, Record<string, { value: any }>>();

        Resource.items?.forEach(resource => {
            resourceMap.set(resource.id, getMxAttributes(resource));
        });

        /** Icon GUID → ImageInfo */
        const iconImageMap = new Map<string, ImageInfo>();

        if (Icon?.status === ValueStatus.Available && Icon.items) {
            console.debug('[Icon] Icon datasource available, items count:', Icon.items.length);
            
            Icon.items.forEach(icon => {
                // Icon 엔티티 자체가 System.Image를 상속하거나 직접 이미지 정보를 포함
                // Icon 엔티티를 직접 extractImageInfo로 처리
                const imageInfo = extractImageInfo(icon);
                
                if (imageInfo) {
                    // Icon ID를 문자열로 정규화하여 저장
                    const iconIdStr = String(icon.id);
                    iconImageMap.set(iconIdStr, imageInfo);
                    console.debug('[Icon] Successfully mapped Icon:', iconIdStr, 'to ImageInfo:', imageInfo);
                } else {
                    // 디버깅: 이미지 정보 추출 실패
                    const iconAttrs = getMxAttributes(icon);
                    const allAttrKeys = Object.keys(iconAttrs);
                    console.warn('[Icon] Failed to extract image info from Icon:', icon.id, 'Available attributes:', allAttrKeys);
                }
            });
            
            console.debug('[Icon] Icon map size after processing:', iconImageMap.size, 'Icon IDs:', Array.from(iconImageMap.keys()));
        } else {
            // 디버깅: Icon 데이터소스가 없거나 사용 불가
            console.warn('[Icon] Icon datasource not available. Status:', Icon?.status, 'Items:', Icon?.items?.length ?? 0);
        }

        const result: MenuItemData[] =
            menuDataSource.items?.map(menu => {
                const attrs = getMxAttributes(menu);

                const resourceGuid = getAssociatedGuid(attrs["PortalModule.SyMenu_SyResource"]?.value);

                const resourceAttrs = resourceGuid ? resourceMap.get(resourceGuid) : undefined;

                // 이미지 정보 추출
                // 1. Icon association을 통해 Icon GUID 찾기
                const iconGuid = getAssociatedGuid(
                    attrs["PortalModule.SyMenu_Icon"]?.value ||
                    attrs["SyMenu_Icon"]?.value ||
                    attrs["Icon"]?.value ||
                    attrs["MenuIcon"]?.value
                );

                let imageInfo: ImageInfo | undefined = undefined;

                // 2. Icon Map에서 이미지 정보 조회
                if (iconGuid) {
                    // Icon GUID를 문자열로 정규화하여 조회
                    const iconGuidStr = String(iconGuid);
                    if (iconImageMap.has(iconGuidStr)) {
                        imageInfo = iconImageMap.get(iconGuidStr);
                    } else {
                        // 디버깅: Icon GUID는 있지만 Map에 없음
                        console.warn('[Client] Icon GUID found but not in map:', iconGuidStr, 'Type:', typeof iconGuid, 'Available Icon IDs:', Array.from(iconImageMap.keys()));
                        console.warn('[Client] Icon datasource status:', Icon?.status, 'Icon items count:', Icon?.items?.length ?? 0);
                        
                        // 타입 불일치 디버깅: Map의 키들과 비교
                        const mapKeys = Array.from(iconImageMap.keys());
                        const matchingKey = mapKeys.find(key => String(key) === iconGuidStr || key === iconGuid);
                        if (matchingKey) {
                            console.warn('[Client] Found matching key with different type:', matchingKey, 'Using it...');
                            imageInfo = iconImageMap.get(matchingKey);
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
                        // 이미지 객체가 직접 전달된 경우
                        if (typeof imageObj === 'object' && imageObj.id) {
                            imageInfo = extractImageInfo(imageObj);
                            if (!imageInfo) {
                                console.debug('Failed to extract image info from direct image object:', imageObj);
                            }
                        } else {
                            // GUID만 있는 경우 (fallback)
                            const imageGuid = getAssociatedGuid(imageObj);
                            if (imageGuid) {
                                imageInfo = {
                                    guid: String(imageGuid),
                                    changedDate: 0,
                                    name: ''
                                };
                            }
                        }
                    }
                }

                // 디버깅: 최종 이미지 정보 확인
                if (imageInfo) {
                    console.debug('Image info found for menu:', attrs.MenuName?.value, imageInfo);
                }

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
                    iconClass: resourceAttrs?.IconClass?.value,

                    // 이미지 정보
                    imageInfo: imageInfo,

                    guid: menu.id
                };
            }) ?? [];

        setMenuData(result);
    }, [menuDataSource.status, menuDataSource.items, Resource?.status, Resource?.items, Icon?.status, Icon?.items]);

    return menuData;
}

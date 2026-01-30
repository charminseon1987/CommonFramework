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

        let result = buildMenuData(sourceItems, resourceMap, iconImageMap);

        // 북마크 모드일 때 originalMenuId로 pageURL 복원
        if (mode === "bookmark" && menuDataSource.items) {
            // 원본 메뉴 데이터 로드
            const allMenuItems = menuDataSource.items;
            const allMenuData = buildMenuData(allMenuItems, resourceMap, iconImageMap);
            
            // originalMenuId로 pageURL 복원
            const originalMenuMap = new Map<string, MenuItemData>();
            allMenuData.forEach(menu => {
                originalMenuMap.set(menu.menuId, menu);
            });

            // 디버깅: 북마크 데이터 확인
            console.log("[useMenuData] 북마크 모드 - 북마크 항목 수:", result.length);
            result.forEach(item => {
                if (!item.pageURL) {
                    console.log(`[useMenuData] pageURL 없는 항목: menuId=${item.menuId}, originalMenuId=${item.originalMenuId}, menuName=${item.menuName}`);
                }
            });

            result = result.map(bookmarkItem => {
                // pageURL이 없는 경우 원본 메뉴에서 복원 시도
                if (!bookmarkItem.pageURL) {
                    // originalMenuId가 있으면 우선 사용, 없으면 menuId 사용 (폴더가 아닌 경우)
                    const lookupId = bookmarkItem.originalMenuId || 
                        (bookmarkItem.menuId && !bookmarkItem.menuId.startsWith("folder-") 
                            ? bookmarkItem.menuId 
                            : null);
                    
                    if (lookupId) {
                        const originalMenu = originalMenuMap.get(lookupId);
                        if (originalMenu && originalMenu.pageURL) {
                            console.log(`[useMenuData] pageURL 복원: menuId=${bookmarkItem.menuId}, lookupId=${lookupId}, pageURL=${originalMenu.pageURL}`);
                            return {
                                ...bookmarkItem,
                                pageURL: originalMenu.pageURL,
                                resourceName: originalMenu.resourceName,
                                resourceType: originalMenu.resourceType,
                                iconClass: originalMenu.iconClass || bookmarkItem.iconClass,
                                resourceEnabledTF: originalMenu.resourceEnabledTF
                            };
                        } else {
                            console.warn(`[useMenuData] 원본 메뉴를 찾을 수 없음: lookupId=${lookupId}, menuId=${bookmarkItem.menuId}`);
                        }
                    } else {
                        // 폴더로 추정 (menuId가 folder-로 시작하거나 lookupId가 없음)
                        console.log(`[useMenuData] 폴더로 추정: menuId=${bookmarkItem.menuId}, menuName=${bookmarkItem.menuName}`);
                    }
                }
                return bookmarkItem;
            });
        }

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

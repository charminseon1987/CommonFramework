// utils/menu/buildIconMap.ts
import { ValueStatus } from "mendix";
import { ImageInfo } from "src/types/menu.types";
import getMxAttributes from "./mxHelper";

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

export default function buildIconMap(Icon?: { status?: ValueStatus; items?: any[] }): Map<string, ImageInfo> {
    const map = new Map<string, ImageInfo>();

    if (!Icon || Icon.status !== ValueStatus.Available || !Array.isArray(Icon.items)) {
        return map;
    }

    Icon.items.forEach(icon => {
        if (!icon?.id) return;

        try {
            const imageInfo = extractImageInfo(icon);
            if (imageInfo?.guid) {
                map.set(String(icon.id), imageInfo);
            }
        } catch (e) {
            console.warn("[IconMap] Failed:", icon?.id, e);
        }
    });

    return map;
}

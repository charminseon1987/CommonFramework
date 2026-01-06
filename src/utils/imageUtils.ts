// utils/imageUtils.ts

import { ImageInfo } from '../types/menu.types';

/**
 * Mendix 이미지 URL 생성
 * System.Image 엔티티의 정보를 기반으로 Mendix 표준 이미지 URL을 생성합니다.
 * PublicThumbnailPath가 있으면 우선 사용합니다.
 * 
 * @param imageInfo - System.Image 엔티티의 이미지 정보 (GUID, ChangedDate, Name, PublicThumbnailPath)
 * @param thumb - 썸네일 이미지 여부 (기본값: true)
 * @returns Mendix 이미지 URL
 * 
 * @example
 * const url = buildMendixImageUrl({
 *   guid: '17451448556099349',
 *   changedDate: 1767674661110,
 *   name: 'login.png'
 * }, true);
 * // 결과: 'http://localhost:8080/file?guid=17451448556099349&changedDate=1767674661110&name=login.png&thumb=true'
 */
export function buildMendixImageUrl(imageInfo: ImageInfo, thumb: boolean = true): string {
    // PublicThumbnailPath가 있으면 우선 사용
    if (imageInfo.publicThumbnailPath) {
        // 절대 URL이면 그대로 사용, 상대 URL이면 baseUrl 추가
        if (imageInfo.publicThumbnailPath.startsWith('http://') || imageInfo.publicThumbnailPath.startsWith('https://')) {
            return imageInfo.publicThumbnailPath;
        }
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}${imageInfo.publicThumbnailPath}`;
    }
    
    // PublicThumbnailPath가 없으면 기존 방식 사용
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
        guid: imageInfo.guid
    });
    
    // ChangedDate와 Name이 있으면 추가
    if (imageInfo.changedDate) {
        params.append('changedDate', imageInfo.changedDate.toString());
    }
    if (imageInfo.name) {
        params.append('name', imageInfo.name);
    }
    
    if (thumb) {
        params.append('thumb', 'true');
    }
    
    return `${baseUrl}/file?${params.toString()}`;
}


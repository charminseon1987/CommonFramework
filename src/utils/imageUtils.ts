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
    try {
        // imageInfo 유효성 검사
        if (!imageInfo || !imageInfo.guid) {
            console.warn('[ImageUtils] Invalid imageInfo provided:', imageInfo);
            return '';
        }

        // PublicThumbnailPath가 있으면 우선 사용
        if (imageInfo.publicThumbnailPath) {
            try {
                // 절대 URL이면 그대로 사용, 상대 URL이면 baseUrl 추가
                if (imageInfo.publicThumbnailPath.startsWith('http://') || imageInfo.publicThumbnailPath.startsWith('https://')) {
                    return imageInfo.publicThumbnailPath;
                }
                
                // baseUrl 안전하게 가져오기
                const baseUrl = getBaseUrl();
                if (!baseUrl) {
                    console.warn('[ImageUtils] Cannot determine baseUrl for publicThumbnailPath');
                    return imageInfo.publicThumbnailPath; // baseUrl이 없어도 상대 경로 반환
                }
                
                // 상대 경로가 /로 시작하지 않으면 추가
                const path = imageInfo.publicThumbnailPath.startsWith('/') 
                    ? imageInfo.publicThumbnailPath 
                    : `/${imageInfo.publicThumbnailPath}`;
                
                return `${baseUrl}${path}`;
            } catch (error) {
                console.warn('[ImageUtils] Error processing publicThumbnailPath:', error);
                // fallback으로 기존 방식 사용
            }
        }
        
        // PublicThumbnailPath가 없으면 기존 방식 사용
        const baseUrl = getBaseUrl();
        if (!baseUrl) {
            console.warn('[ImageUtils] Cannot determine baseUrl, returning empty string');
            return '';
        }

        try {
            const params = new URLSearchParams({
                guid: String(imageInfo.guid)
            });
            
            // ChangedDate와 Name이 있으면 추가
            if (imageInfo.changedDate && imageInfo.changedDate > 0) {
                params.append('changedDate', String(imageInfo.changedDate));
            }
            if (imageInfo.name && imageInfo.name.trim() !== '') {
                params.append('name', String(imageInfo.name));
            }
            
            if (thumb) {
                params.append('thumb', 'true');
            }
            
            return `${baseUrl}/file?${params.toString()}`;
        } catch (error) {
            console.warn('[ImageUtils] Error building URL params:', error);
            // 최소한의 URL이라도 반환
            return `${baseUrl}/file?guid=${encodeURIComponent(String(imageInfo.guid))}`;
        }
    } catch (error) {
        console.error('[ImageUtils] Unexpected error in buildMendixImageUrl:', error);
        return '';
    }
}

/**
 * 안전하게 baseUrl 가져오기
 * 새로고침 시 window.location.origin이 아직 준비되지 않았을 수 있으므로 재시도 로직 포함
 */
function getBaseUrl(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    try {
        // window.location.origin이 있으면 사용
        if (window.location && window.location.origin) {
            return window.location.origin;
        }

        // window.location.origin이 없으면 protocol + hostname + port로 구성
        if (window.location) {
            const protocol = window.location.protocol || 'http:';
            const hostname = window.location.hostname || 'localhost';
            const port = window.location.port ? `:${window.location.port}` : '';
            return `${protocol}//${hostname}${port}`;
        }

        return '';
    } catch (error) {
        console.warn('[ImageUtils] Error getting baseUrl:', error);
        return '';
    }
}


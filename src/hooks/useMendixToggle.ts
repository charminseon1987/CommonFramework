import { useEffect, useRef, useCallback } from "react";

/**
 * Mendix toggle 버튼을 찾는 유연한 로직
 * 클래스명이 변경 가능하므로 여러 방법으로 시도
 */
const findMendixToggleButton = (): HTMLButtonElement | null => {
    // 방법 1: aria-label="Toggle Menu" 또는 title="Toggle Menu" 속성으로 찾기
    const byAriaLabel = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Toggle Menu"], button[title="Toggle Menu"]'
    );
    if (byAriaLabel) return byAriaLabel;

    // 방법 2: aria-controls 속성이 있고 값이 -toggleable로 끝나는 패턴
    const byAriaControls = document.querySelector<HTMLButtonElement>(
        'button[aria-controls*="-toggleable"]'
    );
    if (byAriaControls) return byAriaControls;

    // 방법 3: aria-expanded 속성을 가진 버튼 중에서 적절한 것 선택
    // (aria-haspopup="menu" 속성도 함께 있는 것이 더 정확)
    const byAriaExpanded = document.querySelector<HTMLButtonElement>(
        'button[aria-expanded][aria-haspopup="menu"]'
    );
    if (byAriaExpanded) return byAriaExpanded;

    // 방법 4: 마지막 시도 - aria-expanded 속성만 있는 버튼
    const byExpandedOnly = document.querySelector<HTMLButtonElement>(
        'button[aria-expanded]'
    );
    if (byExpandedOnly) return byExpandedOnly;

    return null;
};

interface UseMendixToggleOptions {
    onCollapse: () => void;
    onExpand: () => void;
    enabled?: boolean;
}

/**
 * Mendix toggle 버튼의 aria-expanded 속성 변화를 감지하는 hook
 */
export function useMendixToggle({
    onCollapse,
    onExpand,
    enabled = true
}: UseMendixToggleOptions): void {
    const observerRef = useRef<MutationObserver | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const retryTimeoutRef = useRef<number | null>(null);
    const lastExpandedStateRef = useRef<boolean | null>(null);

    // 버튼 찾기 및 Observer 설정
    const setupObserver = useCallback(() => {
        // 기존 observer 정리
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        // 기존 timeout 정리
        if (retryTimeoutRef.current !== null) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        if (!enabled) return;

        const button = findMendixToggleButton();

        if (!button) {
            // 버튼을 찾지 못했으면 재시도 (DOM이 아직 로드되지 않았을 수 있음)
            retryTimeoutRef.current = window.setTimeout(() => {
                setupObserver();
            }, 500);
            return;
        }

        buttonRef.current = button;

        // 현재 상태 저장
        const currentExpanded = button.getAttribute("aria-expanded") === "true";
        lastExpandedStateRef.current = currentExpanded;

        // MutationObserver 설정
        observerRef.current = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "aria-expanded"
                ) {
                    const target = mutation.target as HTMLButtonElement;
                    const isExpanded = target.getAttribute("aria-expanded") === "true";

                    // 이전 상태와 다를 때만 콜백 실행
                    if (lastExpandedStateRef.current !== isExpanded) {
                        lastExpandedStateRef.current = isExpanded;

                        if (isExpanded) {
                            // 펼쳐짐
                            onExpand();
                        } else {
                            // 접힘
                            onCollapse();
                        }
                    }
                }
            });
        });

        // aria-expanded 속성 변화 감지
        observerRef.current.observe(button, {
            attributes: true,
            attributeFilter: ["aria-expanded"]
        });
    }, [enabled, onCollapse, onExpand]);

    useEffect(() => {
        setupObserver();

        // 컴포넌트 언마운트 시 정리
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
            if (retryTimeoutRef.current !== null) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
        };
    }, [setupObserver]);
}

import { ReactElement, createElement } from "react";

interface CollapseButtonProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function CollapseButton({ collapsed, onToggle }: CollapseButtonProps): ReactElement {
    return (
        <button
            className="nav-toggle-btn"
            onClick={onToggle}
            title={collapsed ? "사이드바 넓히기" : "사이드바 줄이기"}
            aria-label={collapsed ? "사이드바 넓히기" : "사이드바 줄이기"}
            type="button"
        >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="nav-toggle-icon">
                {collapsed ? (
                    <path
                        d="M4 2L8 6L4 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ) : (
                    <path
                        d="M8 2L4 6L8 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
            </svg>
        </button>
    );
}

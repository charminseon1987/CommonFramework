// src/components/BookmarkSettingsButton.tsx

import { ReactElement, createElement } from "react";
import classNames from "classnames";

interface BookmarkSettingsButtonProps {
    isEditMode: boolean;
    onToggleEditMode: () => void;
    className?: string;
}

export default function BookmarkSettingsButton({
    isEditMode,
    onToggleEditMode,
    className
}: BookmarkSettingsButtonProps): ReactElement {
    return (
        <button
            className={classNames("nav-bookmark-settings-btn", className, {
                "edit-mode": isEditMode
            })}
            onClick={onToggleEditMode}
            type="button"
            aria-label={isEditMode ? "편집 모드 종료" : "북마크 편집"}
            aria-pressed={isEditMode}
        >
            <span className="nav-bookmark-settings-icon">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={classNames({ rotating: isEditMode })}
                >
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                    <path
                        d="M8 2L8.5 3.5L10 4L8.5 4.5L8 6L7.5 4.5L6 4L7.5 3.5L8 2Z"
                        fill="currentColor"
                    />
                    <path
                        d="M14 8L12.5 8.5L12 10L11.5 8.5L10 8L11.5 7.5L12 6L12.5 7.5L14 8Z"
                        fill="currentColor"
                    />
                    <path
                        d="M8 14L8.5 12.5L10 12L8.5 11.5L8 10L7.5 11.5L6 12L7.5 12.5L8 14Z"
                        fill="currentColor"
                    />
                    <path
                        d="M2 8L3.5 7.5L4 6L4.5 7.5L6 8L4.5 8.5L4 10L3.5 8.5L2 8Z"
                        fill="currentColor"
                    />
                </svg>
            </span>
            <span className="nav-bookmark-settings-text">북마크 설정</span>
        </button>
    );
}

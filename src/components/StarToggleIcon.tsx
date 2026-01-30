// src/components/StarToggleIcon.tsx

import { ReactElement, createElement } from "react";
import classNames from "classnames";

interface StarToggleIconProps {
    isSelected: boolean;
    isBookmarked: boolean;
    onClick: (e: React.MouseEvent) => void;
    disabled?: boolean;
}

export function StarToggleIcon({
    isSelected,
    isBookmarked,
    onClick,
    disabled = false
}: StarToggleIconProps): ReactElement {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!disabled && !isBookmarked) {
            onClick(e);
        }
    };

    const isChecked = isSelected || isBookmarked;

    return (
        <label
            className={classNames("menu-tree-selector-checkbox", {
                selected: isSelected,
                bookmarked: isBookmarked,
                disabled: disabled || isBookmarked
            })}
            onClick={handleClick}
            aria-label={isBookmarked ? "이미 북마크됨" : isSelected ? "북마크 해제" : "북마크 추가"}
        >
            <input
                type="checkbox"
                checked={isChecked}
                disabled={disabled || isBookmarked}
                onChange={() => {}} // onClick에서 처리
                onClick={handleClick}
            />
            <span className="checkmark"></span>
        </label>
    );
}

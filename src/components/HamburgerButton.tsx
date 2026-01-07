import { createElement } from "react";
import classNames from "classnames";

type Props = {
    onClick: () => void;
    isOpen?: boolean; // ⭐ 추가
};

export default function HamburgerButton({ onClick, isOpen = false }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={classNames("hamburger-btn", {
                "is-open": isOpen
            })}
        >
            <span className="hamburger-icon">
                <span className="hamburger-line" />
                <span className="hamburger-line" />
                <span className="hamburger-line" />
            </span>
        </button>
    );
}

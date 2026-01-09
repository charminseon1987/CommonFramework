// components/NavigationTabs.tsx
import { createElement } from "react";
import classNames from "classnames";

export type NavigationTabKey = "all" | "bookmark";

interface NavigationTabsProps {
    value: NavigationTabKey;
    onChange: (tab: NavigationTabKey) => void;
}

export default function NavigationTab({ value, onChange }: NavigationTabsProps) {
    return (
        <div className="nav-tabs">
            <button
                type="button"
                className={classNames("nav-tab", { active: value === "all" })}
                onClick={() => onChange("all")}
            >
                메뉴
            </button>

            <button
                type="button"
                className={classNames("nav-tab", { active: value === "bookmark" })}
                onClick={() => onChange("bookmark")}
            >
                ⭐
            </button>
        </div>
    );
}
import { ObjectItem } from "mendix";
export type MenuSourceItem = ObjectItem;

export default function getMenuSource(
    mode: "all" | "bookmark",
    menuItems?: MenuSourceItem[],
    bookmarkItems?: MenuSourceItem[]
): MenuSourceItem[] {
    if (mode === "bookmark") {
        return bookmarkItems ?? [];
    }
    return menuItems ?? [];
}

/**
 * This file was generated from DynamicNavigation.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, ListValue } from "mendix";

export type LayoutEnum = "vertical" | "horizontal" | "topbar_fullwidth";

export interface DynamicNavigationContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    menuDataSource: ListValue;
    bookmark: ListValue;
    Resource: ListValue;
    Icon?: ListValue;
    layout: LayoutEnum;
    maxDepth: number;
    sidebarWidth: string;
    topbarHeight: string;
    collapsible: boolean;
    onLogout?: ActionValue;
    onAuthFailed?: ActionValue;
    expandedByDefault: boolean;
    autoExpandActivePath: boolean;
    enableDynamicAuth: boolean;
    onBookmarkReorganize?: ActionValue;
    bookmarkJson: string;
    themeColor: string;
    showDepthIndicator: boolean;
    animationDuration: number;
    customClass: string;
    enableKeyboardNav: boolean;
    cacheDuration: number;
    debugMode: boolean;
}

export interface DynamicNavigationPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    menuDataSource: {} | { caption: string } | { type: string } | null;
    bookmark: {} | { caption: string } | { type: string } | null;
    Resource: {} | { caption: string } | { type: string } | null;
    Icon: {} | { caption: string } | { type: string } | null;
    layout: LayoutEnum;
    maxDepth: number | null;
    sidebarWidth: string;
    topbarHeight: string;
    collapsible: boolean;
    onLogout: {} | null;
    onAuthFailed: {} | null;
    expandedByDefault: boolean;
    autoExpandActivePath: boolean;
    enableDynamicAuth: boolean;
    onBookmarkReorganize: {} | null;
    bookmarkJson: string;
    themeColor: string;
    showDepthIndicator: boolean;
    animationDuration: number | null;
    customClass: string;
    enableKeyboardNav: boolean;
    cacheDuration: number | null;
    debugMode: boolean;
}

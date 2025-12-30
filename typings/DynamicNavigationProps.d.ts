/**
 * This file was generated from DynamicNavigation.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, ListValue } from "mendix";

export interface CurrentUserType {

}

export type LayoutEnum = "vertical" | "horizontal" | "topbar_fullwidth";

export interface CurrentUserPreviewType {

}

export interface DynamicNavigationContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    menuDataSource: ListValue;
    currentUser: CurrentUserType[];
    Resource: ListValue;
    layout: LayoutEnum;
    sidebarWidth: string;
    topbarHeight: string;
    collapsible: boolean;
    onMenuClick?: ActionValue;
    onAuthFailed?: ActionValue;
    expandedByDefault: boolean;
    autoExpandActivePath: boolean;
    maxDepth: number;
    enableDynamicAuth: boolean;
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
    currentUser: CurrentUserPreviewType[];
    Resource: {} | { caption: string } | { type: string } | null;
    layout: LayoutEnum;
    sidebarWidth: string;
    topbarHeight: string;
    collapsible: boolean;
    onMenuClick: {} | null;
    onAuthFailed: {} | null;
    expandedByDefault: boolean;
    autoExpandActivePath: boolean;
    maxDepth: number | null;
    enableDynamicAuth: boolean;
    themeColor: string;
    showDepthIndicator: boolean;
    animationDuration: number | null;
    customClass: string;
    enableKeyboardNav: boolean;
    cacheDuration: number | null;
    debugMode: boolean;
}

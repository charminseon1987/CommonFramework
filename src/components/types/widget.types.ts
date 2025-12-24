// types/widget.types.ts

import { ActionValue, ListValue, ListAttributeValue } from 'mendix';
import { Big } from 'big.js';

/**
 * Widget Props 인터페이스
 * (XML에서 정의한 properties를 TypeScript로 매핑)
 */
export interface DynamicNavigationContainerProps {
  // Data Source
  menuDataSource: ListValue;
  currentUser?: ListValue;
  
  // Attributes
  menuId: ListAttributeValue<string>;
  menuName: ListAttributeValue<string>;
  menuDepth: ListAttributeValue<Big>;
  parentMenuId: ListAttributeValue<string>;
  sortNo: ListAttributeValue<Big>;
  leftNo?: ListAttributeValue<Big>;
  rightNo?: ListAttributeValue<Big>;
  displayYn?: ListAttributeValue<string>;
  enabledTF?: ListAttributeValue<boolean>;
  
  // Resource Attributes
  resourceName?: ListAttributeValue<string>;
  resourceType?: ListAttributeValue<string>;
  pageURL?: ListAttributeValue<string>;
  iconClass?: ListAttributeValue<string>;
  resourceEnabledTF?: ListAttributeValue<boolean>;
  
  // Layout
  layout: 'vertical' | 'horizontal';
  position: 'left' | 'top';
  sidebarWidth: string;
  topbarHeight: string;
  collapsible: boolean;
  
  // Behavior
  onMenuClick: ActionValue;
  onAuthFailed?: ActionValue;
  expandedByDefault: boolean;
  autoExpandActivePath: boolean;
  maxDepth: number;
  enableDynamicAuth: boolean;
  
  // Appearance
  themeColor: string;
  showDepthIndicator: boolean;
  animationDuration: number;
  customClass?: string;
  
  // Advanced
  enableKeyboardNav: boolean;
  cacheDuration: number;
  debugMode: boolean;
}

/**
 * Preview Props (Studio Pro 에디터용)
 */
export interface DynamicNavigationPreviewProps {
  layout: 'vertical' | 'horizontal';
  position: 'left' | 'top';
  sidebarWidth: string;
  topbarHeight: string;
  themeColor: string;
}
import { ReactElement, createElement } from "react";
import { HelloWorldSample } from "./components/HelloWorldSample";

import { DynamicNavigationContainerProps } from "../typings/DynamicNavigationProps";

import "./ui/DynamicNavigation.css";

export function DynamicNavigation({ sampleText }: DynamicNavigationContainerProps): ReactElement {
    return <HelloWorldSample sampleText={sampleText ? sampleText : "World"} />;
}

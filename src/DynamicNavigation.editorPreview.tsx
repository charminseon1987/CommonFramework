import { ReactElement, createElement } from "react";
import { HelloWorldSample } from "./components/HelloWorldSample";
import { DynamicNavigationPreviewProps } from "../typings/DynamicNavigationProps";

export function preview({ sampleText }: DynamicNavigationPreviewProps): ReactElement {
    return <HelloWorldSample sampleText={sampleText} />;
}

export function getPreviewCss(): string {
    return require("./ui/DynamicNavigation.css");
}

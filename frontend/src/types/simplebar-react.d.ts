declare module "simplebar-react" {
  import * as React from "react";

  export interface SimpleBarProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    autoHide?: boolean;
    forceVisible?: boolean | "x" | "y";
    timeout?: number;
    clickOnTrack?: boolean;
    scrollbarMinSize?: number;
    scrollbarMaxSize?: number;
    direction?: "rtl" | "ltr";
  }

  export default class SimpleBar extends React.Component<SimpleBarProps> {}
}

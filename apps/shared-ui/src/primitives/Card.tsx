import clsx from "clsx";
import type { ReactNode } from "react";
import type { CSSProperties } from "react";
import { forwardRef } from "react";

export type CardProps = {
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, children, style }, ref) => (
  <div
    ref={ref}
    style={style}
    className={clsx("rounded-lg border border-slate-800 bg-slate-900/60", className)}
  >
    {children}
  </div>
));

Card.displayName = "Card";

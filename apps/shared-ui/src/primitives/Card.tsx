import clsx from "clsx";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...rest }, ref) => (
  <div
    ref={ref}
    // Forward native events/attrs (e.g., drag/drop handlers, aria props).
    {...rest}
    className={clsx(
      "rounded-lg border border-slate-800/70 bg-slate-900/70 shadow-sm backdrop-blur-sm",
      className
    )}
  >
    {children}
  </div>
));

Card.displayName = "Card";

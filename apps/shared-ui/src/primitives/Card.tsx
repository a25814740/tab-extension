import clsx from "clsx";
import type { ReactNode } from "react";

export type CardProps = {
  className?: string;
  children: ReactNode;
};

export function Card({ className, children }: CardProps) {
  return (
    <div className={clsx("rounded-lg border border-slate-800 bg-slate-900/60", className)}>
      {children}
    </div>
  );
}
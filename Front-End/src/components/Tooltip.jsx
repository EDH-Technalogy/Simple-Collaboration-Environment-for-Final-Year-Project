import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "../lib/utils";

/** Provide once at app root (see App.jsx); nested providers reset delay behavior. */
export function AppTooltipProvider({ children }) {
  return (
    <Tooltip.Provider delayDuration={350} skipDelayDuration={120}>
      {children}
    </Tooltip.Provider>
  );
}

const TooltipComponent = React.forwardRef(
  ({ content, children, side = "top", sideOffset = 5, className }, ref) => (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>

      <Tooltip.Portal>
        <Tooltip.Content
          ref={ref}
          side={side}
          sideOffset={sideOffset}
          className={cn(
            "z-[10050] max-w-xs select-none rounded-xl border border-(--color-light-input-border) bg-(--color-light-card-bg) px-3 py-2 text-xs leading-snug text-(--color-light-text-primary) shadow-lg outline-none dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-white",
            "will-change-[transform,opacity] data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[instant-open]:animate-in data-[instant-open]:fade-in-0 data-[instant-open]:zoom-in-95",
            className,
          )}
        >
          {content}
          <Tooltip.Arrow className="fill-(--color-light-card-bg) dark:fill-(--color-dark-card-bg)" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  ),
);

TooltipComponent.displayName = "TooltipComponent";

export default TooltipComponent;

import * as React from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { cn } from "../lib/utils";

const HoverCardComponent = React.forwardRef(
  (
    {
      avatarUrl,
      name,
      email,
      description,
      following = 0,
      followers = 0,
      triggerElement,
      className,
    },
    ref,
  ) => (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        {triggerElement ? (
          triggerElement
        ) : (
          <div
            className={cn(
              "inline-block cursor-pointer rounded-full shadow-md outline-none",
              "hover:shadow-lg transition-shadow",
            )}
          >
            <img
              className="block w-[45px] h-[45px] rounded-full object-cover"
              src={avatarUrl}
              alt={name}
            />
          </div>
        )}
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          ref={ref}
          sideOffset={5}
          className={cn(
            "w-[300px] rounded-md p-4 shadow-lg outline-none",
            "bg-card dark:bg-dark-card border border-default dark:border-dark-card",
            "text-primary dark:text-white",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[side=top]:slide-down-fade data-[side=right]:slide-left-fade data-[side=bottom]:slide-up-fade data-[side=left]:slide-right-fade",
            className,
          )}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt={name}
                className="w-[60px] h-[60px] rounded-full object-cover"
              />
              <div className="flex flex-col truncate">
                <span className="font-medium text-sm">{name}</span>
                <span className="text-sm text-muted dark:text-dark-muted truncate">
                  {email}
                </span>
              </div>
            </div>

            {description && (
              <p className="text-sm text-muted dark:text-dark-muted">
                {description}
              </p>
            )}

            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <span className="font-medium">{following}</span>
                <span className="text-sm text-muted dark:text-dark-muted">
                  Following
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{followers}</span>
                <span className="text-sm text-muted dark:text-dark-muted">
                  Followers
                </span>
              </div>
            </div>
          </div>

          <HoverCard.Arrow className="fill-card dark:fill-dark-card" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  ),
);

HoverCardComponent.displayName = "HoverCardComponent";

export default HoverCardComponent;

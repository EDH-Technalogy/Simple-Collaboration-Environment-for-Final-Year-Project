import * as React from "react";
import { Avatar as RadixAvatar } from "radix-ui";
import clsx from "clsx";
import { UserRound } from "lucide-react";

const defaultSizeCls =
  "inline-flex aspect-square size-[1.85rem] max-h-full max-w-full select-none items-center justify-center overflow-hidden rounded-[inherit] align-middle sm:size-[2rem]";

/**
 * Avatar with optional remote image URL; falls back to initials only (no stock photo).
 */
export default function Avatar({
  src = null,
  alt = "",
  initials = "",
  className,
  sizeClass = defaultSizeCls,
}) {
  const label = String(initials ?? "").trim().slice(0, 3).toUpperCase();
  const url = typeof src === "string" && src.trim() ? src.trim() : null;
  const [broken, setBroken] = React.useState(false);
  React.useEffect(() => {
    setBroken(false);
  }, [url]);

  const showImg = Boolean(url && !broken);

  return (
    <RadixAvatar.Root className={clsx(sizeClass, className)}>
      {showImg ? (
        <RadixAvatar.Image
          className="size-full rounded-[inherit]  object-cover"
          src={url}
          alt={alt}
          onError={() => setBroken(true)}
        />
      ) : null}
      <RadixAvatar.Fallback className="flex size-full items-center justify-center rounded-[inherit] bg-accent/18 text-[10px] font-semibold uppercase text-primary sm:text-[11px] dark:bg-[rgba(0,102,255,0.22)] dark:text-dark-primary">
        {label && label !== "?" ? (
          label
        ) : (
          <UserRound className="size-[58%]" strokeWidth={1.8} aria-hidden />
        )}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}

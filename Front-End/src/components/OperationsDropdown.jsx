import { useTranslation } from "react-i18next";
import {
  DropdownContent,
  DropdownItem,
  DropdownMenuRoot,
  DropdownSeparator,
  DropdownTrigger,
} from "./DropdownMenu";

export default function OperationsDropdown({
  label,
  items = [],
  align = "end",
  className,
}) {
  const { t } = useTranslation();

  return (
    <DropdownMenuRoot>
      <DropdownTrigger className={className}>
        {label ?? t("adminShared.labels.actions")}
      </DropdownTrigger>
      <DropdownContent align={align}>
        {items.map((item, index) =>
          item.type === "separator" ? (
            <DropdownSeparator key={`separator-${index}`} />
          ) : (
            <DropdownItem
              key={item.key ?? item.label ?? index}
              icon={item.icon}
              variant={item.variant}
              onClick={item.onClick}
              disabled={item.disabled}
            >
              {item.label}
            </DropdownItem>
          ),
        )}
      </DropdownContent>
    </DropdownMenuRoot>
  );
}

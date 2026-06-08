import {
  DropdownContent,
  DropdownLabel,
  DropdownRadioGroup,
  DropdownRadioItem,
} from "./DropdownMenu";

export default function LanguageDropdown({ current, onChange, onClose }) {
  return (
    <DropdownContent align="end" className="w-44" onEscapeKeyDown={onClose}>
      <DropdownLabel>Language</DropdownLabel>
      <DropdownRadioGroup value={current} onValueChange={onChange}>
        <DropdownRadioItem value="en">English</DropdownRadioItem>
        <DropdownRadioItem value="ps">پښتو</DropdownRadioItem>
        <DropdownRadioItem value="fa">فارسی</DropdownRadioItem>
      </DropdownRadioGroup>
    </DropdownContent>
  );
}

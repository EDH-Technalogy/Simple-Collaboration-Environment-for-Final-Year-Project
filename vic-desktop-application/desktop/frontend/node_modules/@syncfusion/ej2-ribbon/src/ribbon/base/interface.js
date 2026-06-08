/**
 * Defines the layout types of ribbon.
 */
export var RibbonLayout;
(function (RibbonLayout) {
    /**
     * Displays the ribbon tab content in classic layout.
     */
    RibbonLayout["Classic"] = "Classic";
    /**
     * Displays the ribbon tab content in simplified layout.
     */
    RibbonLayout["Simplified"] = "Simplified";
})(RibbonLayout || (RibbonLayout = {}));
/**
 * Defines the alignment of the items in the ribbon group.
 */
export var ItemOrientation;
(function (ItemOrientation) {
    /**
     * Displays the collection of items in rows.
     */
    ItemOrientation["Row"] = "Row";
    /**
     * Displays the collection of items in column.
     */
    ItemOrientation["Column"] = "Column";
})(ItemOrientation || (ItemOrientation = {}));
/**
 * Defines the current size of the ribbon item in normal mode.
 *
 * @aspNumberEnum
 */
export var RibbonItemSize;
(function (RibbonItemSize) {
    /**
     * The item appears with large icon and text at the bottom.
     */
    RibbonItemSize[RibbonItemSize["Large"] = 4] = "Large";
    /**
     * The item appears with small icon and text at the right.
     */
    RibbonItemSize[RibbonItemSize["Medium"] = 2] = "Medium";
    /**
     * The item appears with small icon only.
     */
    RibbonItemSize[RibbonItemSize["Small"] = 1] = "Small";
})(RibbonItemSize || (RibbonItemSize = {}));
/**
 * Defines how to show an item in ribbon simplified layout.
 *
 * @aspNumberEnum
 */
export var DisplayMode;
(function (DisplayMode) {
    /**
     * The item appears in the classic layout group.
     */
    DisplayMode[DisplayMode["Classic"] = 4] = "Classic";
    /**
     * The item appears in the simplified layout group.
     */
    DisplayMode[DisplayMode["Simplified"] = 2] = "Simplified";
    /**
     * The item appears in overflow popup.
     */
    DisplayMode[DisplayMode["Overflow"] = 1] = "Overflow";
    /**
     * The item appears in classic layout group, simplified layout group, and overflow popup based on ribbon overflow state.
     */
    DisplayMode[DisplayMode["Auto"] = 7] = "Auto";
})(DisplayMode || (DisplayMode = {}));
/**
 * Defines the type of the ribbon item.
 */
export var RibbonItemType;
(function (RibbonItemType) {
    /**
     * Renders button as ribbon item.
     */
    RibbonItemType["Button"] = "Button";
    /**
     * Renders checkbox as ribbon item.
     */
    RibbonItemType["CheckBox"] = "CheckBox";
    /**
     * Renders color picker as ribbon item.
     */
    RibbonItemType["ColorPicker"] = "ColorPicker";
    /**
     * Renders combobox as ribbon item.
     */
    RibbonItemType["ComboBox"] = "ComboBox";
    /**
     * Renders dropdownbutton as ribbon item.
     */
    RibbonItemType["DropDown"] = "DropDown";
    /**
     * Renders splitbutton as ribbon item.
     */
    RibbonItemType["SplitButton"] = "SplitButton";
    /**
     * Renders the group button content as ribbon item.
     */
    RibbonItemType["GroupButton"] = "GroupButton";
    /**
     * Renders the gallery as ribbon item.
     */
    RibbonItemType["Gallery"] = "Gallery";
    /**
     * Renders the template content as ribbon item.
     */
    RibbonItemType["Template"] = "Template";
})(RibbonItemType || (RibbonItemType = {}));
/**
 * Defines the alignment of the items in the ribbon group.
 */
export var RibbonGroupButtonSelection;
(function (RibbonGroupButtonSelection) {
    /**
     * Allows selecting single button from button group.
     */
    RibbonGroupButtonSelection["Single"] = "Single";
    /**
     * Allows selecting multiple buttons from button group.
     */
    RibbonGroupButtonSelection["Multiple"] = "Multiple";
})(RibbonGroupButtonSelection || (RibbonGroupButtonSelection = {}));

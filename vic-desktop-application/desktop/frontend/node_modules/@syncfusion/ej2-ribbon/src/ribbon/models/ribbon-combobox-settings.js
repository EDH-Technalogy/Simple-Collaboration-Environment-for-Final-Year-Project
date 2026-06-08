var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ChildProperty, Event, Property, Complex } from '@syncfusion/ej2-base';
import { FieldSettings } from '@syncfusion/ej2-dropdowns';
/**
 * Defines the ribbon combobox item.
 */
var RibbonComboBoxSettings = /** @class */ (function (_super) {
    __extends(RibbonComboBoxSettings, _super);
    function RibbonComboBoxSettings() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} prop - Gets the property of combobox.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    RibbonComboBoxSettings.prototype.setProperties = function (prop, muteOnChange) {
        _super.prototype.setProperties.call(this, prop, muteOnChange);
    };
    __decorate([
        Property(false)
    ], RibbonComboBoxSettings.prototype, "allowFiltering", void 0);
    __decorate([
        Property(true)
    ], RibbonComboBoxSettings.prototype, "autofill", void 0);
    __decorate([
        Property('')
    ], RibbonComboBoxSettings.prototype, "cssClass", void 0);
    __decorate([
        Property('')
    ], RibbonComboBoxSettings.prototype, "label", void 0);
    __decorate([
        Property([])
    ], RibbonComboBoxSettings.prototype, "dataSource", void 0);
    __decorate([
        Complex({ text: null, value: null, iconCss: null, groupBy: null }, FieldSettings)
    ], RibbonComboBoxSettings.prototype, "fields", void 0);
    __decorate([
        Property('Contains')
    ], RibbonComboBoxSettings.prototype, "filterType", void 0);
    __decorate([
        Property(null)
    ], RibbonComboBoxSettings.prototype, "footerTemplate", void 0);
    __decorate([
        Property(null)
    ], RibbonComboBoxSettings.prototype, "groupTemplate", void 0);
    __decorate([
        Property(null)
    ], RibbonComboBoxSettings.prototype, "headerTemplate", void 0);
    __decorate([
        Property(null)
    ], RibbonComboBoxSettings.prototype, "index", void 0);
    __decorate([
        Property(null)
    ], RibbonComboBoxSettings.prototype, "itemTemplate", void 0);
    __decorate([
        Property('No records found')
    ], RibbonComboBoxSettings.prototype, "noRecordsTemplate", void 0);
    __decorate([
        Property(null)
    ], RibbonComboBoxSettings.prototype, "placeholder", void 0);
    __decorate([
        Property('300px')
    ], RibbonComboBoxSettings.prototype, "popupHeight", void 0);
    __decorate([
        Property('100%')
    ], RibbonComboBoxSettings.prototype, "popupWidth", void 0);
    __decorate([
        Property(true)
    ], RibbonComboBoxSettings.prototype, "showClearButton", void 0);
    __decorate([
        Property('None')
    ], RibbonComboBoxSettings.prototype, "sortOrder", void 0);
    __decorate([
        Property(null)
    ], RibbonComboBoxSettings.prototype, "text", void 0);
    __decorate([
        Property(null)
    ], RibbonComboBoxSettings.prototype, "value", void 0);
    __decorate([
        Property('150px')
    ], RibbonComboBoxSettings.prototype, "width", void 0);
    __decorate([
        Property({})
    ], RibbonComboBoxSettings.prototype, "htmlAttributes", void 0);
    __decorate([
        Event()
    ], RibbonComboBoxSettings.prototype, "beforeOpen", void 0);
    __decorate([
        Event()
    ], RibbonComboBoxSettings.prototype, "change", void 0);
    __decorate([
        Event()
    ], RibbonComboBoxSettings.prototype, "close", void 0);
    __decorate([
        Event()
    ], RibbonComboBoxSettings.prototype, "created", void 0);
    __decorate([
        Event()
    ], RibbonComboBoxSettings.prototype, "filtering", void 0);
    __decorate([
        Event()
    ], RibbonComboBoxSettings.prototype, "open", void 0);
    __decorate([
        Event()
    ], RibbonComboBoxSettings.prototype, "select", void 0);
    return RibbonComboBoxSettings;
}(ChildProperty));
export { RibbonComboBoxSettings };

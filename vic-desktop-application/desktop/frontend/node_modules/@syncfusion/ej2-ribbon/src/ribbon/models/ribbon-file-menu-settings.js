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
import { ChildProperty, Property, Event, Complex, Collection } from '@syncfusion/ej2-base';
import { MenuAnimationSettings, MenuItem } from '@syncfusion/ej2-navigations';
import { RibbonTooltip } from './ribbon-tooltip';
/**
 * Defines the ribbon file menu settings.
 */
var FileMenuSettings = /** @class */ (function (_super) {
    __extends(FileMenuSettings, _super);
    function FileMenuSettings() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} prop - Gets the property of FileMenu.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    FileMenuSettings.prototype.setProperties = function (prop, muteOnChange) {
        _super.prototype.setProperties.call(this, prop, muteOnChange);
    };
    __decorate([
        Property('File')
    ], FileMenuSettings.prototype, "text", void 0);
    __decorate([
        Property(false)
    ], FileMenuSettings.prototype, "visible", void 0);
    __decorate([
        Collection([], MenuItem)
    ], FileMenuSettings.prototype, "menuItems", void 0);
    __decorate([
        Property(false)
    ], FileMenuSettings.prototype, "showItemOnClick", void 0);
    __decorate([
        Complex({}, MenuAnimationSettings)
    ], FileMenuSettings.prototype, "animationSettings", void 0);
    __decorate([
        Property('')
    ], FileMenuSettings.prototype, "itemTemplate", void 0);
    __decorate([
        Property('')
    ], FileMenuSettings.prototype, "popupTemplate", void 0);
    __decorate([
        Complex({}, RibbonTooltip)
    ], FileMenuSettings.prototype, "ribbonTooltipSettings", void 0);
    __decorate([
        Event()
    ], FileMenuSettings.prototype, "beforeClose", void 0);
    __decorate([
        Event()
    ], FileMenuSettings.prototype, "beforeOpen", void 0);
    __decorate([
        Event()
    ], FileMenuSettings.prototype, "beforeItemRender", void 0);
    __decorate([
        Event()
    ], FileMenuSettings.prototype, "close", void 0);
    __decorate([
        Event()
    ], FileMenuSettings.prototype, "open", void 0);
    __decorate([
        Event()
    ], FileMenuSettings.prototype, "select", void 0);
    __decorate([
        Property('')
    ], FileMenuSettings.prototype, "keyTip", void 0);
    return FileMenuSettings;
}(ChildProperty));
export { FileMenuSettings };

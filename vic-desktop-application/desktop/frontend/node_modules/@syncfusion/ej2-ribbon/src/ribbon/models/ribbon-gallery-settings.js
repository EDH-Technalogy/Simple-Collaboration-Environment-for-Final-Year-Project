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
import { ChildProperty, Collection, Property, Event } from '@syncfusion/ej2-base';
import { RibbonGalleryGroup } from './ribbon-gallery-group';
/**
 * Defines the ribbon gallery settings.
 */
var RibbonGallerySettings = /** @class */ (function (_super) {
    __extends(RibbonGallerySettings, _super);
    function RibbonGallerySettings() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        Collection([], RibbonGalleryGroup)
    ], RibbonGallerySettings.prototype, "groups", void 0);
    __decorate([
        Property(3)
    ], RibbonGallerySettings.prototype, "itemCount", void 0);
    __decorate([
        Property(null)
    ], RibbonGallerySettings.prototype, "selectedItemIndex", void 0);
    __decorate([
        Property('auto')
    ], RibbonGallerySettings.prototype, "popupHeight", void 0);
    __decorate([
        Property('auto')
    ], RibbonGallerySettings.prototype, "popupWidth", void 0);
    __decorate([
        Property('')
    ], RibbonGallerySettings.prototype, "template", void 0);
    __decorate([
        Property('')
    ], RibbonGallerySettings.prototype, "popupTemplate", void 0);
    __decorate([
        Event()
    ], RibbonGallerySettings.prototype, "popupOpen", void 0);
    __decorate([
        Event()
    ], RibbonGallerySettings.prototype, "popupClose", void 0);
    __decorate([
        Event()
    ], RibbonGallerySettings.prototype, "itemHover", void 0);
    __decorate([
        Event()
    ], RibbonGallerySettings.prototype, "beforeItemRender", void 0);
    __decorate([
        Event()
    ], RibbonGallerySettings.prototype, "beforeSelect", void 0);
    __decorate([
        Event()
    ], RibbonGallerySettings.prototype, "select", void 0);
    return RibbonGallerySettings;
}(ChildProperty));
export { RibbonGallerySettings };

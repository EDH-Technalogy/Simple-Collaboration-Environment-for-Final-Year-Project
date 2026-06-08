import * as constants from '../base/constant';
import { isNullOrUndefined } from '@syncfusion/ej2-base';
/**
 * Defines the ribbon contextual tab.
 */
var RibbonContextualTab = /** @class */ (function () {
    function RibbonContextualTab(parent) {
        this.parent = parent;
    }
    RibbonContextualTab.prototype.getModuleName = function () {
        return 'ribbonContextualTab';
    };
    RibbonContextualTab.prototype.destroy = function () {
        this.parent = null;
    };
    /**
     * Creates Contextual tab.
     *
     * @returns {void}
     * @hidden
     */
    RibbonContextualTab.prototype.addContextualTabs = function () {
        var isSelected = false;
        for (var n = 0; n < this.parent.contextualTabs.length; n++) {
            for (var i = 0; i < this.parent.contextualTabs[parseInt(n.toString(), 10)].tabs.length; i++) {
                this.parent.addTab(this.parent.contextualTabs[parseInt(n.toString(), 10)].tabs[parseInt(i.toString(), 10)]);
                var index = this.parent.tabs.length - 1;
                var tabEle = this.parent.tabObj.element;
                var toolbarEle = tabEle.querySelectorAll('.e-toolbar-item')[parseInt(index.toString(), 10)];
                toolbarEle.classList.add(constants.RIBBON_CONTEXTUAL_TAB);
                toolbarEle.classList.add('e-hidden');
                if (this.parent.contextualTabs[parseInt(n.toString(), 10)].visible) {
                    this.parent.showTab(this.parent.contextualTabs[parseInt(n.toString(), 10)].tabs[parseInt(i.toString(), 10)].id, true);
                    if (this.parent.contextualTabs[parseInt(n.toString(), 10)].isSelected && !isSelected) {
                        this.parent.selectTab(this.parent.contextualTabs[parseInt(n.toString(), 10)].tabs[0].id);
                        isSelected = true;
                    }
                }
            }
        }
    };
    /**
     * Updates Contextual tab.
     *
     * @param {RibbonContextualTabSettingsModel} newProp - Specifies new properties.
     * @param {RibbonContextualTabSettingsModel} contextualTab - Gets the property of contextual tab.
     * @returns {void}
     * @hidden
     */
    RibbonContextualTab.prototype.updateContextualTabs = function (newProp, contextualTab) {
        if (!(isNullOrUndefined(newProp.visible))) {
            for (var i = 0; i < contextualTab.tabs.length; i++) {
                if (newProp.visible) {
                    this.parent.showTab(contextualTab.tabs[parseInt(i.toString(), 10)].id, true);
                }
                else {
                    this.parent.hideTab(contextualTab.tabs[parseInt(i.toString(), 10)].id, true);
                }
            }
        }
        if (!(isNullOrUndefined(newProp.isSelected))) {
            if (newProp.isSelected && contextualTab.visible) {
                this.parent.selectTab(contextualTab.tabs[0].id);
            }
            else {
                var tabEle = this.parent.tabObj.element;
                for (var i = 0; i < this.parent.tabs.length; i++) {
                    var toolbarEle = tabEle.querySelectorAll('.e-toolbar-item')[parseInt(i.toString(), 10)];
                    if (!(toolbarEle.classList.contains('e-hidden') || toolbarEle.classList.contains('e-disable'))) {
                        this.parent.selectTab(this.parent.tabs[parseInt(i.toString(), 10)].id);
                        break;
                    }
                }
            }
        }
        if (newProp.tabs) {
            var _loop_1 = function (key) {
                var index = parseInt(key, 10);
                var tab = this_1.parent.tabs.filter(function (e) {
                    return e.id === contextualTab.tabs[parseInt(index.toString(), 10)].id;
                })[0];
                this_1.parent.updateTab(tab);
            };
            var this_1 = this;
            for (var _i = 0, _a = Object.keys(newProp.tabs); _i < _a.length; _i++) {
                var key = _a[_i];
                _loop_1(key);
            }
        }
    };
    return RibbonContextualTab;
}());
export { RibbonContextualTab };

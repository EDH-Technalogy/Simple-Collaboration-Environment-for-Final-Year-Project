import { compile, getComponent, select, addClass } from '@syncfusion/ej2-base';
import { Tooltip } from '@syncfusion/ej2-popups';
import { DisplayMode, RibbonLayout } from './interface';
import * as constants from './constant';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
/**
 * Gets index value.
 *
 * @param {Array} arr - Gets the array to find index.
 * @param {boolean} condition - Defines whether index matches with the value.
 * @returns {number} - Gets the index value.
 * @hidden
 */
export function getIndex(arr, condition) {
    for (var i = 0; i < arr.length; i++) {
        if (condition(arr[parseInt(i.toString(), 10)], i)) {
            return i;
        }
    }
    return -1;
}
/**
 * Gets template content based on the template property value.
 *
 * @param {string | HTMLElement| Function} template - Template property value.
 * @returns {Function} - Return template function.
 * @hidden
 */
export function getTemplateFunction(template) {
    if (typeof template === 'string') {
        var content = '';
        try {
            var tempEle = select(template);
            if (tempEle) {
                //Return innerHTML incase of jsrenderer script else outerHTML
                content = tempEle.tagName === 'SCRIPT' ? tempEle.innerHTML : tempEle.outerHTML;
            }
            else {
                content = template;
            }
        }
        catch (e) {
            content = template;
        }
        return compile(content);
    }
    else {
        /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
        return compile(template);
    }
}
/**
 * Gets the ribbon item
 *
 * @param {RibbonTabModel} tabs - Gets the ribbon tab model.
 * @param {string} id - Gets the ID of the tab.
 * @param {RibbonItemType} type - Gets the type of the item.
 * @returns {itemProps} - Gets the ribbon item.
 * @hidden
 */
export function getItem(tabs, id, type) {
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[parseInt(i.toString(), 10)];
        for (var j = 0; j < tab.groups.length; j++) {
            var group = tab.groups[parseInt(j.toString(), 10)];
            for (var k = 0; k < group.collections.length; k++) {
                var collection = group.collections[parseInt(k.toString(), 10)];
                for (var l = 0; l < collection.items.length; l++) {
                    var item = collection.items[parseInt(l.toString(), 10)];
                    if ((id && item.id === id) || (type && item.type === type)) {
                        return {
                            item: item, collection: collection, group: group,
                            tabIndex: i, groupIndex: j, collectionIndex: k, itemIndex: l
                        };
                    }
                }
            }
        }
    }
    return null;
}
/**
 * Gets the ribbon collection.
 *
 * @param {RibbonTabModel} tabs - Gets the ribbon tab model.
 * @param {string} id - Gets the ID of the tab.
 * @returns {itemProps} - Gets the ribbon collection.
 * @hidden
 */
export function getCollection(tabs, id) {
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[parseInt(i.toString(), 10)];
        for (var j = 0; j < tab.groups.length; j++) {
            var group = tab.groups[parseInt(j.toString(), 10)];
            for (var k = 0; k < group.collections.length; k++) {
                var collection = group.collections[parseInt(k.toString(), 10)];
                if (collection.id === id) {
                    return {
                        collection: collection, group: group,
                        tabIndex: i, groupIndex: j, collectionIndex: k
                    };
                }
            }
        }
    }
    return null;
}
/**
 * Gets the ribbon group.
 *
 * @param {RibbonTabModel} tabs - Gets the ribbon tab model.
 * @param {string} id - Gets the ID of the tab.
 * @returns {itemProps} - Gets the ribbon group.
 * @hidden
 */
export function getGroup(tabs, id) {
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[parseInt(i.toString(), 10)];
        for (var j = 0; j < tab.groups.length; j++) {
            var group = tab.groups[parseInt(j.toString(), 10)];
            if (group.id === id) {
                return {
                    group: group, tabIndex: i, groupIndex: j
                };
            }
        }
    }
    return null;
}
/**
 * @param {HTMLElement} element - Gets the element to be destroyed.
 * @param {string} moduleName - Gets the module name.
 * @returns {void}
 * @hidden
 */
export function destroyControl(element, moduleName) {
    var control = getComponent(element, moduleName);
    control.destroy();
}
/**
 * Updates common properties.
 *
 * @param {HTMLElement} element - Gets the element to be updated.
 * @param {string} moduleName - Gets the module name.
 * @param {commonProperties} commonProp - Gets the common properties to be updated.
 * @returns {void}
 * @hidden
 */
export function updateCommonProperty(element, moduleName, commonProp) {
    var control = getComponent(element, moduleName);
    control.setProperties(commonProp);
}
/**
 * Updates disabled control.
 *
 * @param {HTMLElement} element - Gets the element to be disabled.
 * @param {string} moduleName - Gets the module name.
 * @param {boolean} disable - Defines whether the control to be disabled or not.
 * @returns {void}
 * @hidden
 */
export function updateControlDisabled(element, moduleName, disable) {
    var control = getComponent(element, moduleName);
    control.setProperties(moduleName === 'combobox' ? { enabled: !disable } : { disabled: disable });
}
/**
 * Gets the ribbon item element.
 *
 * @param {Ribbon} parent - Gets the parent element.
 * @param {string} id - Gets the ID of the item.
 * @param {itemProps} itemProp - Gets the ribbon item.
 * @returns {HTMLElement} - Gets the ribbon item element.
 * @hidden
 */
export function getItemElement(parent, id, itemProp) {
    if (!itemProp) {
        itemProp = getItem(parent.tabs, id);
        if (!itemProp) {
            return null;
        }
    }
    var contentEle = parent.tabObj.items[itemProp.tabIndex].content;
    if (contentEle.innerHTML === '') {
        return null;
    }
    if (parent.activeLayout === RibbonLayout.Classic) {
        if (itemProp.item.displayOptions & DisplayMode.Classic) {
            contentEle = (itemProp.group.isCollapsed) ? parent.ribbonDropDownModule.getOverflowDropDownPopup(itemProp, contentEle)
                : contentEle;
            return contentEle.querySelector('#' + id);
        }
        else {
            return null;
        }
    }
    else {
        //Checks for Simplified and Auto options (Auto = classic + simplified + popup)
        var ele = (itemProp.item.displayOptions & DisplayMode.Simplified) ?
            contentEle.querySelector('#' + itemProp.item.id) : null;
        // element will be null for "Popup" and if the item is moved to overflow in "Auto" mode
        if (!ele) {
            var dropdown = itemProp.group.enableGroupOverflow ?
                getComponent(contentEle.querySelector('#' + itemProp.group.id + constants.GROUPOF_BUTTON_ID), DropDownButton)
                : parent.overflowDDB;
            ele = dropdown.target.querySelector('#' + itemProp.item.id);
        }
        return ele;
    }
}
/**
 * @param {RibbonTooltipModel} tooltip - Gets the property of tooltip.
 * @returns {boolean} - Gets whether the tooltip is present or not.
 * @hidden
 */
export function isTooltipPresent(tooltip) {
    return (tooltip.content || tooltip.iconCss || tooltip.title || tooltip.id || tooltip.cssClass) ? true : false;
}
/**
 * Sets content for tooltip.
 *
 * @param {TooltipEventArgs} args - Gets the argument of tooltip.
 * @param {Tooltip} tooltip - Gets the tooltip to set the content.
 * @param {ribbonTooltipData} tooltipData - Gets the tooltip data.
 * @returns {void}
 * @hidden
 */
export function setToolTipContent(args, tooltip, tooltipData) {
    var targetId = args.target.getAttribute('id');
    var dataObj = tooltipData.filter(function (e) { return e.id === targetId; })[0];
    var data = dataObj.data;
    var content = tooltip.createElement('div', {
        id: data.id ? constants.RIBBON_TOOLTIP_CONTAINER + '_' + data.id : constants.RIBBON_TOOLTIP_CONTAINER
    });
    tooltip.element.append(content);
    if (data.title) {
        var header = tooltip.createElement('div', {
            innerHTML: data.title,
            className: constants.RIBBON_TOOLTIP_TITLE
        });
        content.appendChild(header);
    }
    var textContainer = tooltip.createElement('div', {
        className: constants.RIBBON_TEXT_CONTAINER
    });
    content.appendChild(textContainer);
    if (data.iconCss) {
        var customCss = tooltip.createElement('div', {
            className: data.iconCss + ' ' + constants.RIBBON_TOOLTIP_ICON
        });
        textContainer.appendChild(customCss);
    }
    if (data.content) {
        var tooltipContent = tooltip.createElement('div', {
            innerHTML: data.content,
            className: constants.RIBBON_TOOLTIP_CONTENT
        });
        textContainer.appendChild(tooltipContent);
    }
    tooltip.setProperties({
        content: content,
        cssClass: data.cssClass ? data.cssClass + ' ' + constants.RIBBON_TOOLTIP : constants.RIBBON_TOOLTIP
    });
}
/**
 * Creates tooltip.
 *
 * @param {HTMLElement} element - Gets the element to add tooltip.
 * @param {Ribbon} ribbon - Gets the ribbon.
 * @returns {void}
 * @hidden
 */
export function createTooltip(element, ribbon) {
    var ribbonTooltip = new Tooltip({
        target: '.' + constants.RIBBON_TOOLTIP_TARGET,
        beforeRender: beforeTooltipRender.bind(this),
        windowCollision: true
    });
    ribbonTooltip.appendTo(element);
    /**
     * @param {TooltipEventArgs} args - Gets the tooltip argument.
     * @returns {void}
     * @hidden
     */
    function beforeTooltipRender(args) {
        setToolTipContent(args, ribbonTooltip, ribbon.tooltipData);
    }
}
/**
 * Destroys tooltip
 *
 * @param {HTMLElement} element - Gets the element in which the tooltip needs to be destroyed.
 * @returns {void}
 * @hidden
 */
export function destroyTooltip(element) {
    var control = getComponent(element, Tooltip);
    control.destroy();
}
/**
 * Updates tooltip
 *
 * @param {HTMLElement} element - Gets the element in which the tooltip needs to be Updated.
 * @param {commonProperties} prop - Gets the property to be updated.
 * @returns {void}
 * @hidden
 */
export function updateTooltipProp(element, prop) {
    var control = getComponent(element, Tooltip);
    control.setProperties(prop);
}
/**
 * Sets the HTML attributes of an element
 *
 * @param {HTMLElement} element - The HTML element for which attributes are to be updated.
 * @param {commonProperties} attributes - An object containing key-value pairs of attributes to be updated.
 * @returns {void}
 * @hidden
 */
export function setCustomAttributes(element, attributes) {
    for (var key in attributes) {
        if (key === 'class') {
            var elementClass = attributes['class'].replace(/\s+/g, ' ').trim();
            if (elementClass) {
                addClass([element], elementClass.split(' '));
            }
        }
        else if (key === 'style') {
            var prevStyles = element.getAttribute('style') || '';
            var value = "" + prevStyles + attributes["" + key];
            element.setAttribute("" + key, value);
        }
        else {
            element.setAttribute(key, attributes["" + key]);
        }
    }
}

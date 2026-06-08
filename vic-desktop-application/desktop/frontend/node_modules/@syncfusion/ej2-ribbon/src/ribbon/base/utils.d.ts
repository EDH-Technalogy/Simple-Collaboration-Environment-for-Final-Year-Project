import { Tooltip, TooltipEventArgs } from '@syncfusion/ej2-popups';
import { RibbonTabModel, RibbonTooltipModel } from '../models/index';
import { commonProperties, itemProps, ribbonTooltipData, RibbonItemType } from './interface';
import { Ribbon } from './ribbon';
/**
 * Gets index value.
 *
 * @param {Array} arr - Gets the array to find index.
 * @param {boolean} condition - Defines whether index matches with the value.
 * @returns {number} - Gets the index value.
 * @hidden
 */
export declare function getIndex<T>(arr: Array<T>, condition: (value: T, index: number) => boolean): number;
/**
 * Gets template content based on the template property value.
 *
 * @param {string | HTMLElement| Function} template - Template property value.
 * @returns {Function} - Return template function.
 * @hidden
 */
export declare function getTemplateFunction(template: string | HTMLElement | Function): Function;
/**
 * Gets the ribbon item
 *
 * @param {RibbonTabModel} tabs - Gets the ribbon tab model.
 * @param {string} id - Gets the ID of the tab.
 * @param {RibbonItemType} type - Gets the type of the item.
 * @returns {itemProps} - Gets the ribbon item.
 * @hidden
 */
export declare function getItem(tabs: RibbonTabModel[], id: string, type?: RibbonItemType): itemProps;
/**
 * Gets the ribbon collection.
 *
 * @param {RibbonTabModel} tabs - Gets the ribbon tab model.
 * @param {string} id - Gets the ID of the tab.
 * @returns {itemProps} - Gets the ribbon collection.
 * @hidden
 */
export declare function getCollection(tabs: RibbonTabModel[], id: string): itemProps;
/**
 * Gets the ribbon group.
 *
 * @param {RibbonTabModel} tabs - Gets the ribbon tab model.
 * @param {string} id - Gets the ID of the tab.
 * @returns {itemProps} - Gets the ribbon group.
 * @hidden
 */
export declare function getGroup(tabs: RibbonTabModel[], id: string): itemProps;
/**
 * @param {HTMLElement} element - Gets the element to be destroyed.
 * @param {string} moduleName - Gets the module name.
 * @returns {void}
 * @hidden
 */
export declare function destroyControl(element: HTMLElement, moduleName: string): void;
/**
 * Updates common properties.
 *
 * @param {HTMLElement} element - Gets the element to be updated.
 * @param {string} moduleName - Gets the module name.
 * @param {commonProperties} commonProp - Gets the common properties to be updated.
 * @returns {void}
 * @hidden
 */
export declare function updateCommonProperty(element: HTMLElement, moduleName: string, commonProp: commonProperties): void;
/**
 * Updates disabled control.
 *
 * @param {HTMLElement} element - Gets the element to be disabled.
 * @param {string} moduleName - Gets the module name.
 * @param {boolean} disable - Defines whether the control to be disabled or not.
 * @returns {void}
 * @hidden
 */
export declare function updateControlDisabled(element: HTMLElement, moduleName: string, disable: boolean): void;
/**
 * Gets the ribbon item element.
 *
 * @param {Ribbon} parent - Gets the parent element.
 * @param {string} id - Gets the ID of the item.
 * @param {itemProps} itemProp - Gets the ribbon item.
 * @returns {HTMLElement} - Gets the ribbon item element.
 * @hidden
 */
export declare function getItemElement(parent: Ribbon, id: string, itemProp?: itemProps): HTMLElement;
/**
 * @param {RibbonTooltipModel} tooltip - Gets the property of tooltip.
 * @returns {boolean} - Gets whether the tooltip is present or not.
 * @hidden
 */
export declare function isTooltipPresent(tooltip: RibbonTooltipModel): boolean;
/**
 * Sets content for tooltip.
 *
 * @param {TooltipEventArgs} args - Gets the argument of tooltip.
 * @param {Tooltip} tooltip - Gets the tooltip to set the content.
 * @param {ribbonTooltipData} tooltipData - Gets the tooltip data.
 * @returns {void}
 * @hidden
 */
export declare function setToolTipContent(args: TooltipEventArgs, tooltip: Tooltip, tooltipData: ribbonTooltipData[]): void;
/**
 * Creates tooltip.
 *
 * @param {HTMLElement} element - Gets the element to add tooltip.
 * @param {Ribbon} ribbon - Gets the ribbon.
 * @returns {void}
 * @hidden
 */
export declare function createTooltip(element: HTMLElement, ribbon: Ribbon): void;
/**
 * Destroys tooltip
 *
 * @param {HTMLElement} element - Gets the element in which the tooltip needs to be destroyed.
 * @returns {void}
 * @hidden
 */
export declare function destroyTooltip(element: HTMLElement): void;
/**
 * Updates tooltip
 *
 * @param {HTMLElement} element - Gets the element in which the tooltip needs to be Updated.
 * @param {commonProperties} prop - Gets the property to be updated.
 * @returns {void}
 * @hidden
 */
export declare function updateTooltipProp(element: HTMLElement, prop: commonProperties): void;
/**
 * Sets the HTML attributes of an element
 *
 * @param {HTMLElement} element - The HTML element for which attributes are to be updated.
 * @param {commonProperties} attributes - An object containing key-value pairs of attributes to be updated.
 * @returns {void}
 * @hidden
 */
export declare function setCustomAttributes(element: HTMLElement, attributes: {
    [key: string]: string;
}): void;

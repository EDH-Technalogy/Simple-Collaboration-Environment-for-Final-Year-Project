import { Ribbon } from '../base/ribbon';
import { RibbonContextualTabSettingsModel } from '../models/ribbon-contextual-tab-settings-model';
/**
 * Defines the ribbon contextual tab.
 */
export declare class RibbonContextualTab {
    private parent;
    constructor(parent: Ribbon);
    protected getModuleName(): string;
    protected destroy(): void;
    /**
     * Creates Contextual tab.
     *
     * @returns {void}
     * @hidden
     */
    addContextualTabs(): void;
    /**
     * Updates Contextual tab.
     *
     * @param {RibbonContextualTabSettingsModel} newProp - Specifies new properties.
     * @param {RibbonContextualTabSettingsModel} contextualTab - Gets the property of contextual tab.
     * @returns {void}
     * @hidden
     */
    updateContextualTabs(newProp: RibbonContextualTabSettingsModel, contextualTab: RibbonContextualTabSettingsModel): void;
}

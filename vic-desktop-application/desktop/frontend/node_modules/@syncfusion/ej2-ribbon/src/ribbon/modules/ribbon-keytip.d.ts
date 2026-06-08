import { Ribbon } from '../base';
/**
 * Defines the keytip of Ribbon.
 */
export declare class RibbonKeyTip {
    private parent;
    private isKeytipPopupOpen;
    private isKeytipPresent;
    constructor(parent: Ribbon);
    protected getModuleName(): string;
    protected destroy(): void;
    /**
     * Creates the keytips.
     *
     * @param {string} key - get's the keytip type.
     * @returns {void}
     * @hidden
     */
    createKeytip(key?: string): void;
    private calculateItemPosition;
    private createKeyTipElement;
    private calculateKeyTipPosition;
    /**
     * Performs keytip action.
     *
     * @param {string} keyPress - Gets the keytip text.
     * @param {boolean} isMethod - Gets the isMethod.
     * @returns {void}
     * @hidden
     */
    keytipPress(keyPress: string, isMethod?: boolean): void;
    private clickItems;
    private isInteractableElement;
    private commonItemsKeyTipPress;
    /**
     * Removes the keytip.
     *
     * @param {string} key - Gets the keyboard key element.
     * @returns {void}
     * @hidden
     */
    removeKeytip(key?: string): void;
    /**
     * Shows the Keytip dynamically.
     *
     * @param  {string} keyAction - Item for which the tooltip is to be shown.
     * @returns {void}
     */
    showKeyTips(keyAction?: string): void;
    /**
     * Hides the Keytip dynamically.
     *
     * @returns {void}
     */
    hideKeyTips(): void;
}

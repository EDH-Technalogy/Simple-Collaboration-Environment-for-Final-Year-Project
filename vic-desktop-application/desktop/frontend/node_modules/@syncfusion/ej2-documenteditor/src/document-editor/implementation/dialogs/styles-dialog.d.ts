import { L10n } from '@syncfusion/ej2-base';
import { DocumentHelper } from '../viewer';
/**
 * The Styles dialog is used to create or modify styles.
 */
export declare class StylesDialog {
    /**
     * @private
     */
    documentHelper: DocumentHelper;
    private target;
    private listviewInstance;
    private styleName;
    private localValue;
    private dlgFields;
    private commonDiv;
    private searchDiv;
    private listviewDiv;
    private buttonDiv;
    private newButtonDiv;
    private newButtonElement;
    private newbutton;
    private modifybuttonDiv;
    private modifyButtonElement;
    private addbutton;
    private selecHandlerClickHandler;
    private addNewStyleClickHandler;
    private modifyStyleClickHandler;
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper.
     * @private
     */
    constructor(documentHelper: DocumentHelper);
    private getModuleName;
    /**
     * @private
     * @param {L10n} localValue - Specifies the locale value.
     * @param {string[]} styles - Specifies the styles.
     * @param {boolean} isRtl - Specifies the is rtl.
     * @returns {void}
     */
    initStylesDialog(localValue: L10n, styles: {
        [key: string]: string;
    }[], isRtl?: boolean): void;
    /**
     * @private
     * @returns {void}
     */
    show(): void;
    private updateStyleNames;
    private defaultStyleName;
    private onModifyStyleClick;
    /**
     * @private
     * @returns {void}
     */
    private modifyStyles;
    private onSelecHandlerClick;
    /**
     * @param {SelectEventArgs} args - Specifies the event args.
     * @returns {void}
     */
    private selectHandler;
    /**
     * @param {string} styleName - Specifies the style name.
     * @private
     * @returns {string} - Returns the style name.
     */
    getStyleName(styleName: string): string;
    /**
     * @private
     * @returns {void}
     */
    private hideObjects;
    private onAddNewStyleClick;
    /**
     * @private
     * @returns {void}
     */
    addNewStyles: () => void;
    /**
     * @private
     * @returns {void}
     */
    destroy(): void;
    private removeEvents;
    private removeElements;
}

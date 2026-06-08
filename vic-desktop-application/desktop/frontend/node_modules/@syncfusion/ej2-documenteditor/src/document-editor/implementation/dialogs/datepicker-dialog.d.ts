import { L10n } from '@syncfusion/ej2-base';
import { DocumentHelper } from '../viewer';
/**
 * The DateContent dialog is used to display calendar
 */
export declare class DatePickerDialog {
    private calendar;
    private target;
    private parentDiv;
    /**
     * @private
     */
    documentHelper: DocumentHelper;
    private localeValue;
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper
     * @private
     */
    constructor(documentHelper: DocumentHelper);
    private getModuleName;
    /**
     * @private
     * @param {L10n} localValue - Specified the locale value.
     * @returns {void}
     */
    initDateContentDialog(localValue: L10n): void;
    private valueChange;
    /**
     * @private
     * @returns {void}
     */
    show(): void;
    /**
     * @private
     * @returns {void}
     */
    onCancelButtonClick: () => void;
    /**
     * @private
     * @returns {void}
     */
    destroy(): void;
}

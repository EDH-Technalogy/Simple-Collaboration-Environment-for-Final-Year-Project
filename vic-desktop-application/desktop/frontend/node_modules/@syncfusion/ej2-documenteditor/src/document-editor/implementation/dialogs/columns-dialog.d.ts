import { L10n } from '@syncfusion/ej2-base';
import { DocumentHelper } from '../viewer';
import { ChangeEventArgs as NumericChangeEventArgs, ChangedEventArgs } from '@syncfusion/ej2-inputs';
export declare class ColumnsDialog {
    private oneDiv;
    private twoDiv;
    private threeDiv;
    private leftDiv;
    private rightDiv;
    private target;
    private columnsCountBox;
    private columnValueTexBox;
    private lineCheckbox;
    private equalCheckbox;
    private columnCountBox1;
    private widthCountBox1;
    private spacingCountBox1;
    columnElementDiv: HTMLDivElement;
    private widthcontainerDiv1;
    private columnTable;
    private widthContainer;
    private columns;
    numberOfColumns: number;
    private section;
    private pageWidth;
    private displayText;
    private PresetsContainer;
    private oneDivContainer;
    private oneDivLabel;
    private twoDivContainer;
    private twoDivLabel;
    private threeDivContainer;
    private threeDivLabel;
    private leftDivContainer;
    private leftDivLabel;
    private rightDivContainer;
    private rightDivLabel;
    private nuberOfColumnsContainer;
    private subcontainer;
    private subcontainer1;
    private lineCheckDiv;
    private lineCheck;
    private widthAndSpacingContainer;
    private widthAndSpacingContainerDiv;
    private widthAndSpacingText;
    private tableElement;
    private columnDiv;
    private columnCount;
    private equalCheckDiv;
    private equalCheck;
    private handleSettingCheckBoxActionHandler;
    /**
     * @private
     */
    documentHelper: DocumentHelper;
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper
     * @private
     */
    constructor(documentHelper: DocumentHelper);
    private getModuleName;
    /**
     * @private
     * @param {L10n} localeValue - Specifies the locale.
     * @param {boolean} isRtl - Specifies is rtl.
     * @returns {void}
     */
    initColumnsDialog(localeValue: L10n, isRtl?: boolean): void;
    checkBox: (args: ChangedEventArgs) => void;
    createTextBox: (args: NumericChangeEventArgs) => void;
    private createColumn;
    private widthChange;
    private spaceChange;
    checkAndApplyColumnFormatWidth: (columnWidth: number) => void;
    checkAndApplyColumnFormatSpace: (columnSpace: number) => void;
    canUpdateColumnWidthAndSpacing: (numberOfColumns: number, colIndex: number, colWidth: number, colSpace: number) => void;
    /**
     * @private
     * @returns {void}
     */
    closeDialog: () => void;
    /**
     * @private
     * @returns {void}
     */
    private closeColumnsDialog;
    /**
     * @private
     * @returns {void}
     */
    unWireEventsAndBindings: () => void;
    /**
     * @private
     * @returns {void}
     */
    openColumnsDialog: () => void;
    /**
     * @private
     * @returns {void}
     */
    show(): void;
    private onhandleSettingCheckBoxActionClicked;
    /**
     * @private
     * @param {Event} event - Specifies the event args.
     * @returns {void}
     */
    private handleSettingCheckBoxAction;
    private setSettingPreviewDivElement;
    /**
     * @private
     * @returns {void}
     */
    applyColumnDialog: () => void;
    /**
     * @private
     * @returns {void}
     */
    destroy(): void;
    private removeEvents;
    private removeElements;
}

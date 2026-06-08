import { L10n } from '@syncfusion/ej2-base';
import { ChangeEventArgs } from '@syncfusion/ej2-buttons';
import { DocumentHelper } from '../viewer';
/**
 * The Table of contents dialog is used to insert or edit table of contents at selection.
 */
export declare class TableOfContentsDialog {
    private target;
    /**
     * @private
     */
    documentHelper: DocumentHelper;
    private pageNumber;
    private rightAlign;
    private tabLeader;
    private showLevel;
    private hyperlink;
    private style;
    private heading1;
    private heading2;
    private heading3;
    private heading4;
    private heading5;
    private heading6;
    private heading7;
    private heading8;
    private heading9;
    private normal;
    private outline;
    private textBoxInput;
    private listViewInstance;
    private generalDiv;
    private genLabel;
    private topContainer;
    private leftGeneralDiv;
    private rightGeneralDiv;
    private bottomContainer;
    private leftBottomGeneralDiv;
    private rightBottomGeneralDiv;
    private pageNumberDiv;
    private pageNumber1;
    private rightAlignDiv;
    private rightAlign1;
    private tabDivContainer;
    private tabDiv;
    private tabLeaderLabelDiv;
    private tabLeaderLabel;
    private tabLeaderDiv;
    private tabLeader1;
    private hyperlink1;
    private showDiv;
    private showLevelLabelDiv;
    private showLevelLabel;
    private showLevelDiv;
    private showLevel1;
    private buildTableLabel;
    private table;
    private tr1;
    private td1;
    private availableLabel;
    private td2;
    private tocLabel;
    private tableDiv;
    private table1;
    private tr2;
    private td3;
    private heading1Label;
    private td4;
    private tr3;
    private td5;
    private heading2Label;
    private td6;
    private tr4;
    private td7;
    private heading3Label;
    private td8;
    private tr5;
    private td9;
    private heading4Label;
    private td10;
    private tr6;
    private td11;
    private heading5Label;
    private td12;
    private tr7;
    private td13;
    private heading6Label;
    private td14;
    private tr8;
    private td15;
    private heading7Label;
    private td16;
    private tr9;
    private td17;
    private heading8Label;
    private td18;
    private tr10;
    private td19;
    private heading9Label;
    private td20;
    private tr12;
    private td23;
    private normalLabel;
    private td24;
    private stylesLevelDiv;
    private fieldsDiv;
    private outDiv;
    private outlineDiv;
    private outline1;
    private resetButtonDiv;
    private resetElement;
    private resetButton;
    private tocStylesLabel;
    private textBoxDiv;
    private listViewDiv;
    private modifyButtonDiv;
    private modifyElement;
    private modifyButton;
    private changeStyleClickHandler;
    private changingStyleClickHandler;
    private resetClickHandler;
    private selectHandlerClickHandler;
    private showDialogHandler;
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper.
     * @private
     */
    constructor(documentHelper: DocumentHelper);
    private getModuleName;
    /**
     * @private
     * @param {L10n} localValue - Specifies the locale value
     * @param {boolean} isRtl - Specifies the is rtl
     * @returns {void}
     */
    initTableOfContentDialog(locale: L10n, isRtl?: boolean): void;
    private styleLocaleValue;
    /**
     * @private
     */
    show(): void;
    /**
     * @private
     * @returns {void}
     */
    loadTableofContentDialog: () => void;
    /**
     * @private
     * @returns {void}
     */
    closeTableOfContentDialog: () => void;
    /**
     * @private
     * @returns {void}
     */
    onCancelButtonClick: () => void;
    private onSelectHandlerClick;
    /**
     * @param {SelectEventArgs} args - Specifies the event args.
     * @returns {void}
     */
    private selectHandler;
    private onShowDialog;
    /**
     * @private
     * @returns {void}
     */
    private showStyleDialog;
    private changeShowLevelValue;
    private changeByValue;
    private onResetClick;
    /**
     * @returns {void}
     */
    private reset;
    private onChangeStyleClick;
    /**
     * @param {KeyboardEvent} args - Specifies the event args.
     * @returns {void}
     */
    private changeStyle;
    private initAlertDialog;
    private checkLevel;
    private getElementValue;
    private onChangingStyleClick;
    /**
     * @param {KeyboardEvent} args - Specifies the event args.
     * @returns {void}
     */
    private changeHeadingStyle;
    /**
     * @param {ChangeEventArgs} args - Specifies the event args.
     * @returns {void}
     */
    changePageNumberValue: (args: ChangeEventArgs) => void;
    /**
     * @param {ChangeEventArgs} args - Specifies the event args.
     * @returns {void}
     */
    changeRightAlignValue: (args: ChangeEventArgs) => void;
    /**
     * @param {ChangeEventArgs} args - Specifies the event args.
     * @returns {void}
     */
    changeStyleValue: (args: ChangeEventArgs) => void;
    private getHeadingLevel;
    private applyLevelSetting;
    private getTOCInputValue;
    /**
     * @private
     * @returns {void}
     */
    applyTableOfContentProperties: () => void;
    /**
     * @private
     * @returns {void}
     */
    unWireEventsAndBindings: () => void;
    /**
     * @private
     * @returns {void}
     */
    destroy(): void;
    private removeEvents;
    private removeElements;
}

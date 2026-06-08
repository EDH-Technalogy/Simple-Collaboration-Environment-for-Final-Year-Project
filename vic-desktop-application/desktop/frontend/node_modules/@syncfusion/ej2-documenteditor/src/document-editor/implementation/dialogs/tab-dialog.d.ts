import { L10n } from '@syncfusion/ej2-base';
import { DocumentHelper } from '../viewer';
export declare class TabDialog {
    /**
     * @private
     */
    documentHelper: DocumentHelper;
    private target;
    private listviewInstance;
    private textBoxInput;
    private defaultTabStopIn;
    private left;
    private right;
    private center;
    private decimal;
    private bar;
    private none;
    private dotted;
    private single;
    private Hyphen;
    private underscore;
    private setButton;
    private clearButton;
    private clearAllButton;
    private selectedTabStop;
    private isBarClicked;
    private removedItems;
    private tabStopList;
    private isAddUnits;
    private displayDiv;
    private localeValue;
    private commonDiv;
    private tabStopLabelDiv;
    private tabStopDiv;
    private tabListDiv;
    private textBoxDiv;
    private listviewDiv;
    private defaultTablabelDiv;
    private defaultTabDiv;
    private defaultTabStopDiv;
    private defaultTabWarningDiv;
    private defaultTabStop;
    private alignmentDiv;
    private alignmentLabelDiv;
    private alignmentPropertyDiv;
    private alignmentPropertyDiv1;
    private leftDiv;
    private leftRadioBtn;
    private decimalDiv;
    private decimalRadioBtn;
    private alignmentPropertyDiv2;
    private centerDiv;
    private centerRadioBtn;
    private barDiv;
    private barRadioBtn;
    private alignmentPropertyDiv3;
    private rightDiv;
    private rightRadioBtn;
    private tabLeaderDiv;
    private tabLeaderLabelDiv;
    private tabLeaderPropertyDiv;
    private tabLeaderPropertyDiv1;
    private noneDiv;
    private noneRadioBtn;
    private underscoreDiv;
    private underscoreRadioBtn;
    private tabLeaderPropertyDiv2;
    private dottedDiv;
    private dottedRadioBtn;
    private singleDiv;
    private singleRadioBtn;
    private tabLeaderPropertyDiv3;
    private HyphenDiv;
    private HyphenRadioBtn;
    private buttonDiv;
    private tableElement;
    private setbuttonDiv;
    private setButtonElement;
    private clearbuttonDiv;
    private clearButtonElement;
    private clearAllbuttonDiv;
    private clearAllButtonElement;
    private textBoxInputChangeClickHandler;
    private selectHandlerClickHandler;
    private setButtonClickHandler;
    private clearButtonClickHandler;
    private clearAllButtonClickHandler;
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper.
     * @private
     */
    constructor(documentHelper: DocumentHelper);
    private getModuleName;
    /**
     * @private
     * @returns {void}
     */
    applyParagraphFormat: () => void;
    private onTextBoxInputChangeClick;
    private textBoxInputChange;
    private onSetButtonClick;
    private setButtonClick;
    private onClearAllButtonClick;
    private clearAllButtonClick;
    private onClearButtonClick;
    private clearButtonClick;
    /**
     * @private
     * @returns {void}
     */
    closeTabDialog: () => void;
    /**
     * @private
     * @param {L10n} locale - Specifies the locale.
     * @param {boolean} enableRtl - Specifies is rtl.
     * @returns {void}
     */
    initTabsDialog(localeValue: L10n, enableRtl: boolean): void;
    private getTabAlignmentValue;
    private getTabLeaderValue;
    private onSelectHandlerClick;
    private selectHandler;
    private updateButtons;
    private onBarClick;
    private onTabAlignmentButtonClick;
    private updateTabLeaderButton;
    private updateTabAlignmentButton;
    private clearTabLeaderButton;
    private disableOrEnableTabLeaderButton;
    private clearTabAlignmentButton;
    private focusTextBox;
    /**
     * @private
     * @returns {void}
     */
    show(): void;
    /**
     * @private
     * @returns {void}
     */
    destroy(): void;
    private removeEvents;
    private removeElements;
}

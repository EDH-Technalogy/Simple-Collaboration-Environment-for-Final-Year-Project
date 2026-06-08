import { L10n } from '@syncfusion/ej2-base';
import { WCharacterFormat } from '../format';
import { DocumentHelper } from '../viewer';
export declare class ContentControlPropertiesDialog {
    /**
     * @private
     */
    documentHelper: DocumentHelper;
    private localeValue;
    private target;
    private titleText;
    private tagText;
    private fontColorDiv;
    private removeCheckBox;
    private contentEditedCheckBox;
    private contentDeletedCheckBox;
    private multilineCheckBox;
    private colorPicker;
    private fontColor;
    private dropDownPropertiesDiv;
    private plainTextPropertiesDiv;
    private currentContentControl;
    private listviewInstance;
    private textBoxInput;
    private valueBoxInput;
    private addButton;
    private deleteButton;
    private convertedItems;
    private currentSelectedItem;
    private container;
    private generalDiv;
    private genLabel;
    private displayText;
    private colorDiv;
    private fontColorLabel;
    private fontColorElement;
    private style;
    private remove;
    private removeContent;
    private lockedDiv;
    private lockedLabel;
    private contentDelete;
    private contentDeleted;
    private contentEdit;
    private contentEdited;
    private plainTextLabel;
    private multiline;
    private lockedcontentLabel;
    private commonDiv;
    private searchDiv;
    private textBoxDiv;
    private valueBoxDiv;
    private listviewDiv;
    private buttonDiv;
    private addbuttonDiv;
    private addButtonElement;
    private deleteButtonDiv;
    private deleteButtonElement;
    private keyUpOnTextBoxClickHandler;
    private setButtonClickHandler;
    private clearButtonClickHandler;
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper.
     * @private
     */
    constructor(documentHelper: DocumentHelper);
    /**
     * @private
     */
    characterFormat: WCharacterFormat;
    private getModuleName;
    private createInputElement;
    initContentControlPropertiesDialog(localeValue: L10n, enableRtl: boolean): void;
    /**
     * @private
     * @returns {void}
     */
    show(): void;
    private onClearButtonClick;
    private clearButtonClick;
    private onSetButtonClick;
    private setButtonClick;
    private onKeyUpOnTextBoxClicked;
    /**
     * @private
     * @returns {void}
     */
    onKeyUpOnTextBox: () => void;
    private enableOrDisableButton;
    private loadPropertiesdialog;
    private applyProperties;
    private closePropertiesDialog;
    private fontColorUpdate;
    /**
     * @private
     * @param args args value.
     * @returns {void}
     */
    private selectHandler;
    private unWireEventsAndBindings;
    /**
     * @private
     * @returns {void}
     */
    destroy(): void;
    private removeEvents;
    private removeElements;
}

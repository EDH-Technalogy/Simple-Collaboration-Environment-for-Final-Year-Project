import { DocumentEditor } from '../../document-editor';
/**
 * Form field drop-down dialog is used to modify the value in drop-down form field.
 */
export declare class DropDownFormFieldDialog {
    private target;
    private owner;
    private drpDownItemsInput;
    private listviewInstance;
    private addButton;
    private editButton;
    private removeButton;
    private tooltipInput;
    private bookmarkInput;
    private dropDownEnable;
    private moveUpButton;
    private moveDownButton;
    private currentSelectedItem;
    private dropDownInstance;
    private fieldBegin;
    private dropDownItems;
    private dialogDiv;
    private firstDiv;
    private secondDiv;
    private itemsDrpItemsLabel;
    private listviewDiv;
    private buttonDiv;
    private addButtonDiv;
    private addButtonEle;
    private editButtonDiv;
    private editButtonEle;
    private removeButtonDiv;
    private removeButtonEle;
    private moveBtnDiv;
    private moveUpButtonDiv;
    private moveUpButtonEle;
    private moveDownButtonDiv;
    private moveDownButtonEle;
    private fileSettingsLabel;
    private thirdDiv;
    private toolTipDiv;
    private bookmarkDiv;
    private dropDownEnableDiv;
    private dropDownEnableEle;
    private moveDownItemClickHandler;
    private keyUpOnTextBoxClickHandler;
    private addItemtoListClickHandler;
    private moveUpItemClickHandler;
    private removeItemFromListClickHandler;
    constructor(owner: DocumentEditor);
    private readonly documentHelper;
    private getModuleName;
    /**
     * @private
     * @param {L10n} localValue - Specifies the locale value
     * @param {boolean} isRtl - Specifies the is rtl
     * @returns {void}
     */
    private initTextDialog;
    /**
     * @private
     * @returns {void}
     */
    show(): void;
    /**
     * @private
     * @returns {void}
     */
    loadDropDownDialog(): void;
    private updateList;
    private onAddItemtoListClick;
    /**
     * @private
     * @returns {void}
     */
    addItemtoList: () => void;
    private onRemoveItemFromListClick;
    /**
     * @private
     * @returns {void}
     */
    removeItemFromList: () => void;
    /**
     * @private
     * @returns {void}
     */
    private selectHandler;
    private onMoveUpItemClick;
    /**
     * @private
     * @returns {void}
     */
    moveUpItem: () => void;
    private onMouseDownItemClick;
    /**
     * @private
     * @returns {void}
     */
    moveDownItem: () => void;
    private getSelectedIndex;
    private moveUp;
    private moveDown;
    private onKeyUpOnTextBoxClick;
    /**
     * @private
     * @returns {void}
     */
    onKeyUpOnTextBox: () => void;
    private enableOrDisableButton;
    /**
     * @private
     * @returns {void}
     */
    onCancelButtonClick: () => void;
    /**
     * @private
     * @returns {void}
     */
    insertDropDownField: () => void;
    /**
     * @private
     * @returns {void}
     */
    private closeDropDownField;
    /**
     * @private
     * @returns {void}
     */
    destroy(): void;
    private removeEvents;
    private removeElements;
}

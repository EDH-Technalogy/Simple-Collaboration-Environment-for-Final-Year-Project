import { L10n } from '@syncfusion/ej2-base';
import { DocumentHelper } from '../viewer';
/**
 * The Bookmark dialog is used to add, navigate or delete bookmarks.
 */
export declare class BookmarkDialog {
    /**
     * @private
     */
    documentHelper: DocumentHelper;
    private target;
    private listviewInstance;
    private textBoxInput;
    private addButton;
    private deleteButton;
    private gotoButton;
    private dlgFields;
    private commonDiv;
    private searchDiv;
    private textBoxDiv;
    private listviewDiv;
    private buttonDiv;
    private addbuttonDiv;
    private deleteButtonDiv;
    private addButtonElement;
    private deleteButtonElement;
    private gotoButtonDiv;
    private gotoButtonElement;
    private listViewInstanceClickHandler;
    private onKeyUpOnTextBoxClickHandler;
    private addBookmarkClickHandler;
    private deleteBookmarkClickHandler;
    private gotoBookmarkClickHandler;
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper.
     * @private
     */
    constructor(documentHelper: DocumentHelper);
    private getModuleName;
    /**
     * @private
     * @param {L10n} localValue - Specifies the locale.
     * @param {string[]} bookmarks - Specifies bookmark collection.
     * @param {boolean} isRtl - Specifies is rtl.
     * @returns {void}
     */
    initBookmarkDialog(localValue: L10n, bookmarks: string[], isRtl?: boolean): void;
    private onListInstanceClicked;
    private onKeyUpOnTextBoxClicked;
    private onAddBookmarkClicked;
    private onDeleteBookmarkClicked;
    private onGotoBookmarkClicked;
    /**
     * @private
     * @returns {void}
     */
    show(): void;
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
    private addBookmark;
    private selectHandler;
    private focusTextBox;
    private removeObjects;
    /**
     * @private
     * @returns {void}
     */
    private gotoBookmark;
    /**
     * @private
     * @returns {void}
     */
    private deleteBookmark;
    /**
     * @private
     * @returns {void}
     */
    destroy(): void;
    private removeElements;
    private removeEvents;
}

import { ListView } from '@syncfusion/ej2-lists';
import { Button } from '@syncfusion/ej2-buttons';
import { createElement, L10n, isNullOrUndefined } from '@syncfusion/ej2-base';
import { SanitizeHtmlHelper } from '@syncfusion/ej2-base';
/**
 * The Bookmark dialog is used to add, navigate or delete bookmarks.
 */
var BookmarkDialog = /** @class */ (function () {
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper.
     * @private
     */
    function BookmarkDialog(documentHelper) {
        var _this = this;
        this.listViewInstanceClickHandler = this.onListInstanceClicked.bind(this);
        this.onKeyUpOnTextBoxClickHandler = this.onKeyUpOnTextBoxClicked.bind(this);
        this.addBookmarkClickHandler = this.onAddBookmarkClicked.bind(this);
        this.deleteBookmarkClickHandler = this.onDeleteBookmarkClicked.bind(this);
        this.gotoBookmarkClickHandler = this.onGotoBookmarkClicked.bind(this);
        /**
         * @private
         * @returns {void}
         */
        this.onKeyUpOnTextBox = function () {
            _this.enableOrDisableButton();
        };
        /**
         * @private
         * @returns {void}
         */
        this.addBookmark = function () {
            _this.documentHelper.owner.editorModule.insertBookmark(SanitizeHtmlHelper.sanitize(_this.textBoxInput.value));
            _this.documentHelper.hideDialog();
        };
        /* eslint-disable @typescript-eslint/no-explicit-any */
        this.selectHandler = function (args) {
            _this.focusTextBox(args.text);
        };
        /**
         * @private
         * @returns {void}
         */
        this.gotoBookmark = function () {
            _this.documentHelper.selection.selectBookmark(_this.textBoxInput.value);
        };
        /**
         * @private
         * @returns {void}
         */
        this.deleteBookmark = function () {
            _this.documentHelper.owner.editorModule.deleteBookmark(_this.textBoxInput.value);
            _this.show();
        };
        this.documentHelper = documentHelper;
    }
    BookmarkDialog.prototype.getModuleName = function () {
        return 'BookmarkDialog';
    };
    /**
     * @private
     * @param {L10n} localValue - Specifies the locale.
     * @param {string[]} bookmarks - Specifies bookmark collection.
     * @param {boolean} isRtl - Specifies is rtl.
     * @returns {void}
     */
    BookmarkDialog.prototype.initBookmarkDialog = function (localValue, bookmarks, isRtl) {
        var id = this.documentHelper.owner.containerId + '_insert_bookmark';
        this.target = createElement('div', { id: id, className: 'e-de-bookmark' });
        var headerValue = localValue.getConstant('Bookmark name') + ':';
        this.dlgFields = createElement('div', { innerHTML: headerValue, className: 'e-bookmark-dlgfields' });
        this.target.appendChild(this.dlgFields);
        this.commonDiv = createElement('div', { className: 'e-bookmark-common' });
        this.target.appendChild(this.commonDiv);
        this.searchDiv = createElement('div', { className: 'e-bookmark-list' });
        this.commonDiv.appendChild(this.searchDiv);
        if (isRtl) {
            this.searchDiv.classList.add('e-de-rtl');
        }
        this.textBoxDiv = createElement('div', { className: 'e-bookmark-textboxdiv' });
        this.searchDiv.appendChild(this.textBoxDiv);
        this.textBoxInput = createElement('input', { className: 'e-input e-bookmark-textbox-input', id: 'bookmark_text_box', attrs: { autofocus: 'true' } });
        this.textBoxInput.setAttribute('type', 'text');
        this.textBoxInput.setAttribute('aria-label', localValue.getConstant('Bookmark name'));
        this.textBoxDiv.appendChild(this.textBoxInput);
        this.listviewDiv = createElement('div', { className: 'e-bookmark-listViewDiv', id: 'bookmark_listview', attrs: { tabindex: '-1', role: 'listbox' } });
        this.listviewDiv.setAttribute('aria-label', localValue.getConstant('BookMarkList'));
        this.searchDiv.appendChild(this.listviewDiv);
        // const arts: string[] = this.documentHelper.bookmarks.keys;
        this.listviewInstance = new ListView({
            dataSource: bookmarks,
            cssClass: 'e-bookmark-listview'
        });
        var hasNoBookmark = (bookmarks === undefined || bookmarks.length === 0);
        this.listviewInstance.appendTo(this.listviewDiv);
        this.listviewInstance.addEventListener('select', this.listViewInstanceClickHandler);
        this.buttonDiv = createElement('div', { className: 'e-bookmark-button' });
        this.commonDiv.appendChild(this.buttonDiv);
        this.addbuttonDiv = createElement('div', { className: 'e-bookmark-addbutton' });
        this.buttonDiv.appendChild(this.addbuttonDiv);
        this.addButtonElement = createElement('button', {
            innerHTML: localValue.getConstant('Add'), id: 'add',
            attrs: { type: 'button' }
        });
        this.addButtonElement.setAttribute('aria-label', localValue.getConstant('Add'));
        this.addbuttonDiv.appendChild(this.addButtonElement);
        this.addButton = new Button({ cssClass: 'e-button-custom' });
        this.addButton.disabled = true;
        this.addButton.appendTo(this.addButtonElement);
        this.textBoxInput.addEventListener('input', this.onKeyUpOnTextBoxClickHandler);
        this.textBoxInput.addEventListener('keyup', this.onKeyUpOnTextBoxClickHandler);
        this.addButtonElement.addEventListener('click', this.addBookmarkClickHandler);
        this.deleteButtonDiv = createElement('div', { className: 'e-bookmark-deletebutton' });
        this.buttonDiv.appendChild(this.deleteButtonDiv);
        this.deleteButtonElement = createElement('button', {
            innerHTML: localValue.getConstant('Delete'), id: 'delete',
            attrs: { type: 'button' }
        });
        this.deleteButtonElement.setAttribute('aria-label', localValue.getConstant('Delete'));
        this.deleteButtonDiv.appendChild(this.deleteButtonElement);
        this.deleteButton = new Button({ cssClass: 'e-button-custom' });
        this.deleteButton.disabled = hasNoBookmark;
        this.deleteButton.appendTo(this.deleteButtonElement);
        this.deleteButtonElement.addEventListener('click', this.deleteBookmarkClickHandler);
        this.gotoButtonDiv = createElement('div', { className: 'e-bookmark-gotobutton' });
        this.buttonDiv.appendChild(this.gotoButtonDiv);
        this.gotoButtonElement = createElement('button', {
            innerHTML: localValue.getConstant('Go To'), id: 'goto',
            attrs: { type: 'button' }
        });
        this.gotoButtonElement.setAttribute('aria-label', localValue.getConstant('Go To'));
        this.gotoButtonDiv.appendChild(this.gotoButtonElement);
        this.gotoButton = new Button({ cssClass: 'e-button-custom' });
        this.gotoButton.disabled = hasNoBookmark;
        this.gotoButton.appendTo(this.gotoButtonElement);
        this.gotoButtonElement.addEventListener('click', this.gotoBookmarkClickHandler);
    };
    BookmarkDialog.prototype.onListInstanceClicked = function (args) {
        this.selectHandler(args);
    };
    BookmarkDialog.prototype.onKeyUpOnTextBoxClicked = function () {
        this.onKeyUpOnTextBox();
    };
    BookmarkDialog.prototype.onAddBookmarkClicked = function () {
        this.addBookmark();
    };
    BookmarkDialog.prototype.onDeleteBookmarkClicked = function () {
        this.deleteBookmark();
    };
    BookmarkDialog.prototype.onGotoBookmarkClicked = function () {
        this.gotoBookmark();
    };
    /**
     * @private
     * @returns {void}
     */
    BookmarkDialog.prototype.show = function () {
        var bookmarks = this.documentHelper.getBookmarks();
        var localObj = new L10n('documenteditor', this.documentHelper.owner.defaultLocale);
        localObj.setLocale(this.documentHelper.owner.locale);
        // if (!this.target) {
        this.initBookmarkDialog(localObj, bookmarks, this.documentHelper.owner.enableRtl);
        //}
        this.documentHelper.dialog.header = localObj.getConstant('Bookmark');
        this.documentHelper.dialog.height = 'auto';
        this.documentHelper.dialog.width = 'auto';
        this.documentHelper.dialog.content = this.target;
        this.documentHelper.dialog.beforeOpen = this.documentHelper.updateFocus;
        this.documentHelper.dialog.close = this.documentHelper.updateFocus;
        this.documentHelper.dialog.buttons = [{
                click: this.removeObjects.bind(this),
                buttonModel: { content: localObj.getConstant('Cancel'), cssClass: 'e-flat e-hyper-insert', isPrimary: true }
            }];
        this.documentHelper.dialog.dataBind();
        var hasNoBookmark = (bookmarks === undefined || bookmarks.length === 0);
        if (!hasNoBookmark) {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            var firstItem = bookmarks[0];
            this.listviewInstance.selectItem(firstItem);
        }
        this.documentHelper.dialog.show();
    };
    BookmarkDialog.prototype.enableOrDisableButton = function () {
        // Regex pattern for valid characters (alphanumeric and underscore)
        var validRegex = /^[_a-zA-Z0-9]+$/;
        var text = this.textBoxInput.value.trim();
        if (!isNullOrUndefined(this.addButton)) {
            this.addButton.disabled = !validRegex.test(text);
        }
    };
    BookmarkDialog.prototype.focusTextBox = function (text) {
        this.textBoxInput.value = text;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        var value = document.getElementById('bookmark_text_box');
        value.setSelectionRange(0, text.length);
        value.focus();
        this.enableOrDisableButton();
    };
    BookmarkDialog.prototype.removeObjects = function () {
        this.documentHelper.hideDialog();
    };
    /**
     * @private
     * @returns {void}
     */
    BookmarkDialog.prototype.destroy = function () {
        this.removeEvents();
        this.removeElements();
        if (this.textBoxInput) {
            this.textBoxInput.remove();
            this.textBoxInput = undefined;
        }
        if (this.listviewInstance) {
            this.listviewInstance.destroy();
            this.listviewInstance = undefined;
        }
        this.documentHelper = undefined;
    };
    BookmarkDialog.prototype.removeElements = function () {
        if (this.dlgFields) {
            this.dlgFields.remove();
            this.dlgFields = undefined;
        }
        if (this.commonDiv) {
            this.commonDiv.remove();
            this.commonDiv = undefined;
        }
        if (this.target) {
            this.target.remove();
            this.target = undefined;
        }
        if (this.textBoxDiv) {
            this.textBoxDiv.remove();
            this.textBoxDiv = undefined;
        }
        if (this.searchDiv) {
            this.searchDiv.remove();
            this.searchDiv = undefined;
        }
        if (this.listviewDiv) {
            this.listviewDiv.remove();
            this.listviewDiv = undefined;
        }
        if (this.buttonDiv) {
            this.buttonDiv.remove();
            this.buttonDiv = undefined;
        }
        if (this.addbuttonDiv) {
            this.addbuttonDiv.remove();
            this.addbuttonDiv = undefined;
        }
        if (this.deleteButtonDiv) {
            this.deleteButtonDiv.remove();
            this.deleteButtonDiv = undefined;
        }
        if (this.gotoButtonDiv) {
            this.gotoButtonDiv.remove();
            this.gotoButtonDiv = undefined;
        }
        if (this.addButtonElement) {
            this.addButtonElement.remove();
            this.addButtonElement = undefined;
        }
        if (this.deleteButtonElement) {
            this.deleteButtonElement.remove();
            this.deleteButtonElement = undefined;
        }
        if (this.gotoButtonElement) {
            this.gotoButtonElement.remove();
            this.gotoButtonElement = undefined;
        }
        if (this.addButton) {
            this.addButton.destroy();
            this.addButton = undefined;
        }
        if (this.deleteButton) {
            this.deleteButton.destroy();
            this.deleteButton = undefined;
        }
        if (this.gotoButton) {
            this.gotoButton.destroy();
            this.gotoButton = undefined;
        }
    };
    BookmarkDialog.prototype.removeEvents = function () {
        if (this.listviewInstance) {
            this.listviewInstance.removeEventListener('select', this.listViewInstanceClickHandler);
        }
        if (this.textBoxInput) {
            this.textBoxInput.removeEventListener('input', this.onKeyUpOnTextBoxClickHandler);
            this.textBoxInput.removeEventListener('keyup', this.onKeyUpOnTextBoxClickHandler);
        }
        if (this.addButtonElement) {
            this.addButtonElement.removeEventListener('click', this.addBookmarkClickHandler);
        }
        if (this.deleteButtonElement) {
            this.deleteButtonElement.removeEventListener('click', this.deleteBookmarkClickHandler);
        }
        if (this.gotoButtonElement) {
            this.gotoButtonElement.removeEventListener('click', this.gotoBookmarkClickHandler);
        }
    };
    return BookmarkDialog;
}());
export { BookmarkDialog };

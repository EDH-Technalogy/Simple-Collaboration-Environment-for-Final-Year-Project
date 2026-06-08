import { Browser, EventHandler, L10n, createElement } from '@syncfusion/ej2-base';
/**
 *  To show the dialog is used to insert image on picture Content Control.
 */
var PicContentControlDialog = /** @class */ (function () {
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper
     * @private
     */
    function PicContentControlDialog(documentHelper) {
        var _this = this;
        /**
         * @private
         * @returns {void}
         */
        this.onCancelButtonClick = function () {
            _this.documentHelper.dialog2.hide();
            _this.documentHelper.updateFocus();
        };
        /**
         * @private
         * @returns {void}
         */
        this.onInsertPicClick = function () {
            _this.documentHelper.dialog2.hide();
            _this.imagePicker = createElement('input', {
                attrs: { type: 'file', accept: '.jpg,.jpeg,.png,.bmp,.svg' }, className: 'e-de-ctnr-file-picker'
            });
            if (Browser.isIE) {
                document.body.appendChild(_this.imagePicker);
            }
            _this.imagePicker.value = '';
            _this.imagePicker.click();
            EventHandler.add(_this.imagePicker, 'change', _this.onImageChange, _this);
        };
        this.documentHelper = documentHelper;
    }
    PicContentControlDialog.prototype.getModuleName = function () {
        return 'PicContentControlDialog';
    };
    /**
     * @private
     * @returns {void}
     */
    PicContentControlDialog.prototype.show = function () {
        var localValue = new L10n('documenteditor', this.documentHelper.owner.defaultLocale);
        localValue.setLocale(this.documentHelper.owner.locale);
        this.localeValue = localValue;
        this.documentHelper.dialog2.header = localValue.getConstant('Insert Pictures');
        this.documentHelper.dialog2.showCloseIcon = true;
        this.documentHelper.dialog2.allowDragging = true;
        this.documentHelper.dialog2.position = { X: 'center', Y: 'center' };
        this.documentHelper.dialog2.width = 'auto';
        this.documentHelper.dialog2.beforeOpen = this.documentHelper.updateFocus;
        this.documentHelper.dialog2.buttons = [{
                click: this.onInsertPicClick,
                buttonModel: { content: localValue.getConstant('Upload from computer'), iconCss: 'e-icons e-de-ctnr-upload', iconPosition: 'Left' }
            }];
        this.documentHelper.dialog2.dataBind();
        this.documentHelper.dialog2.show();
    };
    PicContentControlDialog.prototype.onImageChange = function () {
        var _this = this;
        var file = this.imagePicker.files[0];
        var fileReader = new FileReader();
        fileReader.onload = function () {
            _this.insertImage(fileReader.result);
        };
        fileReader.readAsDataURL(file);
    };
    PicContentControlDialog.prototype.insertImage = function (data) {
        this.image = document.createElement('img');
        var documentHelper = this.documentHelper;
        var container = this.container;
        this.image.addEventListener('load', function () {
            documentHelper.owner.editorModule.insertImageInternal(data, true, this.width, this.height, this.alt);
            //to upload an image newly = false, this condition applies and to replace the new image = true , this condition not applies
            if (!documentHelper.owner.selection.isImageSelected) {
                documentHelper.owner.selection.handleShiftLeftKey();
                documentHelper.owner.editor.insertContentControl('Picture');
            }
        });
        this.image.src = data;
    };
    /**
     * @private
     * @returns {void}
     */
    PicContentControlDialog.prototype.destroy = function () {
        this.documentHelper = undefined;
        if (this.imagePicker) {
            this.imagePicker.remove();
            this.imagePicker = undefined;
        }
        if (this.image) {
            this.image.remove();
            this.image = undefined;
        }
    };
    return PicContentControlDialog;
}());
export { PicContentControlDialog };

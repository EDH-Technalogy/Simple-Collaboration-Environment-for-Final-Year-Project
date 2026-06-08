import { createElement, L10n, isNullOrUndefined } from '@syncfusion/ej2-base';
import { RadioButton, CheckBox } from '@syncfusion/ej2-buttons';
import { FieldElementBox, CheckBoxFormField } from '../viewer/page';
import { NumericTextBox, TextBox } from '@syncfusion/ej2-inputs';
/**
 * Form field checkbox dialog is used to modify the value in checkbox form field.
 */
var CheckBoxFormFieldDialog = /** @class */ (function () {
    /**
     * @param {DocumentHelper} owner - Specifies the document helper.
     * @private
     */
    function CheckBoxFormFieldDialog(owner) {
        var _this = this;
        /**
         * @private
         * @param {ChangeArgs} event - Specifies the event args.
         * @returns {void}
         */
        this.changeBidirectional = function (event) {
            if (event.value === 'exact') {
                _this.autoButton.checked = !_this.exactButton.checked;
                _this.exactlyNumber.enabled = true;
            }
            else {
                _this.exactButton.checked = !_this.autoButton.checked;
                _this.exactlyNumber.enabled = false;
            }
        };
        /**
         * @private
         * @param {ChangeArgs} event - Specifies the event args.
         * @returns {void}
         */
        this.changeBidirect = function (event) {
            if (event.value === 'check') {
                _this.notCheckedButton.checked = !_this.checkedButton.checked;
            }
            else {
                _this.checkedButton.checked = !_this.notCheckedButton.checked;
            }
        };
        /**
         * @private
         * @returns {void}
         */
        this.onCancelButtonClick = function () {
            _this.documentHelper.dialog.hide();
        };
        /**
         * @private
         * @returns {void}
         */
        this.insertCheckBoxField = function () {
            _this.closeCheckBoxField();
            var checkBoxField = new CheckBoxFormField();
            checkBoxField.defaultValue = _this.checkedButton.checked;
            checkBoxField.name = _this.bookmarkInputText.value;
            checkBoxField.helpText = _this.tooltipInputText.value;
            checkBoxField.checked = checkBoxField.defaultValue;
            checkBoxField.enabled = _this.checBoxEnableElement.checked;
            if (_this.exactButton.checked) {
                checkBoxField.sizeType = 'Exactly';
                checkBoxField.size = _this.exactlyNumber.value;
            }
            else {
                checkBoxField.sizeType = 'Auto';
                checkBoxField.size = 11;
            }
            _this.owner.editorModule.editFormField('CheckBox', checkBoxField);
        };
        /**
         * @private
         * @returns {void}
         */
        this.closeCheckBoxField = function () {
            _this.documentHelper.dialog.hide();
            _this.documentHelper.dialog.element.style.pointerEvents = '';
        };
        this.owner = owner;
    }
    Object.defineProperty(CheckBoxFormFieldDialog.prototype, "documentHelper", {
        get: function () {
            return this.owner.documentHelper;
        },
        enumerable: true,
        configurable: true
    });
    CheckBoxFormFieldDialog.prototype.getModuleName = function () {
        return 'CheckBoxFormFieldDialog';
    };
    /* eslint-disable */
    /**
     * @private
     * @param {L10n} locale - Specifies the locale.
     * @param {boolean} isRtl - Specifies is rtl.
     * @returns {void}
     */
    CheckBoxFormFieldDialog.prototype.initCheckBoxDialog = function (localValue, isRtl) {
        this.target = createElement('div');
        this.dialogDiv = createElement('div');
        this.headingLabel = createElement('div', {
            className: 'e-de-para-dlg-heading',
            innerHTML: localValue.getConstant('Check box size')
        });
        this.sizeParentDiv = createElement('div', { className: 'e-de-container-row' });
        this.autoDiv = createElement('div', { className: 'e-de-ff-radio-scnd-div' });
        this.exactDiv = createElement('div', { className: 'e-de-ff-radio-scnd-div' });
        this.autoEle = createElement('input', { className: 'e-de-rtl-btn-div', attrs: { 'aria-label': localValue.getConstant('Auto') } });
        this.exactEle = createElement('input', { className: 'e-de-rtl-btn-div', attrs: { 'aria-label': localValue.getConstant('Exactly') } });
        this.autoButton = new RadioButton({
            label: localValue.getConstant('Auto'), cssClass: 'e-small', change: this.changeBidirectional, checked: true,
            enableRtl: isRtl
        });
        this.exactButton = new RadioButton({
            label: localValue.getConstant('Exactly'), value: 'exact', cssClass: 'e-small', change: this.changeBidirectional,
            enableRtl: isRtl
        });
        this.exactNumberDiv = createElement('div', { className: 'e-de-ff-chck-exact' });
        this.exactNumber = createElement('input', { attrs: { 'type': 'text', 'aria-label': localValue.getConstant('Exactly') } });
        this.exactlyNumber = new NumericTextBox({
            format: 'n', value: 10, min: 1, max: 1584, enablePersistence: false, enabled: false, cssClass: 'e-de-check-exactnumbr-width',
            enableRtl: isRtl
        });
        this.defaultValueLabel = createElement('div', {
            className: 'e-de-para-dlg-heading',
            innerHTML: localValue.getConstant('Default value')
        });
        this.defaultcheckDiv = createElement('div', { className: 'e-de-container-row' });
        this.notcheckDiv = createElement('div', { className: 'e-de-ff-radio-div' });
        this.checkDiv = createElement('div', { className: 'e-de-ff-radio-div' });
        this.notcheckEle = createElement('input', { className: 'e-de-rtl-btn-div', attrs: { 'aria-label': localValue.getConstant('Not checked') } });
        this.checkEle = createElement('input', { className: 'e-de-rtl-btn-div', attrs: { 'aria-label': localValue.getConstant('Checked') } });
        this.notCheckedButton = new RadioButton({
            label: localValue.getConstant('Not checked'), enableRtl: isRtl, cssClass: 'e-small', change: this.changeBidirect
        });
        this.checkedButton = new RadioButton({
            label: localValue.getConstant('Checked'), value: 'check', enableRtl: isRtl, cssClass: 'e-small',
            change: this.changeBidirect, checked: true
        });
        this.fieldSettingsLabel = createElement('div', {
            className: 'e-de-para-dlg-heading',
            innerHTML: localValue.getConstant('Field settings')
        });
        this.settingsTotalDiv = createElement('div', { className: 'e-de-container-row' });
        this.totalToolTipDiv = createElement('div', { className: 'e-de-subcontainer-left' });
        this.totalBookmarkDiv = createElement('div', { className: 'e-de-subcontainer-right' });
        this.tooltipInputText = createElement('input', { className: 'e-input e-bookmark-textbox-input', attrs: { 'aira-label': localValue.getConstant('Tooltip') } });
        this.bookmarkInputText = createElement('input', { className: 'e-input e-bookmark-textbox-input', attrs: { 'aira-label': localValue.getConstant('Name') } });
        this.checkBoxEnableDiv = createElement('div');
        this.checBoxEnableEle = createElement('input', { attrs: { type: 'checkbox' } });
        this.checBoxEnableEle.setAttribute('aria-label', localValue.getConstant('Check box enabled'));
        this.checBoxEnableElement = new CheckBox({
            cssClass: 'e-de-ff-dlg-check',
            label: localValue.getConstant('Check box enabled'),
            enableRtl: isRtl
        });
        if (isRtl) {
            this.autoDiv.classList.add('e-de-rtl');
            this.exactDiv.classList.add('e-de-rtl');
            this.exactNumberDiv.classList.add('e-de-rtl');
            this.notcheckDiv.classList.add('e-de-rtl');
            this.checkDiv.classList.add('e-de-rtl');
            this.totalToolTipDiv.classList.add('e-de-rtl');
            this.totalBookmarkDiv.classList.add('e-de-rtl');
        }
        this.target.appendChild(this.dialogDiv);
        this.dialogDiv.appendChild(this.defaultValueLabel);
        this.dialogDiv.appendChild(this.defaultcheckDiv);
        this.defaultcheckDiv.appendChild(this.notcheckDiv);
        this.notcheckDiv.appendChild(this.notcheckEle);
        this.notCheckedButton.appendTo(this.notcheckEle);
        this.defaultcheckDiv.appendChild(this.checkDiv);
        this.checkDiv.appendChild(this.checkEle);
        this.checkedButton.appendTo(this.checkEle);
        this.dialogDiv.appendChild(this.headingLabel);
        this.dialogDiv.appendChild(this.sizeParentDiv);
        this.sizeParentDiv.appendChild(this.autoDiv);
        this.autoDiv.appendChild(this.autoEle);
        this.autoButton.appendTo(this.autoEle);
        this.sizeParentDiv.appendChild(this.exactDiv);
        this.exactDiv.appendChild(this.exactEle);
        this.exactButton.appendTo(this.exactEle);
        this.exactDiv.appendChild(this.exactNumberDiv);
        this.exactNumberDiv.appendChild(this.exactNumber);
        this.exactlyNumber.appendTo(this.exactNumber);
        this.dialogDiv.appendChild(this.fieldSettingsLabel);
        this.dialogDiv.appendChild(this.settingsTotalDiv);
        this.settingsTotalDiv.appendChild(this.totalToolTipDiv);
        this.settingsTotalDiv.appendChild(this.totalBookmarkDiv);
        this.totalToolTipDiv.appendChild(this.tooltipInputText);
        this.totalBookmarkDiv.appendChild(this.bookmarkInputText);
        this.dialogDiv.appendChild(this.checkBoxEnableDiv);
        this.checkBoxEnableDiv.appendChild(this.checBoxEnableEle);
        this.checBoxEnableElement.appendTo(this.checBoxEnableEle);
        new TextBox({ placeholder: localValue.getConstant('Tooltip'), floatLabelType: 'Always' }, this.tooltipInputText);
        new TextBox({ placeholder: localValue.getConstant('Name'), floatLabelType: 'Always' }, this.bookmarkInputText);
    };
    /**
     * @private
     * @returns {void}
     */
    CheckBoxFormFieldDialog.prototype.show = function () {
        var localObj = new L10n('documenteditor', this.documentHelper.owner.defaultLocale);
        localObj.setLocale(this.documentHelper.owner.locale);
        if (isNullOrUndefined(this.target)) {
            this.initCheckBoxDialog(localObj, this.documentHelper.owner.enableRtl);
        }
        this.loadCheckBoxDialog();
        this.documentHelper.dialog.header = localObj.getConstant('Check Box Form Field');
        this.documentHelper.dialog.position = { X: 'center', Y: 'center' };
        this.documentHelper.dialog.height = 'auto';
        this.documentHelper.dialog.width = '400px';
        this.documentHelper.dialog.content = this.target;
        this.documentHelper.dialog.buttons = [{
                click: this.insertCheckBoxField,
                buttonModel: { content: localObj.getConstant('Ok'), cssClass: 'e-flat e-table-cell-margin-okay', isPrimary: true }
            },
            {
                click: this.onCancelButtonClick,
                buttonModel: { content: localObj.getConstant('Cancel'), cssClass: 'e-flat e-table-cell-margin-cancel' }
            }];
        this.documentHelper.dialog.show();
    };
    /**
     * @private
     * @returns {void}
     */
    CheckBoxFormFieldDialog.prototype.loadCheckBoxDialog = function () {
        var inline = this.owner.selectionModule.getCurrentFormField();
        if (inline instanceof FieldElementBox) {
            this.fieldBegin = inline;
            var fieldData = this.fieldBegin.formFieldData;
            if (!fieldData.defaultValue) {
                this.checkedButton.checked = false;
                this.notCheckedButton.checked = true;
            }
            else {
                this.checkedButton.checked = true;
                this.notCheckedButton.checked = false;
            }
            if (fieldData.sizeType !== 'Auto') {
                this.exactButton.checked = true;
                this.autoButton.checked = false;
                this.exactlyNumber.enabled = true;
            }
            else {
                this.autoButton.checked = true;
                this.exactButton.checked = false;
                this.exactlyNumber.enabled = false;
            }
            if (fieldData.size) {
                this.exactlyNumber.value = fieldData.size;
            }
            if (fieldData.enabled) {
                this.checBoxEnableElement.checked = true;
            }
            else {
                this.checBoxEnableElement.checked = false;
            }
            if (fieldData.name && fieldData.name !== '') {
                this.bookmarkInputText.value = fieldData.name;
            }
            else {
                this.bookmarkInputText.value = '';
            }
            if (fieldData.helpText && fieldData.helpText !== '') {
                this.tooltipInputText.value = fieldData.helpText;
            }
            else {
                this.tooltipInputText.value = '';
            }
        }
    };
    /**
     * @private
     * @returns {void}
     */
    CheckBoxFormFieldDialog.prototype.destroy = function () {
        var checkBoxDialogTarget = this.target;
        if (checkBoxDialogTarget) {
            if (checkBoxDialogTarget.parentElement) {
                checkBoxDialogTarget.parentElement.removeChild(checkBoxDialogTarget);
            }
            this.target = undefined;
        }
        this.owner = undefined;
        if (this.autoButton) {
            this.autoButton.destroy();
            this.autoButton = undefined;
        }
        if (this.exactButton) {
            this.exactButton.destroy();
            this.exactButton = undefined;
        }
        if (this.notCheckedButton) {
            this.notCheckedButton.destroy();
            this.notCheckedButton = undefined;
        }
        if (this.checkedButton) {
            this.checkedButton.destroy();
            this.checkedButton = undefined;
        }
        this.bookmarkInputText = undefined;
        this.tooltipInputText = undefined;
        if (this.checBoxEnableElement) {
            this.checBoxEnableElement.destroy();
            this.checBoxEnableElement = undefined;
        }
        if (this.exactlyNumber) {
            this.exactlyNumber.destroy();
            this.exactlyNumber = undefined;
        }
        this.exactNumberDiv = undefined;
        this.removeElements();
    };
    CheckBoxFormFieldDialog.prototype.removeElements = function () {
        if (this.dialogDiv) {
            this.dialogDiv.remove();
            this.dialogDiv = undefined;
        }
        if (this.headingLabel) {
            this.headingLabel.remove();
            this.headingLabel = undefined;
        }
        if (this.sizeParentDiv) {
            this.sizeParentDiv.remove();
            this.sizeParentDiv = undefined;
        }
        if (this.autoDiv) {
            this.autoDiv.remove();
            this.autoDiv = undefined;
        }
        if (this.exactDiv) {
            this.exactDiv.remove();
            this.exactDiv = undefined;
        }
        if (this.autoEle) {
            this.autoEle.remove();
            this.autoEle = undefined;
        }
        if (this.exactEle) {
            this.exactEle.remove();
            this.exactEle = undefined;
        }
        if (this.exactNumber) {
            this.exactNumber.remove();
            this.exactNumber = undefined;
        }
        if (this.defaultValueLabel) {
            this.defaultValueLabel.remove();
            this.defaultValueLabel = undefined;
        }
        if (this.defaultcheckDiv) {
            this.defaultcheckDiv.remove();
            this.defaultcheckDiv = undefined;
        }
        if (this.notcheckDiv) {
            this.notcheckDiv.remove();
            this.notcheckDiv = undefined;
        }
        if (this.checkDiv) {
            this.checkDiv.remove();
            this.checkDiv = undefined;
        }
        if (this.notcheckEle) {
            this.notcheckEle.remove();
            this.notcheckEle = undefined;
        }
        if (this.checkEle) {
            this.checkEle.remove();
            this.checkEle = undefined;
        }
        if (this.checkBoxEnableDiv) {
            this.checkBoxEnableDiv.remove();
            this.checkBoxEnableDiv = undefined;
        }
        if (this.checBoxEnableEle) {
            this.checBoxEnableEle.remove();
            this.checBoxEnableEle = undefined;
        }
        if (this.fieldSettingsLabel) {
            this.fieldSettingsLabel.remove();
            this.fieldSettingsLabel = undefined;
        }
        if (this.settingsTotalDiv) {
            this.settingsTotalDiv.remove();
            this.settingsTotalDiv = undefined;
        }
        if (this.totalToolTipDiv) {
            this.totalToolTipDiv.remove();
            this.totalToolTipDiv = undefined;
        }
        if (this.totalBookmarkDiv) {
            this.totalBookmarkDiv.remove();
            this.totalBookmarkDiv = undefined;
        }
    };
    return CheckBoxFormFieldDialog;
}());
export { CheckBoxFormFieldDialog };

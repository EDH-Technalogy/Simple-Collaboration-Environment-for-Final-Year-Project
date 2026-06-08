import { ListView } from '@syncfusion/ej2-lists';
import { Button, RadioButton } from '@syncfusion/ej2-buttons';
import { createElement, L10n, isNullOrUndefined } from '@syncfusion/ej2-base';
import { NumericTextBox } from '@syncfusion/ej2-inputs';
import { HelperMethods } from '../editor/editor-helper';
import { WTabStop } from '../format/paragraph-format';
var TabDialog = /** @class */ (function () {
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper.
     * @private
     */
    function TabDialog(documentHelper) {
        var _this = this;
        this.isBarClicked = false;
        this.removedItems = [];
        this.tabStopList = [];
        this.isAddUnits = true;
        this.textBoxInputChangeClickHandler = this.onTextBoxInputChangeClick.bind(this);
        this.selectHandlerClickHandler = this.onSelectHandlerClick.bind(this);
        this.setButtonClickHandler = this.onSetButtonClick.bind(this);
        this.clearButtonClickHandler = this.onClearButtonClick.bind(this);
        this.clearAllButtonClickHandler = this.onClearAllButtonClick.bind(this);
        /**
         * @private
         * @returns {void}
         */
        this.applyParagraphFormat = function () {
            if (_this.defaultTabStopIn.value !== _this.documentHelper.defaultTabWidth) {
                _this.documentHelper.defaultTabWidth = _this.defaultTabStopIn.value;
            }
            if (_this.removedItems.length > 0) {
                var values_1 = [];
                for (var i = 0; i < _this.removedItems.length; i++) {
                    values_1.push(_this.removedItems[parseInt(i.toString(), 10)].value);
                }
                _this.documentHelper.owner.editorModule.removeTabStops(_this.documentHelper.selection.getParagraphsInSelection(), values_1);
            }
            var tab = !isNullOrUndefined(_this.selectedTabStop) ? _this.selectedTabStop.value : new WTabStop();
            tab.deletePosition = 0;
            tab.tabJustification = _this.getTabAlignmentValue();
            tab.tabLeader = _this.getTabLeaderValue();
            var values = [];
            for (var i = 0; i < _this.tabStopList.length; i++) {
                values.push(_this.tabStopList[parseInt(i.toString(), 10)].value);
            }
            if (isNullOrUndefined(_this.selectedTabStop)) {
                var value = HelperMethods.getNumberFromString(_this.textBoxInput.value);
                if (value.toString() !== 'NaN') {
                    tab.position = value;
                    values.push(tab);
                }
            }
            _this.documentHelper.owner.editorModule.onApplyParagraphFormat('tabStop', values, false, false);
            _this.closeTabDialog();
        };
        this.textBoxInputChange = function (args) {
            var value = HelperMethods.getNumberFromString(_this.textBoxInput.value);
            for (var i = 0; i < _this.tabStopList.length; i++) {
                var tabValue = HelperMethods.getNumberFromString(_this.tabStopList[parseInt(i.toString(), 10)].displayText);
                if (tabValue === value) {
                    _this.selectedTabStop = _this.tabStopList[parseInt(i.toString(), 10)];
                    break;
                }
                else {
                    _this.selectedTabStop = undefined;
                }
            }
            _this.isAddUnits = false;
            var index = _this.listviewInstance.dataSource.indexOf(_this.selectedTabStop);
            var item = index >= 0 ? _this.listviewInstance.dataSource[parseInt(index.toString(), 10)] : undefined;
            _this.listviewInstance.selectItem(item);
            _this.isAddUnits = true;
        };
        this.setButtonClick = function (args) {
            if (!isNullOrUndefined(_this.selectedTabStop)) {
                var value = _this.selectedTabStop.value;
                value.tabJustification = _this.getTabAlignmentValue();
                value.tabLeader = _this.getTabLeaderValue();
            }
            else {
                var value = parseFloat(HelperMethods.getNumberFromString(_this.textBoxInput.value).toFixed(2));
                if (value.toString() === 'NaN') {
                    return;
                }
                var tabStop = new WTabStop();
                tabStop.position = value;
                tabStop.tabJustification = _this.getTabAlignmentValue();
                tabStop.tabLeader = _this.getTabLeaderValue();
                tabStop.deletePosition = 0;
                var tempCollection = [];
                for (var i = 0; i < _this.tabStopList.length; i++) {
                    tempCollection.push(_this.tabStopList[parseInt(i.toString(), 10)].value);
                }
                var index = _this.documentHelper.owner.editorModule.addTabStopToCollection(tempCollection, tabStop, true);
                var tabStopListObj = { 'displayText': parseFloat(value.toFixed(2)) + ' pt', 'value': tabStop };
                _this.tabStopList.splice(index, 0, tabStopListObj);
                _this.selectedTabStop = tabStopListObj;
                _this.listviewInstance.dataSource = _this.tabStopList;
                _this.listviewInstance.refresh();
                _this.listviewInstance.selectItem(_this.selectedTabStop);
            }
        };
        this.clearAllButtonClick = function (args) {
            for (var i = 0; i < _this.tabStopList.length; i++) {
                _this.removedItems.push(_this.tabStopList[parseInt(i.toString(), 10)]);
            }
            _this.displayDiv.innerText = _this.localeValue.getConstant('All');
            _this.tabStopList = [];
            _this.listviewInstance.dataSource = [];
            _this.listviewInstance.refresh();
            _this.selectedTabStop = undefined;
            _this.textBoxInput.value = '';
            _this.updateButtons();
        };
        this.clearButtonClick = function (args) {
            _this.removedItems.push(_this.selectedTabStop);
            if (_this.displayDiv.innerText !== _this.localeValue.getConstant('All')) {
                if (_this.displayDiv.innerText !== '') {
                    _this.displayDiv.innerText += ', ';
                }
                _this.displayDiv.innerText += _this.selectedTabStop.displayText;
            }
            var index = _this.tabStopList.indexOf(_this.selectedTabStop);
            if (index === _this.tabStopList.length - 1) {
                _this.tabStopList.splice(index, 1);
                _this.selectedTabStop = _this.tabStopList[index - 1];
            }
            else if (_this.tabStopList.length === 0) {
                _this.selectedTabStop = undefined;
            }
            else {
                _this.tabStopList.splice(index, 1);
                _this.selectedTabStop = _this.tabStopList[parseInt(index.toString(), 10)];
            }
            _this.listviewInstance.refresh();
            if (!isNullOrUndefined(_this.selectedTabStop)) {
                _this.textBoxInput.value = !isNullOrUndefined(_this.selectedTabStop) && _this.tabStopList.length > 0 ? _this.selectedTabStop.displayText : '';
            }
            else {
                _this.textBoxInput.value = '';
            }
            _this.updateButtons();
        };
        /**
         * @private
         * @returns {void}
         */
        this.closeTabDialog = function () {
            _this.documentHelper.hideDialog();
        };
        this.selectHandler = function (args) {
            if (_this.isAddUnits) {
                _this.focusTextBox(args.text);
            }
            _this.selectedTabStop = args.data;
            if (!isNullOrUndefined(_this.selectedTabStop) && _this.selectedTabStop.value.tabJustification === 'Bar') {
                _this.isBarClicked = true;
            }
            _this.updateButtons();
        };
        this.onBarClick = function (args) {
            _this.clearTabLeaderButton();
            _this.disableOrEnableTabLeaderButton(true);
            _this.isBarClicked = true;
        };
        this.onTabAlignmentButtonClick = function (args) {
            _this.disableOrEnableTabLeaderButton(false);
            if (_this.isBarClicked) {
                _this.updateTabLeaderButton('None');
                _this.isBarClicked = false;
            }
        };
        this.documentHelper = documentHelper;
    }
    TabDialog.prototype.getModuleName = function () {
        return 'TabDialog';
    };
    TabDialog.prototype.onTextBoxInputChangeClick = function (args) {
        this.textBoxInputChange(args);
    };
    TabDialog.prototype.onSetButtonClick = function (args) {
        this.setButtonClick(args);
    };
    TabDialog.prototype.onClearAllButtonClick = function (args) {
        this.clearAllButtonClick(args);
    };
    TabDialog.prototype.onClearButtonClick = function (args) {
        this.clearButtonClick(args);
    };
    /* eslint-disable */
    /**
     * @private
     * @param {L10n} locale - Specifies the locale.
     * @param {boolean} enableRtl - Specifies is rtl.
     * @returns {void}
     */
    TabDialog.prototype.initTabsDialog = function (localeValue, enableRtl) {
        var ownerId = this.documentHelper.owner.containerId;
        this.target = createElement('div', { id: ownerId + '_tab', className: 'e-de-tab' });
        this.commonDiv = createElement('div', { className: 'e-de-container-row' });
        this.target.appendChild(this.commonDiv);
        this.tabStopLabelDiv = createElement('div', { innerHTML: localeValue.getConstant('Tab stop position') + ':', className: 'e-de-para-dlg-heading' });
        this.tabStopDiv = createElement('div', { className: 'e-de-subcontainer-left' });
        this.tabStopDiv.appendChild(this.tabStopLabelDiv);
        this.tabListDiv = createElement('div', { className: 'e-tab-list' });
        this.tabStopDiv.appendChild(this.tabListDiv);
        if (enableRtl) {
            this.tabListDiv.classList.add('e-de-rtl');
        }
        this.textBoxDiv = createElement('div', { className: 'e-bookmark-textboxdiv' });
        this.tabListDiv.appendChild(this.textBoxDiv);
        this.textBoxInput = createElement('input', { className: 'e-input e-tab-textbox-input', attrs: { autofocus: 'true' } });
        this.textBoxInput.setAttribute('type', 'text');
        this.textBoxInput.setAttribute('aria-label', localeValue.getConstant('Tab stop position'));
        this.textBoxDiv.appendChild(this.textBoxInput);
        this.textBoxDiv.addEventListener('keyup', this.textBoxInputChangeClickHandler);
        this.textBoxInput.value = !isNullOrUndefined(this.tabStopList) && this.tabStopList.length > 0 ? this.tabStopList[0].displayText : '';
        this.listviewDiv = createElement('div', { className: 'e-tab-listViewDiv', attrs: { tabindex: '-1' } });
        this.listviewDiv.setAttribute('aria-label', localeValue.getConstant('TabMarkList'));
        this.tabListDiv.appendChild(this.listviewDiv);
        this.listviewInstance = new ListView({
            dataSource: this.tabStopList,
            fields: { text: 'displayText' },
            cssClass: 'e-bookmark-listview'
        });
        this.listviewInstance.appendTo(this.listviewDiv);
        this.listviewInstance.addEventListener('select', this.selectHandlerClickHandler);
        this.commonDiv.appendChild(this.tabStopDiv);
        this.defaultTablabelDiv = createElement('div', { innerHTML: localeValue.getConstant('Default tab stops') + ':', className: 'e-de-para-dlg-heading' });
        this.defaultTabDiv = createElement('div', { className: 'e-de-subcontainer-right' });
        this.commonDiv.appendChild(this.defaultTabDiv);
        this.defaultTabStopDiv = createElement('div', { className: 'e-de-dlg-container' });
        this.defaultTabStop = createElement('input', { attrs: { 'type': 'text' } });
        this.defaultTabStopDiv.appendChild(this.defaultTablabelDiv);
        this.defaultTabStopDiv.appendChild(this.defaultTabStop);
        this.defaultTabDiv.appendChild(this.defaultTabStopDiv);
        this.defaultTabStopIn = new NumericTextBox({
            format: '# pt', value: this.documentHelper.defaultTabWidth, min: 0, max: 1584, step: 1, enablePersistence: false, placeholder: localeValue.getConstant('Default tab stops'),
        });
        this.defaultTabStopIn.appendTo(this.defaultTabStop);
        this.defaultTabWarningDiv = createElement('div', { innerHTML: localeValue.getConstant('Tab stops to be cleared') + ':', className: 'e-de-dlg-container' });
        this.defaultTabDiv.appendChild(this.defaultTabWarningDiv);
        this.displayDiv = createElement('div', { className: 'e-defaultTablabelDiv' });
        if (this.documentHelper.owner.enableRtl) {
            this.displayDiv.style.marginRight = '20px';
        }
        else {
            this.displayDiv.style.marginLeft = '20px';
        }
        this.defaultTabDiv.appendChild(this.displayDiv);
        this.alignmentDiv = createElement('div', { className: 'e-de-dlg-container' });
        this.target.appendChild(this.alignmentDiv);
        this.alignmentLabelDiv = createElement('div', { innerHTML: localeValue.getConstant('Alignment') + ':', className: 'e-de-para-dlg-heading' });
        this.alignmentDiv.appendChild(this.alignmentLabelDiv);
        this.alignmentPropertyDiv = createElement('div', { styles: 'display: flex;' });
        this.alignmentDiv.appendChild(this.alignmentPropertyDiv);
        this.alignmentPropertyDiv1 = createElement('div', { styles: 'display: flex; flex-direction: column; width: 33.33%' });
        this.leftDiv = createElement('div');
        this.leftRadioBtn = createElement('input', {
            attrs: { 'type': 'radiobutton' }
        });
        this.decimalDiv = createElement('div');
        this.decimalRadioBtn = createElement('input', {
            attrs: { 'type': 'radiobutton' }
        });
        this.leftDiv.appendChild(this.leftRadioBtn);
        this.decimalDiv.appendChild(this.decimalRadioBtn);
        this.alignmentPropertyDiv1.appendChild(this.leftDiv);
        this.alignmentPropertyDiv1.appendChild(this.decimalDiv);
        this.alignmentPropertyDiv.appendChild(this.alignmentPropertyDiv1);
        this.left = new RadioButton({ label: localeValue.getConstant('Left'), name: 'alignment', value: 'left', cssClass: 'e-small', checked: true, enableRtl: enableRtl, change: this.onTabAlignmentButtonClick });
        this.decimal = new RadioButton({ label: localeValue.getConstant('Decimal'), name: 'alignment', value: 'decimal', cssClass: 'e-small', enableRtl: enableRtl, change: this.onTabAlignmentButtonClick });
        this.left.appendTo(this.leftRadioBtn);
        this.decimal.appendTo(this.decimalRadioBtn);
        this.leftRadioBtn.setAttribute('aria-label', localeValue.getConstant('Left'));
        this.decimalRadioBtn.setAttribute('aria-label', localeValue.getConstant('Decimal'));
        this.alignmentPropertyDiv2 = createElement('div', { styles: 'display: flex; flex-direction: column; width: 33.33%' });
        this.centerDiv = createElement('div');
        this.centerRadioBtn = createElement('input', {
            attrs: { 'type': 'radiobutton' }
        });
        this.barDiv = createElement('div');
        this.barRadioBtn = createElement('input', {
            attrs: { 'type': 'radiobutton' }
        });
        this.barDiv.appendChild(this.barRadioBtn);
        this.centerDiv.appendChild(this.centerRadioBtn);
        this.alignmentPropertyDiv2.appendChild(this.centerDiv);
        this.alignmentPropertyDiv2.appendChild(this.barDiv);
        this.bar = new RadioButton({ label: localeValue.getConstant('Bar'), name: 'alignment', value: 'bar', cssClass: 'e-small', enableRtl: enableRtl, change: this.onBarClick });
        this.center = new RadioButton({ label: localeValue.getConstant('Center'), name: 'alignment', value: 'center', cssClass: 'e-small', enableRtl: enableRtl, change: this.onTabAlignmentButtonClick });
        this.bar.appendTo(this.barRadioBtn);
        this.center.appendTo(this.centerRadioBtn);
        this.barRadioBtn.setAttribute('aria-label', localeValue.getConstant('Bar'));
        this.centerRadioBtn.setAttribute('aria-label', localeValue.getConstant('Center'));
        this.alignmentPropertyDiv.appendChild(this.alignmentPropertyDiv2);
        this.alignmentPropertyDiv3 = createElement('div', { styles: 'display: flex; flex-direction: column;width: 33.33%' });
        this.rightDiv = createElement('div');
        this.rightRadioBtn = createElement('input', {
            attrs: { 'type': 'radiobutton' }
        });
        this.rightDiv.appendChild(this.rightRadioBtn);
        this.alignmentPropertyDiv3.appendChild(this.rightDiv);
        this.right = new RadioButton({ label: localeValue.getConstant('Right'), name: 'alignment', value: 'right', cssClass: 'e-small', enableRtl: enableRtl, change: this.onTabAlignmentButtonClick });
        this.right.appendTo(this.rightRadioBtn);
        this.rightRadioBtn.setAttribute('aria-label', localeValue.getConstant('Right'));
        this.alignmentPropertyDiv.appendChild(this.alignmentPropertyDiv3);
        this.tabLeaderDiv = createElement('div', { className: 'e-de-dlg-container' });
        this.tabLeaderLabelDiv = createElement('div', { innerHTML: localeValue.getConstant('Leader') + ':', className: 'e-de-para-dlg-heading' });
        this.tabLeaderDiv.appendChild(this.tabLeaderLabelDiv);
        this.target.appendChild(this.tabLeaderDiv);
        this.tabLeaderPropertyDiv = createElement('div', { styles: 'display: flex;' });
        this.tabLeaderDiv.appendChild(this.tabLeaderPropertyDiv);
        this.tabLeaderPropertyDiv1 = createElement('div', { styles: 'display: flex; flex-direction: column; width: 33.33%' });
        this.noneDiv = createElement('div');
        this.noneRadioBtn = createElement('input', {
            attrs: { 'type': 'radiobutton' }
        });
        this.underscoreDiv = createElement('div');
        this.underscoreRadioBtn = createElement('input', {
            attrs: { 'type': 'radiobutton' }
        });
        this.noneDiv.appendChild(this.noneRadioBtn);
        this.underscoreDiv.appendChild(this.underscoreRadioBtn);
        this.tabLeaderPropertyDiv1.appendChild(this.noneDiv);
        this.tabLeaderPropertyDiv1.appendChild(this.underscoreDiv);
        this.none = new RadioButton({ label: '1 ' + localeValue.getConstant('None'), name: 'tabLeader', value: 'none', cssClass: 'e-small', checked: true, enableRtl: enableRtl });
        this.underscore = new RadioButton({ label: '4 _____', name: 'tabLeader', value: 'underscore', cssClass: 'e-small', enableRtl: enableRtl });
        this.none.appendTo(this.noneRadioBtn);
        this.underscore.appendTo(this.underscoreRadioBtn);
        this.tabLeaderPropertyDiv.appendChild(this.tabLeaderPropertyDiv1);
        this.tabLeaderPropertyDiv2 = createElement('div', { styles: 'display: flex; flex-direction: column; width: 33.33%' });
        this.dottedDiv = createElement('div');
        this.dottedRadioBtn = createElement('input', {
            attrs: { 'type': 'radiobutton' }
        });
        this.singleDiv = createElement('div');
        this.singleRadioBtn = createElement('input', {
            attrs: { 'type': 'radiobutton' }
        });
        this.dottedDiv.appendChild(this.dottedRadioBtn);
        this.singleDiv.appendChild(this.singleRadioBtn);
        this.dotted = new RadioButton({ label: '2 .......', name: 'tabLeader', value: 'dotted', cssClass: 'e-small', enableRtl: enableRtl });
        this.single = new RadioButton({ label: '5 -------', name: 'tabLeader', value: 'single', cssClass: 'e-small', enableRtl: enableRtl });
        this.dotted.appendTo(this.dottedRadioBtn);
        this.single.appendTo(this.singleRadioBtn);
        this.tabLeaderPropertyDiv2.appendChild(this.dottedDiv);
        this.tabLeaderPropertyDiv2.appendChild(this.singleDiv);
        this.tabLeaderPropertyDiv.appendChild(this.tabLeaderPropertyDiv2);
        this.tabLeaderPropertyDiv3 = createElement('div', { styles: 'display: flex; flex-direction: column; width: 33.33%' });
        this.HyphenDiv = createElement('div');
        this.HyphenRadioBtn = createElement('input', {
            attrs: { 'type': 'radiobutton' }
        });
        this.HyphenDiv.appendChild(this.HyphenRadioBtn);
        this.tabLeaderPropertyDiv3.appendChild(this.HyphenDiv);
        this.Hyphen = new RadioButton({ label: '3 -------', name: 'tabLeader', value: 'hyphen', cssClass: 'e-small', enableRtl: enableRtl });
        this.Hyphen.appendTo(this.HyphenRadioBtn);
        this.tabLeaderPropertyDiv.appendChild(this.tabLeaderPropertyDiv3);
        this.buttonDiv = createElement('div', { className: 'e-de-tab-button', styles: 'display: flex;' });
        this.target.appendChild(this.buttonDiv);
        this.tableElement = createElement('table');
        this.buttonDiv.appendChild(this.tableElement);
        this.tableElement.style.width = '100%';
        var row = this.tableElement.insertRow();
        var cell = row.insertCell();
        this.setbuttonDiv = createElement('div', { className: 'e-de-tab-setBtn' });
        this.buttonDiv.appendChild(this.setbuttonDiv);
        this.setButtonElement = createElement('button', {
            innerHTML: localeValue.getConstant('Set'),
            attrs: { type: 'button' }
        });
        this.setButtonElement.setAttribute('aria-label', localeValue.getConstant('Set'));
        this.setbuttonDiv.appendChild(this.setButtonElement);
        this.setButton = new Button({ cssClass: 'e-button-custom' });
        this.setButton.appendTo(this.setButtonElement);
        cell.appendChild(this.setbuttonDiv);
        this.setButtonElement.addEventListener('click', this.setButtonClickHandler);
        //setButtonElement.addEventListener('click', this.setTabStop);
        cell.style.width = '33.33%';
        cell.style.display = 'table-cell';
        cell = row.insertCell();
        this.clearbuttonDiv = createElement('div', { className: 'e-de-tab-clearBtn' });
        this.buttonDiv.appendChild(this.clearbuttonDiv);
        this.clearButtonElement = createElement('button', {
            innerHTML: localeValue.getConstant('Clear'),
            attrs: { type: 'button' }
        });
        this.clearButtonElement.setAttribute('aria-label', localeValue.getConstant('Clear'));
        this.clearbuttonDiv.appendChild(this.clearButtonElement);
        this.clearButton = new Button({ cssClass: 'e-button-custom' });
        this.clearButton.appendTo(this.clearButtonElement);
        this.clearButtonElement.addEventListener('click', this.clearButtonClickHandler);
        //clearButtonElement.addEventListener('click', this.clearTabStop);
        cell.appendChild(this.clearbuttonDiv);
        cell.style.width = '33.33%';
        cell.style.display = 'table-cell';
        cell = row.insertCell();
        this.clearAllbuttonDiv = createElement('div', { className: 'e-de-tab-clearAllBtn' });
        this.buttonDiv.appendChild(this.clearAllbuttonDiv);
        this.clearAllButtonElement = createElement('button', {
            innerHTML: localeValue.getConstant('Clear All'),
            attrs: { type: 'button' }
        });
        this.clearAllButtonElement.setAttribute('aria-label', localeValue.getConstant('Clear All'));
        this.clearAllbuttonDiv.appendChild(this.clearAllButtonElement);
        this.clearAllButton = new Button({ cssClass: 'e-button-custom' });
        this.clearAllButton.appendTo(this.clearAllButtonElement);
        this.clearAllButtonElement.addEventListener('click', this.clearAllButtonClickHandler);
        //clearButtonElement.addEventListener('click', this.clearTabStop);
        cell.appendChild(this.clearAllbuttonDiv);
        cell.style.width = '33.33%';
        cell.style.display = 'table-cell';
        this.selectedTabStop = !isNullOrUndefined(this.tabStopList) && this.tabStopList.length > 0 ? this.tabStopList[0] : undefined;
        this.updateButtons();
    };
    TabDialog.prototype.getTabAlignmentValue = function () {
        if (this.left.checked) {
            return 'Left';
        }
        else if (this.center.checked) {
            return 'Center';
        }
        else if (this.right.checked) {
            return 'Right';
        }
        else if (this.decimal.checked) {
            return 'Decimal';
        }
        else if (this.bar.checked) {
            return 'Bar';
        }
        return 'Left';
    };
    TabDialog.prototype.getTabLeaderValue = function () {
        if (this.none.checked) {
            return 'None';
        }
        else if (this.dotted.checked) {
            return 'Dot';
        }
        else if (this.Hyphen.checked) {
            return 'Hyphen';
        }
        else if (this.underscore.checked) {
            return 'Underscore';
        }
        else if (this.single.checked) {
            return 'Single';
        }
        return 'None';
    };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    TabDialog.prototype.onSelectHandlerClick = function (args) {
        this.selectHandler(args);
    };
    TabDialog.prototype.updateButtons = function () {
        if (!isNullOrUndefined(this.selectedTabStop)) {
            this.updateTabAlignmentButton(this.selectedTabStop.value.tabJustification);
            this.updateTabLeaderButton(this.selectedTabStop.value.tabLeader);
        }
        else {
            this.updateTabAlignmentButton('Left');
            this.updateTabLeaderButton('None');
        }
    };
    TabDialog.prototype.updateTabLeaderButton = function (value) {
        this.clearTabLeaderButton();
        if (this.getTabAlignmentValue() === 'Bar') {
            return;
        }
        switch (value) {
            case 'None':
                this.none.checked = true;
                break;
            case 'Single':
                this.single.checked = true;
                break;
            case 'Dot':
                this.dotted.checked = true;
                break;
            case 'Hyphen':
                this.Hyphen.checked = true;
                break;
            case 'Underscore':
                this.underscore.checked = true;
                break;
            default:
                this.none.checked = true;
                break;
        }
    };
    TabDialog.prototype.updateTabAlignmentButton = function (value) {
        this.clearTabAlignmentButton();
        switch (value) {
            case 'Left':
                this.left.checked = true;
                break;
            case 'Center':
                this.center.checked = true;
                break;
            case 'Right':
                this.right.checked = true;
                break;
            case 'Decimal':
                this.decimal.checked = true;
                break;
            case 'Bar':
                this.bar.checked = true;
                this.clearTabLeaderButton();
                this.disableOrEnableTabLeaderButton(true);
                return;
            default:
                break;
        }
        this.disableOrEnableTabLeaderButton(false);
    };
    TabDialog.prototype.clearTabLeaderButton = function () {
        this.none.checked = false;
        this.single.checked = false;
        this.dotted.checked = false;
        this.Hyphen.checked = false;
        this.underscore.checked = false;
    };
    TabDialog.prototype.disableOrEnableTabLeaderButton = function (isDisable) {
        this.none.disabled = isDisable;
        this.single.disabled = isDisable;
        this.dotted.disabled = isDisable;
        this.Hyphen.disabled = isDisable;
        this.underscore.disabled = isDisable;
    };
    TabDialog.prototype.clearTabAlignmentButton = function () {
        this.left.checked = false;
        this.center.checked = false;
        this.right.checked = false;
        this.decimal.checked = false;
        this.bar.checked = false;
    };
    TabDialog.prototype.focusTextBox = function (text) {
        this.textBoxInput.value = text;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        var value = this.textBoxInput;
        value.setSelectionRange(0, text.length);
        value.focus();
    };
    /**
     * @private
     * @returns {void}
     */
    TabDialog.prototype.show = function () {
        var localObj = new L10n('documenteditor', this.documentHelper.owner.defaultLocale);
        localObj.setLocale(this.documentHelper.owner.locale);
        this.localeValue = localObj;
        var tabs = this.documentHelper.owner.editorModule.getTabsInSelection();
        this.tabStopList = [];
        for (var i = 0; i < tabs.length; i++) {
            var value = parseFloat((tabs[i].position).toFixed(2)) + ' pt';
            var objectValue = { 'displayText': value, 'value': tabs[i].clone() };
            this.tabStopList.push(objectValue);
        }
        this.initTabsDialog(localObj, this.documentHelper.owner.enableRtl);
        this.documentHelper.dialog.header = localObj.getConstant('Tabs');
        this.documentHelper.dialog.height = 'auto';
        this.documentHelper.dialog.width = 'auto';
        this.documentHelper.dialog.content = this.target;
        this.documentHelper.dialog.beforeOpen = this.documentHelper.updateFocus;
        this.documentHelper.dialog.close = this.documentHelper.updateFocus;
        this.documentHelper.dialog.buttons = [{
                click: this.applyParagraphFormat,
                buttonModel: { content: localObj.getConstant('Ok'), cssClass: 'e-flat e-para-okay', isPrimary: true }
            },
            {
                click: this.closeTabDialog,
                buttonModel: { content: localObj.getConstant('Cancel'), cssClass: 'e-flat e-para-cancel' }
            }
        ];
        this.documentHelper.dialog.show();
    };
    /**
     * @private
     * @returns {void}
     */
    TabDialog.prototype.destroy = function () {
        this.removeEvents();
        this.removeElements();
        this.target = undefined;
        this.textBoxInput = undefined;
        this.defaultTabStopIn = undefined;
        this.left = undefined;
        this.right = undefined;
        this.center = undefined;
        this.decimal = undefined;
        this.bar = undefined;
        this.none = undefined;
        this.dotted = undefined;
        this.single = undefined;
        this.Hyphen = undefined;
        this.setButton = undefined;
        this.clearButton = undefined;
        this.clearAllButton = undefined;
        if (this.listviewInstance) {
            this.listviewInstance.destroy();
            this.listviewInstance = undefined;
        }
        this.selectedTabStop = undefined;
        this.isBarClicked = undefined;
        this.removedItems = undefined;
        this.tabStopList = undefined;
        this.localeValue = undefined;
    };
    TabDialog.prototype.removeEvents = function () {
        if (this.textBoxDiv) {
            this.textBoxDiv.removeEventListener('keyup', this.textBoxInputChangeClickHandler);
        }
        if (this.setButtonElement) {
            this.setButtonElement.removeEventListener('click', this.setButtonClickHandler);
        }
        if (this.clearButtonElement) {
            this.clearButtonElement.removeEventListener('click', this.clearButtonClickHandler);
        }
        if (this.clearAllButtonElement) {
            this.clearAllButtonElement.removeEventListener('click', this.clearAllButtonClickHandler);
        }
        if (this.listviewInstance) {
            this.listviewInstance.removeEventListener('select', this.selectHandlerClickHandler);
        }
    };
    TabDialog.prototype.removeElements = function () {
        if (this.commonDiv) {
            this.commonDiv.remove();
            this.commonDiv = undefined;
        }
        if (this.tabStopLabelDiv) {
            this.tabStopLabelDiv.remove();
            this.tabStopLabelDiv = undefined;
        }
        if (this.tabStopDiv) {
            this.tabStopDiv.remove();
            this.tabStopDiv = undefined;
        }
        if (this.tabListDiv) {
            this.tabListDiv.remove();
            this.tabListDiv = undefined;
        }
        if (this.textBoxDiv) {
            this.textBoxDiv.remove();
            this.textBoxDiv = undefined;
        }
        if (this.listviewDiv) {
            this.listviewDiv.remove();
            this.listviewDiv = undefined;
        }
        if (this.defaultTablabelDiv) {
            this.defaultTablabelDiv.remove();
            this.defaultTablabelDiv = undefined;
        }
        if (this.defaultTabDiv) {
            this.defaultTabDiv.remove();
            this.defaultTabDiv = undefined;
        }
        if (this.defaultTabStopDiv) {
            this.defaultTabStopDiv.remove();
            this.defaultTabStopDiv = undefined;
        }
        if (this.defaultTabWarningDiv) {
            this.defaultTabWarningDiv.remove();
            this.defaultTabWarningDiv = undefined;
        }
        if (this.defaultTabStop) {
            this.defaultTabStop.remove();
            this.defaultTabStop = undefined;
        }
        if (this.displayDiv) {
            this.displayDiv.remove();
            this.displayDiv = undefined;
        }
        if (this.alignmentDiv) {
            this.alignmentDiv.remove();
            this.alignmentDiv = undefined;
        }
        if (this.alignmentLabelDiv) {
            this.alignmentLabelDiv.remove();
            this.alignmentLabelDiv = undefined;
        }
        if (this.alignmentPropertyDiv) {
            this.alignmentPropertyDiv.remove();
            this.alignmentPropertyDiv = undefined;
        }
        if (this.alignmentPropertyDiv1) {
            this.alignmentPropertyDiv1.remove();
            this.alignmentPropertyDiv1 = undefined;
        }
        if (this.leftDiv) {
            this.leftDiv.remove();
            this.leftDiv = undefined;
        }
        if (this.leftRadioBtn) {
            this.leftRadioBtn.remove();
            this.leftRadioBtn = undefined;
        }
        if (this.decimalDiv) {
            this.decimalDiv.remove();
            this.decimalDiv = undefined;
        }
        if (this.decimalRadioBtn) {
            this.decimalRadioBtn.remove();
            this.decimalRadioBtn = undefined;
        }
        if (this.alignmentPropertyDiv2) {
            this.alignmentPropertyDiv2.remove();
            this.alignmentPropertyDiv2 = undefined;
        }
        if (this.centerDiv) {
            this.centerDiv.remove();
            this.centerDiv = undefined;
        }
        if (this.centerRadioBtn) {
            this.centerRadioBtn.remove();
            this.centerRadioBtn = undefined;
        }
        if (this.barDiv) {
            this.barDiv.remove();
            this.barDiv = undefined;
        }
        if (this.barRadioBtn) {
            this.barRadioBtn.remove();
            this.barRadioBtn = undefined;
        }
        if (this.alignmentPropertyDiv3) {
            this.alignmentPropertyDiv3.remove();
            this.alignmentPropertyDiv3 = undefined;
        }
        if (this.rightDiv) {
            this.rightDiv.remove();
            this.rightDiv = undefined;
        }
        if (this.rightRadioBtn) {
            this.rightRadioBtn.remove();
            this.rightRadioBtn = undefined;
        }
        if (this.tabLeaderDiv) {
            this.tabLeaderDiv.remove();
            this.tabLeaderDiv = undefined;
        }
        if (this.tabLeaderLabelDiv) {
            this.tabLeaderLabelDiv.remove();
            this.tabLeaderLabelDiv = undefined;
        }
        if (this.tabLeaderPropertyDiv) {
            this.tabLeaderPropertyDiv.remove();
            this.tabLeaderPropertyDiv = undefined;
        }
        if (this.tabLeaderPropertyDiv1) {
            this.tabLeaderPropertyDiv1.remove();
            this.tabLeaderPropertyDiv1 = undefined;
        }
        if (this.noneDiv) {
            this.noneDiv.remove();
            this.noneDiv = undefined;
        }
        if (this.noneRadioBtn) {
            this.noneRadioBtn.remove();
            this.noneRadioBtn = undefined;
        }
        if (this.underscoreDiv) {
            this.underscoreDiv.remove();
            this.underscoreDiv = undefined;
        }
        if (this.underscoreRadioBtn) {
            this.underscoreRadioBtn.remove();
            this.underscoreRadioBtn = undefined;
        }
        if (this.tabLeaderPropertyDiv2) {
            this.tabLeaderPropertyDiv2.remove();
            this.tabLeaderPropertyDiv2 = undefined;
        }
        if (this.dottedDiv) {
            this.dottedDiv.remove();
            this.dottedDiv = undefined;
        }
        if (this.dottedRadioBtn) {
            this.dottedRadioBtn.remove();
            this.dottedRadioBtn = undefined;
        }
        if (this.singleDiv) {
            this.singleDiv.remove();
            this.singleDiv = undefined;
        }
        if (this.singleRadioBtn) {
            this.singleRadioBtn.remove();
            this.singleRadioBtn = undefined;
        }
        if (this.tabLeaderPropertyDiv3) {
            this.tabLeaderPropertyDiv3.remove();
            this.tabLeaderPropertyDiv3 = undefined;
        }
        if (this.HyphenDiv) {
            this.HyphenDiv.remove();
            this.HyphenDiv = undefined;
        }
        if (this.HyphenRadioBtn) {
            this.HyphenRadioBtn.remove();
            this.HyphenRadioBtn = undefined;
        }
        if (this.buttonDiv) {
            this.buttonDiv.remove();
            this.buttonDiv = undefined;
        }
        if (this.tableElement) {
            this.tableElement.remove();
            this.tableElement = undefined;
        }
        if (this.setbuttonDiv) {
            this.setbuttonDiv.remove();
            this.setbuttonDiv = undefined;
        }
        if (this.setButtonElement) {
            this.setButtonElement.remove();
            this.setButtonElement = undefined;
        }
        if (this.setButton) {
            this.setButton.destroy();
            this.setButton = undefined;
        }
        if (this.clearbuttonDiv) {
            this.clearbuttonDiv.remove();
            this.clearbuttonDiv = undefined;
        }
        if (this.clearButtonElement) {
            this.clearButtonElement.remove();
            this.clearButtonElement = undefined;
        }
        if (this.clearButton) {
            this.clearButton.destroy();
            this.clearButton = undefined;
        }
        if (this.clearAllbuttonDiv) {
            this.clearAllbuttonDiv.remove();
            this.clearAllbuttonDiv = undefined;
        }
        if (this.clearAllButtonElement) {
            this.clearAllButtonElement.remove();
            this.clearAllButtonElement = undefined;
        }
        if (this.clearAllButton) {
            this.clearAllButton.destroy();
            this.clearAllButton = undefined;
        }
        if (this.textBoxInput) {
            this.textBoxInput.remove();
            this.textBoxInput = undefined;
        }
    };
    return TabDialog;
}());
export { TabDialog };

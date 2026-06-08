import { L10n, createElement, isNullOrUndefined } from '@syncfusion/ej2-base';
import { CheckBox } from '@syncfusion/ej2-buttons';
import { NumericTextBox } from '@syncfusion/ej2-inputs';
import { WSectionFormat, WColumnFormat, HelperMethods } from '../index';
import { SectionBreakType } from '../../base/types';
/**
 * @private
 */
var Column = /** @class */ (function () {
    function Column() {
    }
    return Column;
}());
var ColumnsDialog = /** @class */ (function () {
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper
     * @private
     */
    function ColumnsDialog(documentHelper) {
        var _this = this;
        this.lineCheckbox = undefined;
        this.equalCheckbox = undefined;
        this.handleSettingCheckBoxActionHandler = this.onhandleSettingCheckBoxActionClicked.bind(this);
        this.checkBox = function (args) {
            for (var i = 0; i < _this.columns.length; i++) {
                var col = _this.columns[parseInt(i.toString(), 10)];
                if (_this.equalCheckbox.checked === true) {
                    if (i !== 0) {
                        col.width.enabled = false;
                        col.space.enabled = false;
                    }
                }
                else {
                    col.width.enabled = true;
                    col.space.enabled = true;
                }
            }
        };
        this.createTextBox = function (args) {
            if (_this.columnValueTexBox.value === 1) {
                _this.oneDiv.classList.add('e-de-table-border-inside-setting-click');
                _this.twoDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.threeDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.leftDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.rightDiv.classList.remove('e-de-table-border-inside-setting-click');
            }
            else if (_this.columnValueTexBox.value === 2) {
                _this.oneDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.twoDiv.classList.add('e-de-table-border-inside-setting-click');
                _this.threeDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.leftDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.rightDiv.classList.remove('e-de-table-border-inside-setting-click');
            }
            else if (_this.columnValueTexBox.value === 3) {
                _this.oneDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.twoDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.threeDiv.classList.add('e-de-table-border-inside-setting-click');
                _this.leftDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.rightDiv.classList.remove('e-de-table-border-inside-setting-click');
            }
            _this.numberOfColumns = args.value;
            if (args.value >= 1) {
                _this.equalCheckbox.disabled = false;
                _this.lineCheckbox.disabled = false;
                var i = args.previousValue;
                while (i < _this.numberOfColumns) {
                    _this.createColumn(i + 1);
                    i++;
                }
                while (i > _this.numberOfColumns) {
                    _this.columnTable.deleteRow(_this.columnTable.rows.length - 1);
                    _this.columns.splice(_this.columns.length - 1, _this.columns.length);
                    if (_this.numberOfColumns === 1) {
                        _this.equalCheckbox.disabled = true;
                        _this.columns[0].space.enabled = false;
                    }
                    i--;
                }
                _this.canUpdateColumnWidthAndSpacing(args.value, undefined, undefined, undefined);
            }
        };
        this.widthChange = function (args) {
            if (args.isInteracted === true) {
                var val = (args.event.target).parentElement.classList;
                val.replace('width1', 'Width');
                _this.checkAndApplyColumnFormatWidth(args.value);
            }
        };
        this.spaceChange = function (args) {
            if (args.isInteracted === true) {
                var val = (args.event.target).parentElement.classList;
                val.replace('space1', 'Space');
                _this.checkAndApplyColumnFormatSpace(args.value);
            }
        };
        this.checkAndApplyColumnFormatWidth = function (columnWidth) {
            if (_this.numberOfColumns === 1) {
                if (columnWidth > _this.pageWidth) {
                    _this.columns[0].width.value = columnWidth - 1;
                }
                else {
                    _this.columns[0].width.value = columnWidth + 1;
                }
            }
            else {
                if (_this.equalCheckbox.checked === true) {
                    for (var i = 0; i < _this.columns.length; i++) {
                        var col = _this.columns[parseInt(i.toString(), 10)];
                        if (columnWidth >= 36 && _this.columns[0].space.value >= 0) {
                            var spaceCal = (_this.pageWidth - (_this.numberOfColumns * columnWidth)) / (_this.numberOfColumns - 1);
                            col.width.value = columnWidth;
                            if (i < _this.columns.length - 1) {
                                col.space.value = spaceCal;
                            }
                        }
                        else {
                            _this.columns[0].width.value = _this.columns[1].width.value;
                        }
                    }
                }
                if (_this.equalCheckbox.checked === false) {
                    for (var i = 0; i < _this.columns.length; i++) {
                        var col = _this.columns[parseInt(i.toString(), 10)];
                        var updatedNumber = void 0;
                        if (columnWidth === _this.columns[parseInt(i.toString(), 10)].width.value) {
                            updatedNumber = i;
                            if (updatedNumber + 1 !== _this.columns.length) {
                                if (columnWidth > _this.columns[0].width.value
                                    || columnWidth > _this.columns[_this.columns.length - 1].width.value) {
                                    for (var y = updatedNumber + 1; y <= _this.columns.length; y++) {
                                        var col_1 = _this.columns[parseInt(y.toString(), 10)];
                                        //1
                                        if (y < _this.columns.length) {
                                            if (col_1.width.value > 36) {
                                                col_1.width.value = col_1.width.value - 1;
                                            }
                                        }
                                        //2
                                        if (_this.columns[0].space.value === 0) {
                                            for (var k = updatedNumber - 1; k >= 0; k--) {
                                                var col_2 = _this.columns[parseInt(k.toString(), 10)];
                                                if (col_2.width.value > 36) {
                                                    col_2.width.value = col_2.width.value - 1;
                                                }
                                            }
                                        }
                                        //3
                                        if ((y >= _this.columns.length && _this.columns[0].width.value === 36)
                                            || (_this.columns[y - 1].width.value === 36 && _this.columns[0].space.value !== 0)) {
                                            for (var j = 0; j < _this.columns.length - 1; j++) {
                                                var col_3 = _this.columns[parseInt(j.toString(), 10)];
                                                if (col_3.space.value > 0) {
                                                    if (j < _this.columns.length - 1) {
                                                        col_3.space.value = col_3.space.value - 1;
                                                    }
                                                }
                                            }
                                        }
                                        //4
                                        if (_this.columns[0].width.value === 36 && _this.columns[0].space.value === 0
                                            || _this.columns[y - 1].width.value === 36 && _this.columns[0].space.value === 0) {
                                            for (var j = 0; j < _this.columns.length; j++) {
                                                var col_4 = _this.columns[parseInt(j.toString(), 10)];
                                                if (col_4.width.value !== 36 && columnWidth
                                                    > (_this.pageWidth - ((_this.numberOfColumns - 1) * 36))) {
                                                    col_4.width.value = columnWidth - 1;
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    for (var y = updatedNumber + 1; y < _this.columns.length; y++) {
                                        var col_5 = _this.columns[parseInt(y.toString(), 10)];
                                        if (col_5.width.value > 36) {
                                            col_5.width.value = col_5.width.value + 1;
                                        }
                                    }
                                }
                            }
                            else {
                                if (columnWidth > _this.columns[0].width.value
                                    || columnWidth > _this.columns[_this.columns.length - 1].width.value) {
                                    for (var y = updatedNumber + 1; y <= _this.columns.length; y++) {
                                        //2
                                        if (_this.columns[0].space.value === 0) {
                                            for (var k = updatedNumber - 1; k >= 0; k--) {
                                                var col_6 = _this.columns[parseInt(k.toString(), 10)];
                                                if (col_6.width.value > 36) {
                                                    col_6.width.value = col_6.width.value - 1;
                                                }
                                            }
                                        }
                                        //3
                                        if ((y <= _this.columns.length && _this.columns[0].space.value !== 0)) {
                                            for (var j = 0; j < _this.columns.length - 1; j++) {
                                                var col_7 = _this.columns[parseInt(j.toString(), 10)];
                                                if (col_7.space.value > 0) {
                                                    if (j < _this.columns.length - 1) {
                                                        col_7.space.value = col_7.space.value - 1;
                                                    }
                                                }
                                            }
                                        }
                                        //4
                                        if (_this.columns[0].width.value === 36 && _this.columns[0].space.value === 0) {
                                            for (var j = 0; j < _this.columns.length; j++) {
                                                var col_8 = _this.columns[parseInt(j.toString(), 10)];
                                                if (col_8.width.value !== 36 && columnWidth
                                                    > (_this.pageWidth - ((_this.numberOfColumns - 1) * 36))) {
                                                    col_8.width.value = columnWidth - 1;
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    for (var y = updatedNumber + 1; y < _this.columns.length; y++) {
                                        var col_9 = _this.columns[parseInt(y.toString(), 10)];
                                        if (col_9.width.value > 36) {
                                            col_9.width.value = col_9.width.value + 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        this.checkAndApplyColumnFormatSpace = function (columnSpace) {
            if (_this.equalCheckbox.checked === true) {
                for (var i = 0; i < _this.columns.length; i++) {
                    var col = _this.columns[parseInt(i.toString(), 10)];
                    if (columnSpace >= 0 && _this.columns[0].width.value >= 36) {
                        var widthCal = (_this.pageWidth - (columnSpace * (_this.numberOfColumns - 1))) / (_this.numberOfColumns);
                        col.width.value = widthCal;
                        if (i < _this.columns.length - 1) {
                            col.space.value = columnSpace;
                        }
                    }
                    else {
                        _this.columns[0].space.value = _this.columns[1].space.value;
                    }
                }
            }
            if (_this.equalCheckbox.checked === false) {
                for (var i = 0; i < _this.columns.length; i++) {
                    var col = _this.columns[parseInt(i.toString(), 10)];
                    var updatedNumber = void 0;
                    if (columnSpace === _this.columns[parseInt(i.toString(), 10)].space.value) {
                        updatedNumber = i;
                        if (updatedNumber + 1 !== _this.columns.length) {
                            _this.columns[_this.columns.length - 1].space.value = 0;
                            if (columnSpace > _this.columns[0].space.value || columnSpace > _this.columns[_this.columns.length - 2].space.value) {
                                //1
                                for (var y = updatedNumber + 1; y <= _this.columns.length; y++) {
                                    var col_10 = _this.columns[parseInt(y.toString(), 10)];
                                    if (y < _this.columns.length) {
                                        if (col_10.width.value > 36) {
                                            col_10.width.value = col_10.width.value - 1;
                                        }
                                    }
                                    //2
                                    if ((_this.columns[updatedNumber + 1].width.value === 36
                                        && _this.columns[parseInt(updatedNumber.toString(), 10)].width.value > 36)) {
                                        for (var j = updatedNumber; j >= 0; j--) {
                                            var col_11 = _this.columns[parseInt(j.toString(), 10)];
                                            if (col_11.width.value > 36) {
                                                col_11.width.value = col_11.width.value - 1;
                                            }
                                        }
                                    }
                                    //3
                                    if (_this.columns[parseInt(updatedNumber.toString(), 10)].width.value === 36) {
                                        if (_this.columns[0].space.value !== 0 || _this.columns[updatedNumber + 1].space.value !== 0) {
                                            for (var k = 0; k < _this.columns.length - 1; k++) {
                                                var col_12 = _this.columns[parseInt(k.toString(), 10)];
                                                if (col_12.space.value > 0) {
                                                    if (k < _this.columns.length - 1) {
                                                        col_12.space.value = col_12.space.value - 1;
                                                        _this.columns[parseInt(updatedNumber.toString(), 10)].space.value = columnSpace;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    //4
                                    if (_this.columns[0].width.value === 36 && (_this.columns[0].space.value === 0
                                        || _this.columns[updatedNumber + 1].space.value === 0)) {
                                        for (var j = 0; j < _this.columns.length; j++) {
                                            var col_13 = _this.columns[parseInt(j.toString(), 10)];
                                            if (col_13.space.value !== 0 && columnSpace > (_this.pageWidth - ((_this.numberOfColumns) * 36))) {
                                                col_13.space.value = columnSpace - 1;
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                for (var y = updatedNumber + 1; y < _this.columns.length; y++) {
                                    var col_14 = _this.columns[parseInt(y.toString(), 10)];
                                    if (col_14.width.value > 36) {
                                        col_14.width.value = col_14.width.value + 0.5;
                                    }
                                }
                            }
                        }
                        else {
                            _this.columns[parseInt(updatedNumber.toString(), 10)].space.value = 0;
                        }
                    }
                }
            }
        };
        this.canUpdateColumnWidthAndSpacing = function (numberOfColumns, colIndex, colWidth, colSpace) {
            var spaceValue = 36;
            var valueWidthEqualFirst = (_this.pageWidth - 36 * (numberOfColumns - 1)) / numberOfColumns;
            var valueWidthEqualsecond = (_this.pageWidth - 36 * (numberOfColumns)) / (numberOfColumns - 1);
            if (numberOfColumns === 2) {
                _this.equalCheckbox.checked = true;
            }
            if (_this.equalCheckbox.checked === true) {
                if (numberOfColumns > 1) {
                    var col = _this.columns[numberOfColumns - 1];
                    col.index.value = numberOfColumns;
                    for (var i = 0; i < numberOfColumns; i++) {
                        var col_15 = _this.columns[parseInt(i.toString(), 10)];
                        if (numberOfColumns <= 6) {
                            col_15.width.value = valueWidthEqualFirst;
                        }
                        else {
                            col_15.width.value = spaceValue;
                        }
                        col_15.width.value = valueWidthEqualFirst;
                        if (i < numberOfColumns - 1) {
                            if (numberOfColumns <= 6) {
                                col_15.space.value = spaceValue;
                            }
                            else {
                                col_15.space.value = valueWidthEqualsecond;
                            }
                        }
                        col_15.width.enabled = false;
                        col_15.space.enabled = false;
                    }
                }
                else {
                    _this.columns[0].width.value = _this.pageWidth;
                }
                _this.columns[0].width.enabled = true;
                if (numberOfColumns > 1) {
                    _this.columns[0].space.enabled = true;
                }
                else {
                    _this.columns[0].space.enabled = false;
                }
            }
            if (_this.equalCheckbox.checked === false) {
                if (numberOfColumns > 2) {
                    var col = _this.columns[numberOfColumns - 1];
                    col.index.value = numberOfColumns;
                    for (var i = 0; i < numberOfColumns; i++) {
                        var col_16 = _this.columns[parseInt(i.toString(), 10)];
                        col_16.width.value = valueWidthEqualFirst;
                        if (i < numberOfColumns - 1) {
                            if (col_16.width.value <= 36) {
                                col_16.space.value = valueWidthEqualsecond;
                            }
                            else {
                                col_16.space.value = spaceValue;
                            }
                        }
                        col_16.width.enabled = true;
                        col_16.space.enabled = true;
                    }
                }
                else {
                    _this.columns[0].width.value = _this.pageWidth;
                }
            }
        };
        /**
         * @private
         * @returns {void}
         */
        this.closeDialog = function () {
            _this.documentHelper.dialog.hide();
            _this.unWireEventsAndBindings();
            _this.closeColumnsDialog();
        };
        /**
         * @private
         * @returns {void}
         */
        this.closeColumnsDialog = function () {
            _this.documentHelper.dialog2.element.style.pointerEvents = '';
            _this.unWireEventsAndBindings();
            _this.documentHelper.updateFocus();
        };
        /**
         * @private
         * @returns {void}
         */
        this.unWireEventsAndBindings = function () {
            _this.equalCheckbox.checked = true;
            _this.lineCheckbox.checked = false;
            _this.equalCheckbox.disabled = true;
            var cols = [];
            for (var i = 0; i < _this.columns.length; i++) {
                _this.columns.splice(1, _this.columns.length - 1);
                _this.columns[0].space.enabled = false;
            }
            while (_this.columnTable.rows.length > 1) {
                _this.columnTable.deleteRow(_this.columnTable.rows.length - 1);
            }
        };
        /**
         * @private
         * @returns {void}
         */
        this.openColumnsDialog = function () {
            var sectionFormat = _this.documentHelper.selection.sectionFormat;
            var pageWidthBox = sectionFormat.pageWidth - sectionFormat.leftMargin - sectionFormat.rightMargin;
            _this.columnValueTexBox.max = pageWidthBox / 36;
            _this.columns[0].width.value = pageWidthBox;
            _this.documentHelper.updateFocus();
            _this.equalCheckbox.checked = sectionFormat.equalWidth;
            _this.lineCheckbox.checked = sectionFormat.lineBetweenColumns;
            _this.columnValueTexBox.value = sectionFormat.columns.length === 0 ? 1 : sectionFormat.columns.length;
            switch (_this.columnValueTexBox.value) {
                case 1:
                    _this.oneDiv.classList.add('e-de-table-border-inside-setting-click');
                    _this.twoDiv.classList.remove('e-de-table-border-inside-setting-click');
                    _this.threeDiv.classList.remove('e-de-table-border-inside-setting-click');
                    _this.leftDiv.classList.remove('e-de-table-border-inside-setting-click');
                    _this.rightDiv.classList.remove('e-de-table-border-inside-setting-click');
                    break;
                case 2:
                    _this.twoDiv.classList.add('e-de-table-border-inside-setting-click');
                    _this.oneDiv.classList.remove('e-de-table-border-inside-setting-click');
                    _this.threeDiv.classList.remove('e-de-table-border-inside-setting-click');
                    _this.leftDiv.classList.remove('e-de-table-border-inside-setting-click');
                    _this.rightDiv.classList.remove('e-de-table-border-inside-setting-click');
                    break;
                case 3:
                    _this.threeDiv.classList.add('e-de-table-border-inside-setting-click');
                    _this.twoDiv.classList.remove('e-de-table-border-inside-setting-click');
                    _this.oneDiv.classList.remove('e-de-table-border-inside-setting-click');
                    _this.leftDiv.classList.remove('e-de-table-border-inside-setting-click');
                    _this.rightDiv.classList.remove('e-de-table-border-inside-setting-click');
                    break;
            }
            if (_this.columnValueTexBox.value !== 1) {
                _this.columns[0].space.value = sectionFormat.columns[0].space;
                _this.columns[0].width.value = sectionFormat.columns[0].width;
            }
            if (_this.columnValueTexBox.value === 1) {
                _this.columns[0].space.value = 0;
            }
            /* eslint-disable */
            for (var i = 1; i < _this.columnValueTexBox.value; i++) {
                _this.createColumn(i + 1, sectionFormat.columns[i].width, sectionFormat.columns[i].space);
            }
            /* eslint-enable */
        };
        /**
         * @private
         * @param {Event} event - Specifies the event args.
         * @returns {void}
         */
        this.handleSettingCheckBoxAction = function (event) {
            var targetId = event.target.id;
            var columnDialogId = _this.target.id;
            if (targetId === columnDialogId + '_One_Div' || targetId === columnDialogId + '_One_Div_Container') {
                _this.oneDiv.classList.add('e-de-table-border-inside-setting-click');
                _this.setSettingPreviewDivElement('one');
            }
            else if (targetId === columnDialogId + '_Two_Div' || targetId === columnDialogId + '_Two_Div_Container') {
                _this.twoDiv.classList.add('e-de-table-border-inside-setting-click');
                _this.setSettingPreviewDivElement('two');
            }
            else if (targetId === columnDialogId + '_Three_Div' || targetId === columnDialogId + '_Three_Div_Container') {
                _this.threeDiv.classList.add('e-de-table-border-inside-setting-click');
                _this.setSettingPreviewDivElement('three');
            }
            else if (targetId === columnDialogId + '_Left_Div' || targetId === columnDialogId + '_Left_Div_Container') {
                _this.oneDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.threeDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.rightDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.setSettingPreviewDivElement('two', 'left');
            }
            else if (targetId === columnDialogId + '_Right_Div' || targetId === columnDialogId + '_Right_Div_Container') {
                _this.oneDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.threeDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.leftDiv.classList.remove('e-de-table-border-inside-setting-click');
                _this.setSettingPreviewDivElement('two', 'right');
            }
        };
        /**
         * @private
         * @returns {void}
         */
        this.applyColumnDialog = function () {
            if (!_this.documentHelper.selection.isEmpty) {
                if (_this.documentHelper.owner.editorHistory) {
                    _this.documentHelper.owner.editor.initComplexHistory('InsertSectionBreak');
                }
                var startParagraphInfo = _this.documentHelper.selection.getParagraphInfo(_this.documentHelper.selection.start);
                var endParagraphInfo = _this.documentHelper.selection.getParagraphInfo(_this.documentHelper.selection.end);
                var startIndex = _this.documentHelper.selection.getHierarchicalIndex(startParagraphInfo.paragraph, startParagraphInfo.offset.toString());
                var endIndex = _this.documentHelper.selection.getHierarchicalIndex(endParagraphInfo.paragraph, endParagraphInfo.offset.toString());
                _this.documentHelper.selection.select(endIndex, endIndex);
                _this.documentHelper.owner.editorModule.insertSectionBreak(SectionBreakType.Continuous);
                _this.documentHelper.selection.select(startIndex, startIndex);
                _this.documentHelper.owner.editorModule.insertSectionBreak(SectionBreakType.Continuous);
            }
            var sectionFormat = new WSectionFormat();
            var currentSectionFormat = _this.documentHelper.selection.sectionFormat;
            sectionFormat.bottomMargin = currentSectionFormat.bottomMargin;
            sectionFormat.topMargin = currentSectionFormat.topMargin;
            sectionFormat.leftMargin = currentSectionFormat.leftMargin;
            sectionFormat.rightMargin = currentSectionFormat.rightMargin;
            sectionFormat.pageWidth = currentSectionFormat.pageWidth;
            sectionFormat.pageHeight = currentSectionFormat.pageHeight;
            sectionFormat.differentOddAndEvenPages = currentSectionFormat.differentOddAndEvenPages;
            sectionFormat.differentFirstPage = currentSectionFormat.differentFirstPage;
            sectionFormat.headerDistance = currentSectionFormat.headerDistance;
            sectionFormat.footerDistance = currentSectionFormat.footerDistance;
            sectionFormat.numberOfColumns = _this.numberOfColumns;
            sectionFormat.equalWidth = _this.equalCheckbox.checked;
            sectionFormat.lineBetweenColumns = _this.lineCheckbox.checked;
            var cols = [];
            for (var i = 0; i < _this.columns.length; i++) {
                var colFormat = new WColumnFormat();
                colFormat.width = HelperMethods.convertPointToPixel(_this.columns[parseInt(i.toString(), 10)].width.value);
                colFormat.space = HelperMethods.convertPointToPixel(_this.columns[parseInt(i.toString(), 10)].space.value);
                cols.push(colFormat);
            }
            sectionFormat.columns = cols;
            sectionFormat.breakCode = currentSectionFormat.breakCode;
            _this.documentHelper.owner.editorModule.onApplySectionFormat(undefined, sectionFormat);
            if (_this.documentHelper.owner.editorHistory) {
                _this.documentHelper.owner.editorHistory.updateComplexHistory();
            }
            _this.documentHelper.hideDialog();
        };
        this.documentHelper = documentHelper;
    }
    ColumnsDialog.prototype.getModuleName = function () {
        return 'ColumnsDialog';
    };
    /**
     * @private
     * @param {L10n} localeValue - Specifies the locale.
     * @param {boolean} isRtl - Specifies is rtl.
     * @returns {void}
     */
    ColumnsDialog.prototype.initColumnsDialog = function (localeValue, isRtl) {
        this.columns = [];
        this.target = createElement('div', {
            id: this.documentHelper.owner.containerId + '_Columns',
            className: 'e-de-table-border-shading-dlg'
        });
        this.displayText = createElement('div', {
            innerHTML: localeValue.getConstant('Presets'),
            className: 'e-de-para-dlg-heading'
        });
        this.PresetsContainer = createElement('div', {
            className: 'e-de-dlg-row'
        });
        this.oneDivContainer = createElement('div', {
            id: this.target.id + '_One_Div_Container', className: 'e-de-preset-container'
        });
        this.oneDiv = createElement('div', {
            id: this.target.id + '_One_Div',
            className: 'e-icons e-de-ctnr-columns-one e-de-columns-presets-genral'
        });
        this.oneDivLabel = createElement('label', {
            innerHTML: localeValue.getConstant('One'), className: 'e-de-column-label',
            id: this.target.id + '_One_Div_Label'
        });
        this.twoDivContainer = createElement('div', {
            id: this.target.id + '_Two_Div_Container', className: 'e-de-preset-container'
        });
        this.twoDiv = createElement('div', {
            id: this.target.id + '_Two_Div',
            className: 'e-icons e-de-ctnr-columns-two e-de-columns-presets-genral'
        });
        this.twoDivLabel = createElement('label', {
            innerHTML: localeValue.getConstant('Two'), className: 'e-de-column-label',
            id: this.target.id + '_Two_Div_Label'
        });
        this.threeDivContainer = createElement('div', {
            id: this.target.id + '_Three_Div_Container', className: 'e-de-preset-container'
        });
        this.threeDiv = createElement('div', {
            id: this.target.id + '_Three_Div',
            className: 'e-icons e-de-ctnr-columns-three  e-de-columns-presets-genral'
        });
        this.threeDivLabel = createElement('label', {
            innerHTML: localeValue.getConstant('Three'), className: 'e-de-column-label',
            id: this.target.id + '_Three_Div_Label'
        });
        this.leftDivContainer = createElement('div', {
            id: this.target.id + '_Left_Div_Container', className: 'e-de-preset-container'
        });
        this.leftDiv = createElement('div', {
            id: this.target.id + '_Left_Div',
            className: 'e-icons e-de-ctnr-columns-left e-de-columns-presets-genral'
        });
        this.leftDivLabel = createElement('label', {
            innerHTML: localeValue.getConstant('Left'), className: 'e-de-column-label',
            id: this.target.id + '_Left_Div_Label'
        });
        this.rightDivContainer = createElement('div', {
            id: this.target.id + '_Right_Div_Container', className: 'e-de-preset-container'
        });
        this.rightDiv = createElement('div', {
            id: this.target.id + '_Right_Div',
            className: 'e-icons e-de-ctnr-columns-right e-de-columns-presets-genral'
        });
        this.rightDivLabel = createElement('label', {
            innerHTML: localeValue.getConstant('Right'), className: 'e-de-column-label',
            id: this.target.id + '_Right_Div_Label'
        });
        this.nuberOfColumnsContainer = createElement('div', {
            className: 'e-de-container-row e-de-columns-padding-alignment'
        });
        this.subcontainer = createElement('div', {
            className: 'e-de-subcontainer-left'
        });
        this.oneDivContainer.setAttribute('aria-label', localeValue.getConstant('One'));
        this.twoDivContainer.setAttribute('aria-label', localeValue.getConstant('Two'));
        this.threeDivContainer.setAttribute('aria-label', localeValue.getConstant('Three'));
        this.leftDivContainer.setAttribute('aria-label', localeValue.getConstant('Left'));
        this.rightDivContainer.setAttribute('aria-label', localeValue.getConstant('Right'));
        if (isRtl) {
            this.oneDiv.classList.add('e-de-rtl');
            this.twoDiv.classList.add('e-de-rtl');
            this.threeDiv.classList.add('e-de-rtl');
            this.leftDiv.classList.add('e-de-rtl');
            this.rightDiv.classList.add('e-de-rtl');
            this.oneDivContainer.classList.add('e-de-rtl');
            this.twoDivContainer.classList.add('e-de-rtl');
            this.threeDivContainer.classList.add('e-de-rtl');
            this.leftDivContainer.classList.add('e-de-rtl');
            this.rightDivContainer.classList.add('e-de-rtl');
            this.oneDivLabel.classList.add('e-de-rtl');
            this.twoDivLabel.classList.add('e-de-rtl');
            this.threeDivLabel.classList.add('e-de-rtl');
            this.leftDivLabel.classList.add('e-de-rtl');
            this.rightDivLabel.classList.add('e-de-rtl');
        }
        this.columnsCountBox = createElement('input', {
            attrs: { type: 'text' }
        });
        this.subcontainer.appendChild(this.columnsCountBox);
        this.nuberOfColumnsContainer.appendChild(this.subcontainer);
        this.section = this.documentHelper.selection.sectionFormat;
        this.pageWidth = this.section.pageWidth - this.section.leftMargin - this.section.rightMargin;
        this.columnValueTexBox = new NumericTextBox({
            format: '#',
            value: 1,
            min: 1,
            strictMode: true,
            placeholder: localeValue.getConstant('Number of columns'),
            floatLabelType: 'Always',
            change: this.createTextBox
        });
        this.columnValueTexBox.appendTo(this.columnsCountBox);
        this.subcontainer1 = createElement('div', {
            className: 'e-de-subcontainer-right'
        });
        this.lineCheckDiv = createElement('div', {
            className: 'e-de-columns-padding-alignment'
        });
        this.lineCheck = createElement('input', { attrs: { type: 'checkbox' } });
        this.subcontainer1.appendChild(this.lineCheckDiv);
        this.lineCheckDiv.appendChild(this.lineCheck);
        this.lineCheck.setAttribute('aria-labelledby', localeValue.getConstant('Line between column'));
        this.columnsCountBox.setAttribute('aria-labelledby', localeValue.getConstant('Number of columns'));
        this.lineCheckbox = new CheckBox({
            label: localeValue.getConstant('Line between column')
        });
        this.widthAndSpacingContainer = createElement('div', {
            className: 'e-de-dlg-row'
        });
        this.widthAndSpacingContainerDiv = createElement('div', {});
        this.widthAndSpacingText = createElement('div', {
            innerHTML: localeValue.getConstant('Width and Spacing'),
            className: 'e-de-para-dlg-heading'
        });
        //  this.subWidthAndSpacingContainerDiv = <HTMLDivElement>createElement('div',{
        //     className:'e-bookmark-listview e-width-space-div',
        //     styles: "width:100%;"
        // });
        this.columnElementDiv = createElement('div', {
            className: 'e-width-space-div '
        });
        this.widthcontainerDiv1 = createElement('div', {
            className: 'e-de-container-row'
        });
        this.widthContainer = createElement('div', {
            className: 'e-de-container-row'
        });
        // Heading
        // this.containerHead = <HTMLDivElement>createElement('div', {
        //     className: 'e-de-container-row'
        // });
        this.tableElement = createElement('table');
        this.tableElement.style.width = '96%';
        var row = this.tableElement.insertRow();
        var cell = row.insertCell();
        cell.innerHTML = localeValue.getConstant('Column');
        cell.style.width = '20%';
        cell.style.display = 'table-cell';
        cell.classList.add('e-de-dlg-sub-header');
        cell = row.insertCell();
        cell.innerHTML = localeValue.getConstant('Width');
        cell.style.width = '40%';
        cell.style.display = 'table-cell';
        cell.classList.add('e-de-dlg-sub-header');
        cell = row.insertCell();
        cell.innerHTML = localeValue.getConstant('Spacing');
        cell.style.width = '40%';
        cell.style.display = 'table-cell';
        cell.classList.add('e-de-dlg-sub-header');
        //wC
        //this.columnCountSI = <HTMLInputElement>createElement('input', {
        //});
        // this.columnValueSI = new NumericTextBox({
        //     //placeholder: localeValue.getConstant('Column'),
        //     enabled: false,
        //     showSpinButton: false
        // });
        //this.containerHead.appendChild(this.columnCountSI);
        // this.columnValueSI.appendTo(this.columnCountSI);
        //wSi
        //this.widthCountSI = <HTMLInputElement>createElement('input', {
        //});
        // this.widthValueSI = new NumericTextBox({
        //     //placeholder: localeValue.getConstant('Width'),
        //     enabled: false,
        //     showSpinButton: false
        // });
        //this.containerHead.appendChild(this.widthCountSI);
        //this.widthValueSI.appendTo(this.widthCountSI);
        //ws
        //this.spaceCountSI = <HTMLInputElement>createElement('input', {
        //});
        // this.spaceValueSI = new NumericTextBox({
        //     //placeholder: localeValue.getConstant('Spacing'),
        //     enabled: false,
        //     showSpinButton: false
        // });
        //this.containerHead.appendChild(this.spaceCountSI);
        //this.spaceValueSI.appendTo(this.spaceCountSI);
        this.columnDiv = createElement('div', { styles: 'width:100%;height:100px;overflow-y: scroll;overflow-x: hidden;' });
        this.columnTable = createElement('table', { styles: 'width:100%;' });
        var row1 = this.columnTable.insertRow();
        var cell1 = row1.insertCell();
        cell1.style.width = '20%';
        //NUMERIC TEXT BOX
        // column
        var col = new Column();
        this.columnCountBox1 = createElement('input', {});
        col.index = new NumericTextBox({
            format: '#',
            min: 1,
            value: 1,
            enabled: false,
            cssClass: 'index1',
            showSpinButton: false,
            floatLabelType: 'Always',
            change: this.spaceChange
        });
        cell1.appendChild(this.columnCountBox1);
        col.index.appendTo(this.columnCountBox1);
        // width
        var cell2 = row1.insertCell();
        cell2.style.width = '40%';
        this.widthCountBox1 = createElement('input', {
            attrs: { 'type': 'text' }
        });
        col.width = new NumericTextBox({
            min: 36,
            decimals: 2,
            strictMode: true,
            enablePersistence: false,
            cssClass: 'width1',
            floatLabelType: 'Always',
            change: this.widthChange
        });
        cell2.appendChild(this.widthCountBox1);
        cell2.style.width = '40%';
        col.width.appendTo(this.widthCountBox1);
        //spacing
        var cell3 = row1.insertCell();
        cell3.style.width = '40%';
        this.spacingCountBox1 = createElement('input', {
            attrs: { 'type': 'text' }
        });
        col.space = new NumericTextBox({
            min: 0,
            decimals: 2,
            strictMode: true,
            enablePersistence: false,
            cssClass: 'space1',
            floatLabelType: 'Always',
            change: this.spaceChange
        });
        cell3.appendChild(this.spacingCountBox1);
        col.space.appendTo(this.spacingCountBox1);
        this.columns.push(col);
        col.space.enabled = false;
        this.widthCountBox1.setAttribute('aria-labelledby', 'Width');
        this.spacingCountBox1.setAttribute('aria-labelledby', 'Space');
        this.equalCheckDiv = createElement('div', {
            className: 'e-de-columns-padding-alignment'
        });
        this.equalCheck = createElement('input', { attrs: { type: 'checkbox' } });
        this.equalCheckDiv.appendChild(this.equalCheck);
        this.equalCheckDiv.setAttribute('aria-label', localeValue.getConstant('Equal column width'));
        this.equalCheckbox = new CheckBox({
            label: localeValue.getConstant('Equal column width'),
            change: this.checkBox
        });
        this.equalCheckbox.appendTo(this.equalCheck);
        this.lineCheckbox.appendTo(this.lineCheck);
        this.nuberOfColumnsContainer.appendChild(this.subcontainer1);
        this.oneDivContainer.appendChild(this.oneDiv);
        this.oneDivContainer.appendChild(this.oneDivLabel);
        this.twoDivContainer.appendChild(this.twoDiv);
        this.twoDivContainer.appendChild(this.twoDivLabel);
        this.threeDivContainer.appendChild(this.threeDiv);
        this.threeDivContainer.appendChild(this.threeDivLabel);
        this.leftDivContainer.appendChild(this.leftDiv);
        this.leftDivContainer.appendChild(this.leftDivLabel);
        this.rightDivContainer.appendChild(this.rightDiv);
        this.rightDivContainer.appendChild(this.rightDivLabel);
        this.PresetsContainer.appendChild(this.oneDivContainer);
        this.PresetsContainer.appendChild(this.twoDivContainer);
        this.PresetsContainer.appendChild(this.threeDivContainer);
        this.PresetsContainer.appendChild(this.leftDivContainer);
        this.PresetsContainer.appendChild(this.rightDivContainer);
        //this.subWidthAndSpacingContainerDiv.appendChild(this.containerHead);
        //this.subWidthAndSpacingContainerDiv.appendChild(this.widthcontainerDiv1);//<- First add
        this.widthAndSpacingContainerDiv.appendChild(this.widthAndSpacingText);
        this.widthAndSpacingContainerDiv.appendChild(this.tableElement);
        this.columnDiv.appendChild(this.columnTable);
        this.widthAndSpacingContainerDiv.appendChild(this.columnDiv);
        //widthAndSpacingContainerDiv.appendChild(this.subWidthAndSpacingContainerDiv);
        this.widthAndSpacingContainer.appendChild(this.widthAndSpacingContainerDiv);
        this.target.appendChild(this.displayText);
        this.target.appendChild(this.PresetsContainer);
        this.target.appendChild(this.nuberOfColumnsContainer);
        this.target.appendChild(this.widthAndSpacingContainer);
        this.target.appendChild(this.equalCheckDiv);
        // Handling clicking
        this.oneDivContainer.addEventListener('click', this.handleSettingCheckBoxActionHandler);
        this.twoDivContainer.addEventListener('click', this.handleSettingCheckBoxActionHandler);
        this.threeDivContainer.addEventListener('click', this.handleSettingCheckBoxActionHandler);
        this.leftDivContainer.addEventListener('click', this.handleSettingCheckBoxActionHandler);
        this.rightDivContainer.addEventListener('click', this.handleSettingCheckBoxActionHandler);
        this.widthcontainerDiv1.style.display = 'flex';
        this.equalCheckbox.checked = true;
        this.equalCheckbox.disabled = true;
        this.lineCheckbox.disabled = true;
    };
    ColumnsDialog.prototype.createColumn = function (index, width, space) {
        this.widthContainer = createElement('div', {
            className: 'e-de-container-row'
        });
        this.widthContainer.style.display = 'flex';
        var row = this.columnTable.insertRow();
        var cell1 = row.insertCell();
        cell1.style.width = '20%';
        var col = new Column();
        // column
        this.columnCount = createElement('input', {});
        col.index = new NumericTextBox({
            format: '#',
            min: 1,
            value: index,
            enabled: false,
            cssClass: 'column1',
            showSpinButton: false,
            floatLabelType: 'Always'
        });
        cell1.appendChild(this.columnCount);
        col.index.appendTo(this.columnCount);
        // width
        var cell2 = row.insertCell();
        cell2.style.width = '40%';
        var widthCountBox = createElement('input', {
            attrs: { 'type': 'text' }
        });
        col.width = new NumericTextBox({
            min: 36,
            decimals: 2,
            strictMode: true,
            enablePersistence: false,
            cssClass: 'width1',
            floatLabelType: 'Always',
            change: this.widthChange
        });
        if (!isNullOrUndefined(width)) {
            col.width.value = width;
        }
        cell2.appendChild(widthCountBox);
        col.width.appendTo(widthCountBox);
        //spacing
        var cell3 = row.insertCell();
        cell3.style.width = '40%';
        var spacingCountBox = createElement('input', {
            attrs: { 'type': 'text' }
        });
        col.space = new NumericTextBox({
            min: 0,
            decimals: 2,
            strictMode: true,
            enablePersistence: false,
            cssClass: 'space1',
            floatLabelType: 'Always',
            change: this.spaceChange
        });
        if (!isNullOrUndefined(space)) {
            col.space.value = space;
        }
        cell3.appendChild(spacingCountBox);
        col.space.appendTo(spacingCountBox);
        //this.columnElementDiv.appendChild(this.widthContainer);
        //this.subWidthAndSpacingContainerDiv.appendChild(this.columnElementDiv);//<- Second Add
        this.columns.push(col);
    };
    /**
     * @private
     * @returns {void}
     */
    ColumnsDialog.prototype.show = function () {
        var localeValue = new L10n('documenteditor', this.documentHelper.owner.defaultLocale);
        localeValue.setLocale(this.documentHelper.owner.locale);
        if (!this.target) {
            this.initColumnsDialog(localeValue, this.documentHelper.owner.enableRtl);
        }
        // this.loadColumnsDialog(localeValue);
        this.documentHelper.dialog.content = this.target;
        this.documentHelper.dialog.header = localeValue.getConstant('Columns');
        this.documentHelper.dialog.beforeOpen = this.openColumnsDialog;
        this.documentHelper.dialog.close = this.closeColumnsDialog;
        this.documentHelper.dialog.position = { X: 'center', Y: 'center' };
        this.documentHelper.dialog.width = 'auto';
        this.documentHelper.dialog.height = 'auto';
        this.documentHelper.dialog.buttons = [{
                click: this.applyColumnDialog,
                buttonModel: { content: localeValue.getConstant('Ok'), cssClass: 'e-flat e-table-border-shading-okay', isPrimary: true }
            },
            {
                click: this.closeDialog,
                buttonModel: { content: localeValue.getConstant('Cancel'), cssClass: 'e-flat e-table-border-shading-cancel' }
            }];
        this.documentHelper.dialog.dataBind();
        this.documentHelper.dialog.show();
    };
    ColumnsDialog.prototype.onhandleSettingCheckBoxActionClicked = function (event) {
        this.handleSettingCheckBoxAction(event);
    };
    ColumnsDialog.prototype.setSettingPreviewDivElement = function (position, type) {
        var _this = this;
        this.equalCheckbox.checked = true;
        switch (position) {
            case 'one':
                this.columnValueTexBox.value = 1;
                break;
            case 'two':
                this.columnValueTexBox.value = 2;
                setTimeout(function () {
                    if (type === 'left' || type === 'right') {
                        _this.equalCheckbox.checked = false;
                    }
                    if (type === 'left') {
                        _this.numberOfColumns = 2;
                        _this.leftDiv.classList.add('e-de-table-border-inside-setting-click');
                        _this.twoDiv.classList.remove('e-de-table-border-inside-setting-click');
                        var colWidth = ((_this.pageWidth - (2 * 36)) / 3);
                        _this.columns[0].width.value = colWidth;
                        _this.columns[1].width.value = colWidth + colWidth + 36;
                        _this.columns[1].space.value = undefined;
                    }
                    else if (type === 'right') {
                        _this.numberOfColumns = 2;
                        _this.rightDiv.classList.add('e-de-table-border-inside-setting-click');
                        _this.twoDiv.classList.remove('e-de-table-border-inside-setting-click');
                        var colWidth = ((_this.pageWidth - (2 * 36)) / 3);
                        _this.columns[0].width.value = colWidth + colWidth + 36;
                        _this.columns[1].width.value = colWidth;
                        _this.columns[1].space.value = undefined;
                    }
                }, 5);
                break;
            case 'three':
                this.columnValueTexBox.value = 3;
                break;
        }
    };
    /**
     * @private
     * @returns {void}
     */
    ColumnsDialog.prototype.destroy = function () {
        this.removeElements();
        this.removeEvents();
        this.target = undefined;
        this.oneDiv = undefined;
        this.twoDiv = undefined;
        this.threeDiv = undefined;
        this.leftDiv = undefined;
        this.rightDiv = undefined;
        this.documentHelper = undefined;
    };
    ColumnsDialog.prototype.removeEvents = function () {
        if (this.oneDivContainer) {
            this.oneDivContainer.removeEventListener('click', this.handleSettingCheckBoxActionHandler);
        }
        if (this.twoDivContainer) {
            this.twoDivContainer.removeEventListener('click', this.handleSettingCheckBoxActionHandler);
        }
        if (this.threeDivContainer) {
            this.threeDivContainer.removeEventListener('click', this.handleSettingCheckBoxActionHandler);
        }
        if (this.leftDivContainer) {
            this.leftDivContainer.removeEventListener('click', this.handleSettingCheckBoxActionHandler);
        }
        if (this.rightDivContainer) {
            this.rightDivContainer.removeEventListener('click', this.handleSettingCheckBoxActionHandler);
        }
    };
    ColumnsDialog.prototype.removeElements = function () {
        if (this.target) {
            this.target.remove();
        }
        if (this.oneDiv) {
            this.oneDiv.remove();
            this.oneDiv = undefined;
        }
        if (this.twoDiv) {
            this.twoDiv.remove();
            this.twoDiv = undefined;
        }
        if (this.threeDiv) {
            this.threeDiv.remove();
            this.threeDiv = undefined;
        }
        if (this.leftDiv) {
            this.leftDiv.remove();
            this.leftDiv = undefined;
        }
        if (this.rightDiv) {
            this.rightDiv.remove();
            this.rightDiv = undefined;
        }
        if (this.columnsCountBox) {
            this.columnsCountBox.remove();
            this.columnsCountBox = undefined;
        }
        if (this.columnValueTexBox && this.columnValueTexBox.element && this.columnValueTexBox.element.parentNode) {
            this.columnValueTexBox.destroy();
            this.columnValueTexBox = undefined;
        }
        if (this.lineCheckbox) {
            this.lineCheckbox.destroy();
            this.lineCheckbox = undefined;
        }
        if (this.equalCheckbox) {
            this.equalCheckbox.destroy();
            this.equalCheckbox = undefined;
        }
        if (this.columnCountBox1) {
            this.columnCountBox1.remove();
            this.columnCountBox1 = undefined;
        }
        if (this.widthCountBox1) {
            this.widthCountBox1.remove();
            this.widthCountBox1 = undefined;
        }
        if (this.spacingCountBox1) {
            this.spacingCountBox1.remove();
            this.spacingCountBox1 = undefined;
        }
        if (this.columnTable) {
            this.columnTable.remove();
            this.columnTable = undefined;
        }
        if (this.displayText) {
            this.displayText.remove();
            this.displayText = undefined;
        }
        if (this.PresetsContainer) {
            this.PresetsContainer.remove();
            this.PresetsContainer = undefined;
        }
        if (this.oneDivContainer) {
            this.oneDivContainer.remove();
            this.oneDivContainer = undefined;
        }
        if (this.oneDivLabel) {
            this.oneDivLabel.remove();
            this.oneDivLabel = undefined;
        }
        if (this.twoDivContainer) {
            this.twoDivContainer.remove();
            this.twoDivContainer = undefined;
        }
        if (this.twoDivLabel) {
            this.twoDivLabel.remove();
            this.twoDivLabel = undefined;
        }
        if (this.threeDivContainer) {
            this.threeDivContainer.remove();
            this.threeDivContainer = undefined;
        }
        if (this.threeDivLabel) {
            this.threeDivLabel.remove();
            this.threeDivLabel = undefined;
        }
        if (this.leftDivContainer) {
            this.leftDivContainer.remove();
            this.leftDivContainer = undefined;
        }
        if (this.leftDivLabel) {
            this.leftDivLabel.remove();
            this.leftDivLabel = undefined;
        }
        if (this.rightDivContainer) {
            this.rightDivContainer.remove();
            this.rightDivContainer = undefined;
        }
        if (this.rightDivLabel) {
            this.rightDivLabel.remove();
            this.rightDivLabel = undefined;
        }
        if (this.nuberOfColumnsContainer) {
            this.nuberOfColumnsContainer.remove();
            this.nuberOfColumnsContainer = undefined;
        }
        if (this.subcontainer) {
            this.subcontainer.remove();
            this.subcontainer = undefined;
        }
        if (this.subcontainer1) {
            this.subcontainer1.remove();
            this.subcontainer1 = undefined;
        }
        if (this.lineCheckDiv) {
            this.lineCheckDiv.remove();
            this.lineCheckDiv = undefined;
        }
        if (this.lineCheck) {
            this.lineCheck.remove();
            this.lineCheck = undefined;
        }
        if (this.widthAndSpacingContainer) {
            this.widthAndSpacingContainer.remove();
            this.widthAndSpacingContainer = undefined;
        }
        if (this.widthAndSpacingContainerDiv) {
            this.widthAndSpacingContainerDiv.remove();
            this.widthAndSpacingContainerDiv = undefined;
        }
        if (this.widthAndSpacingText) {
            this.widthAndSpacingText.remove();
            this.widthAndSpacingText = undefined;
        }
        if (this.tableElement) {
            this.tableElement.remove();
            this.tableElement = undefined;
        }
        if (this.columnDiv) {
            this.columnDiv.remove();
            this.columnDiv = undefined;
        }
        if (this.columnCount) {
            this.columnCount.remove();
            this.columnCount = undefined;
        }
        if (this.equalCheckDiv) {
            this.equalCheckDiv.remove();
            this.equalCheckDiv = undefined;
        }
        if (this.equalCheck) {
            this.equalCheck.remove();
            this.equalCheck = undefined;
        }
    };
    return ColumnsDialog;
}());
export { ColumnsDialog };

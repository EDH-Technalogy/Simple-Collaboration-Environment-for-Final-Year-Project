import { createElement, isNullOrUndefined, updateCSSText } from '@syncfusion/ej2-base';
/**
 * Class which performs regular text measuring logic to find font height.
 */
var Regular = /** @class */ (function () {
    /**
     * Constructor to initialize Regular module.
     *
     * @param {DocumentHelper} documentHelper - the document helper object
     */
    function Regular(documentHelper) {
        this.documentHelper = documentHelper;
    }
    /**
     * Gets module name.
     *
     * @returns {string} - the module name.
     */
    Regular.prototype.getModuleName = function () {
        return 'Regular';
    };
    /**
     * @private
     * @param {WCharacterFormat} characterFormat - character format to apply.
     * @param {string} fontToRender - font to render.
     * @returns {TextSizeInfo} returns text size information.
     */
    Regular.prototype.getHeightInternal = function (characterFormat, fontToRender) {
        var textHeight = 0;
        var baselineOffset = 0;
        var spanElement = document.createElement('span');
        spanElement.innerText = 'm';
        var iframe = createElement('iframe');
        document.body.appendChild(iframe);
        var innerHtml = '<!DOCTYPE html>'
            + '<html><head></head>'
            + '<body>'
            + '</body>'
            + '</html>';
        if (!isNullOrUndefined(iframe.contentDocument)) {
            iframe.contentDocument.open();
            iframe.contentDocument.write(innerHtml);
            iframe.contentDocument.close();
        }
        this.applyStyle(spanElement, characterFormat, fontToRender);
        var parentDiv = document.createElement('div');
        parentDiv.style.cssText = 'display:inline-block;position:absolute;';
        var tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'display:inline-block;width: 1px; height: 0px;vertical-align: baseline;';
        parentDiv.appendChild(spanElement);
        parentDiv.appendChild(tempDiv);
        iframe.contentDocument.body.appendChild(parentDiv);
        textHeight = spanElement.offsetHeight;
        var textTopVal = spanElement.offsetTop;
        var tempDivTopVal = tempDiv.offsetTop;
        baselineOffset = tempDivTopVal - textTopVal;
        document.body.removeChild(iframe);
        return { 'Height': textHeight, 'BaselineOffset': baselineOffset };
    };
    Regular.prototype.applyStyle = function (spanElement, characterFormat, fontToRender) {
        if (!isNullOrUndefined(spanElement) && !isNullOrUndefined(characterFormat)) {
            var style = 'white-space:nowrap;';
            if (!isNullOrUndefined(fontToRender) && fontToRender !== '') {
                style += 'font-family:' + fontToRender + ';';
            }
            else {
                style += 'font-family:' + characterFormat.fontFamily + ';';
            }
            var isBidi = characterFormat.bidi || characterFormat.complexScript;
            var fontSize = isBidi ? characterFormat.fontSizeBidi : characterFormat.fontSize;
            if (fontSize <= 0.5) {
                fontSize = 0.5;
            }
            style += 'font-size:' + fontSize.toString() + 'pt;';
            if (characterFormat.bold) {
                style += 'font-weight:bold;';
            }
            if (characterFormat.italic) {
                style += 'font-style:italic;';
            }
            updateCSSText(spanElement, style);
        }
    };
    /**
     * @private
     * @returns {void}
     */
    Regular.prototype.destroy = function () {
        this.documentHelper = undefined;
    };
    return Regular;
}());
export { Regular };

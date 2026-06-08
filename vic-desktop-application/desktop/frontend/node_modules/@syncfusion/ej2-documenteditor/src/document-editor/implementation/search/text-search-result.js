/**
 * @private
 */
var TextSearchResult = /** @class */ (function () {
    function TextSearchResult(owner) {
        this.startIn = undefined;
        this.endIn = undefined;
        this.startOffset = undefined;
        this.endOffset = undefined;
        this.owner = owner;
        this.documentHelper = this.owner.documentHelper;
    }
    Object.defineProperty(TextSearchResult.prototype, "start", {
        get: function () {
            return this.startIn;
        },
        set: function (value) {
            this.startIn = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextSearchResult.prototype, "end", {
        get: function () {
            return this.endIn;
        },
        set: function (value) {
            this.endIn = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextSearchResult.prototype, "text", {
        get: function () {
            var startPosition = this.documentHelper.selection.getTextPosBasedOnLogicalIndex(this.startOffset);
            var endPosition = this.documentHelper.selection.getTextPosBasedOnLogicalIndex(this.endOffset);
            return this.documentHelper.selection.getTextInternal(startPosition, endPosition, false);
        },
        enumerable: true,
        configurable: true
    });
    TextSearchResult.prototype.destroy = function () {
        this.start = undefined;
        this.end = undefined;
        this.startOffset = undefined;
        this.endOffset = undefined;
    };
    return TextSearchResult;
}());
export { TextSearchResult };

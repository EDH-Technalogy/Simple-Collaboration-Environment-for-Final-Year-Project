/**
 * Represents document editor header and footer.
 */
import { DocumentEditorContainer } from '../document-editor-container';
/**
 * @private
 */
export declare class HeaderFooterProperties {
    private container;
    private firstPage;
    private oddOrEven;
    private linkToPrevious;
    private pageNumber;
    private pageCount;
    private headerFromTop;
    private footerFromTop;
    private isHeaderTopApply;
    private isFooterTopApply;
    private isRtl;
    private localObj;
    private elementId;
    element: HTMLElement;
    private headerDiv;
    private headerLabel;
    private closeIcon;
    private optionsLabelDiv;
    private optionsLabel;
    private optionsDiv;
    private firstPageDiv;
    private oddOrEvenDiv;
    private linkToPreviousDiv;
    private positionLabelDiv;
    private positionLabel;
    private positionDiv;
    private headerTopDiv;
    private headerTopLabel;
    private footerBottomDiv;
    private footerBottomLabel;
    private divElement;
    private HeaderTopApplyClickHook;
    private FooterTopApplyClickHook;
    private OnHeaderValueKeyDownHook;
    private OnFooterValueKeyDownHook;
    private ChangeHeaderBlurHook;
    private ChangeFooterBlurHook;
    private readonly documentEditor;
    private readonly toolbar;
    /**
     * @private
     * @param {boolean} enable - enable/disable header footer pane.
     * @returns {void}
     */
    enableDisableElements(enable: boolean): void;
    constructor(container: DocumentEditorContainer, isRtl?: boolean);
    initHeaderFooterPane(): void;
    showHeaderFooterPane(isShow: boolean): void;
    private initializeHeaderFooter;
    private createDivTemplate;
    private wireEvents;
    private headerTopApply;
    private footerTopapply;
    private changeHeaderBlur;
    private changeFooterBlur;
    private onClose;
    private changeFirstPageOptions;
    private changeoddOrEvenOptions;
    private changeLinkToPreviousOptions;
    private changeHeaderValue;
    private onHeaderValue;
    private onFooterValue;
    private changeFooterValue;
    onSelectionChange(): void;
    destroy(): void;
    private unWireEvents;
    private removeHTMLDOM;
}

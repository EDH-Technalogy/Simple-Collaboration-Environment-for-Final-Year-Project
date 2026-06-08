import { DocumentEditorContainer } from '../document-editor-container';
/**
 * Image Property pane
 *
 * @private
 */
export declare class ImageProperties {
    private widthNumericBox;
    private heightNumericBox;
    private aspectRatioBtn;
    private imageDiv;
    private label;
    private alabel;
    private outerDiv;
    private aspectRatio;
    private aspectRatioDiv;
    private textArea;
    element: HTMLElement;
    private widthElement;
    private heightElement;
    private textareaObj;
    private altDiv;
    private container;
    private elementId;
    private isMaintainAspectRatio;
    private isWidthApply;
    private isHeightApply;
    private isRtl;
    private onAspectRatioBtnClickHook;
    private widthBlurHook;
    private heightBlurHook;
    private onImageWidthHook;
    private onImageHeightHook;
    private widthNumericBlurHook;
    private heightNumericBlurHook;
    private altTextAreaBlurHook;
    private readonly documentEditor;
    constructor(container: DocumentEditorContainer, isRtl?: boolean);
    /**
     * @private
     * @param {boolean} enable - enable/disable image properties pane.
     * @returns {void}
     */
    enableDisableElements(enable: boolean): void;
    private initializeImageProperties;
    private initImageProp;
    private initImageAltProp;
    private createImagePropertiesDiv;
    wireEvents(): void;
    private altTextAreaBlur;
    private heightNumericBlur;
    private widthNumericBlur;
    private widthBlur;
    private heightBlur;
    private applyImageAlternativeText;
    private onImageWidth;
    private onImageHeight;
    private applyImageWidth;
    private applyImageHeight;
    private onAspectRatioBtnClick;
    showImageProperties(isShow: boolean): void;
    updateImageProperties(): void;
    destroy(): void;
    private removeHTMLDom;
    private unWireEvents;
}

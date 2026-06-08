import { DocumentHelper } from '../viewer';
import { DocumentEditorContainer } from '../../../document-editor-container';
/**
 *  To show the dialog is used to insert image on picture Content Control.
 */
export declare class PicContentControlDialog {
    /**
     * @private
     */
    container: DocumentEditorContainer;
    /**
     * @private
     */
    imagePicker: HTMLInputElement;
    private parentDiv;
    /**
     * @private
     */
    documentHelper: DocumentHelper;
    private image;
    private localeValue;
    /**
     * @param {DocumentHelper} documentHelper - Specifies the document helper
     * @private
     */
    constructor(documentHelper: DocumentHelper);
    private getModuleName;
    /**
     * @private
     * @returns {void}
     */
    show(): void;
    /**
     * @private
     * @returns {void}
     */
    onCancelButtonClick: () => void;
    /**
     * @private
     * @returns {void}
     */
    onInsertPicClick: () => void;
    private onImageChange;
    private insertImage;
    /**
     * @private
     * @returns {void}
     */
    destroy(): void;
}

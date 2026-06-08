import { DocumentEditorContainer } from '../document-editor-container';
import { Text } from './text-properties';
import { Paragraph } from './paragraph-properties';
/**
 * Text Properties pane
 *
 * @private
 */
export declare class TextProperties {
    element: HTMLElement;
    private container;
    /**
     * @private
     */
    text: Text;
    /**
     * @private
     */
    paragraph: Paragraph;
    /**
     * Initialize the Text properties pane.
     *
     * @param {DocumentEditorContainer} container DocumentEditorContainer instance.
     * @param {string} id Identifier element reference.
     * @param {boolean} isTableProperties Specified if text properties is inside the text properties.
     * @param {boolean} isRtl Specifies the RTL layout.
     */
    constructor(container: DocumentEditorContainer, id: string, isTableProperties: boolean, isRtl?: boolean);
    private initializeTextProperties;
    wireEvents(): void;
    onSelectionChange(): void;
    destroy(): void;
}

/**
 * @private
 */
export declare class DocumentCanvasElement {
    /** Gets or sets the height of a canvas element on a document. */
    height: number;
    /** Gets or sets the width of a canvas element on a document. */
    width: number;
    style: CSSStyleDeclaration;
    private context;
    constructor();
    /**
     * @param {string} contextId - Specifies the type of context to create, 2d or webgl.
     * @param {CanvasRenderingContext2DSettings} options - Specifies the type of context to create, 2d or webgl.
     * @private
     * @returns {CanvasRenderingContext2D} - Returns the canvas rendering context 2D.
     */
    getContext(contextId: '2d', options?: CanvasRenderingContext2DSettings): DocumentCanvasRenderingContext2D;
    /**
     * @param {string} type - Specifies the type of image to return.
     * @param {any} quality - A Number between 0 and 1 indicating the image quality to use for image formats that use lossy compression.
     * @private
     * @returns {string} - Returns the data URL containing a representation of the image in the format specified by the type parameter.
     */
    toDataURL(type?: string, quality?: any): string;
}
/**
 * @private
 */
export declare class DocumentCanvasRenderingContext2D {
    renderedPath: string;
    globalAlpha: number;
    globalCompositeOperation: any;
    fillStyle: string;
    strokeStyle: string;
    direction: CanvasDirection;
    font: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    lineWidth: number;
    lineCap: number;
    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx?: number, dy?: number, dw?: number, dh?: number): void;
    beginPath(): void;
    clip(fillRule?: CanvasFillRule): void;
    fill(fillRule?: CanvasFillRule): void;
    stroke(): void;
    closePath(): void;
    lineTo(x: number, y: number): void;
    moveTo(x: number, y: number): void;
    rect(x: number, y: number, w: number, h: number): void;
    setLineDash(segments: number[]): void;
    clearRect(x: number, y: number, w: number, h: number): void;
    fillRect(x: number, y: number, w: number, h: number): void;
    strokeRect(x: number, y: number, w: number, h: number): void;
    restore(): void;
    save(): void;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    measureText(text: string): any;
    strokeText(text: string, x: number, y: number, maxWidth?: number): void;
    scale(x: number, y: number): void;
}

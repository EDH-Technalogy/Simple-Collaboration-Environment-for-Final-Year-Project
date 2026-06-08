import { ChildProperty } from '@syncfusion/ej2-base';
/**
 * Defines the ribbon tooltip.
 */
export declare class RibbonTooltip extends ChildProperty<RibbonTooltip> {
    /**
     * Defines the CSS class to customize the appearance of the tooltip.
     *
     * @default ''
     */
    cssClass: string;
    /**
     * Defines the unique ID for the tooltip.
     *
     * @default ''
     */
    id: string;
    /**
     * Defines the header content of the tooltip.
     *
     * @default ''
     */
    title: string;
    /**
     * Defines the content for the tooltip.
     *
     * @default ''
     */
    content: string;
    /**
     * Defines the CSS class for the icons to be shown in tooltip.
     *
     * @default ''
     */
    iconCss: string;
}

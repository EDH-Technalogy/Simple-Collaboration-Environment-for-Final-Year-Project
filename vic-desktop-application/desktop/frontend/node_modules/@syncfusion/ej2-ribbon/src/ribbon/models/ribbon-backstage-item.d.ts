import { ChildProperty, EmitType, BaseEventArgs } from '@syncfusion/ej2-base';
import { BackstageItemModel } from './ribbon-backstage-item-model';
/**
 * Defines the ribbon backstage back button.
 */
export declare class BackstageItem extends ChildProperty<BackstageItem> {
    /**
     * Specifies the text for backstage item.
     *
     * @default ''
     */
    text: string;
    /**
     * Defines a unique identifier for the backstage item.
     *
     * @default ''
     */
    id: string;
    /**
     * Specifies the keytip content.
     *
     * @default ''
     */
    keyTip: string;
    /**
     * Specifies the backstage item’s content as selector.
     *
     * @default ''
     * @angularType string | object
     * @reactType string | function | JSX.Element
     * @vueType string | function
     * @aspType string
     */
    content: string | Function;
    /**
     * Specifies the icon css class for backstage back button.
     *
     * @default ''
     */
    iconCss: string;
    /**
     * Specifies the separator between the backstage items.
     *
     * @default false
     */
    separator: boolean;
    /**
     * Specifies whether the item is placed in Footer section of backstage.
     *
     * @default false
     */
    isFooter: boolean;
    /**
     * Event triggers when backstage item is clicked.
     *
     * @event backStageItemClick
     */
    backStageItemClick: EmitType<BackstageItemClickArgs>;
}
/**
 * Event triggers when backstage item is clicked.
 */
export interface BackstageItemClickArgs extends BaseEventArgs {
    /**
     * Set to true when the event has to be canceled, else false.
     */
    cancel: boolean;
    /**
     * Provides the backstage menu item object.
     */
    item?: BackstageItemModel;
    /**
     *  Provides the HTML element of the backstage menu item clicked.
     */
    target: HTMLElement;
    /**
     * Returns true when back button item is clicked.
     */
    isBackButton: boolean;
}

import { ChildProperty } from '@syncfusion/ej2-base';
import { RibbonGroupButtonSelection } from '../base/interface';
import { RibbonGroupButtonItemModel } from './ribbon-group-button-item-model';
/**
 * Defines the ribbon group button settings.
 */
export declare class RibbonGroupButtonSettings extends ChildProperty<RibbonGroupButtonSettings> {
    /**
     * Specifies the header for the groupbutton popup in Simplified layout.
     *
     * @default ''
     */
    header: string;
    /**
     * Defines options for Selection Type.
     *
     * @isenumeration true
     * @default 'Single'
     * @asptype RibbonGroupButtonSelection
     */
    selection: RibbonGroupButtonSelection;
    /**
     * Defines the properties for collection of button items in Ribbon group button.
     *
     * @default []
     * @aspType List<RibbonGroupButtonItem>
     */
    items: RibbonGroupButtonItemModel[];
}

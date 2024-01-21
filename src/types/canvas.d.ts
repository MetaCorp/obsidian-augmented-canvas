export type CanvasNodeType = 'link' | 'file' | 'text' | 'group';
export type CanvasDirection =
    'bottomright'
    | 'bottomleft'
    | 'topright'
    | 'topleft'
    | 'right'
    | 'left'
    | 'top'
    | 'bottom';

export interface CanvasNodeUnknownData {
    id: string;
    type: CanvasNodeType;
    collapsed: boolean;

    [key: string]: any;
}

module CIV {

    export enum ResourceType {
        Gold,
        Food,
        Science
    }

    export interface ResourceInfo {
        name: string;
        key: string;
        canBeFoundOn: TileType[];
        bonus: {
            food?: string,
            science?: string,
            gold?: string
        }
    }
}
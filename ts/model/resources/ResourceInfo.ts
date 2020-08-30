module CIV {

    export enum ResourceType {
        Gold,
        Food,
        Science
    }

    export interface ResourceInfo {
        name: string;
        key: string;
        description: string,
        canBeFoundOn: TileType[];
        bonus: {
            Food?: string,
            Science?: string,
            Gold?: string
        }
    }
}
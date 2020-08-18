module CIV {

    export interface ResourceInfo {
        name: string;
        key: string;
        canBeFoundOn: TileType[];
    }
}
module CIV {


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
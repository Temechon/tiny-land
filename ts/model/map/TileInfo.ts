module CIV {

    export interface TileInfo {
        type: TileType;
        key: string | Array<string>;

        /** Used when two units attack */
        defenseModifier: number;

        resources: {
            Food?: string,
            Science?: string,
            Gold?: string,
        }

    }
    /**
     * Hexagons on the map can be one of these kind
     */
    export enum TileType {
        Land = "land", /* Resource can grow on it */
        Water = "water", /* Only boat can go through */
        Beach = "beach", /* Only boat can go through */
        Forest = "forest",
        Mountain = "mountain",
        DeepWater = "deepwater", /* Only bigger boat can navigate here */
        Toundra = "toundra" /* Nothing much to do here... Maybe except some awesome resources ? */
    }
}
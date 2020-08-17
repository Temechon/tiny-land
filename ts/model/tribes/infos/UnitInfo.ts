module CIV {

    export interface UnitInfo {
        name: string;
        key: string;

        /** The number of tile this unit can go through in one turn */
        range: number;
        /** The number of tile this unit can see */
        vision: number;
        /** The cost in gold to build this unit */
        cost: number;
        /** The strength of this unit in combat */
        strength: number;

    }
}
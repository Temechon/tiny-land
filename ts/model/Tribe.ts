module CIV {

    /**
     * A tribe is a set of cities, units and resources available on the map.
     */
    export class Tribe {

        public cities: Array<City> = [];

        constructor(public name: string) {
        }
    }
}
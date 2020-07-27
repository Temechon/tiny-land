module CIV {

    /**
     * A tribe is a set of cities, units and resources available on the map.
     */
    export class Tribe {

        public cities: Array<City> = [];
        public units : Phaser.GameObjects.Container;

        /** The color of the influence radius */
        public color: number = 0xff0000;

        constructor(public name: string) {
            this.units = Game.INSTANCE.make.container({x:0, y:0});
        }


    }
}
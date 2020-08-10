module CIV {

    /**
     * A tribe is a set of cities, units and resources available on the map.
     */
    export class Tribe extends Phaser.GameObjects.Container {

        public cities: City[] = [];
        public units: Unit[] = [];

        /** The color of the influence radius */
        public color: number = 0xff0000;

        constructor(public name: string) {
            super(Game.INSTANCE);
            Game.INSTANCE.add.existing(this);
        }

        setCityOn(tile: Tile, map: WorldMap) {

            let city = new City({
                tile: tile,
                worldmap: map,
                tribe: this
            });
            // Update the tile resource : add one gold and one research
            tile.resources[ResourceType.Gold]++
            tile.resources[ResourceType.Research] += 2;
            map.updateResourceLayer();

            this.cities.push(city);
            this.add(city);
        }


    }
}
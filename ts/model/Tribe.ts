module CIV {

    /**
     * A tribe is a set of cities, units and resources available on the map.
     */
    export class Tribe extends Phaser.GameObjects.Container {

        public cities: City[] = [];
        public units: Unit[] = [];

        /** The color of the influence radius */
        public color: number = 0xff0000;

        /** The fog of war on the map  for ths tribe */
        fogOfWar: Phaser.GameObjects.Container;


        constructor(public name: string) {
            super(Game.INSTANCE);
            Game.INSTANCE.add.existing(this);
            this.depth = Constants.LAYER.TRIBE_ROOT;

            this.fogOfWar = Game.INSTANCE.make.container({ x: 0, y: 0, add: false });
            this.add(this.fogOfWar);

            Game.INSTANCE.map.doForAllTiles(t => {
                let fog = Game.INSTANCE.make.image({ x: t.worldPosition.x, y: t.worldPosition.y, key: 'hex', add: false });
                fog.name = t.name;
                fog.setTint(0x000000);
                fog.scale = ratio;
                this.fogOfWar.add(fog);
            });
        }

        setCityOn(tile: Tile): City {

            let city = new City({
                tile: tile,
                worldmap: Game.INSTANCE.map,
                tribe: this
            });
            // Update the tile resource : add one gold and one research
            tile.resources[ResourceType.Gold]++
            tile.resources[ResourceType.Research] += 2;

            this.cities.push(city);
            this.add(city);

            // Remove all tiles of this city from the fog of war
            this.removeFogOfWar(city.getVision());

            this.bringToTop(this.fogOfWar);
            this.bringToTop(city);
            return city;
        }

        getProductionOf(type: ResourceType): number {
            let res = 0;
            for (let t of this.cities) {
                res += t.getProductionOf(type);
            }
            return res;
        }

        removeFogOfWar(tiles: Array<Tile>) {
            for (let t of tiles) {
                let img = this.fogOfWar.getByName(t.name);
                if (img) {
                    this.fogOfWar.remove(img, true);
                }
            }

            // Update the ressource layer
            Game.INSTANCE.map.updateResourceLayer();

        }

        /**
         * Th vision of the tribe is the union of all vision for all cities and units
         * and all hexes browsed by all units
         */
        // getVision(): Array<Tile> {
        //     let res = [];

        //     for (let c of this.cities) {
        //         res.push(...c.getVision());
        //     }

        //     return res;
        // }

    }
}
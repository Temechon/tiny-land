module CIV {

    /**
     * A tribe is a set of cities, units and resources available on the map.
     */
    export class Tribe extends Phaser.GameObjects.Container {

        public cities: City[] = [];
        public units: Unit[] = [];

        /** The color of the influence radius */
        public color: number;

        /** The fog of war on the map  for ths tribe */
        fogOfWar: FogOfWar;

        static DEBUG_FOG_OF_WAR_ON = false;

        /** True if this tribe is the player, false otherwise */
        isPlayer: boolean = false;


        constructor(public name: string) {
            super(Game.INSTANCE);
            Game.INSTANCE.add.existing(this);
            this.depth = Constants.LAYER.TRIBE_ROOT;
            this.fogOfWar = new FogOfWar();
            this.color = parseInt(chance.color({ format: '0x' }));

        }

        setCityOn(tile: Tile): City {

            let city = new City({
                tile: tile,
                worldmap: Game.INSTANCE.map,
                tribe: this
            });
            // Update the tile resource : add one gold and one research
            tile.resources[ResourceType.Gold]++
            tile.resources[ResourceType.Science] += 2;

            this.cities.push(city);
            this.add(city);

            // Remove all tiles of this city from the fog of war
            this.removeFogOfWar(city.getVision());

            // this.bringToTop(this.fogOfWar);
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
                this.fogOfWar.remove(t);
            }

            // Update the ressource layer
            Game.INSTANCE.map.updateResourceLayer();
        }

        /**
         * Returns true if the given tile is in the fog of war, false otherwise
         */
        isInFogOfWar(tile: Tile): boolean {
            return this.fogOfWar.has(tile);
        }

        /**
         * Returns the list of all unit this player can create. This list should be then filtered
         * according to each city that is trying to create something
         */
        getListOfPossibleProduction(): Array<Class> {
            let res = [];
            res.push(Unit);
            return res;
        }

        /**
         * Reset the state of all units to IDLE
         */
        resetAllUnits() {
            for (let unit of this.units) {
                unit.setIdle();
            }
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
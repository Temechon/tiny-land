module CIV {

    /**
     * A tribe is a set of cities, units and resources available on the map.
     */
    export class Tribe extends Phaser.GameObjects.Container {

        static DEBUG_FOG_OF_WAR_ON = true;

        public cities: City[] = [];
        public units: Unit[] = [];

        /** The color of the influence radius */
        public color: number;

        /** The fog of war on the map  for ths tribe */
        fogOfWar: FogOfWar;

        /** True if this tribe is the player, false otherwise */
        isPlayer: boolean = false;

        /** The global pool of ressource for this tribe */
        productionManager: ProductionManager;

        constructor(public name: string) {
            super(Game.INSTANCE);
            Game.INSTANCE.add.existing(this);
            this.depth = Constants.LAYER.TRIBE_ROOT;
            this.fogOfWar = new FogOfWar();
            this.color = parseInt(chance.color({ format: '0x' }));

            // Ressources
            this.productionManager = new ProductionManager();

        }

        /**
         * Set a city on the given tile, and ressources (1 gold, 2 science) on this tile (just because).
         * The fog of war is also removed for this city.
         */
        setCityOn(tile: Tile): City {

            let city = new City({
                tile: tile,
                worldmap: Game.INSTANCE.map,
                tribe: this
            });
            // Update the tile resource : add one gold and one science
            tile.resources[ResourceType.Gold]++
            tile.resources[ResourceType.Science] += 2;

            this.productionManager.addCity(city);
            this.productionManager.collectCity(city);

            this.cities.push(city);
            this.add(city);

            // Remove all tiles of this city from the fog of war
            this.removeFogOfWar(city.getVision());

            // this.bringToTop(this.fogOfWar);
            this.bringToTop(city);
            return city;
        }

        /**
         * Returns the production by turn of all cities of this tribe.
         */
        getProductionByTurnOf(type: ResourceType): number {
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
        getListOfPossibleConstruction(): Array<UnitInfo> {
            let res = [];
            let allUnits = Game.INSTANCE.allUnits
            for (let unitKey in allUnits) {
                // TODO Filter what should not be visible for this tribe (according to the technology level)
                let info = allUnits[unitKey];
                res.push(info);
            }
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

    class ProductionManager {

        /** The total pool of ressource for this tribe */
        private ressources: Array<number> = [];

        _cities: Array<City> = [];

        constructor() {
            this.ressources[ResourceType.Food] = 0;
            this.ressources[ResourceType.Gold] = 0;
            this.ressources[ResourceType.Science] = 0;
        }

        get food(): number {
            return this.ressources[ResourceType.Food];
        }

        get gold(): number {
            return this.ressources[ResourceType.Gold];
        }

        get science(): number {
            return this.ressources[ResourceType.Science];
        }

        get foodByTurn(): number {
            let res = 0;
            for (let c of this._cities) {
                res += c.getProductionOf(ResourceType.Food)
            }
            return res;
        }

        get goldByTurn(): number {
            let res = 0;
            for (let c of this._cities) {
                res += c.getProductionOf(ResourceType.Gold)
            }
            return res;
        }

        get scienceByTurn(): number {
            let res = 0;
            for (let c of this._cities) {
                res += c.getProductionOf(ResourceType.Science)
            }
            return res;
        }

        addCity(city: City) {
            this._cities.push(city);
        }

        /**
         * Add each city production to the global pool
         */
        collect() {
            this.ressources[ResourceType.Food] += this.foodByTurn;
            this.ressources[ResourceType.Gold] += this.goldByTurn;
            this.ressources[ResourceType.Science] += this.scienceByTurn;
        }

        /**
         * Collect all ressources from the given city
         */
        collectCity(city: City) {
            this.ressources[ResourceType.Food] += city.getProductionOf(ResourceType.Food);
            this.ressources[ResourceType.Gold] += city.getProductionOf(ResourceType.Gold);
            this.ressources[ResourceType.Science] += city.getProductionOf(ResourceType.Science);
        }

        consume(type: ResourceType, nb: number) {
            this.ressources[type] -= nb;
        }

    }
}
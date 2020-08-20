module CIV {

    export class ProductionManager {

        /** The total pool of ressource for this tribe */
        private ressources: Array<number> = [];

        /** The city the manager should collect ressources (and compute their upkeep) */
        private _cities: Array<City> = [];

        private _tribe: Tribe;

        constructor(tribe: Tribe) {
            this._tribe = tribe;
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
            this.ressources[ResourceType.Food] += this.foodByTurn
            this.ressources[ResourceType.Gold] += this.goldByTurn - this.upkeep();
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

        /**
         * The total cost of all cities, according to the distance to the capital (2 gold * distance to capital)
         */
        upkeep(): number {
            let res = 0;
            for (let c of this._cities) {
                if (c === this._tribe.capital) {
                    continue;
                }
                let path = Game.INSTANCE.map.getPath(c.tile.name, this._tribe.capital.tile.name);
                res += 2 * path.length
            }
            return res;
        }

    }
}
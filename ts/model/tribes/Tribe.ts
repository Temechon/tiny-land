module CIV {

    /**
     * A tribe is a set of cities, units and resources available on the map.
     */
    export class Tribe extends Phaser.GameObjects.Container {

        static DEBUG_FOG_OF_WAR_ON = false;

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

        /** The tetxure used to display the influence */
        private _influenceTexture: Phaser.GameObjects.Graphics;

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
            this.removeFogOfWar(city.getInfluenceZone());

            // this.bringToTop(this.fogOfWar);
            this.bringToTop(city);
            this.updateFrontiers();
            return city;
        }

        updateFrontiers() {

            if (this._influenceTexture) {
                this._influenceTexture.destroy();
                this.remove(this._influenceTexture);
            }

            // Group cities by axial distance to the first one
            let groups = [];
            let remainingCities = this.cities.slice();

            let g = Game.INSTANCE.make.graphics({ x: 0, y: 0, add: false });
            g.depth = 100;


            // A city is added in a group if its distance between at least one city in the group is smaller than c1 + c2 + 1
            let belongToGroup = (c: City, group: City[]): boolean => {
                for (let m of group) {
                    let dist = HexGrid.axialDistance(c.tile.rq.q, c.tile.rq.r, m.tile.rq.q, m.tile.rq.r);
                    let radius1 = c.influenceRadius;
                    let radius2 = m.influenceRadius;
                    if (dist <= radius1 + radius2 + 1) {
                        return true;
                    }
                }
                return false;
            }

            let group = [this.cities[0]];
            remainingCities.shift();

            while (remainingCities.length > 0) {

                let toAdd = remainingCities.filter(c => belongToGroup(c, group));
                remainingCities = remainingCities.filter(c => !belongToGroup(c, group));

                if (toAdd.length > 0) {
                    for (let c of toAdd) {
                        group.push(c);
                    }
                } else {
                    groups.push(group);
                    group = [remainingCities[0]];
                    remainingCities.shift();
                }
            }
            groups.push(group);
            console.log("groups of cities", groups);

            for (let gg of groups) {
                this._updateFrontiers(gg, g);
            }
            this._influenceTexture = g;
            this.add(this._influenceTexture);


        }

        private _updateFrontiers(cities: City[], g: Phaser.GameObjects.Graphics) {
            let hw = 0;

            let ring = [];
            for (let city of cities) {
                city.updateInfluenceTiles();
                ring.push(...city.getInfluenceZone());
            }

            hw = (ring[0] as Tile).displayHeight / 2;
            hw = hw * hw + 100;

            // Get all vertices
            let allVertices: Vertex[] = [];
            for (let t of ring) {
                allVertices.push(...t.vertices);
            }

            // Kepp all vertices shared by two tiles or less
            allVertices = allVertices.filter(v => Tile.getTilesSharingVertex(v, ring).length <= 2)

            let points = [];

            for (let v of allVertices) {
                points.push({
                    x: v.coords.x + Game.INSTANCE.map.x,
                    y: v.coords.y + Game.INSTANCE.map.y
                });
            }
            // Remove duplicates points
            for (let i = 0; i < points.length; i++) {
                let p = points[i];

                for (let pp of points) {
                    let dist = Phaser.Math.Distance.BetweenPointsSquared(p, pp)
                    if (dist < 100 * ratio && dist > 0) {
                        points.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }

            // Sort vertices
            let paths = [];
            let sortedVertices = [points[0]];
            points.shift();

            for (let i = 0; i < points.length; i++) {
                let last = sortedVertices[sortedVertices.length - 1];

                let vertexIndex;
                let nearest;
                let minDist = Number.MAX_VALUE
                for (let j = 0; j < points.length; j++) {
                    let r = points[j];

                    let distToLast = Phaser.Math.Distance.BetweenPointsSquared(r, last);
                    // console.log("Distance", minDist)
                    if (distToLast > ratio && distToLast < minDist) {
                        nearest = r;
                        minDist = distToLast
                        vertexIndex = j;
                    }
                }
                // console.log("Distance min", minDist)
                if (minDist > hw) {
                    // Create a new path
                    paths.push(sortedVertices);
                    sortedVertices = [];
                }
                sortedVertices.push(nearest)
                points.splice(vertexIndex, 1);
                i--;
            }
            paths.push(sortedVertices);
            console.log(paths);


            // Draw it
            let i = 0;
            g.lineStyle(20 * ratio, this.color);
            for (let frontier of paths) {

                frontier.push(frontier[0]);
                frontier.push(frontier[1]);
                g.strokePoints(frontier);
                // for (let p of frontier) {
                //     setTimeout(() => {
                //         g.fillCircle(p.x, p.y, 10);
                //     }, 200 * i++)
                // }
            }

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


        destroy() {
            for (let c of this.cities) {
                c.destroy();
            }

            for (let u of this.units) {
                u.destroy();
            }
            this.fogOfWar.destroy();
            super.destroy();
        }

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
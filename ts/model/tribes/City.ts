module CIV {

    export interface ConstructionOrder {
        unit: UnitInfo,
        deactivated?: { reason: string }
    }

    export class City extends Phaser.GameObjects.Container implements IClickable {

        private _tile: Tile;
        public worldmap: WorldMap;

        /** The tribe this city belongs to */
        private _tribe: Tribe;

        /** The number of hexagon around this city that can be used by this city */
        public influenceRadius: number = 1;
        /** The tetxure used to display the influence */
        private _influenceTexture: Phaser.GameObjects.Graphics;
        /** All tiles in the influence area of this city */
        private _influenceTiles: Tile[] = [];

        constructor(config: {
            worldmap: WorldMap,
            tile: Tile,
            tribe: Tribe
        }) {
            super(Game.INSTANCE);
            this._tile = config.tile;
            this.worldmap = config.worldmap;
            this._tribe = config.tribe;

            let cityImage = Game.INSTANCE.make.image({
                x: this._tile.worldPosition.x,
                y: this._tile.worldPosition.y,
                key: 'city',
                add: false
            });

            cityImage.scale = ratio;
            this.add(cityImage)

            // Remove assets from the tile
            for (let ass of this._tile.assets) {
                ass.destroy();
            }

            // Draw its influence area
            this.updateInfluenceRadius();
            this._tile.addClickable(this);
        }

        get worldposition(): Phaser.Types.Math.Vector2Like {
            return { x: this._tile.worldPosition.x, y: this._tile.worldPosition.y }
        }

        /**
         * Returns true if this city already has a unit
         */
        get hasUnit(): boolean {
            return this._tile.hasUnit;
        }

        /**
         * Produce a unit on this city.
         * TODO Remove resources from the tribe to produce this unit
         */
        public produceUnit(info: UnitInfo) {
            if (this._tribe.productionManager.gold > info.cost) {

                let unit = new Unit({
                    scene: Game.INSTANCE,
                    x: this._tile.worldPosition.x,
                    y: this._tile.worldPosition.y,
                    infos: info,
                    map: this.worldmap,
                    tile: this._tile,
                    tribe: this._tribe
                });
                this._tribe.productionManager.consume(ResourceType.Gold, info.cost);
                unit.setWaitingNextTurn();
                this.scene.add.existing(unit);

                this._tribe.units.push(unit);
                this.scene.events.emit("updateui");
            }
        }

        /**
         * Returns the list of all unit this player can create on this city.
         */
        getListOfPossibleProduction(): Array<ConstructionOrder> {
            let possible: Array<UnitInfo> = this._tribe.getListOfPossibleConstruction();
            let res = [];

            // TODO Filter the list according to the city capabilities (ex:strategic ressources, water...)
            for (let unitInfo of possible) {
                let deactivated = null;
                // If this tribe has enough gold
                if (this._tribe.productionManager.gold < unitInfo.cost) {
                    deactivated = { reason: "Not enough gold" }
                }
                // If this city is not empty
                if (this.hasUnit) {
                    deactivated = { reason: "A unit is already in the city" }
                }

                res.push({
                    unit: unitInfo,
                    deactivated: deactivated
                } as ConstructionOrder);
            }

            return res;
        }

        getProductionOf(type: ResourceType): number {
            let res = 0;
            for (let t of this._influenceTiles) {
                res += t.resources[type];
            }

            return res;
        }

        updateInfluenceRadius() {

            if (this._influenceTexture) {
                this._influenceTexture.destroy();
                this.remove(this._influenceTexture);
            }
            // Clear the array of influence tiles
            for (let t of this._influenceTiles) {
                t.belongsTo = null;
            }
            this._influenceTiles = []

            let r = this.influenceRadius;
            let ring = this.worldmap.getRing(this._tile, r);
            ring.push(this._tile)

            ring = ring.filter(t => t.belongsTo === null);

            for (let r of ring) {
                this._influenceTiles.push(r);
            }
            this._influenceTiles.push(this._tile);

            for (let t of this._influenceTiles) {
                t.belongsTo = this;
            }

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
                    x: v.coords.x + this._tile.parentContainer.x,
                    y: v.coords.y + this._tile.parentContainer.y
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
                    if (distToLast > 0 && distToLast < minDist) {
                        nearest = r;
                        minDist = distToLast
                        vertexIndex = j;
                    }
                }
                sortedVertices.push(nearest)
                points.splice(vertexIndex, 1);
                i--;
            }
            // Draw it
            let g = Game.INSTANCE.make.graphics({ x: 0, y: 0, add: false });
            g.depth = 100;

            let path = new Phaser.Curves.Path(sortedVertices[0].x, sortedVertices[0].y);
            sortedVertices.push(sortedVertices[0])
            sortedVertices.push(sortedVertices[1])
            path.splineTo(sortedVertices);
            g.lineStyle(20 * ratio, this._tribe.color);
            path.draw(g, sortedVertices.length * 100);
            this._influenceTexture = g;
            this.add(this._influenceTexture);
        }

        /**
         * True if a city can be created on the current tile with the given tribe
         *  (no other city, not too close of another city of the same tribe (at least 2 tiles), not in an influence zone of another city
         */
        static canCreateHere(tile: Tile, tribe: Tribe): boolean {
            // Not on another city
            if (tile.hasCity) {
                return false;
            }
            // In an influence zone of a city (any tribe)
            if (tile.belongsTo) {
                return false;
            }
            // Not too close of another city of the same tribe (at least a distance of 2 tiles - then a city should not be in ring(1))
            let around = Game.INSTANCE.map.getRing(tile, 2);
            for (let t of around) {
                if (t.hasCity && t.belongsTo._tribe === tribe) {
                    return false;
                }
            }

            return true;
        }

        activate() {
            // Check if the city belongs to the player
            if (!this._tribe.isPlayer) {
                return;
            }
            let listOfUnits = this.getListOfPossibleProduction();

            this.scene.events.emit("circularmenuon", {
                city: this,
                position: this.worldposition,
                constructions: listOfUnits
            });
            console.log("CITY ACTIVATED");
        }

        /**
        * The vision of this city is the set of hex in this influence zone
        * TODO redo this with a parameter "bonus" when we create a new city
        */
        getVision(): Array<Tile> {
            return this._influenceTiles;
        }

        deactivate() {
            this.scene.events.emit("circularmenuoff");
            console.log("CITY DEACTIVATED");
        }

        destroy() {
            this._influenceTexture.destroy();
            super.destroy();
        }

    }
}
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
        private _influenceTexture: Phaser.GameObjects.RenderTexture;
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
            this.add(this._influenceTexture)
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
                this._influenceTexture.clearMask(true);
                this._influenceTexture.destroy();
                this.remove(this._influenceTexture);
            }
            this._influenceTiles = []

            let ring: Array<Tile> = [];
            let r = this.influenceRadius;

            while (r > 0) {
                ring.push(...this.worldmap.getTilesByAxialCoords(
                    this.worldmap.grid.ring(
                        this._tile.rq.q, this._tile.rq.r, r
                    )
                ))
                r--;
            }
            ring.push(this._tile)
            // TODO Filter hex fron tome influence radius that are in another city

            // Create a container that contains all hex to draw
            let container = Game.INSTANCE.make.container({ x: this._tile.worldPosition.x, y: this._tile.worldPosition.y, add: false })//.setVisible(false);

            let mask = Game.INSTANCE.make.container({ x: this._tile.worldPosition.x, y: this._tile.worldPosition.y, add: false });

            for (let t of ring) {
                // Add this tile to the influence array
                this._influenceTiles.push(t);
                let image = t.getHexPrint(this._tribe.color);
                image.x -= this._tile.worldPosition.x;
                image.y -= this._tile.worldPosition.y;
                image.scale *= 1.1
                // image.alpha = 0.5
                container.add(image);

                image = t.getHexPrint(0x000000);
                image.x -= this._tile.worldPosition.x;
                image.y -= this._tile.worldPosition.y;
                mask.add(image);
            }


            let size = Helpers.getSize(container, this._tile.displayWidth, this._tile.displayHeight);

            let rt = Game.INSTANCE.make.renderTexture({ x: this._tile.worldPosition.x, y: this._tile.worldPosition.y, width: size.width * 2, height: size.height * 2 })
            rt.setOrigin(0.5, 0.5);
            rt.draw(container, size.width, size.height)
            container.iterate(c => c.destroy());
            container.destroy();

            rt.mask = new Phaser.Display.Masks.BitmapMask(Game.INSTANCE, mask);
            rt.mask.invertAlpha = true;

            this._influenceTexture = rt;
            this.add(this._influenceTexture);
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
        */
        getVision(): Array<Tile> {
            return this._influenceTiles;
        }

        deactivate() {
            this.scene.events.emit("circularmenuoff");
            console.log("CITY DEACTIVATED");
        }

    }
}
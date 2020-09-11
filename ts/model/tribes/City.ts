module CIV {

    export interface ConstructionOrder {
        unit: UnitInfo,
        deactivated?: { reason: string }
    }

    export class City extends Phaser.GameObjects.Container implements IClickable {

        tile: Tile;
        public worldmap: WorldMap;

        /** The tribe this city belongs to */
        private _tribe: Tribe;

        /** The number of hexagon around this city that can be used by this city */
        public influenceRadius: number = 1;
        /** All tiles in the influence area of this city */
        private _influenceTiles: Tile[] = [];

        private _image: Phaser.GameObjects.Image;

        name: string;
        nameText: Phaser.GameObjects.BitmapText;

        /** True if this city is being captured */
        private _isBeingCaptured: { value: boolean, tween: Phaser.Tweens.Tween } = { value: false, tween: null };

        constructor(config: {
            worldmap: WorldMap,
            tile: Tile,
            tribe: Tribe
        }) {
            super(Game.INSTANCE, config.tile.worldPosition.x, config.tile.worldPosition.y);
            this.tile = config.tile;
            this.worldmap = config.worldmap;
            this._tribe = config.tribe;

            this.tile.removeClickable(this.tile);
            this.tile.removeAssets();
            this.tile.infos.defenseModifier = 0.25

            let cityImage = Game.INSTANCE.make.image({
                x: 0,
                y: 0,
                key: 'city',
                scale: ratio,
                add: false
            });
            this.name = Helpers.getCityName();
            this._image = cityImage;

            this.add(cityImage)


            this.nameText = this.scene.make.bitmapText({
                x: this.tile.worldPosition.x,
                y: this.tile.worldPosition.y,
                font: "font_normal",
                size: 45 * ratio,
                text: this.name,
                depth: 10
            }).setOrigin(0.5, -1.5);

            // Remove assets from the tile
            for (let ass of this.tile.assets) {
                ass.destroy();
            }

            // Draw its influence area
            this.updateInfluenceTiles();
            this.tile.addClickable(this);
        }

        get worldposition(): Phaser.Types.Math.Vector2Like {
            return { x: this.tile.worldPosition.x, y: this.tile.worldPosition.y }
        }

        get isBeingCaptured(): boolean {
            return this._isBeingCaptured.value;
        }
        set isBeingCaptured(val: boolean) {
            this._isBeingCaptured.value = val;

            if (val) {
                this._isBeingCaptured.tween = this.scene.tweens.addCounter({
                    duration: 1000,
                    ease: Phaser.Math.Easing.Cubic.Out,
                    yoyo: true,
                    repeat: -1,
                    from: 0,
                    to: 255,
                    onUpdate: (tween) => {
                        var value = Math.floor(tween.getValue());
                        let color = Phaser.Display.Color.GetColor(255, (255 - value), (255 - value));
                        this._image.setTint(color, color, 0xffffff, 0xffffff)
                    }
                });
            } else {
                this._image.setTint(0xffffff, 0xffffff, 0xffffff, 0xffffff)
                this._isBeingCaptured.tween.stop();
            }
        }

        /**
         * Returns true if this city already has a unit
         */
        get hasUnit(): boolean {
            return this.tile.hasUnit;
        }

        /** Returns the tribe of this city */
        get tribe(): Tribe {
            return this._tribe;
        }

        getTexture(): string {
            return this._image.texture.key;
        }

        /**
         * Produce a unit on this city.
         * TODO Remove resources from the tribe to produce this unit
         */
        public produceUnit(info: UnitInfo) {
            if (this._tribe.productionManager.gold >= info.cost) {

                let unit = new Unit({
                    scene: Game.INSTANCE,
                    x: this.tile.worldPosition.x,
                    y: this.tile.worldPosition.y,
                    infos: info,
                    map: this.worldmap,
                    tile: this.tile,
                    tribe: this._tribe
                });
                this._tribe.productionManager.consume(ResourceType.Gold, info.cost);
                unit.setWaitingNextTurn();
                this.scene.add.existing(unit);

                this._tribe.units.push(unit);
                this.scene.events.emit(Constants.EVENTS.UI_UPDATE);
                this.scene.events.emit(Constants.EVENTS.UI_OFF);
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

        /**
         * This city is given to the tribe passed in parameter
         */
        updateOwner(tribe: Tribe) {
            this.tribe.removeCity(this);
            this._tribe = tribe;
            this._tribe.addCity(this);
        }

        updateInfluenceTiles() {

            // Clear the array of influence tiles
            for (let t of this._influenceTiles) {
                t.belongsTo = null;
            }
            this._influenceTiles = []

            let r = this.influenceRadius;
            let ring = this.worldmap.getRing(this.tile, r);

            ring = ring.filter(t => t.belongsTo === null);

            for (let r of ring) {
                this._influenceTiles.push(r);
            }
            this._influenceTiles.push(this.tile);

            for (let t of this._influenceTiles) {
                t.belongsTo = this;
            }
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

            this.scene.events.emit(Constants.EVENTS.CIRCULAR_MENU_ON, {
                city: this,
                position: this.worldposition,
                constructions: listOfUnits
            });
            // console.log("CITY ACTIVATED");
            this.tile.displayTileInformation();
        }

        /**
        * The vision of this city is the set of hex in this influence zone
        * TODO redo this with a parameter "bonus" when we create a new city
        */
        getInfluenceZone(): Array<Tile> {
            return this._influenceTiles;
        }

        /**
         * Returns a ring of 2 tiles around the city
         */
        getVision(): Array<Tile> {
            let res = this.worldmap.getRing(this.tile, 2);
            res.push(this.tile);
            return res;
        }

        deactivate() {
            // this.scene.events.emit(Constants.EVENTS.CIRCULAR_MENU_OFF);
            this.scene.events.emit(Constants.EVENTS.UI_OFF);
            // console.log("CITY DEACTIVATED");
        }

        destroy() {
            this.nameText.destroy();
            this.tile.addClickable(this.tile);
            super.destroy();
        }
    }
}
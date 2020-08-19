module CIV {

    enum UnitState {
        IDLE,
        /** This unit has been selected */
        ACTIVATED,
        /** This unit is moving */
        MOVING,
        /** This unit is waiting on the next turn to be able to move again */
        WAITING_NEXT_TURN
    }

    export class Unit extends Phaser.GameObjects.Container implements IClickable {

        infos: UnitInfo;

        /** The set of tile this unit can mvoe to */
        private _moveRange: Array<Tile>;
        private _moveRangeGraphics: Array<Phaser.GameObjects.Graphics>;
        private _image: Phaser.GameObjects.Image;

        public currentTile: Tile;
        public map: WorldMap;
        /** The tribe this unit belong to */
        private _tribe: Tribe;
        state: UnitState = UnitState.IDLE;

        /** Create a city for a settler, heal, improve unit... */
        private _specialAction: Phaser.GameObjects.Image;

        constructor(config: {
            scene: Phaser.Scene,
            x: number,
            y: number,
            infos: UnitInfo,
            map: WorldMap,
            tile: Tile,
            tribe: Tribe
        }) {
            super(config.scene);

            this.infos = config.infos;

            this.currentTile = config.tile;
            this.map = config.map;
            this._tribe = config.tribe;
            this.depth = Constants.LAYER.UNITS;

            let image = Game.INSTANCE.make.image({ x: config.x, y: config.y, key: config.infos.key, add: false });
            this.add(image);
            this._image = image;

            image.scale = ratio;
            this.currentTile.addClickable(this);
        }

        /**
         * True if this unit can move
         */
        get canMove(): boolean {
            return this.state === UnitState.IDLE;
        }

        setWaitingNextTurn() {
            this.state = UnitState.WAITING_NEXT_TURN;
        }

        setIdle() {
            this.state = UnitState.IDLE;
        }

        deactivate() {
            if (this._moveRangeGraphics) {
                this._moveRangeGraphics.forEach(i => i.destroy());
                this._moveRangeGraphics = null;
            }
            if (this.state === UnitState.ACTIVATED) {
                this.state = UnitState.IDLE
            }
            if (this._specialAction) {
                this._specialAction.destroy();
            }
        }

        activate() {
            // Check if the city belongs to the player
            if (!this._tribe.isPlayer) {
                return;
            }

            if (this.state === UnitState.WAITING_NEXT_TURN) {
                // Only display something like stat, but can't move
            } else if (this.canMove) {
                this.state = UnitState.ACTIVATED;

                // Display move range
                this._moveRange = this.map.getMoveRange({
                    from: this.currentTile,
                    range: this.infos.range
                });
                this._moveRangeGraphics = [];

                for (let obj of this._moveRange) {
                    let h = obj.getHexPrint(0x00ffaa);
                    h.scale *= 0.75;
                    this._moveRangeGraphics.push(h);
                    h.alpha = 0.5
                    this.add(h);
                    // Game.INSTANCE.add.existing(h);
                    h.on('pointerup', this.move.bind(this, obj));
                }

                if (this.infos.name === Constants.SETTLER_NAME) {
                    console.log("name settler!")
                    if (City.canCreateHere(this.currentTile, this._tribe)) {

                        let img = this.scene.add.image(this.currentTile.worldPosition.x, this.currentTile.worldPosition.y, 'settler_create');
                        this.add(img);
                        img.depth = 100;
                        img.setOrigin(0.5, 1.5);
                        img.setInteractive();
                        img.on('pointerdown', () => {
                            // TODO if a city can be created here
                            this.destroy();
                            this._tribe.setCityOn(this.currentTile);
                        })
                        this._specialAction = img;
                    }
                }
            }
        }

        /**
         * Move this unit to the given tile. IF this unit cannot move, return.
         */
        move(tile: Tile) {
            this.state = UnitState.MOVING;

            Game.INSTANCE.add.tween({
                targets: this._image,
                x: tile.worldPosition.x,
                y: tile.worldPosition.y,
                duration: 50,
                onComplete: () => {
                    this.state = UnitState.WAITING_NEXT_TURN;
                }

            })

            // Deactivate this unit
            this.deactivate();
            // Remove this unit from the current tile
            this.currentTile.removeClickable(this);
            // Add this unit to the given tile
            this.currentTile = tile;
            this.currentTile.addClickable(this);

            // Update fog of war
            let vision = this.getVision();
            this._tribe.removeFogOfWar(vision);

        }

        /**
         * Returns the list of tiles this unit can see, starting from the given tile.
         * If no tile is given, the vision is from the unit currentile
         */
        getVision(tile?: Tile): Array<Tile> {
            // Increase if the unit is on a mountainlet currentRange = this.infos.range;
            let vision = this.infos.vision;

            if (this.currentTile.type === TileType.Mountain) {
                vision++;
            }

            if (!tile) {
                tile = this.currentTile;
            }

            let res = [];

            for (let i = vision; i >= 1; i--) {
                res.push(...this.map.getRing(tile, i))
            }
            return res;
        }

        destroy() {
            for (let g of this._moveRangeGraphics) {
                g.destroy();
            }
            super.destroy();
        }
    }
}
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

        /** The number of tile this unit can go through inone turn */
        range: number = 1;
        /** The number of tile this unit can see */
        vision: number = 1;
        /** The set of tile this unit can mvoe to */
        private _moveRange: Array<Tile>;
        private _moveRangeGraphics: Array<Phaser.GameObjects.Graphics>;
        public currentTile: Tile;
        public map: WorldMap;
        private _image: Phaser.GameObjects.Image;
        /** The tribe this unit belong to */
        private _tribe: Tribe;

        state: UnitState = UnitState.IDLE;

        constructor(config: {
            scene: Phaser.Scene,
            x: number,
            y: number,
            key: string,
            map: WorldMap,
            tile: Tile,
            tribe: Tribe
        }) {
            super(config.scene);

            this.currentTile = config.tile;
            this.map = config.map;
            this._tribe = config.tribe;

            let image = Game.INSTANCE.make.image({ x: config.x, y: config.y, key: config.key, add: false });
            image.setTint(this._tribe.color);
            this.add(image);
            this._image = image;

            image.scale = ratio;
            this.currentTile.addClickable(this);
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
        }

        activate() {
            if (this.state === UnitState.WAITING_NEXT_TURN) {
                // Only display something like stat, but can't move
            } else if (this.state === UnitState.IDLE) {
                this.state = UnitState.ACTIVATED;

                // Display move range
                this._moveRange = this.map.getMoveRange({
                    from: this.currentTile,
                    range: this.range
                });
                this._moveRangeGraphics = [];

                for (let obj of this._moveRange) {
                    let h = obj.getHexPrint(0x00ffaa);
                    h.scale *= 0.75;
                    this._moveRangeGraphics.push(h);
                    h.alpha = 0.5
                    this.add(h);
                    // Game.INSTANCE.add.existing(h);
                    h.on('pointerdown', this.move.bind(this, obj));
                }
            }
        }

        /**
         * Move this unit to the given tile.
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
            if (!tile) {
                tile = this.currentTile;
            }

            let res = [];

            for (let i = this.vision; i >= 1; i--) {
                res.push(...this.map.getTilesByAxialCoords(this.map.grid.ring(tile.rq.q, tile.rq.r, i)))
            }
            return res;
        }
    }
}
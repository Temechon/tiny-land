module CIV {

    enum UnitState {
        IDLE,
        /** This unit has been selected */
        ACTIVATED,
        /** This unit is moving */
        MOVING,
        /** This unit has already moved */
        MOVED
    }

    export class Unit extends Phaser.GameObjects.Image implements IClickable {

        /** The number of tile this unit can go through inone turn */
        public range: number = 5;
        /** The sprite displayed on each tile this unit can move to */
        private _moveRange: Array<{ tile: Tile, graphic: Phaser.GameObjects.Graphics }>;
        public currentTile: Tile;
        public worldmap: WorldMap;

        public state: UnitState = UnitState.IDLE;

        constructor(config: {
            scene: Phaser.Scene,
            x: number,
            y: number,
            key: string,
            map: WorldMap
            tile: Tile;
        }) {
            super(config.scene, config.x, config.y, config.key);

            this.scale = ratio;
            this.currentTile = config.tile;
            this.worldmap = config.map;
            this.currentTile.addClickable(this);
        }

        deactivate() {
            if (this._moveRange) {
                this._moveRange.forEach(i => i.graphic.destroy());
                this._moveRange = null;
            }
            if (this.state === UnitState.ACTIVATED) {
                this.state = UnitState.IDLE
            }
        }

        activate() {
            if (this.state === UnitState.IDLE) {
                this.state = UnitState.ACTIVATED;

                // Display move range
                this._moveRange = this.worldmap.getMoveRange({
                    from: this.currentTile,
                    range: this.range
                });

                for (let obj of this._moveRange) {
                    let h = obj.graphic;
                    h.alpha = 0.5
                    Game.INSTANCE.add.existing(h);
                    h.on('pointerdown', this.moveTo.bind(this, obj.tile));
                }
            }
        }

        /**
         * Move this unit to the given tile.
         */
        moveTo(tile: Tile) {
            this.state = UnitState.MOVING;

            Game.INSTANCE.add.tween({
                targets: this,
                x: tile.position.x,
                y: tile.position.y,
                duration: 150,
                onComplete: () => {
                    this.state = UnitState.IDLE;
                }

            })

            // Deactivate this unit
            this.deactivate();

            // Remove this unit from the current tile
            this.currentTile.removeClickable(this);
            // Add this unit to the given tile
            this.currentTile = tile;
            this.currentTile.addClickable(this);

        }
    }
}
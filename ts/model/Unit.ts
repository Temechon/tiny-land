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
        public range: number = 1;
        /** The sprite displayed on each tile this unit can move to */
        private _moveRange: Array<Phaser.GameObjects.Image>;
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
            this._moveRange.forEach(i => i.destroy());
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
                for (let h of this._moveRange) {
                    h.scale *= 0.5
                    Game.INSTANCE.add.existing(h);
                }
            }
        }
    }
}
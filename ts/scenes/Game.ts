module CIV {

    interface Hashmap<T> {
        [key: string]: T;
    }

    export class Game extends Phaser.Scene {

        public player: Tribe;
        map: WorldMap;
        /** All tribes playing on this map */
        tribes: Array<Tribe> = [];

        /** All units available in the game */
        allUnits: Hashmap<UnitInfo> = {};

        public static INSTANCE: Game;

        constructor() {
            super('game');
            Game.INSTANCE = this;
        }


        create() {

            // Load Units in memory
            let units = this.cache.json.get('units');
            for (let unit of units) {
                this.allUnits[unit.key] = unit as UnitInfo;
            }

            // Display UI
            this.scene.run('gameui');

            // let graphics = this.add.graphics();
            // graphics.fillStyle(0xffff00, 0.25);
            // graphics.fillRectShape(bounds);
            // graphics.setScrollFactor(0, 0)

            let ch = new CameraHelper(this);

            this.map = new WorldMap(this);

            // TRIBES
            this.player = new Player(chance.name());
            this.tribes.push(this.player);

            this.input.keyboard.on('keydown-' + 'W', () => {
                this.cameras.main.zoom += 0.25
            });
            this.input.keyboard.on('keydown-' + 'X', () => {
                this.cameras.main.zoom -= 0.25
            });

            // AI
            let nbPlayer = 3;
            let tiles = this.map.getEvenlyLocatedTiles(nbPlayer, Constants.MAP.SIZE * 2, this.map.isStartingLocationCorrect.bind(this.map));
            this.player.setCityOn(tiles[0]);
            for (let i = 1; i < nbPlayer; i++) {
                let ai = new AI(chance.name());
                this.tribes.push(ai);
                ai.setCityOn(tiles[i]);
            }

            this.map.drawResourceLayer();
        }

        /**
         * For all tribes: 
         * - reset their unit state.
         * - Increase the production of all cities 
         */
        nextTurn() {
            // Deactivate all tiles
            this.map.doForAllTiles(t => t.deactivate());

            for (let tribe of this.tribes) {
                tribe.resetAllUnits();

                // Add ressources
                tribe.productionManager.collect();

                if (tribe instanceof AI) {
                    let ai = tribe as AI;
                    ai.play();
                }
                // TODO Finish here
            }

            this.events.emit("updateui")
        }
    }
}

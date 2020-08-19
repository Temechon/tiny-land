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

            // let graphics = this.add.graphics();
            // graphics.fillStyle(0xffff00, 0.25);
            // graphics.fillRectShape(bounds);
            // graphics.setScrollFactor(0, 0)

            let ch = new CameraHelper(this);

            this.map = new WorldMap(this);

            this.map.create();

            // Display UI
            this.scene.run('loading');
            this.scene.run('gameui');

            // TRIBES
            this.player = new Player(chance.name());
            this.tribes.push(this.player);

            this.input.keyboard.on('keydown-' + 'W', () => {
                this.cameras.main.zoom += 0.25
            });
            this.input.keyboard.on('keydown-' + 'X', () => {
                this.cameras.main.zoom -= 0.25
            });
            this.input.keyboard.on('keyup-' + 'C', () => {
                this.resetMap();
            });

            // AI
            let nbPlayer = 2;
            let tiles = this.map.getEvenlyLocatedTiles(nbPlayer, Constants.MAP.SIZE * 2, this.map.isStartingLocationCorrect.bind(this.map));
            this.player.setCityOn(tiles[0]);
            for (let i = 1; i < nbPlayer; i++) {
                let ai = new AI(chance.name());
                this.tribes.push(ai);
                ai.setCityOn(tiles[i]);
            }

            setTimeout(() => {
                // this.map.drawResourceLayer();

                let loadingScene = this.scene.get('loading') as Loading;

                loadingScene.add.tween({
                    targets: loadingScene.container,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => { this.scene.stop('loading') }
                })
            }, 0)


            this.cameras.main.centerOn(tiles[0].worldPosition.x, tiles[0].worldPosition.y)




        }

        resetMap() {
            for (let t of this.tribes) {
                t.destroy();
            }
            this.tribes = [];
            this.map.destroy();
            this.map = new WorldMap(this);
            this.map.create();
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

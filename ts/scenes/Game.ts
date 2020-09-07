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

        turn: number = 0;

        public static INSTANCE: Game;

        ch: CameraHelper;

        /** All AI events to play (mostly unit movements) before the player can play */
        aiEvents: Array<() => Promise<any>> = [];

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

            this.ch = new CameraHelper(this);

            this.map = new WorldMap(this, Constants.MAP.SIZE);
            this.map.create();

            // Display UI
            this.scene.run('loading');

            this.input.keyboard.on('keyup-' + 'W', () => {
                console.log("CAMERA - Zoom:", this.cameras.main.zoom);
                this.cameras.main.zoom += 0.15
            });
            this.input.keyboard.on('keyup-' + 'X', () => {
                console.log("CAMERA - Zoom:", this.cameras.main.zoom);

                this.cameras.main.zoom -= 0.15
            });
            this.input.keyboard.on('keyup-' + 'C', () => {
                // this.resetMap();
                for (let c of this.player.cities) {
                    c.influenceRadius++;
                }
                this.player.updateFrontiers();
                this.events.emit(Constants.EVENTS.UI_UPDATE)
            });
            this.input.keyboard.on('keyup-' + 'SPACE', () => {
                this.nextTurn()
            })
            this.tweens.add({
                targets: this.cameras.main,
                zoom: 0.5,
                duration: 1500,
                ease: Phaser.Math.Easing.Expo.Out
            })


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


            this.scene.run('gameui');
            // TRIBES
            this.player = new Player(chance.name());
            this.tribes.push(this.player);

            // AI
            let nbPlayer = 2;
            let tiles = this.map.getEvenlyLocatedTiles(nbPlayer, Constants.MAP.SIZE * 2, this.map.isStartingLocationCorrect.bind(this.map));
            this.player.setCityOn(tiles[0]);
            for (let i = 1; i < nbPlayer; i++) {
                let ai = new AI(chance.name());
                this.tribes.push(ai);
                ai.setCityOn(tiles[i]);
            }

            // Set the camera to an apropriate zoom
            let x = tiles[0].worldPosition.x;
            let scrollX = x - this.cameras.main.width * 0.5;
            let y = tiles[0].worldPosition.y;
            let scrollY = y - this.cameras.main.height * 0.5;

            setTimeout(() => {
                this.tweens.add({
                    targets: this.cameras.main,
                    zoom: { from: 0, to: 1 },
                    scrollX: scrollX,
                    scrollY: scrollY,
                    duration: 2000,
                    ease: Phaser.Math.Easing.Circular.Out
                })
            }, 150)


            // let p = () => {
            //     return new Promise(resolve => {
            //         console.log('coucou');
            //         resolve();
            //     });
            // };
            // let p2 = () => {
            //     return new Promise(resolve => {
            //         setTimeout(() => {
            //             console.log('coucou2');
            //             resolve();
            //         }, 2000)
            //     });
            // };
            // let p3 = () => {
            //     return new Promise(resolve => {
            //         setTimeout(() => {
            //             console.log('coucou3');
            //             resolve();
            //         }, 1000)
            //     });
            // }

            // Helpers.pseries([p, p2, p3]).then(() => {
            //     console.log('coucou4');

            // })
            // p2().then(() => p())

            // this.cameras.main.centerOn(tiles[0].worldPosition.x, tiles[0].worldPosition.y)

        }

        resetMap() {
            for (let t of this.tribes) {
                t.destroy();
            }
            this.tribes = [];
            this.map.destroy();
            Constants.MAP.SIZE = 8//chance.integer({ min: 5, max: 20 });
            this.map = new WorldMap(this, Constants.MAP.SIZE);
            this.map.create();

            // Set the camera to an apropriate zoom
            setTimeout(() => {
                let zoom = 0.5
                this.tweens.add({
                    targets: this.cameras.main,
                    zoom: zoom,
                    duration: 1500,
                    ease: Phaser.Math.Easing.Expo.Out
                })
            }, 150)
        }

        /**
         * For all tribes: 
         * - reset their unit state.
         * - Increase the production of all cities 
         */
        nextTurn() {
            this.turn++;
            // Deactivate all tiles
            this.map.doForAllTiles(t => t.deactivate());


            for (let tribe of this.tribes) {

                // Capture all cities that were being captured
                for (let city of tribe.cities) {
                    if (city.isBeingCaptured) {
                        city.isBeingCaptured = false;
                        // Pass this city to the tribe that is being capturing this city
                        let newOwner = city.tile.unit.tribe;
                        city.updateOwner(newOwner);
                    }
                }

                if (tribe.cities.length === 0) {
                    new Toast({
                        scene: this.scene.get("gameui"),
                        message: "Tribe " + tribe.name + " has been exterminated!",
                        style: Toast.STYLE.WARNING
                    });
                    // Set this tribe has "exterminated"
                    tribe.exterminated = true;
                    continue;
                }

                tribe.resetAllUnits();

                // Add ressources
                tribe.productionManager.collect();

                if (tribe instanceof AI) {
                    let ai = tribe as AI;
                    ai.play();
                }
                // Move units one by one
                Helpers.pseries(this.aiEvents).then(() => {
                    this.aiEvents = [];
                })
                // TODO Finish here
            }

            this.events.emit(Constants.EVENTS.UI_UPDATE)
        }
    }
}

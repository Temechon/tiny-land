module CIV {


    export class Game extends Phaser.Scene {

        public player: Tribe;
        map: WorldMap;
        /** All tribes playing on this map */
        tribes: Array<Tribe> = [];

        public static INSTANCE: Game;

        constructor() {
            super('game');
            Game.INSTANCE = this;
        }


        create() {

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

            // AI
            let ai = new AI(chance.name());
            this.tribes.push(ai);

            this.input.keyboard.on('keydown-' + 'W', () => {
                this.cameras.main.zoom += 0.25
            });
            this.input.keyboard.on('keydown-' + 'X', () => {
                this.cameras.main.zoom -= 0.25
            });

            let tiles = this.map.getEvenlyLocatedTiles(2, Constants.MAP.SIZE);
            this.player.setCityOn(tiles[0]);
            ai.setCityOn(tiles[1]);

            // let tile = this.map.getSartingTile();
            // let city = this.player.setCityOn(tile);
            this.map.drawResourceLayer();

            // this.input.keyboard.on('keyup-' + 'C', () => {
            //     // this.player.visible = !this.player.visible;
            //     // console.log(this.player.getProduccontionOf(ResourceType.Gold));  
            //     // this.player.fogOfWar.visible = !this.player.fogOfWar.visible
            //     city.influenceRadius++;
            //     city.updateInfluenceRadius();
            //     this.events.emit('uiupdate');
            // });
            // // this.cameras.main.zoom = 0.25;
            // this.cameras.main.centerOn(city.worldposition.x, city.worldposition.y);
        }

        /**
         * For all tribes: 
         * - reset their unit state.
         * - Increase the production of all cities 
         */
        nextTurn() {
            for (let tribe of this.tribes) {
                tribe.resetAllUnits();
                // TODO Finish here
            }
        }
    }
}

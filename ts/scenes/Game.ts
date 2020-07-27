module CIV {


    export class Game extends Phaser.Scene {

        public player: Tribe;

        public static INSTANCE: Game;

        constructor() {
            super('game');
            Game.INSTANCE = this;
        }


        create() {

            // let graphics = this.add.graphics();
            // graphics.fillStyle(0xffff00, 0.25);
            // graphics.fillRectShape(bounds);
            // graphics.setScrollFactor(0, 0)

            let ch = new CameraHelper(this);

            this.player = new Tribe(chance.name());

            let map = new WorldMap(this);


            this.player.cities.push(map.setStartingCity(this.player));

            //this.cameras.main.zoom = 0.8; 
            let startingCity = this.player.cities[0];
            this.cameras.main.centerOn(startingCity.position.x, startingCity.position.y);

            startingCity.produceUnit();
        }
    }
}

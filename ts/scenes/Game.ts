module CIV {


    export class Game extends Phaser.Scene {

        public player: Tribe;
        map: WorldMap;

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

            this.player = new Tribe(chance.name());

            // this.cameras.main.zoom = 0.25

            this.input.keyboard.on('keydown-' + 'W', () => {
                this.cameras.main.zoom += 0.25
            });
            this.input.keyboard.on('keydown-' + 'X', () => {
                this.cameras.main.zoom -= 0.25
            });
            this.input.keyboard.on('keyup-' + 'C', () => {
                // this.player.visible = !this.player.visible;
                // console.log(this.player.getProductionOf(ResourceType.Gold));  
                this.player.fogOfWar.visible = !this.player.fogOfWar.visible
            });

            let tile = this.map.getSartingTile();
            let city = this.player.setCityOn(tile);
            this.map.drawResourceLayer();

            city.produceUnit();
            console.log();

            this.cameras.main.centerOn(city.worldposition.x, city.worldposition.y);
        }
    }
}

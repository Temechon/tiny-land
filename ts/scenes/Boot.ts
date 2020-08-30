module CIV {

    export var ratio: number;
    // export var bounds: Phaser.Geom.Rectangle;

    export var chance: Chance.Chance;
    declare var Chance: any;

    export class Boot extends Phaser.Scene {

        constructor() {
            super('boot');
            chance = new Chance(123456789);
        }

        preload() {
            this.load.image('toundra', 'assets/hex_toundra.png');
            this.load.image('land', 'assets/hex_land.png');
            this.load.image('land2', 'assets/hex_land2.png');
            this.load.image('land3', 'assets/hex_land3.png');
            this.load.image('land4', 'assets/hex_land4.png');
            this.load.image('water', 'assets/hex_water.png');
            this.load.image('beach', 'assets/hex_beach.png');
            this.load.image('deepwater', 'assets/hex_deepwater.png');

            this.load.image('tree', 'assets/tree.png');
            this.load.image('tree2', 'assets/tree2.png');
            this.load.image('mountain', 'assets/mountain.png');
            this.load.image('mountain2', 'assets/mountain2.png');
            this.load.image('coast', 'assets/coast.png');

            this.load.image('selector', 'assets/selector.png');

            this.load.image('city', 'assets/city.png');

            // Units
            this.load.image('warrior', 'assets/units/warrior.png');
            this.load.image('settler', 'assets/units/settler.png');
            this.load.image('settler_create', 'assets/units/settler_create.png');

            // UI
            this.load.image('foodIcon', 'assets/hud/food.png');
            this.load.image('goldIcon', 'assets/hud/gold.png');
            this.load.image('scienceIcon', 'assets/hud/research.png');

            // Special resources
            this.load.image('wheat', 'assets/resources/wheat.png');
            this.load.image('iron', 'assets/resources/iron.png');
            this.load.image('gold', 'assets/resources/gold.png');

            // Units
            this.load.json("units", "assets/jsons/units.json");
            this.load.json("resources", "assets/jsons/resources.json");
            this.load.json("tiles", "assets/jsons/tiles.json");

            this.load.bitmapFont('font_normal', 'assets/fonts/font_normal.png', 'assets/fonts/font_normal.xml');
            // this.load.bitmapFont('font_small', 'assets/fonts/font_small.png', 'assets/fonts/font_small.xml');

        }

        create() {

            let w = this.game.config.width as number;
            let h = this.game.config.height as number;

            let baseW = 360 * 2;
            let baseH = 740 * 2;

            let ratioW = w / baseW;
            let ratioH = h / baseH;

            if (ratioW > ratioH) {
                ratio = ratioH;
            } else {
                ratio = ratioW;
            }

            let bounds = new Phaser.Geom.Rectangle(
                w / 2 - baseW / 2 * ratio,
                h / 2 - baseH / 2 * ratio,
                baseW * ratio,
                baseH * ratio);

            console.log('Bounds - ', bounds);
            console.log('Game width - ', w);
            console.log('Game height - ', h);
            console.log('Window - ', window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
            console.log('ratio - ', ratio);


            // this.scene.start('gameui');
            this.scene.start('game');
        }

    }
}

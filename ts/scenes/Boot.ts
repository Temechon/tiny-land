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
            this.load.image('hex', 'assets/hex.png');
            this.load.image('city', 'assets/city.png');
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


            this.scene.start('game');

        }

    }
}

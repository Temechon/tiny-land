module CIV {

    export var ratio: number;

    export class Game extends Phaser.Scene {

        constructor() {
            super('demo');
        }

        preload() {
            this.load.image('hex', 'assets/hex.png');
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

            var bounds = new Phaser.Geom.Rectangle(
                w / 2 - baseW / 2 * ratio,
                h / 2 - baseH / 2 * ratio,
                baseW * ratio,
                baseH * ratio);

            console.log('Bounds - ', bounds);
            console.log('Game width - ', w);
            console.log('Game height - ', h);
            console.log('Window - ', window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
            console.log('ratio - ', ratio);

            let map = new WorldMap(this);


            // let graphics = this.add.graphics();
            // graphics.fillStyle(0xffff00, 0.25);
            // graphics.fillRectShape(bounds);
            // graphics.setScrollFactor(0, 0)

            let ch = new CameraHelper(this);
        }


        update(time, delta) {
        }
    }
}

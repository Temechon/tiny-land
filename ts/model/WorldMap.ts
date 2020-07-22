module CIV {
    export class WorldMap extends Phaser.GameObjects.Container {

        constructor(scene: Phaser.Scene) {
            super(scene);


            let grid = new HexGrid(99, true);


            let mapCoords = grid.hexagon(0, 0, 20, true);


            for (let c of mapCoords) {
                let center = grid.getCenterXY(c.q, c.r);
                // console.log(center);

                let sprite = this.scene.make.sprite({
                    x: center.x * ratio,
                    y: center.y * ratio,
                    key: 'hex'
                })
                this.add(sprite);
                sprite.scale = ratio;
                // sprite.anchor.set(0.5);
            }

            this.scene.add.existing(this);
            this.x = (this.scene.game.config.width as number) / 2;
            this.y = (this.scene.game.config.height as number) / 2;

            // this.setXY(, (this.scene.game.config.height as number) / 2);

        }
    }
}
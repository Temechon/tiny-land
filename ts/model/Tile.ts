module CIV {

    export class Tile extends Phaser.GameObjects.Image {

        public type: TileType = TileType.Land;

        /** Row number */
        public r: number;
        /** Column number */
        public q: number;
        public name: string;

        constructor(config: {
            scene: Phaser.Scene,
            x: number,
            y: number,
            r: number,
            q: number
            key: string
        }) {
            super(config.scene, config.x, config.y, config.key);

            this.scale = ratio;
            this.r = config.r;
            this.q = config.q;
            this.name = chance.guid();

            this.setInteractive();

            this.on('pointerdown', () => {
                console.log("q/r", this.q, this.r)
                console.log("x/y", this.getStorageXY().x, this.getStorageXY().y)
            });

        }

        public get position(): Phaser.Geom.Point {
            let x = this.parentContainer.x + this.x;
            let y = this.parentContainer.y + this.y;
            return new Phaser.Geom.Point(x, y);
        }

        public getStorageXY(): { x: number, y: number } {
            return {
                x: this.r + Constants.MAP.SIZE,
                y: this.q + Constants.MAP.SIZE
            }
        }

        public get isWater(): boolean {
            return this.type === TileType.Water || this.type === TileType.DeepWater;
        }

        public getHexPrint(color: number): Phaser.GameObjects.Graphics {

            let radius = Game.INSTANCE.make.graphics({ x: this.position.x, y: this.position.y });
            radius.fillStyle(color, 1.0);
            radius.beginPath();
            radius.scale = ratio;
            // radius.alpha = 0.5

            let points = HexGrid.getPoints({
                width: this.width,
                height: this.height,
                x: 0,
                y: 0
            })

            radius.moveTo(points[0].x, points[0].y);
            for (let p = 1; p < points.length; p++) {
                let pp = points[p];
                radius.lineTo(pp.x, pp.y);
            }
            radius.closePath();
            radius.fillPath();

            // let tex = radius.generateTexture(this.name, this.width, this.height);
            // radius.destroy();

            return radius;

            // let img = this.scene.make.image({
            //     scene: this.scene,
            //     x: this.position.x,
            //     y: this.position.y,
            //     key: 'hex'
            // });
            // img.scale = ratio;
            // return img;
        }
    }

}
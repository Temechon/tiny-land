module CIV {

    export class Home extends Phaser.Scene {

        container: Phaser.GameObjects.Container;

        constructor() {
            super({ key: 'home' });
        }


        create() {

            this.container = this.add.container();
            let graphics = this.make.graphics({ add: false });
            graphics.fillStyle(0xffffff, 0.4);
            graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
            graphics.setScrollFactor(0, 0)
            this.container.add(graphics);

            let map = new WorldMap(this, 20, false);
            map.create();

            this.add.tween({
                targets: [map, map.allAssets],
                duration: 10000,
                scale: {
                    from: 0.4,
                    to: 0.5
                },
                yoyo: true,
                repeat: -1,
                ease: Phaser.Math.Easing.Quadratic.InOut
            })

            map.scale = 0.5
            map.allAssets.scale = 0.5

            map.depth = 0;
            this.container.depth = 100;

            let titleStyle = {
                fontSize: Helpers.font(100),
                fill: "#fff",
                fontFamily: Constants.FONT.NUMBERS,
                align: 'center',
                stroke: "#5C69AD",
                strokeThickness: 20 * ratio
            };

            let textStyle = {
                fontSize: Helpers.font(30),
                fill: "#fff",
                fontFamily: Constants.FONT.TEXT,
                align: 'center'
            };

            let hw = this.cameras.main.width / 2;

            // * Game title
            let victory = this.add.text(hw, 250 * ratio, "TINY LAND", titleStyle)
            victory.setShadow(5 * ratio, 5 * ratio, "#333333", 2, true, false);

            victory.setOrigin(0.5)
            this.container.add(victory);


            let menuButton = new Button(this, {
                w: 350 * ratio,
                h: 100 * ratio,
                backgroundColor: 0x5C69AD,
                shadowColor: 0x07141c,
                label: "New game",
                fontSize: 40,
                fontFamily: Constants.FONT.TEXT,
                fontColor: 'white',
                x: this.cameras.main.width / 2,
                y: this.cameras.main.height / 2
            })
            menuButton.onInputDown = () => {

                this.add.tween({
                    targets: [map, map.allAssets],
                    scale: 0.5,
                    duration: 2000
                })

                this.add.tween({
                    targets: this.container,
                    alpha: 0,
                    ease: Phaser.Math.Easing.Back.In,
                    duration: 500,
                    onComplete: () => {
                        this.scene.start('game')

                    }
                })
            }
            this.container.add(menuButton);

        }
    }
}
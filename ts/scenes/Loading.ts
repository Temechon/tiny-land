module CIV {
    export class Loading extends Phaser.Scene {

        container: Phaser.GameObjects.Container;

        constructor() {
            super({ key: 'loading' });
        }

        create() {
            this.container = this.add.container();
            let graphics = this.make.graphics({ add: false });
            graphics.fillStyle(0x000000);
            graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
            graphics.setScrollFactor(0, 0)

            let hw = this.cameras.main.width / 2;
            let hh = this.cameras.main.height / 2

            let style = {
                fontSize: Helpers.font(80),
                fill: "#fff",
                fontFamily: Constants.FONT.TEXT,
                wordWrap: { width: this.cameras.main.width - 100 * ratio },
                align: 'center'
            }
            let text = this.add.text(hw, hh, "GENERATING WORLD...", style)
            text.setOrigin(0.5)
            this.container.add(graphics);
            this.container.add(text);

        }
    }
}
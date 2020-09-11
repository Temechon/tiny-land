module CIV {

    export class Popin extends Phaser.GameObjects.Container {

        message: string;

        static STYLE = {
            WARNING: {
                fontColor: "#ccc",
                backgroundColor: 0x212121
            }
        }

        constructor(config: {
            scene: Phaser.Scene,
            message: string
        }) {
            super(config.scene);
            this.message = config.message;

            this.x = this.scene.cameras.main.width / 2;
            this.y = this.scene.cameras.main.height / 2;

            let w = this.scene.cameras.main.width * 0.65;
            let h = 500 * ratio;

            let style = {
                fontSize: Helpers.font(30),
                fontColor: "#ffffff",
                fontFamily: Constants.FONT.NUMBERS,
                align: "center"
            }
            let text = this.scene.make.text({
                x: 0,
                y: 0,
                text: this.message,
                style: style
            });
            text.setOrigin(0.5, 0.5);
            text.setWordWrapWidth(w);

            let graphics = this.scene.make.graphics({ x: -w / 2, y: -h / 2, add: false });
            graphics.fillStyle(0x5C69AD);
            graphics.fillRoundedRect(0, 0, w, h, 10 * ratio);

            // Icon
            let icon = this.scene.make.image({
                x: 0,
                y: -h / 2 + 40 * ratio,
                key: 'skull',
                scale: ratio,
                add: false
            });
            icon.setOrigin(0.5, 0)

            this.add(graphics);
            this.add(text);
            this.add(icon);
            this.scene.add.existing(this);

        }
    }
}
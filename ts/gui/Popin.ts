module CIV {

    export class Popin extends Phaser.GameObjects.Container {

        message: string;

        constructor(config: {
            scene: Phaser.Scene,
            message: string
        }) {
            super(config.scene);
            this.message = config.message;

            this.x = this.scene.cameras.main.width / 2;
            this.y = 500 * ratio;

            let w = Math.min(this.scene.cameras.main.width * 0.85, 600 * ratio);
            let h = 400 * ratio;

            let style = {
                fontSize: Helpers.font(30),
                fill: "#ffffff",
                fontFamily: Constants.FONT.NUMBERS,
                align: "center"
            }
            let text = this.scene.make.text({
                x: 0,
                y: 50 * ratio,
                text: this.message,
                style: style
            });
            text.setOrigin(0.5, 0.5);
            text.setWordWrapWidth(w - 50 * ratio);

            let background = this.scene.make.graphics({ x: -w / 2, y: -h / 2, add: false });
            background.fillStyle(0x5C69AD);
            background.fillRoundedRect(0, 0, w, h, 10 * ratio);

            // Stop event propagation behing the popin
            background.setInteractive(
                new Phaser.Geom.Rectangle(0, 0, w, h),
                Phaser.Geom.Rectangle.Contains
            );
            background.on('pointerdown', (pointer, localx, locay, event) => {
                event.stopPropagation();
            });

            // Icon
            let icon = this.scene.make.image({
                x: 0,
                y: -h / 2 + 40 * ratio,
                key: 'skull',
                scale: ratio,
                add: false
            });
            icon.setOrigin(0.5, 0)

            // Ok button
            let buttonw = 120 * ratio;
            let buttonh = 60 * ratio;


            let button = new Button(this.scene, {
                w: buttonw,
                h: buttonh,
                backgroundColor: Helpers.shadeBlendConvert(0x5C69AD, -0.4) as number,
                activeBackgroundColor: Helpers.shadeBlendConvert(0x5C69AD, -0.8) as number,
                label: "OK",
                fontSize: 20,
                fontFamily: Constants.FONT.NUMBERS,
                fontColor: "#ffffff",
                x: 0,
                y: h / 2 - buttonh,
                border: { width: 3 * ratio, color: 0xffffff },
                roundness: 10 * ratio
            })
            button.onInputDown = () => {
                this.destroy();
            }

            this.add(background);
            this.add(text);
            this.add(icon);
            this.add(button);
            this.scene.add.existing(this);

        }
    }
}
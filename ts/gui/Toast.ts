module CIV {
    export class Toast extends Phaser.GameObjects.Container {

        message: string;
        static STYLE = {
            WARNING: {
                fontColor: "#ccc",
                backgroundColor: 0x212121
            }
        }

        constructor(config: {
            scene: Phaser.Scene,
            message: string,
            style: { fontColor: string, backgroundColor: number }
        }) {
            super(config.scene);
            this.message = config.message;

            this.x = this.scene.cameras.main.width / 2;
            this.y = this.scene.cameras.main.height + 300 * ratio;

            let style = {
                fontSize: Helpers.font(30),
                fontColor: config.style.fontColor,
                fontFamily: 'OpenSans'
            }
            let text = this.scene.make.text({
                x: 0,
                y: 0,
                text: this.message,
                style: style
            });
            text.setOrigin(0.5, 0.5);

            let paddingH = 35 * ratio;
            let paddingV = 15 * ratio;

            let graphics = this.scene.make.graphics({ x: -text.width / 2 - paddingH, y: -text.height / 2 - paddingV, add: false });
            graphics.fillStyle(config.style.backgroundColor);

            graphics.fillRoundedRect(0, 0, text.width + 2 * paddingH, text.height + 2 * paddingV, 10 * ratio);

            this.add(graphics);
            this.add(text);
            this.scene.add.existing(this);

            // Animations
            this.scene.tweens.add({
                targets: this,
                y: {
                    from: this.scene.cameras.main.height + 300 * ratio,
                    to: this.scene.cameras.main.height - 100 * ratio
                },
                ease: 'Back.easeOut',
                duration: 200
            })
            this.scene.tweens.add({
                targets: this,
                y: {
                    to: this.scene.cameras.main.height - 250 * ratio,
                    from: this.scene.cameras.main.height - 100 * ratio
                },
                alpha: 0,
                ease: 'Back.easeIn',
                duration: 500,
                delay: 2000,
                onComplete: () => {
                    this.destroy();
                }
            })

        }
    }
}
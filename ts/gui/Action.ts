module CIV {
    export class Action extends Phaser.GameObjects.Container {

        _icon: Phaser.GameObjects.Image;
        _action: () => void;

        constructor(config: {
            scene: Phaser.Scene,
            key: string,
            name: string,
            action: () => void
        }) {
            super(config.scene, 0, 0);
            this._action = config.action;

            this._icon = this.scene.make.image({ x: 0, y: 0, key: config.key, add: false });
            this.add(this._icon);

            let style = {
                fontSize: Helpers.font(20),
                fill: "#fff",
                fontFamily: 'KeepCalm'
            };

            let name = this.scene.make.text({ x: 0, y: this._icon.height / 0.95, add: false, text: config.name, style: style });
            name.setOrigin(0.5, 0.5);

            // Background
            let width = name.width * 1.5;
            let height = name.height * 1.5;
            let rect = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
            let graphics = this.scene.make.graphics({ x: 0, y: this._icon.height / 0.95, add: false });
            graphics.fillStyle(0x000000);
            graphics.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 10 * ratio);
            this.add(graphics);
            this.add(name);

            // EVENTS
            this._icon.setInteractive();
            graphics.setInteractive(rect, Phaser.Geom.Rectangle.Contains)

            this._icon.on('pointerdown', this._action.bind(this));
            graphics.on('pointerdown', this._action.bind(this));
        }


    }
}
module CIV {
    /**
     * (0,0) of this container is the center of the circular menu 
     */
    export class CircularMenu extends Phaser.GameObjects.Container {

        /** The graphics used to create the mask inside the circular menu. Animte this to animate the mask */
        private _inside: Phaser.GameObjects.Graphics;
        size: number;

        /** The list of actions displayed on the circular menu */
        actions: Array<Action> = [];

        constructor(config: {
            scene: Phaser.Scene,
            x: number,
            y: number,
            actions: Array<Action>
        }) {
            super(config.scene, config.x, config.y);
            this.actions = config.actions;

            this.size = 250 * ratio;
            let graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0x000000, 0.25);
            graphics.fillCircle(0, 0, this.size)
            graphics.lineStyle(10 * ratio, 0x000, 0.5)
            graphics.strokeCircle(0, 0, this.size);
            this.add(graphics);

            // Mask
            let inside = this.scene.make.graphics({ x: config.x, y: config.y });
            inside.fillStyle(0xffffff);
            inside.beginPath();
            inside.fillCircle(0, 0, this.size / 2)
            this._inside = inside;
            let mask = inside.createGeometryMask();
            // mask.invertAlpha = true;
            graphics.setMask(mask);
            // graphics.mask = new Phaser.Display.Masks.GeometryMask(Game.INSTANCE, inside);
            graphics.mask.invertAlpha = true;
            // this.add(inside);

            this.scene.add.existing(this);
            this._displayActions();

            this.scene.tweens.add({
                targets: [this._inside, this],
                scaleX: {
                    from: 0,
                    to: 1
                },
                scaleY: {
                    from: 0,
                    to: 1
                },
                ease: 'Back.easeOut',
                duration: 200
            })

        }

        /**
         * Animate the menu back to scale 0 and destroy it
         */
        destroy() {
            this.scene.tweens.add({
                targets: [this._inside, this],
                scaleX: {
                    from: 1,
                    to: 0
                },
                scaleY: {
                    from: 1,
                    to: 0
                },
                ease: 'Back.easeIn',
                duration: 200,
                onComplete: super.destroy.bind(this)
            })
        }

        _displayActions() {
            let step = Phaser.Math.PI2 / this.actions.length;
            let r = this.size - this.size / 4;

            this.actions.forEach((act: Action, i: number) => {

                let x = Math.cos(step * i) * r
                let y = Math.sin(step * i) * r;

                act.x = x;
                act.y = y;
                this.add(act);

                // name.setPadding(15 * ratio, 15 * ratio, 15 * ratio, 15 * ratio);
                // name.x -= name.width / 2;
                // this.add(name);
            })

        }

    }
}
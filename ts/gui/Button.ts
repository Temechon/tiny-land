module CIV {
    export class Button extends Phaser.GameObjects.Container {

        private _text: Phaser.GameObjects.Text;
        private _icon: Phaser.GameObjects.Sprite;

        private _top: Phaser.GameObjects.Graphics;
        private _background: Phaser.GameObjects.Graphics;

        isFlat: boolean = false;

        private _offset: number;

        private _isCliked = false;

        /** Function called when the selected animation is finished */
        public onInputDown: () => void;

        constructor(scene: Phaser.Scene,
            public options: {
                w: number,
                h: number,
                backgroundColor: number,
                activeBackgroundColor: number, // Background color when the button is clicked
                label: string,
                fontFamily: string,
                fontColor: string,
                x: number,
                y: number,
                fontSize?: number, // If not specified, the font size will be set according to the button height
                shadowColor?: number, // If not set, the button will be flat
                iconKey?: string // If not set, no icon will be present in the button
                border?: { width: number, color: number }, // If not set, the button won't have any border
                roundness?: number // The roundness of the button
            }
        ) {

            super(scene);

            this.isFlat = !!!options.shadowColor;

            this._offset = 10 * ratio;
            if (!this.options.fontSize) {
                this.options.fontSize = this.options.h / 1.5;
            }
            if (!this.options.roundness) {
                this.options.roundness = 20 * ratio;
            }

            this._background = this.scene.make.graphics({ x: 0, y: 0 });
            this.add(this._background);

            this._top = this.scene.make.graphics({ x: 0, y: 0 });
            this._top.depth = 2;
            this.add(this._top);

            this.build();
            this.scene.add.existing(this);

            this.setInteractive(
                new Phaser.Geom.Rectangle(
                    -this.options.w / 2,
                    -this.options.h / 2,
                    this.options.w,
                    this.options.h
                ),
                Phaser.Geom.Rectangle.Contains
            );

            this.on("pointerdown", () => {

                this._updateColor(this._top, this.options.activeBackgroundColor)
                if (this.isFlat) {
                    // Do something if button is flat

                } else {
                    this._top.y += this._offset;
                    this._text.y += this._offset;
                    if (this._icon) {
                        this._icon.y += this._offset;
                    }
                }
                this._isCliked = true;
            });

            this.on('pointerout', () => {

                if (this._isCliked) {

                    this._updateColor(this._top, this.options.backgroundColor)
                    if (this.isFlat) {
                        // Do something if button is flat

                    } else {
                        this._top.y -= this._offset;
                        this._text.y -= this._offset;
                        if (this._icon) {
                            this._icon.y -= this._offset;
                        }
                    }
                    this._isCliked = false;
                }
            })

            this.on("pointerup", () => {
                if (this._isCliked) {

                    this._updateColor(this._top, this.options.backgroundColor)
                    if (this.isFlat) {
                        // Do something if button is flat

                    } else {
                        this._top.y -= this._offset;
                        this._text.y -= this._offset;
                        if (this._icon) {
                            this._icon.y -= this._offset;
                        }
                    }
                    this._isCliked = false;

                    this.scene.time.delayedCall(100, () => {
                        if (this.onInputDown) {
                            this.onInputDown();
                        }
                    });
                }
            });

            this.x = this.options.x || 0;
            this.y = this.options.y || 0;
        }

        get label(): string {
            return this._text.text;
        }
        set label(label: string) {
            this._text.text = label;
        }

        private _updateColor(g: Phaser.GameObjects.Graphics, color: number, drawBorder = true) {
            g.clear();
            g.fillStyle(color);
            g.fillRoundedRect(-this.options.w / 2, -this.options.h / 2, this.options.w, this.options.h, this.options.roundness);

            if (this.options.border && drawBorder) {
                this._top.lineStyle(this.options.border.width, this.options.border.color);
                this._top.strokeRoundedRect(-this.options.w / 2, -this.options.h / 2, this.options.w, this.options.h, this.options.roundness);
            }
        }

        public build() {

            // * Background
            this._updateColor(this._top, this.options.backgroundColor)

            // let lighter = Helpers.shadeBlendConvert(this.options.backgroundColor, 0.2);

            if (!this.isFlat) {
                this._background.clear();

                // * Shadow 
                let darker = Helpers.shadeBlendConvert(this.options.backgroundColor, -0.4) as number;
                if (this.options.shadowColor) {
                    darker = this.options.shadowColor;
                }
                this._background.fillStyle(darker, 1);
                this._background.fillRoundedRect(-this.options.w / 2, -this.options.h / 2 + this._offset, this.options.w, this.options.h, this.options.roundness);

                // Special case for the thin 0xd2ebff line under button
                // this._background.fillStyle(0xd2ebff, 1);
                // this._background.fillRoundedRect(-this.options.w / 2, -this.options.h / 2 + this._offset * 1.5, this.options.w, this.options.h - this._offset, this.options.roundness);

            }
            //* Text
            let fontColor = "#fff";
            if (this.options.fontColor) {
                fontColor = this.options.fontColor;
            }
            let style = {
                fontSize: Helpers.font(this.options.fontSize),
                fill: fontColor,
                fontFamily: this.options.fontFamily
            };
            let labelText = this.scene.make.text({
                x: 0,
                y: 0,
                text: this.options.label,
                style: style
            });
            labelText.setOrigin(0.5, 0.5);

            this._text = labelText;
            this.add(labelText);

            // * Icon
            if (this.options.iconKey) {
                let icon = this.scene.make.sprite({
                    x: 0,
                    y: 0,
                    key: this.options.iconKey
                });
                icon.displayWidth = icon.displayHeight = this.options.h - 35 * ratio;
                this.add(icon);
                icon.x = -this.options.w / 2 + this.options.h / 2
                this._icon = icon;

                labelText.x = -this.options.w / 2 + this.options.h + this._icon.width / 2 + 40 * ratio;
            }

        }

        updateText(label: string) {
            this.options.label = label;
            this._text.text = label;
        }
    }
}
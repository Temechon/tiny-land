module CIV {

    export class BotPanel extends Phaser.GameObjects.Container {

        private _x: number;
        private _y: number;

        private _textStyle: any;
        private _helpTextStyle: any;

        constructor(config: {
            scene: Phaser.Scene,
            height: number,
            title: string
        }) {
            super(config.scene, 0, config.scene.cameras.main.height);
            this.scene.add.existing(this);

            this._x = 60 * ratio;

            // * Background
            let graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            this.add(graphics);
            graphics.fillStyle(0x000000, 0.75);
            graphics.fillRect(0, 0, this.scene.cameras.main.width, config.height);

            // * Tile name
            let tileName = this.scene.make.bitmapText({
                x: this._x,
                y: 25 * ratio,
                font: "font_normal",
                text: config.title,
                size: 45 * ratio,
                add: false
            })
            this.add(tileName);
            this._y = tileName.y + tileName.height + 10 * ratio;


            this._textStyle = {
                fontSize: Helpers.font(28),
                fontStyle: '',
                fill: "#ffffff",
                fontFamily: Constants.FONT.TEXT,
                wordWrap: { width: this.scene.cameras.main.width - 100 * ratio }
            };

            this._helpTextStyle = _.extend({}, this._textStyle);
            this._helpTextStyle.fontSize = Helpers.font(25);
            this._helpTextStyle.fontStyle = 'italic';
        }


        addResource(text: string, resourceKey: string) {
            let foodNb = this.scene.make.bitmapText({
                x: this._x,
                y: this._y,
                font: "font_normal",
                text: text,
                size: 28 * ratio,
                add: false
            })
            let food = this.scene.make.image({
                x: foodNb.x + foodNb.width + 10 * ratio,
                y: this._y,
                scale: ratio,
                key: resourceKey,
                add: false
            })
            food.setOrigin(0, 0.1)
            this.add(foodNb);
            this.add(food);
            this._x = food.x + food.displayWidth + 20 * ratio;
        }

        addDefenseBonus(text: string) {
            this._x = 60 * ratio;
            let desc = this.scene.make.text({
                x: this._x,
                y: this._y + 50 * ratio,
                text: text,
                style: this._textStyle
            })
            this.add(desc);
        }

        addBonusResource(config: {
            name: string,
            description: string,
            food?: string,
            science?: string,
            gold?: string
        }) {

            this._x = 60 * ratio;
            let g = this.scene.make.graphics({ x: 0, y: 180 * ratio, add: false });
            g.fillStyle(0x000000);
            g.fillRect(0, 0, this.scene.cameras.main.width, 90 * ratio)
            this.add(g);

            // Bonus name
            let bonusName = this.scene.make.text({
                x: this._x,
                y: 210 * ratio,
                text: "Bonus resource: " + config.name,
                style: this._textStyle
            })
            this.add(bonusName);

            this._x = bonusName.x + bonusName.width + 30 * ratio;
            this._y = bonusName.y;
            if (config.food) {
                this.addResource(config.food.toString(), 'foodIcon');
            }
            if (config.gold) {
                this.addResource(config.gold.toString(), 'goldIcon');
            }
            if (config.science) {
                this.addResource(config.science.toString(), 'scienceIcon');
            }

            // Bonus description
            let bonusDesc = this.scene.make.text({
                x: this._x + 30 * ratio,
                y: bonusName.y,
                text: config.description,
                style: this._helpTextStyle,
                add: false
            }).setOrigin(0, 0)
            this.add(bonusDesc);

        }

        addImage(key: string | string[], scale?: number) {
            // * Tile sprite
            let keys: string[];
            if (Array.isArray(key)) {
                keys = key as string[];
            } else {
                keys = [key];
            }

            for (let k of keys) {
                let img = this.scene.make.image({
                    x: this.scene.cameras.main.width,
                    y: 0,
                    key: k,
                    scale: scale || ratio,
                    add: false
                })
                img.x -= img.displayWidth / 2 + 50 * ratio
                img.y += img.displayHeight / 4
                this.add(img);
            }
        }

        addUnitInfos(config: UnitInfo) {
            let x = this._x;
            let y = this._y;
            // Health            
            this.addBasicInfo("Health", config.hp + "/" + config.hpmax);
            // Strength            
            this.addBasicInfo("Strength", config.strength.toString());
            // Movement            
            this.addBasicInfo("Movement", config.movement.toString());
            this._x = 300 * ratio
            this._y = y
            // Range            
            this.addBasicInfo("Range", config.range.toString());
            // Vision            
            this.addBasicInfo("Vision", config.vision.toString());
            this._x = 600 * ratio
            this._y = y
            this.addBasicInfo('', config.description, this._helpTextStyle);
        }

        addBasicInfo(key: string, value: string, styleConfig?: any) {
            let text = key ? key + ": " + value : value;
            let style = styleConfig ? styleConfig : this._textStyle;

            let info = this.scene.make.text({
                x: this._x,
                y: this._y,
                text: text,
                style: style
            })
            this._y += info.displayHeight + 10 * ratio;
            this.add(info);
        }
    }
}
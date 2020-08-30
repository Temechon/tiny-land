module CIV {

    /** Configuration to display the bot panel */
    export interface PanelConfig {
        title: string,
        key: string | string[],
        description: string
        resources: {
            food?: number,
            science?: number,
            gold?: number
        },
        bonus?: {
            name: string,
            description: string,
            food?: string,
            science?: string,
            gold?: string
        }
    }

    export class GameUI extends Phaser.Scene {

        private _gameScene: Game;

        private goldTotal: Phaser.GameObjects.Text;
        private foodTotal: Phaser.GameObjects.Text;
        private scienceTotal: Phaser.GameObjects.Text;

        private goldByTurn: Phaser.GameObjects.Text;
        private foodByTurn: Phaser.GameObjects.Text;
        private scienceByTurn: Phaser.GameObjects.Text;

        constructor() {
            super({ key: 'gameui' });
        }

        create() {

            //  Grab a reference to the Game Scene
            this._gameScene = this.scene.get('game') as Game;

            this._gameScene.events.on(Constants.EVENTS.UI_UPDATE, this.updateUI.bind(this))

            let hud = this.add.container();


            let titlestyle = {
                fontSize: Helpers.font(35),
                fontFamily: Constants.FONT.NUMBERS,
                color: "#fff",
                stroke: '#000',
                strokeThickness: 5 * ratio,
            };
            let style = {
                fontSize: Helpers.font(20),
                fontFamily: Constants.FONT.NUMBERS,
                color: "#fff",
                stroke: '#000',
                strokeThickness: 2 * ratio,
            };

            let gold = this.make.image({
                x: 75 * ratio,
                y: 75 * ratio,
                key: 'goldIcon',
                scale: ratio
            });
            let food = this.make.image({
                x: gold.x,
                y: gold.y + gold.displayHeight,
                key: 'foodIcon',
                scale: ratio
            });
            let science = this.make.image({
                x: food.x,
                y: food.y + food.displayHeight,
                key: 'scienceIcon',
                scale: ratio
            });

            hud.add(gold);
            hud.add(food);
            hud.add(science);

            this.goldTotal = this.add.text(150 * ratio, gold.y, '', titlestyle).setOrigin(0.5, 0.5);
            this.foodTotal = this.add.text(150 * ratio, food.y, '', titlestyle).setOrigin(0.5, 0.5);
            this.scienceTotal = this.add.text(150 * ratio, science.y, '', titlestyle).setOrigin(0.5, 0.5);

            this.goldByTurn = this.add.text(210 * ratio, gold.y, '', style).setOrigin(0.5, 0.25);
            this.foodByTurn = this.add.text(210 * ratio, food.y, '', style).setOrigin(0.5, 0.25);
            this.scienceByTurn = this.add.text(210 * ratio, science.y, '', style).setOrigin(0.5, 0.25);
            this.updateUI();

            hud.add(this.goldTotal);
            hud.add(this.foodTotal);
            hud.add(this.scienceTotal);

            hud.add(this.goldByTurn);
            hud.add(this.foodByTurn);
            hud.add(this.scienceByTurn);

            let menu = null;
            this._gameScene.events.on(Constants.EVENTS.CIRCULAR_MENU_ON, (config: {
                position: Phaser.Types.Math.Vector2Like,
                constructions: Array<ConstructionOrder>,
                city: City
            }) => {

                let screen = this.getXY(config.position);

                let actions = [];
                for (let con of config.constructions) {
                    let deactivated = null;
                    if (con.deactivated) {
                        deactivated = con.deactivated;
                    }
                    let act = new Action({
                        scene: this,
                        key: con.unit.key,
                        name: con.unit.name,
                        deactivated: deactivated,
                        action: () => {
                            config.city.produceUnit(con.unit);
                            menu.destroy();
                            menu = null;
                        }
                    })
                    actions.push(act);
                }

                menu = new CircularMenu({
                    scene: this,
                    x: screen.x,
                    y: screen.y,
                    actions: actions
                });
            })

            this._gameScene.events.on(Constants.EVENTS.CIRCULAR_MENU_OFF, () => {
                if (menu) {
                    menu.destroy();
                    menu = null;
                }
            })

            let botPanel = null;
            this._gameScene.events.on(Constants.EVENTS.BOT_PANEL_ON, (config: PanelConfig) => {
                if (botPanel) {
                    this.removePanel(botPanel);
                    botPanel = null;
                }
                botPanel = this.displayPanel(config);
            })
            this._gameScene.events.on(Constants.EVENTS.UI_OFF, (config: PanelConfig) => {
                if (botPanel) {
                    this.removePanel(botPanel);
                    botPanel = null;
                }
                if (menu) {
                    menu.destroy();
                    menu = null;
                }
            })

            // BUTTONS
            // let showResourceButton = new Button(this, {
            //     w: 250 * ratio,
            //     h: 80 * ratio,
            //     backgroundColor: 0x1c4c68,
            //     shadowColor: 0x07141c,
            //     label: "Resources ON",
            //     fontSize: 25,
            //     fontFamily: Constants.FONT.TEXT,
            //     fontColor: 'white',
            //     x: 200 * ratio,
            //     y: this.cameras.main.height - 100 * ratio
            // })
            // showResourceButton.onInputDown = () => {
            //     this._gameScene.map.resourceLayer.visible = !this._gameScene.map.resourceLayer.visible;
            //     if (this._gameScene.map.resourceLayer.visible) {
            //         showResourceButton.label = "Resources ON"
            //     } else {
            //         showResourceButton.label = "Resources OFF"
            //     }
            // }
            // hud.add(showResourceButton);
            // END TURN
            let endTurnButton = new Button(this, {
                w: 250 * ratio,
                h: 80 * ratio,
                backgroundColor: 0x1c4c68,
                shadowColor: 0x07141c,
                label: "Next turn",
                fontSize: 25,
                fontFamily: Constants.FONT.TEXT,
                fontColor: 'white',
                x: this.cameras.main.width / 2,
                y: this.cameras.main.height - 100 * ratio
            })
            endTurnButton.onInputDown = () => {
                this._gameScene.nextTurn();
            }
            hud.add(endTurnButton);

            // this.displayPanel({
            //     title: 'Montagne',
            //     key: ['land3', 'wheat'],
            //     description: 'Défense : +3',
            //     resource: 'Ressource : Maïs (food +1)'
            // });

            // new map
            // let newmap = new Button(this, {
            //     w: 250 * ratio,
            //     h: 80 * ratio,
            //     backgroundColor: 0x1c4c68,
            //     shadowColor: 0x07141c,
            //     label: "New map",
            //     fontSize: 25,
            //     fontFamily: Constants.FONT.TEXT,
            //     fontColor: 'white',
            //     x: this.cameras.main.width / 2,
            //     y: this.cameras.main.height - 100 * ratio
            // })
            // newmap.onInputDown = () => {
            //     this._gameScene.resetMap();
            // }
            // hud.add(newmap);
        }

        updateUI() {
            this.goldTotal.text = this._gameScene.player.productionManager.gold.toString();
            this.foodTotal.text = this._gameScene.player.productionManager.food.toString();
            this.scienceTotal.text = this._gameScene.player.productionManager.science.toString();

            this.goldByTurn.text = "+" + this._gameScene.player.productionManager.goldByTurn.toString();
            this.foodByTurn.text = "+" + this._gameScene.player.productionManager.foodByTurn.toString();
            this.scienceByTurn.text = "+" + this._gameScene.player.productionManager.scienceByTurn.toString();
        }

        /**
         * Display a panel from the bottom of the scree displaying informations about a tile
         * (defence bonus, resource...)
         */
        displayPanel(config: PanelConfig) {

            let panelHeight = 220 * ratio;

            if (config.bonus) {
                panelHeight += 50 * ratio;
            }
            let x = 60 * ratio;

            let panel = this.add.container(0, this.cameras.main.height);

            let graphics = this.make.graphics({ x: 0, y: 0, add: false });
            panel.add(graphics);
            graphics.fillStyle(0x000000, 0.75);
            graphics.fillRect(0, 0, this.cameras.main.width, panelHeight);

            // * Tile name
            let tileName = this.make.bitmapText({
                x: x,
                y: 25 * ratio,
                font: "font_normal",
                text: config.title,
                size: 45 * ratio,
                add: false
            })
            panel.add(tileName);

            // * Standard resources 
            let xx = x;
            let yy = tileName.y + tileName.height + 10 * ratio;

            if (config.resources.food) {
                let foodNb = this.make.bitmapText({
                    x: xx,
                    y: yy,
                    font: "font_normal",
                    text: config.resources.food.toString(),
                    size: 28 * ratio,
                    add: false
                })
                let food = this.make.image({
                    x: foodNb.x + foodNb.width + 10 * ratio,
                    y: yy,
                    scale: ratio,
                    key: 'foodIcon',
                    add: false
                })
                food.setOrigin(0, 0.1)
                panel.add(foodNb);
                panel.add(food);
                xx = food.x + food.displayWidth + 20 * ratio;
            }

            if (config.resources.gold) {
                let goldNb = this.make.bitmapText({
                    x: xx,
                    y: yy,
                    font: "font_normal",
                    text: config.resources.gold.toString(),
                    size: 28 * ratio,
                    add: false
                })
                let gold = this.make.image({
                    x: goldNb.x + goldNb.width + 10 * ratio,
                    y: yy,
                    scale: ratio,
                    key: 'goldIcon',
                    add: false
                })
                gold.setOrigin(0, 0.1)
                panel.add(goldNb);
                panel.add(gold);
                xx = gold.x + gold.displayWidth + 20 * ratio;
            }

            if (config.resources.science) {
                let scienceNb = this.make.bitmapText({
                    x: xx,
                    y: yy,
                    font: "font_normal",
                    text: config.resources.science.toString(),
                    size: 28 * ratio,
                    add: false
                })
                let science = this.make.image({
                    x: scienceNb.x + scienceNb.width + 10 * ratio,
                    y: yy,
                    scale: ratio,
                    key: 'scienceIcon',
                    add: false
                })
                science.setOrigin(0)
                panel.add(scienceNb);
                panel.add(science);
            }

            let style = {
                fontSize: Helpers.font(28),
                fontStyle: '',
                fill: "#ffffff",
                fontFamily: Constants.FONT.TEXT,
                wordWrap: { width: this.cameras.main.width - 100 * ratio }
            };

            // * Defense bonus
            let desc = this.make.text({
                x: x,
                y: yy + 50 * ratio,
                text: "Bonus defense: " + config.description,
                style: style
            })
            panel.add(desc);

            //* Bonus resource
            if (config.bonus) {
                let g = this.make.graphics({ x: 0, y: 180 * ratio, add: false });
                g.fillStyle(0x000000);
                g.fillRect(0, 0, this.cameras.main.width, 90 * ratio)
                panel.add(g);

                // Bonus name
                let bonusName = this.make.text({
                    x: x,
                    y: 210 * ratio,
                    text: "Bonus resource: " + config.bonus.name,
                    style: style
                })
                panel.add(bonusName);

                let xx = bonusName.x + bonusName.width + 30 * ratio;
                if (config.bonus.food) {
                    let foodNb = this.make.bitmapText({
                        x: xx,
                        y: bonusName.y,
                        font: "font_normal",
                        text: config.bonus.food.toString(),
                        size: 28 * ratio,
                        add: false
                    })
                    let food = this.make.image({
                        x: foodNb.x + foodNb.width + 10 * ratio,
                        y: bonusName.y,
                        scale: ratio,
                        key: 'foodIcon',
                        add: false
                    })
                    food.setOrigin(0)
                    panel.add(foodNb);
                    panel.add(food);
                    xx = food.x + food.displayWidth + 20 * ratio;
                }

                if (config.bonus.gold) {
                    let goldNb = this.make.bitmapText({
                        x: xx,
                        y: bonusName.y,
                        font: "font_normal",
                        text: config.bonus.gold.toString(),
                        size: 28 * ratio,
                        add: false
                    })
                    let gold = this.make.image({
                        x: goldNb.x + goldNb.width + 10 * ratio,
                        y: bonusName.y,
                        scale: ratio,
                        key: 'goldIcon',
                        add: false
                    })
                    gold.setOrigin(0)
                    panel.add(goldNb);
                    panel.add(gold);
                    xx = gold.x + gold.displayWidth + 20 * ratio;
                }

                if (config.bonus.science) {
                    let scienceNb = this.make.bitmapText({
                        x: xx,
                        y: bonusName.y,
                        font: "font_normal",
                        text: config.bonus.science.toString(),
                        size: 28 * ratio,
                        add: false
                    })
                    let science = this.make.image({
                        x: scienceNb.x + scienceNb.width + 10 * ratio,
                        y: bonusName.y,
                        scale: ratio,
                        key: 'scienceIcon',
                        add: false
                    })
                    science.setOrigin(0)
                    panel.add(scienceNb);
                    panel.add(science);
                    xx = science.x + science.displayWidth + 20 * ratio;
                }

                // Bonus description
                style.fontSize = Helpers.font(25);
                style.fontStyle = 'italic';
                let bonusDesc = this.make.text({
                    x: xx + 30 * ratio,
                    y: bonusName.y,
                    text: config.bonus.description,
                    style: style,
                    add: false
                }).setOrigin(0, 0)
                panel.add(bonusDesc);
            }

            // * Tile sprite
            let keys: string[];
            if (Array.isArray(config.key)) {
                keys = config.key as string[];
            } else {
                keys = [config.key];
            }

            console.log("ici", keys);
            for (let k of keys) {
                let img = this.make.image({
                    x: this.cameras.main.width,
                    y: 0,
                    key: k,
                    scale: ratio,
                    add: false
                })
                img.x -= img.displayWidth / 2 + 50 * ratio
                img.y += img.displayHeight / 4
                panel.add(img);
            }



            this.add.tween({
                targets: panel,
                y: this.cameras.main.height - panelHeight,
                duration: 300,
                ease: Phaser.Math.Easing.Back.Out,
            })
            return panel;
        }

        removePanel(panel: Phaser.GameObjects.Container) {
            this.add.tween({
                targets: panel,
                y: this.cameras.main.height,
                duration: 300,
                ease: Phaser.Math.Easing.Back.In,
                onComplete: () => panel.destroy()
            })
        }

        /**
         * Transform a given position from the game scene to the UI scene
         */
        getXY(g: Phaser.Types.Math.Vector2Like): Phaser.Types.Math.Vector2Like {

            let cam = this._gameScene.cameras.main
            let screenCenterX = cam.centerX - cam.scrollX * cam.zoom;
            let screenCenterY = cam.centerY - cam.scrollY * cam.zoom;

            let diffx = (g.x - cam.centerX) * cam.zoom;
            let diffy = (g.y - cam.centerY) * cam.zoom;

            // console.log(cam.centerX, cam.centerY, cam.scrollX, cam.scrollY);
            // this.add.image(screenCenterX, screenCenterY, 'food')
            // this.add.image(screenCenterX + diffx, screenCenterY + diffy, 'gold')
            return {
                x: screenCenterX + diffx,
                y: screenCenterY + diffy
            }
        }
    }
}
module CIV {

    /** Base configuration to display the bot panel */
    interface PanelConfig {
        title: string,
        key: string | string[],
        description: string
    }

    /** Configuration to display tile informations */
    export interface TilePanelConfig extends PanelConfig {
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

        private _turnText: Phaser.GameObjects.Text;

        constructor() {
            super({ key: 'gameui' });
        }

        create() {

            //  Grab a reference to the Game Scene
            this._gameScene = this.scene.get('game') as Game;

            this._gameScene.events.on(Constants.EVENTS.UI_UPDATE, this.updateUI.bind(this))

            let hud = this.add.container();
            let y = 60 * ratio;

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
            }

            // * Number of turns
            let labelTurn = this.make.text({
                x: this.cameras.main.width / 2,
                y: y,
                text: "Turn",
                style: style
            }).setOrigin(0.5, 0.5)

            this._turnText = this.make.text({
                x: this.cameras.main.width / 2,
                y: labelTurn.y + labelTurn.height + 20 * ratio,
                text: "0",
                style: titlestyle
            }).setOrigin(0.5, 0.5)


            let gold = this.make.image({
                x: 75 * ratio,
                y: y,
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
            this._gameScene.events.on(Constants.EVENTS.BOT_PANEL_TILE_ON, (config: TilePanelConfig) => {
                if (botPanel) {
                    this.removePanel(botPanel);
                    botPanel = null;
                }
                botPanel = this.displayTilePanel(config);
            })
            this._gameScene.events.on(Constants.EVENTS.BOT_PANEL_UNIT_ON, (config: UnitInfo) => {
                if (botPanel) {
                    this.removePanel(botPanel);
                    botPanel = null;
                }
                botPanel = this.displayUnitPanel(config);
            })

            this._gameScene.events.on(Constants.EVENTS.UI_OFF, (config: TilePanelConfig) => {
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

            this._turnText.text = this._gameScene.turn.toString();
        }


        displayUnitPanel(config: UnitInfo) {

            let panelHeight = 220 * ratio;

            let panel = new BotPanel({ scene: this, height: panelHeight, title: config.name });

            //* Tile image
            panel.addImage(config.key, ratio * 1.5);
            panel.addUnitInfos(config);

            this.add.tween({
                targets: panel,
                y: this.cameras.main.height - panelHeight,
                duration: 300,
                ease: Phaser.Math.Easing.Back.Out,
            })
            return panel;
        }


        /**
         * Display a panel from the bottom of the scree displaying informations about a tile
         * (defence bonus, resource...)
         */
        displayTilePanel(config: TilePanelConfig) {

            let panelHeight = 220 * ratio;

            if (config.bonus) {
                panelHeight += 50 * ratio;
            }

            let panel = new BotPanel({ scene: this, height: panelHeight, title: config.title });

            // * Standard resources 
            if (config.resources.food) {
                panel.addResource(config.resources.food.toString(), 'foodIcon');
            }
            if (config.resources.gold) {
                panel.addResource(config.resources.gold.toString(), 'goldIcon');
            }
            if (config.resources.science) {
                panel.addResource(config.resources.science.toString(), 'scienceIcon');
            }

            // * Defense bonus
            panel.addDefenseBonus("Bonus defense: " + config.description)

            //* Bonus resource
            if (config.bonus) {
                panel.addBonusResource(config.bonus);
            }

            //* Tile image
            panel.addImage(config.key);

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
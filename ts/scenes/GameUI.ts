module CIV {
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
                key: 'researchIcon',
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
                x: this.cameras.main.width - 225 * ratio,
                y: this.cameras.main.height - 100 * ratio
            })
            endTurnButton.onInputDown = () => {
                this._gameScene.nextTurn();
            }
            hud.add(endTurnButton);

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
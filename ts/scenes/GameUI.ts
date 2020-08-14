module CIV {
    export class GameUI extends Phaser.Scene {

        private _gameScene: Game;

        constructor() {
            super({ key: 'gameui' });
        }

        create() {

            //  Grab a reference to the Game Scene
            this._gameScene = this.scene.get('game') as Game;
            let hud = this.add.container();
            // hud.depth = Constants.LAYER.HUD;


            let titlestyle = {
                fontSize: Helpers.font(35),
                fontFamily: Constants.FONT.NUMBERS,
                color: "#fff",
                stroke: '#000',
                strokeThickness: 5,
            };

            let gold = this.make.image({
                x: 75 * ratio,
                y: 75 * ratio,
                key: 'gold'
            });
            gold.scale = ratio;
            let food = this.make.image({
                x: gold.x,
                y: gold.y + gold.height,
                key: 'food'
            });
            food.scale = ratio;
            let science = this.make.image({
                x: food.x,
                y: food.y + food.height,
                key: 'research'
            });
            science.scale = ratio;

            hud.add(gold);
            hud.add(food);
            hud.add(science);

            let goldNb = this.add.text(150 * ratio, gold.y, this._gameScene.player.getProductionOf(ResourceType.Gold).toString(), titlestyle).setOrigin(0.5, 0.5);
            let foodNb = this.add.text(150 * ratio, food.y, this._gameScene.player.getProductionOf(ResourceType.Food).toString(), titlestyle).setOrigin(0.5, 0.5);
            let scienceNb = this.add.text(150 * ratio, science.y, this._gameScene.player.getProductionOf(ResourceType.Science).toString(), titlestyle).setOrigin(0.5, 0.5);
            hud.add(goldNb);
            hud.add(foodNb);
            hud.add(scienceNb);

            this._gameScene.events.on('uiupdate', () => {
                goldNb.text = this._gameScene.player.getProductionOf(ResourceType.Gold).toString();
                foodNb.text = this._gameScene.player.getProductionOf(ResourceType.Food).toString();
                scienceNb.text = this._gameScene.player.getProductionOf(ResourceType.Science).toString();
            })

            let menu = null;
            this._gameScene.events.on('circularmenuon', (config: {
                position: Phaser.Types.Math.Vector2Like,
                constructions: Array<ConstructionOrder>,
                city: City
            }) => {

                let screen = this.getXY(config.position);

                let actions = [];
                for (let con of config.constructions) {
                    let deactivated = null;
                    if (con.config.deactivated) {
                        deactivated = con.config.deactivated;
                    }
                    let act = new Action({
                        scene: this,
                        key: 'food',
                        name: "WARRIOR",
                        deactivated: deactivated,
                        action: () => {
                            config.city.produceUnit();
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

            this._gameScene.events.on('circularmenuoff', (arg) => {
                if (menu) {
                    menu.destroy();
                    menu = null;
                }
            })

            // BUTTONS
            let showResourceButton = new Button(this, {
                w: 250 * ratio,
                h: 80 * ratio,
                backgroundColor: 0x1c4c68,
                shadowColor: 0x07141c,
                label: "Resources ON",
                fontSize: 25,
                fontFamily: Constants.FONT.TEXT,
                fontColor: 'white',
                x: 200 * ratio,
                y: this.cameras.main.height - 100 * ratio
            })
            showResourceButton.onInputDown = () => {
                this._gameScene.map.resourceLayer.visible = !this._gameScene.map.resourceLayer.visible;
                if (this._gameScene.map.resourceLayer.visible) {
                    showResourceButton.label = "Resources ON"
                } else {
                    showResourceButton.label = "Resources OFF"
                }
            }
            hud.add(showResourceButton);
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

            let test = new Button(this, {
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
            test.onInputDown = () => {
                new Toast({
                    scene: this,
                    message: "Ceci est un message de test",
                    style: Toast.STYLE.WARNING
                })
            }
            hud.add(test);

        }

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
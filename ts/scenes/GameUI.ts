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
                fontFamily: "KeepCalm",
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
            this._gameScene.events.on('circularmenuon', (arg) => {
                let screen = this.getXY(arg);
                menu = new CircularMenu({
                    scene: this,
                    x: screen.x,
                    y: screen.y,
                    actions: [
                        new Action({ scene: this, key: 'food', name: 'Avant-poste', action: () => console.log("avant poste") }),
                        new Action({ scene: this, key: 'research', name: 'warrior', action: () => console.log("warrior") }),
                        new Action({ scene: this, key: 'gold', name: 'warrior', action: () => console.log("warrior 2") })]
                });
            })

            this._gameScene.events.on('circularmenuoff', (arg) => {
                if (menu) {
                    menu.destroy();
                    menu = null;
                }
            })

            // BUTTONS
            let button = new Button(this, {
                w: 250 * ratio,
                h: 80 * ratio,
                backgroundColor: 0x1c4c68,
                shadowColor: 0x07141c,
                label: "Resources ON",
                fontSize: 25,
                fontFamily: "KeepCalm",
                fontColor: 'white',
                x: 200 * ratio,
                y: this.cameras.main.height - 100 * ratio
            })
            button.onInputDown = () => {
                this._gameScene.map.resourceLayer.visible = !this._gameScene.map.resourceLayer.visible;
                if (this._gameScene.map.resourceLayer.visible) {
                    button.label = "Resources ON"
                } else {
                    button.label = "Resources OFF"
                }
            }
            hud.add(button);

        }

        getXY(g: Phaser.Types.Math.Vector2Like): Phaser.Types.Math.Vector2Like {
            let scrollx = this._gameScene.cameras.main.scrollX * this._gameScene.cameras.main.zoom;
            let scrolly = this._gameScene.cameras.main.scrollY * this._gameScene.cameras.main.zoom;
            return {
                x: g.x - scrollx,
                y: g.y - scrolly
            }
        }
    }
}
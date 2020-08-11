module CIV {
    export class GameUI extends Phaser.Scene {

        constructor() {
            super({ key: 'gameui' });
        }

        create() {

            //  Grab a reference to the Game Scene
            let game = this.scene.get('game') as Game;
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

            let goldNb = this.add.text(150 * ratio, gold.y, "99", titlestyle).setOrigin(0.5, 0.5);
            let foodNb = this.add.text(150 * ratio, food.y, "99", titlestyle).setOrigin(0.5, 0.5);
            let scienceNb = this.add.text(150 * ratio, science.y, "99", titlestyle).setOrigin(0.5, 0.5);
            hud.add(goldNb);
            hud.add(foodNb);
            hud.add(scienceNb);

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
                game.map.resourceLayer.visible = !game.map.resourceLayer.visible;
                if (game.map.resourceLayer.visible) {
                    button.label = "Resources ON"
                } else {
                    button.label = "Resources OFF"
                }
            }
            hud.add(button);
        }
    }
}
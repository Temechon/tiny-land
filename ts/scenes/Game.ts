module CIV {


    export class Game extends Phaser.Scene {

        public player: Tribe;
        map: WorldMap;

        public static INSTANCE: Game;

        constructor() {
            super('game');
            Game.INSTANCE = this;
        }


        create() {

            // let graphics = this.add.graphics();
            // graphics.fillStyle(0xffff00, 0.25);
            // graphics.fillRectShape(bounds);
            // graphics.setScrollFactor(0, 0)

            let ch = new CameraHelper(this);

            this.map = new WorldMap(this);

            this.player = new Tribe(chance.name());

            this.cameras.main.zoom = 0.25

            this.input.keyboard.on('keydown-' + 'W', () => {
                this.cameras.main.zoom += 0.25
            });
            this.input.keyboard.on('keydown-' + 'X', () => {
                this.cameras.main.zoom -= 0.25
            });
            this.input.keyboard.on('keyup-' + 'C', () => {
                // this.player.visible = !this.player.visible;
                // console.log(this.player.getProductionOf(ResourceType.Gold));                
            });

            let tile = this.map.getSartingTile();
            let city = this.player.setCityOn(tile);



            //this.cameras.main.zoom = 0.8; 
            // this.cameras.main.centerOn(startingCity.position.x, startingCity.position.y);

            city.produceUnit();

            //* UI
            {
                let hud = Game.INSTANCE.add.container();
                hud.depth = Constants.LAYER.HUD;
                this.cameras.main.ignore(hud);

                let hudCamera = this.cameras.add();
                hudCamera.inputEnabled = false;
                hudCamera.ignore(this.map);
                hudCamera.ignore(this.player)
                hudCamera.ignore(this.map.resourceLayer)

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

                let goldNb = this.add.text(150 * ratio, gold.y, this.player.getProductionOf(ResourceType.Gold).toString(), titlestyle).setOrigin(0.5, 0.5);
                let foodNb = this.add.text(150 * ratio, food.y, this.player.getProductionOf(ResourceType.Food).toString(), titlestyle).setOrigin(0.5, 0.5);
                let scienceNb = this.add.text(150 * ratio, science.y, this.player.getProductionOf(ResourceType.Research).toString(), titlestyle).setOrigin(0.5, 0.5);
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
                    this.map.resourceLayer.visible = !this.map.resourceLayer.visible;
                    if (this.map.resourceLayer.visible) {
                        button.label = "Resources ON"
                    } else {
                        button.label = "Resources OFF"
                    }
                }
                hud.add(button);
            }
        }
    }
}

module CIV {


    export class Game extends Phaser.Scene {

        public player: Tribe;

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

            this.player = new Tribe(chance.name());
            this.player.depth = 2;
            let map = new WorldMap(this);

            this.cameras.main.zoom = 0.25

            this.input.keyboard.on('keydown-' + 'W', () => {
                this.cameras.main.zoom += 0.25
            });
            this.input.keyboard.on('keydown-' + 'X', () => {
                this.cameras.main.zoom -= 0.25
            });
            this.input.keyboard.on('keyup-' + 'C', () => {
                // this.player.visible = !this.player.visible;
                console.log(this.player.cities[0].getProduction());
            });

            let tile = map.getSartingTile();
            this.player.setCityOn(tile, map);



            //this.cameras.main.zoom = 0.8; 
            // this.cameras.main.centerOn(startingCity.position.x, startingCity.position.y);

            // startingCity.produceUnit();

            //* UI
            {
                let hud = Game.INSTANCE.add.container();
                this.cameras.main.ignore(hud);

                let hudCamera = this.cameras.add();
                hudCamera.ignore(map);
                hudCamera.ignore(this.player)
                hudCamera.ignore(map.resourceLayer)

                let titlestyle = {
                    fontSize: Helpers.font(50),
                    fontFamily: "KeepCalm",
                    color: "#fff",
                    stroke: '#000',
                    strokeThickness: 5,
                };
                let style = titlestyle;
                style.fontSize = Helpers.font(35);

                let gold = this.add.text(0, 0, "GOLD", titlestyle);
                hud.add(gold);

                let button = new Button(this, {
                    w: 250 * ratio,
                    h: 80 * ratio,
                    backgroundColor: 0xff0000,
                    shadowColor: 0xff00ff,
                    label: "TEST",
                    fontSize: 50,
                    fontFamily: "KeepCalm",
                    fontColor: 'white',
                    x: 200 * ratio,
                    y: 100 * ratio
                })
                button.onInputDown = () => {
                    console.log("coucou", this.scene.key);
                }
                hud.add(button);
            }
        }
    }
}

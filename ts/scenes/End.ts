module CIV {

    export class End extends Phaser.Scene {

        container: Phaser.GameObjects.Container;

        constructor() {
            super({ key: 'end' });
        }

        create() {

            this.container = this.add.container();
            let graphics = this.make.graphics({ add: false });
            graphics.fillStyle(0x000000, 0.75);
            graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
            graphics.setScrollFactor(0, 0)
            this.container.add(graphics);

            let titleStyle = {
                fontSize: Helpers.font(100),
                fill: "#fff",
                fontFamily: Constants.FONT.NUMBERS,
                align: 'center'
            };

            let textStyle = {
                fontSize: Helpers.font(30),
                fill: "#fff",
                fontFamily: Constants.FONT.TEXT,
                align: 'center'
            };

            let scoreStyle = {
                fontSize: Helpers.font(40),
                fill: "#fff",
                fontFamily: Constants.FONT.NUMBERS,
                align: 'right'
            };

            let hw = this.cameras.main.width / 2;
            let hh = this.cameras.main.height / 2

            // * Victory or defeat
            let victory = this.add.text(hw, 300 * ratio, "VICTORY!", titleStyle)
            victory.setOrigin(0.5)
            this.container.add(victory);

            let yy = 500 * ratio;
            let xx = this.cameras.main.width - 100 * ratio;
            // graphics.fillStyle(0xffffff);
            graphics.lineStyle(3 * ratio, 0xffffff, 0.5);

            // * Number of resources
            let resourceScore = this.add.text(100 * ratio, yy, "Resources", textStyle)
            let resourceScoreVal = this.add.text(xx, yy, "9999", scoreStyle).setOrigin(1, 0.15)
            this.container.add(resourceScore);
            this.container.add(resourceScoreVal);
            graphics.lineBetween(
                resourceScore.x + resourceScore.width + 50 * ratio,
                yy + resourceScore.height / 2,
                resourceScoreVal.x - resourceScoreVal.width - 50 * ratio,
                yy + resourceScore.height / 2);

            yy += resourceScore.height + 80 * ratio;

            // * Resource bonus
            let bonusResourcesScore = this.add.text(100 * ratio, yy, "Bonus resources", textStyle)
            let bonusVal = this.add.text(xx, yy, "9999", scoreStyle).setOrigin(1, 0.15)
            this.container.add(bonusResourcesScore);
            this.container.add(bonusVal);
            graphics.lineBetween(
                bonusResourcesScore.x + bonusResourcesScore.width + 50 * ratio,
                yy + bonusResourcesScore.height / 2,
                bonusVal.x - bonusVal.width - 50 * ratio,
                yy + bonusResourcesScore.height / 2);
            yy += resourceScore.height + 80 * ratio;

            // * Number of tiles managed
            let tileScore = this.add.text(100 * ratio, yy, "Tiles in the empire", textStyle)
            let tileVal = this.add.text(xx, yy, "9999", scoreStyle).setOrigin(1, 0.15)
            this.container.add(tileVal);
            this.container.add(tileScore);
            graphics.lineBetween(
                tileScore.x + tileScore.width + 50 * ratio,
                yy + tileScore.height / 2,
                tileVal.x - tileVal.width - 50 * ratio,
                yy + tileScore.height / 2);
            yy += resourceScore.height + 80 * ratio;

            // * Military force
            let military = this.add.text(100 * ratio, yy, "Military forces", textStyle)
            let militaryVal = this.add.text(xx, yy, "9999", scoreStyle).setOrigin(1, 0.15)
            this.container.add(militaryVal);
            this.container.add(military);
            graphics.lineBetween(
                military.x + military.width + 50 * ratio,
                yy + military.height / 2,
                militaryVal.x - militaryVal.width - 50 * ratio,
                yy + military.height / 2);
            yy += resourceScore.height + 80 * ratio;

            // * Final score
            titleStyle.fontSize = Helpers.font(50)
            textStyle.fontSize = Helpers.font(50)
            textStyle.fill = "#FFFF00"
            let finalScore = this.add.text(100 * ratio, yy, "Final Score", titleStyle)
            this.container.add(finalScore);
            let finalScoreVal = this.add.text(xx, yy, "999999", textStyle).setOrigin(1, -0.1)
            this.container.add(finalScoreVal);

            let menuButton = new Button(this, {
                w: 250 * ratio,
                h: 80 * ratio,
                backgroundColor: 0x1c4c68,
                shadowColor: 0x07141c,
                label: "OK !",
                fontSize: 30,
                fontFamily: Constants.FONT.NUMBERS,
                fontColor: 'white',
                x: this.cameras.main.width / 2,
                y: this.cameras.main.height - 100 * ratio
            })
            menuButton.onInputDown = () => {
                this.add.tween({
                    targets: this.container,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => { this.scene.start('home') }
                })
            }
            this.container.add(menuButton);

        }
    }
}
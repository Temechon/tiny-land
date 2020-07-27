module CIV {
    export class City implements IClickable {

        private _tile: Tile;
        private scene: Phaser.Scene;
        public worldmap: WorldMap;

        /** The tribe this city belongs to */
        private _tribe: Tribe;

        /** The number of hexagon around this city that can be used by this city */
        public influenceRadius: number = 1;
        /** The tetxure used to display the influence */
        private _influenceTexture: Phaser.GameObjects.RenderTexture;

        constructor(config: {
            scene: Phaser.Scene,
            worldmap: WorldMap,
            tile: Tile,
            tribe: Tribe
        }) {

            this.scene = config.scene;
            this._tile = config.tile;
            this.worldmap = config.worldmap;
            this._tribe = config.tribe;

            this._tile.setTexture('city');
            this._tile.setTint(0xffffff);

            // Draw its influence area
            this._drawInfluenceRadius();
            this._tile.addClickable(this);
        }

        public get position(): Phaser.Geom.Point {
            let x = this._tile.parentContainer.x + this._tile.x;
            let y = this._tile.parentContainer.y + this._tile.y;
            return new Phaser.Geom.Point(x, y);
        }

        /**
         * TODO Just for test here
         */
        public produceUnit() {
            let unit = new Unit({
                scene: Game.INSTANCE,
                x: this._tile.position.x,
                y: this._tile.position.y,
                key: 'warrior',
                map: this.worldmap,
                tile: this._tile
            });
            Game.INSTANCE.add.existing(unit);
        }

        private _drawInfluenceRadius() {

            if (this._influenceTexture) {
                this._influenceTexture.destroy();
            }

            let ring: Array<Tile> = [];
            let r = this.influenceRadius;

            while (r > 0) {
                ring.push(...this.worldmap.getTilesByAxialCoords(
                    this.worldmap.grid.ring(
                        this._tile.q, this._tile.r, r
                    )
                ))
                r--;
            }
            ring.push(this._tile)
            // TODO Filter hex fron tome influence radius that are in another city

            // Create a container that contains all hex to draw
            let container = Game.INSTANCE.make.container({ x: this.position.x, y: this.position.y })//.setVisible(false);

            let mask = Game.INSTANCE.make.container({ x: this.position.x, y: this.position.y, add: false });

            for (let t of ring) {
                let image = t.getHexPrint(this._tribe.color);
                image.x -= this.position.x;
                image.y -= this.position.y;
                image.scale *= 1.1
                // image.alpha = 0.5
                container.add(image);

                image = t.getHexPrint(0x000000);
                image.x -= this.position.x;
                image.y -= this.position.y;
                mask.add(image);
            }


            let size = Helpers.getSize(container, this._tile.displayWidth, this._tile.displayHeight);

            let rt = Game.INSTANCE.add.renderTexture(this.position.x, this.position.y, size.width * 2, size.height * 2)
            rt.setOrigin(0.5, 0.5);
            rt.draw(container, size.width, size.height)
            container.iterate(c => c.destroy());
            container.destroy();

            rt.mask = new Phaser.Display.Masks.BitmapMask(Game.INSTANCE, mask);
            rt.mask.invertAlpha = true;

            this._influenceTexture = rt;
        }

        activate() {
            // TODO Display the build menu
            console.log("CITY ACTIVATED");

        }
        deactivate() {
            // TODO Remove the build menu
            console.log("CITY DEACTIVATED");
        }

    }
}
module CIV {
    export class City extends Phaser.GameObjects.Container implements IClickable {

        private _tile: Tile;
        public worldmap: WorldMap;

        /** The tribe this city belongs to */
        private _tribe: Tribe;

        /** The number of hexagon around this city that can be used by this city */
        public influenceRadius: number = 1;
        /** The tetxure used to display the influence */
        private _influenceTexture: Phaser.GameObjects.RenderTexture;
        /** All tiles in the influence area of this city */
        private _influenceTiles: Tile[] = [];

        constructor(config: {
            worldmap: WorldMap,
            tile: Tile,
            tribe: Tribe
        }) {
            super(Game.INSTANCE);
            this._tile = config.tile;
            this.worldmap = config.worldmap;
            this._tribe = config.tribe;

            let cityImage = Game.INSTANCE.make.image({
                x: this._tile.worldPosition.x,
                y: this._tile.worldPosition.y,
                key: 'city'
            });

            cityImage.scale = ratio;
            this.add(cityImage)

            // Draw its influence area
            this._drawInfluenceRadius();
            this.add(this._influenceTexture)
            this._tile.addClickable(this);
        }

        /**
         * TODO Just for test here
         */
        public produceUnit() {
            let unit = new Unit({
                scene: Game.INSTANCE,
                x: this._tile.worldPosition.x,
                y: this._tile.worldPosition.y,
                key: 'warrior',
                map: this.worldmap,
                tile: this._tile
            });
            Game.INSTANCE.add.existing(unit);
        }

        getProduction(): number[] {
            let res = [];
            res[ResourceType.Gold] = 0;
            res[ResourceType.Food] = 0;
            res[ResourceType.Research] = 0;
            for (let t of this._influenceTiles) {
                res[ResourceType.Gold] += t.resources[ResourceType.Gold];
                res[ResourceType.Food] += t.resources[ResourceType.Food];
                res[ResourceType.Research] += t.resources[ResourceType.Research];
            }

            return res;
        }

        private _drawInfluenceRadius() {

            if (this._influenceTexture) {
                this._influenceTexture.destroy();
                this.remove(this._influenceTexture);
            }
            this._influenceTiles = []

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
            let container = Game.INSTANCE.make.container({ x: this._tile.worldPosition.x, y: this._tile.worldPosition.y })//.setVisible(false);

            let mask = Game.INSTANCE.make.container({ x: this._tile.worldPosition.x, y: this._tile.worldPosition.y, add: false });

            for (let t of ring) {
                // Add this tile to the influence array
                this._influenceTiles.push(t);
                let image = t.getHexPrint(this._tribe.color);
                image.x -= this._tile.worldPosition.x;
                image.y -= this._tile.worldPosition.y;
                image.scale *= 1.1
                // image.alpha = 0.5
                container.add(image);

                image = t.getHexPrint(0x000000);
                image.x -= this._tile.worldPosition.x;
                image.y -= this._tile.worldPosition.y;
                mask.add(image);
            }


            let size = Helpers.getSize(container, this._tile.displayWidth, this._tile.displayHeight);
            console.log("SIZE", container.getBounds());


            let rt = Game.INSTANCE.add.renderTexture(this._tile.worldPosition.x, this._tile.worldPosition.y, size.width * 2, size.height * 2)
            rt.setOrigin(0.5, 0.5);
            rt.draw(container, size.width, size.height)
            container.iterate(c => c.destroy());
            container.destroy();

            rt.mask = new Phaser.Display.Masks.BitmapMask(Game.INSTANCE, mask);
            rt.mask.invertAlpha = true;

            this._influenceTexture = rt;
            this.add(this._influenceTexture);
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
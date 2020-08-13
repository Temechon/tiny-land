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
                key: 'city',
                add: false
            });

            cityImage.scale = ratio;
            this.add(cityImage)

            // Draw its influence area
            this.updateInfluenceRadius();
            this.add(this._influenceTexture)
            this._tile.addClickable(this);
        }

        get worldposition(): Phaser.Types.Math.Vector2Like {
            return { x: this._tile.worldPosition.x, y: this._tile.worldPosition.y }
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
                tile: this._tile,
                tribe: this._tribe
            });
            this._tribe.units.push(unit);
            this._tribe.add(unit);
        }

        /**
         * Returns the list of all unit this player can create on this city.
         */
        getListOfPossibleProduction(): Array<any> {
            let res = this._tribe.getListOfPossibleProduction();
            // TODO Filter the list according to the city capabilities (ex:strategic ressources, water...)
            return res;
        }

        getProductionOf(type: ResourceType): number {
            let res = 0;
            for (let t of this._influenceTiles) {
                res += t.resources[type];
            }

            return res;
        }

        updateInfluenceRadius() {

            if (this._influenceTexture) {
                this._influenceTexture.clearMask(true);
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
            let container = Game.INSTANCE.make.container({ x: this._tile.worldPosition.x, y: this._tile.worldPosition.y, add: false })//.setVisible(false);

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


            let rt = Game.INSTANCE.make.renderTexture({ x: this._tile.worldPosition.x, y: this._tile.worldPosition.y, width: size.width * 2, height: size.height * 2 })
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
            let listOfUnits = this.getListOfPossibleProduction();

            this.scene.events.emit("circularmenuon", {
                city: this,
                position: this.worldposition,
                constructions: listOfUnits
            });
            console.log("CITY ACTIVATED");
        }

        /**
        * The vision of this city is the set of hex in this influence zone
        */
        getVision(): Array<Tile> {
            return this._influenceTiles;
        }

        deactivate() {
            this.scene.events.emit("circularmenuoff");
            console.log("CITY DEACTIVATED");
        }

    }
}
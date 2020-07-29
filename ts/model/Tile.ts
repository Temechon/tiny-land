module CIV {

    export class Tile extends Phaser.GameObjects.Image {

        public type: TileType = TileType.Land;

        /** Row number */
        public r: number;
        /** Column number */
        public q: number;
        public name: string;
        private _map: WorldMap;

        /* TODO */
        private _vertices: Array<Phaser.Geom.Point> = [];
        private _edge: Array<{ from: Phaser.Geom.Point, to: Phaser.Geom.Point }> = [];


        /** The stuff that is currently on this tile - Can be one unit and one city for example*/
        private _onIt: IClickable[] = [];
        /** The index in the 'onIt' array of the stuff that is currently activated */
        private currentlyActivatedIndex: number = 0;

        constructor(config: {
            scene: Phaser.Scene,
            x: number,
            y: number,
            r: number,
            q: number
            key: string,
            map: WorldMap
        }) {
            super(config.scene, config.x, config.y, config.key);

            this.scale = ratio;
            this.r = config.r;
            this.q = config.q;
            this.name = chance.guid();
            this._map = config.map;

            this.setInteractive();

            this.on('pointerdown', this.onPointerDown.bind(this));

        }

        public get position(): Phaser.Geom.Point {
            let x = this.parentContainer.x + this.x;
            let y = this.parentContainer.y + this.y;
            return new Phaser.Geom.Point(x, y);
        }

        public getStorageXY(): { x: number, y: number } {
            return {
                x: this.r + Constants.MAP.SIZE,
                y: this.q + Constants.MAP.SIZE
            }
        }

        public get isWater(): boolean {
            return this.type === TileType.Water || this.type === TileType.DeepWater;
        }

        /**
         * Returns a graphics texture that is the same hexagon than this tile
         * @param color 
         */
        public getHexPrint(color: number): Phaser.GameObjects.Graphics {

            let radius = Game.INSTANCE.make.graphics({ x: this.position.x, y: this.position.y });
            radius.fillStyle(color, 1.0);
            radius.beginPath();
            radius.scale = ratio;
            // radius.alpha = 0.5

            let points = HexGrid.getPoints({
                width: this.width,
                height: this.height,
                x: 0,
                y: 0
            })

            radius.fillPoints(points);
            radius.setInteractive(
                new Phaser.Geom.Polygon(points),
                Phaser.Geom.Polygon.Contains
            );

            return radius;
            // radius.generateTexture(this.name, this.width, this.height);
            // return Game.INSTANCE.add.sprite(this.position.x, this.position.y, this.name);

            // Game.INSTANCE.textures.get(this.name);
            // radius.destroy();

            // let img = this.scene.make.image({
            //     scene: this.scene,
            //     x: this.position.x,
            //     y: this.position.y,
            //     key: 'hex'
            // });
            // img.scale = ratio;
            // return img;
        }

        public onPointerDown() {
            console.log('tile selected!')
            // Deactivate all other tiles
            this._map.deactivateAllOtherTiles(this);


            if (this._onIt.length === 0) {
                // Display something when clicking on this tile
                return;
            }
            // If we cycle around all stuff on this tile, reset all
            if (this.currentlyActivatedIndex === this._onIt.length) {
                this._onIt[this.currentlyActivatedIndex - 1].deactivate();
                this.currentlyActivatedIndex = 0;
                return;
            }
            // Deactivate last activated stuff
            if (this.currentlyActivatedIndex - 1 >= 0) {
                this._onIt[this.currentlyActivatedIndex - 1].deactivate();
            }
            // Activate next stuff on this tile
            let stuff = this._onIt[this.currentlyActivatedIndex];
            this.currentlyActivatedIndex++;
            stuff.activate();
        }

        public deactivate() {
            for (let s of this._onIt) {
                s.deactivate();
            }
            this.currentlyActivatedIndex = 0;
        }

        /**
         * Add the given stuff at the beginning of the onIt array. This stuff is now on this tile 
         */
        public addClickable(c: IClickable) {
            this._onIt.unshift(c);
        }

        /**
         * Remove the given stuff from the onIt array. This stuff is no longer on this tile 
         */
        public removeClickable(c: IClickable) {
            let index = this._onIt.indexOf(c);
            if (index === -1) {
                console.warn("This stuff was not on this tile!")
            } else {
                this._onIt.splice(index, 1);
            }
        }

        /** 
         * Returns true if this tile has a unit on it, false otherwise
         */
        public get hasUnit(): boolean {
            return this._onIt.filter(s => s instanceof Unit).length > 0;
        }

    }

}
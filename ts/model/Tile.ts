module CIV {

    export type Vertex = { coords: Phaser.Geom.Point, neighbours: number[] };

    export class Tile extends Phaser.GameObjects.Image {

        public type: TileType = TileType.Land;

        /** Row number */
        public r: number;
        /** Column number */
        public q: number;
        public name: string;
        private _map: WorldMap;

        /** Coordinates of each vertex of this tile */
        private _vertices: Array<Vertex> = [];


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

        get isWater(): boolean {
            return this.type === TileType.Water || this.type === TileType.DeepWater;
        }

        /**
         * Returns true if the given vertex is shared with this tile
         */
        hasVertex(vex: Vertex): boolean {
            for (let v of this._vertices) {
                if (Phaser.Math.Distance.BetweenPointsSquared(vex.coords, v.coords) < 1) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Returns the vertex corresponding to the given vertex position for this tile, null if not found
         */
        getVertex(vex: Vertex): Vertex {
            for (let v of this._vertices) {
                if (Phaser.Math.Distance.BetweenPointsSquared(vex.coords, v.coords) < 1) {
                    return v;
                }
            }
            return null;
        }

        getRandomVertex(): Vertex {
            return chance.pickone(this._vertices);
        }
        /**
         * Returns the vertex corresponding to the given vertex position for this tile, null if not found
         */
        getVertexByIndex(index: number): Vertex {
            return this._vertices[index]
        }

        /**
         * Returns a random neighbour of the given vertex
         */
        getRandomNeighbourVertex(vex: Vertex): Vertex {
            return this._vertices[chance.pickone(vex.neighbours)];
        }

        /**
         * Returns all vertices shared with the given tile.
         */
        getVerticesSharedWith(tile: Tile): Array<Vertex> {
            let otherVertices = tile._vertices;
            let res: Vertex[] = [];
            for (let v of this._vertices) {
                for (let ov of otherVertices) {
                    if (Phaser.Math.Distance.BetweenPointsSquared(v.coords, ov.coords) < 1) {
                        res.push(ov);
                    }
                }
            }
            return res;
        }

        /**
         * Store all vertices for this tile and its edge in memory, in order to draw rivers
         */
        computePointsAndEdges() {

            let points = HexGrid.getPoints({
                width: this.displayWidth,
                height: this.displayHeight,
                x: this.position.x,
                y: this.position.y
            });

            for (let i = 0; i < points.length; i++) {
                let p = points[i];
                this._vertices.push({
                    coords: p,
                    neighbours: [(i - 1) < 0 ? points.length - 1 : i - 1, (i + 1) % points.length]
                })
            }
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
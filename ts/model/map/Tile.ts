module CIV {

    export type Vertex = { coords: Phaser.Geom.Point, neighbours: number[] };
    export type RQ = { r: number, q: number };

    export class Tile extends Phaser.GameObjects.Image {

        public type: TileType = TileType.Land;

        /** All resources that can be found on this tile. Index: Resource type, value : number of this type */
        public resources: number[] = [];

        public hasRiver: boolean = false;

        /** Row and col number */
        public rq: RQ;

        public name: string;
        private _map: WorldMap;

        /** Coordinates of each vertex of this tile */
        private _vertices: Array<Vertex> = [];

        /** The stuff that is currently on this tile - Can be one unit and one city for example*/
        private _onIt: IClickable[] = [];
        /** The index in the 'onIt' array of the stuff that is currently activated */
        private currentlyActivatedIndex: number = 0;

        /** The list of sprites added on this tile (trees, rocks...) */
        assets: Array<Phaser.GameObjects.Image> = [];

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
            this.rq = { r: config.r, q: config.q };
            this.name = chance.guid();
            this._map = config.map;

            this.setInteractive();

            this.on('pointerdown', this.onPointerDown.bind(this));

        }

        get worldPosition(): Phaser.Geom.Point {
            let x = this.parentContainer.x + this.x;
            let y = this.parentContainer.y + this.y;
            return new Phaser.Geom.Point(x, y);
        }

        getStorageXY(): { x: number, y: number } {
            return {
                x: this.rq.r + Constants.MAP.SIZE,
                y: this.rq.q + Constants.MAP.SIZE
            }
        }

        get isWater(): boolean {
            return this.type === TileType.Water || this.type === TileType.DeepWater;
        }

        get isLand(): boolean {
            return this.type === TileType.Land
        }

        /**
         * Returns true if the given vertex is shared with this tile
         */
        hasVertex(vex: Vertex): boolean {
            for (let v of this._vertices) {
                if (Phaser.Math.Distance.BetweenPointsSquared(vex.coords, v.coords) < 5 * ratio) {
                    return true;
                }
            }
            return false;
        }

        hasVertexAsPoint(p: Phaser.Geom.Point): boolean {
            for (let v of this._vertices) {
                if (Phaser.Math.Distance.BetweenPointsSquared(p, v.coords) < 5 * ratio) {
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
                if (Phaser.Math.Distance.BetweenPointsSquared(vex.coords, v.coords) < 5 * ratio) {
                    return v;
                }
            }
            return null;
        }

        getRandomVertex(): Vertex {
            return chance.pickone(this._vertices);
        }


        drawResources(container: Phaser.GameObjects.Container) {
            let positions: Phaser.Types.Math.Vector2Like[] = [];
            let nbResources = this.resources.filter(r => r !== 0).length
            let p1, p2, p3;
            let delta = 25 * ratio;

            // let wp = this.worldPosition;

            switch (nbResources) {
                case 1:
                    positions = [{ x: 0, y: 0 }];
                    break;
                case 2:
                    p1 = { x: 0, y: 0 };
                    p2 = { x: 0, y: 0 };
                    p1.y -= delta;
                    p2.y += delta;
                    positions = [p1, p2]
                    break;
                case 3:

                    p1 = { x: 0, y: 0 };
                    p2 = { x: 0, y: 0 };
                    p3 = { x: 0, y: 0 };
                    p1.x -= delta;
                    p1.y -= delta;
                    p2.x += delta;
                    p2.y -= delta;
                    p3.y += delta;
                    positions = [
                        p1, p2, p3
                    ]
                    break;

            }

            let p = 0;
            for (let type = 0; type < this.resources.length; type++) {
                let r = this.resources[type];
                if (r !== 0) {
                    this._drawResource(type, r, positions[p++], container);
                }
            }
        }

        _drawResource(type: ResourceType, nb: number, p: Phaser.Types.Math.Vector2Like, rootContainer: Phaser.GameObjects.Container) {
            let container = Game.INSTANCE.make.container({ x: 0, y: 0, add: false });
            let keys = ['gold', 'food', 'research'];
            let nbKeys = ['one', 'two', 'three', 'four', 'five'];
            let s = Game.INSTANCE.make.image({ x: p.x, y: p.y, key: keys[type], add: false });
            s.scale = ratio;
            container.add(s);
            let nbSprite = Game.INSTANCE.make.image({ x: p.x + 15 * ratio, y: p.y + 15 * ratio, key: nbKeys[nb - 1], add: false });
            nbSprite.scale = ratio;
            container.add(nbSprite);

            let rt = Game.INSTANCE.make.renderTexture({ x: this.worldPosition.x, y: this.worldPosition.y, width: this.displayWidth, height: this.displayHeight });
            rt.setOrigin(0.5, 0.5);

            // let g = Game.INSTANCE.make.graphics({ x: 0, y: 0 });
            // g.fillStyle(0xff0000);
            // g.fillCircle(0, 0, 50);
            // g.fillStyle(0xffffff, 0.15);
            // g.fillRect(0, 0, this.displayWidth, this.displayHeight)
            // rt.draw(g)
            rt.draw(container, this.displayWidth / 2, this.displayHeight / 2);
            rootContainer.add(rt);
            container.destroy();
        }
        /**
         * Returns all vertices shared with the given tile.
         */
        getVerticesSharedWith(tile: Tile): Array<Vertex> {
            let otherVertices = tile._vertices;
            let res: Vertex[] = [];
            for (let v of this._vertices) {
                for (let ov of otherVertices) {
                    if (Phaser.Math.Distance.BetweenPointsSquared(v.coords, ov.coords) < 5 * ratio) {
                        res.push(v);
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
                x: this.x,
                y: this.y
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

            let radius = Game.INSTANCE.make.graphics({ x: this.worldPosition.x, y: this.worldPosition.y, add: false });
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
            console.log('tile selected!', this.rq)

            // Deactivate all other tiles
            this._map.deactivateAllOtherTiles(this);


            if (this._onIt.length === 0) {
                // If there is no stuff on this tile, nothing to do
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
            this.currentlyActivatedIndex = 0;
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
            this.currentlyActivatedIndex = 0;
        }

        /** 
         * Returns true if this tile has a unit on it, false otherwise
         */
        public get hasUnit(): boolean {
            return this._onIt.filter(s => s instanceof Unit).length > 0;
        }
        public get isEmpty(): boolean {
            return this._onIt.length === 0;
        }

        /**
         * Draw the path from the 'from' vertex, to the 'to' vertex. Returns the list of vertex use to draw this path, including 'from' and 'to'
         */
        drawShortestEdgePath(from: Vertex, to: Vertex, graphics: Phaser.GameObjects.Graphics): Vertex[] {
            let path = this.getShortestEdgePath(from, to);

            for (let v = 0; v < path.length - 1; v++) {
                let vex = path[v];
                let vevex = path[v + 1]
                graphics.lineBetween(vex.coords.x, vex.coords.y, vevex.coords.x, vevex.coords.y);
            }
            return path;
        }

        getShortestEdgePath(from: Vertex, to: Vertex): Vertex[] {
            let dir1 = this._getEdgesPath(from, to, 0);
            let dir2 = this._getEdgesPath(from, to, 1);

            if (dir1.length < dir2.length) {
                return dir1;
            }
            return dir2;
        }

        /**
         * Includes from and to in the result array
         */
        private _getEdgesPath(from: Vertex, to: Vertex, dir: number): Vertex[] {
            let res = [from];
            let start = from;

            if (from === to) {
                return [];
            }
            for (let v = 0; v < this._vertices.length; v++) {
                let neighbour = this._vertices[start.neighbours[dir]];
                res.push(neighbour);
                if (neighbour === to) {
                    break;
                }
                start = neighbour;
            }

            return res;
        }

        equals(other: Tile) {
            return this.rq.q === other.rq.q && this.rq.r === other.rq.r;
        }
    }

}
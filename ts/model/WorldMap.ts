module CIV {
    export class WorldMap extends Phaser.GameObjects.Container {

        /** All tiles of this map, indexed by hexagon XY coordinates. Hex(q, r) is at array[x=r+SIZE][y=q+SIZE]  */
        private _tiles: Array<Array<Tile>> = [];

        /** The total number of tiles on this map */
        nbTiles: number;

        /** The hex grid coordinates (q,r) */
        public grid: HexGrid;

        /** The walking graph for land units */
        private _landgraph: Graph;

        /** the texture where resources from ll visible tiles will be drawn */
        resourceLayer: Phaser.GameObjects.Container;

        /** All rivers on this map */
        private _rivers: River[] = [];

        constructor(scene: Phaser.Scene) {
            super(scene);

            this.grid = new HexGrid(99, true);

            this._landgraph = new Graph();

            let mapCoords = this.grid.hexagon(0, 0, Constants.MAP.SIZE, true);
            this.nbTiles = mapCoords.length;
            console.log("MAP - ", this.nbTiles, "tiles");

            let noiseGen = new FastSimplexNoise(Constants.MAP.WATER.NOISE);
            let forestNoiseGen = new FastSimplexNoise(Constants.MAP.FOREST.NOISE);
            let mountainNoiseGen = new FastSimplexNoise(Constants.MAP.MOUNTAIN.NOISE);
            for (let c of mapCoords) {

                let center = this.grid.getCenterXY(c.q, c.r);

                let tile = new Tile({
                    scene: this.scene,
                    x: center.x * ratio,
                    y: center.y * ratio,
                    r: c.r,
                    q: c.q,
                    key: 'hex',
                    map: this
                });
                tile.setTint(0xA4BF69);
                tile.type = TileType.Land;
                this.push(tile);

                this.add(tile);

                let noise = noiseGen.scaled([c.q, c.r]);
                let forestNoise = forestNoiseGen.scaled([c.q, c.r]);
                let mountainNoise = mountainNoiseGen.scaled([c.q, c.r]);

                if (noise > Constants.MAP.WATER.THRESHOLD) {
                    tile.setTint(0x1B618C);
                    tile.type = TileType.Water;
                }
                else {

                    if (forestNoise > Constants.MAP.FOREST.THRESHOLD) {
                        tile.setTint(0x5E7348)
                        tile.type = TileType.Forest;
                    }
                    if (mountainNoise > Constants.MAP.MOUNTAIN.THRESHOLD) {
                        tile.setTint(0xF8F6FC)
                        tile.type = TileType.Mountain;
                    }
                }

                // Set resources for this tile
                Resource.setResources(tile);
            }

            // DEEPWATER - Only for tiles that are completely surrounded by water
            let allTiles = this.getAllTiles(t => true);
            for (let t of allTiles) {

                // If the tile is empty, continue
                if (!t) {
                    continue;
                }

                // Get the tile neighbors
                let neighbours = this.getNeighbours(t);
                let waterNeighbours = neighbours.filter(tile => {
                    if (!tile) {
                        return false;
                    } else {
                        return tile.type !== TileType.Water && tile.type !== TileType.DeepWater
                    }
                });

                // If all neighbours are only water, set it as deepwater
                if (waterNeighbours.length === 0) {
                    t.type = TileType.DeepWater
                    t.setTint(0x053959)
                }
            }

            // Arctic on north and south of the map (r = +-MAP.SIZE)
            let nbLineTop = chance.integer({ min: Constants.MAP.SIZE / 6, max: Constants.MAP.SIZE / 3 });
            let probamin = 1 / nbLineTop;

            for (let i = 0; i <= nbLineTop; i++) {
                let allTop = this.getAllTiles(t => t.rq.r === Constants.MAP.SIZE - i);
                allTop.push(...this.getAllTiles(t => t.rq.r === -Constants.MAP.SIZE + i));
                for (let t of allTop) {
                    if (chance.floating({ min: 0, max: 1 }) < (1 - probamin * (i - 1))) {
                        t.setTint(0xeeeeee);
                        t.type = TileType.Toundra;
                    }
                }
            }

            // Add this tile to the land graph
            this.doForAllTiles(t => this.addTileToGraph(t), t => !t.isWater)

            this.depth = Constants.LAYER.MAP;
            this.scene.add.existing(this);
            this.x = (this.scene.game.config.width as number) / 2;
            this.y = (this.scene.game.config.height as number) / 2;

            // Create rivers
            this.doForAllTiles(t => t.computePointsAndEdges());

            console.log("MAP - ", this.nbTiles / 75, "rivers");
            for (let i = 0; i < this.nbTiles / 75; i++) {
                let river = new River({
                    map: this,
                    size: { min: Constants.MAP.SIZE / 4, max: Constants.MAP.SIZE / 2 }
                });
                this._rivers.push(river);
                for (let t of river.tiles) {
                    t.hasRiver = true;
                }
                this.add(river.graphics);
            }
            // Draw all ressources on a container
            // this.updateResourceLayer();


        }

        /**
         * Draw the texture with all resources from all tiles on it.
         */
        drawResourceLayer() {
            let isVisible = false;
            if (this.resourceLayer) {
                isVisible = this.resourceLayer.visible;
                this.resourceLayer.destroy();
            }

            console.time("resource drawing")
            this.resourceLayer = Game.INSTANCE.add.container(0, 0);

            this.doForAllTiles(t => t.drawResources(this.resourceLayer))
            this.resourceLayer.depth = Constants.LAYER.RESOURCES_MAP;
            this.resourceLayer.visible = isVisible;

            // Mask
            let mask = Game.INSTANCE.make.container({ x: 0, y: 0 });
            this.doForAllTiles(t => {
                let image = t.getHexPrint(0x000000);
                // image.alpha = 0.5
                mask.add(image);
            }, t => !Game.INSTANCE.player.isInFogOfWar(t));

            this.resourceLayer.mask = new Phaser.Display.Masks.BitmapMask(Game.INSTANCE, mask);
            console.timeEnd("resource drawing")
        }

        updateResourceLayer() {
            if (!this.resourceLayer) {
                return;
            }

            console.time("mask drawing")
            this.resourceLayer.clearMask(true);
            // Mask
            let mask = Game.INSTANCE.make.container({ x: 0, y: 0 });
            this.doForAllTiles(t => {
                let image = t.getHexPrint(0x000000);
                // image.alpha = 0.5
                mask.add(image);
            }, t => !Game.INSTANCE.player.isInFogOfWar(t));

            this.resourceLayer.mask = new Phaser.Display.Masks.BitmapMask(Game.INSTANCE, mask);
            console.timeEnd("mask drawing")

        }


        /**
         * Returns true if the given tile is a correct starting point for a tribe
         */
        public isStartingLocationGood(t: Tile): boolean {
            let ring = this.grid.ring(t.rq.q, t.rq.r, 2);
            let tilesInRing = this.getTilesByAxialCoords(ring);
            // The starting location should not be on the border of the map
            if (tilesInRing.length <= 7) {
                return false;
            }
            // The starting location should not be near too much water
            let nbWaterInRing = tilesInRing.filter(t => t.isWater).length;
            if (nbWaterInRing < tilesInRing.length) {
                return true;
            }
            return false;
        }

        /**
         * Returns the list of tile (with its graphics) corrsponding to the given moving range 
         */
        public getMoveRange(config: { from: Tile; range: number; }): Array<Tile> {
            let res: Tile[] = [];
            let range: Tile[] = [];

            for (let i = config.range; i >= 1; i--) {
                range.push(...this.getTilesByAxialCoords(this.grid.ring(config.from.rq.q, config.from.rq.r, i)))
            }

            for (let n of range) {
                // Check if the path between the 'from' tile and this neighbours is <= to the range number
                if (n.isWater) {
                    continue;
                }
                if (n.hasUnit) {
                    continue;
                }

                // let path = this._landgraph.shortestPath(config.from.name, n.name);
                let path = HexGrid.axialDistance(config.from.rq.q, config.from.rq.r, n.rq.q, n.rq.r)
                if (path > config.range + 1) {
                    continue;
                }

                res.push(n);
            }
            return res;
        }

        /**
         * Deactivate all tiles (before activating one generally)
         */
        public deactivateAllOtherTiles(tile: Tile) {
            this.doForAllTiles(t => t.deactivate(), t => t.name !== tile.name);
        }

        /**
         * Return the list of neighbours of the given tile
         */
        getNeighbours(t: Tile): Array<Tile> {
            return this.getTilesByAxialCoords(this.grid.neighbors(t.rq.q, t.rq.r));
        }


        /** MANIPULATE TILES */
        /**
         * Add the given tile to the map storage data
         */
        private push(t: Tile) {
            let coords = t.getStorageXY();
            if (!this._tiles[coords.x]) {
                this._tiles[coords.x] = [];
            }
            this._tiles[coords.x][coords.y] = t;
        }

        public getTile(x: number, y: number): Tile | null {
            return this._tiles[x][y] || null;
        }

        /**
         * Return a tile by its given axial coordinates. Uselful when ahg lib gives only coordinates
         */
        public getTileByAxialCoords(q: number, r: number): Tile | null {
            if (q < -Constants.MAP.SIZE || q > Constants.MAP.SIZE) {
                return null;
            }
            if (r < -Constants.MAP.SIZE || r > Constants.MAP.SIZE) {
                return null;
            }
            return this._tiles[r + Constants.MAP.SIZE][q + Constants.MAP.SIZE] || null;
        }

        /**
         * Return the list of tiles corresponding to the given coordinates.
         * Removes all tile that are null (not in the map)
         */
        public getTilesByAxialCoords(coords: Array<{ q: number, r: number }>): Array<Tile> {
            let res = [];

            for (let coord of coords) {
                let tile = this.getTileByAxialCoords(coord.q, coord.r);
                if (tile) {
                    res.push(tile);
                }
            }
            return res;
        }

        /**
         * Returns all tile that satisfies the given predicate
         */
        public getAllTiles(predicate: (t: Tile) => boolean): Array<Tile> {

            let res = [];

            for (let x = 0; x < this._tiles.length; x++) {
                for (let y = 0; y < this._tiles[0].length; y++) {
                    let t = this.getTile(x, y);

                    // If the tile is empty, continue
                    if (!t) {
                        continue;
                    }
                    if (predicate(t)) {
                        res.push(t);
                    }
                }
            }
            return res;
        }


        /**
         * Do a specific action for all tiles where the given predicate is true.
         * Returns all tiles impacted by this action
         */
        public doForAllTiles(action: (t: Tile) => void, predicate?: (t: Tile) => boolean): Array<Tile> {

            let res = [];
            if (!predicate) {
                predicate = (t) => true;
            }

            for (let x = 0; x < this._tiles.length; x++) {
                for (let y = 0; y < this._tiles[0].length; y++) {
                    let t = this.getTile(x, y);

                    // If the tile is empty, continue
                    if (!t) {
                        continue;
                    }
                    if (predicate(t)) {
                        action(t);
                        res.push(t);
                    }
                }
            }
            return res;
        }

        /**
         * A the given tile in the walking graph
         */
        public addTileToGraph(tile: Tile) {
            if (tile.isWater) {
                // Nothing to do
                return;
            }

            let neighboursSet = {};

            let neighbours = this.getTilesByAxialCoords(this.grid.neighbors(tile.rq.q, tile.rq.r));
            for (let n of neighbours) {
                if (n.isWater) {
                    continue;
                }
                // Road from tile to n
                neighboursSet[n.name] = 1;
            }
            this._landgraph.addVertex(tile.name, neighboursSet);
        }

        /**
         * Returns the path (as tile name) between the two given tiles.
         */
        getPath(from: string, to: string): Array<string> {
            let path = this._landgraph.shortestPath(from, to);
            console.log(path)
            return path;
        }

        /** DEBUG USEFULNESS ONLY */
        public displayGraph() {

            let graphics = Game.INSTANCE.add.graphics();
            graphics.lineStyle(5, 0xff0000, 0.15)
            graphics.fillStyle(0xff0000)
            // graphics.fillRect(0, 0, 300, 300);

            // DEBUG : VIEW GRAPH BETWEEN HEXAGONS
            let viewLink = (tile: Tile, neighbors: any) => {

                for (let n in neighbors) {
                    graphics.beginPath();

                    graphics.moveTo(tile.worldPosition.x, tile.worldPosition.y);
                    // get hex by name
                    let hexn = this.getAllTiles(t => t.name === n)[0];
                    let pos = hexn.worldPosition;
                    graphics.lineTo(pos.x, pos.y);;

                    graphics.closePath()
                    graphics.strokePath();
                }
            }

            for (let vertex in this._landgraph.vertices) {
                // get hex by name
                let hex = this.getAllTiles(t => t.name === vertex)[0];
                viewLink(hex, this._landgraph.vertices[vertex]);
            }
            // END DEBUG
        }

        /**
         * Tries 10 times max to get 'nb' tiles separated by 'disancemax' tiles. 
         * If the selected tile does not answer to the condition, a new try is done
         */
        getEvenlyLocatedTiles(nb: number, distanceMax: number, condition?: (t: Tile) => boolean): Array<Tile> {
            let res = [];
            // If no condition is set, the selected tile is the corect one
            if (!condition) {
                condition = t => true;
            }
            for (let i = distanceMax; i > 0; i--) {
                // Let's try 10 times at this distance
                for (let tryy = 0; tryy < 10; tryy++) {
                    console.log("Try", tryy, "for distance", i);
                    let chosenTiles = [];
                    let allLandTiles = this.getAllTiles(t => !t.isWater && t.isEmpty && condition(t));

                    for (let j = 0; j < nb; j++) {
                        if (allLandTiles.length === 0) {
                            break;
                        }
                        let tile = chance.pickone(allLandTiles);
                        allLandTiles = allLandTiles.filter(t => HexGrid.axialDistance(t.rq.q, t.rq.r, tile.rq.q, tile.rq.r) >= i);
                        chosenTiles.push(tile);
                    }
                    if (chosenTiles.length === nb) {
                        console.log("final distance", i)
                        return chosenTiles;
                    }
                }
            }
            console.warn("Impossible to find evenly placed tiles")
            return res;
        }
    }
}
module CIV {
    export class WorldMap extends Phaser.GameObjects.Container {

        /** All tiles of this map, indexed by hexagon XY coordinates. Hex(q, r) is at array[x=r+SIZE][y=q+SIZE]  */
        private _tiles: Array<Array<Tile>> = [];

        /** The hex grid coordinates (q,r) */
        public grid: HexGrid;

        /** The walking graph for land units */
        private _landgraph: Graph;

        constructor(scene: Phaser.Scene) {
            super(scene);

            this.grid = new HexGrid(99, true);

            this._landgraph = new Graph();

            let mapCoords = this.grid.hexagon(0, 0, Constants.MAP.SIZE, true);


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
                else if (forestNoise > Constants.MAP.FOREST.THRESHOLD) {
                    tile.setTint(0x5E7348)
                    tile.type = TileType.Forest;
                }
                else if (mountainNoise > Constants.MAP.MOUNTAIN.THRESHOLD) {
                    tile.setTint(0xF8F6FC)
                    tile.type = TileType.Mountain;
                }
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

                // Add this tile to the land graph
                this.addTileToGraph(t);
            }


            this.scene.add.existing(this);
            this.x = (this.scene.game.config.width as number) / 2;
            this.y = (this.scene.game.config.height as number) / 2;

            // Create rivers
            this.doForAllTiles(t => true, t => t.computePointsAndEdges());

            new River(this);

            // // Get direction of water
            // let waterFlow = new Phaser.Math.Vector2(
            //     water.position.x - land.position.x,
            //     water.position.y - land.position.y,
            // );
            // let angle = waterFlow.angle();
            // if (angle === 0) {
            //     console.log("EAST");
            // } else if (angle < Math.PI / 2) {
            //     console.log("SOUTH EAST !")
            // } else if (angle < Math.PI) {
            //     console.log("SOUTH WEST");
            // } else if (angle < 3 * Math.PI / 2) {
            //     console.log("NORTH WEST");
            // } else {
            //     console.log("NORTH EAST")
            // }


            // let river = [land];
            // let riverVertex = [currentVertex];

            // let isVertexInRiver = (vex: Vertex): boolean => {
            //     for (let r of riverVertex) {
            //         if (Phaser.Math.Distance.BetweenPointsSquared(r.coords, vex.coords) < 1) {
            //             return true;
            //         }
            //     }
            //     return false;
            // }
            // let nbOfTileInRiver = (tile: Tile): number => {
            //     return river.filter(t => t.name === tile.name).length;
            // }

            // for (let i = 0; i < 20; i++) {
            //     graphics.fillCircle(currentVertex.coords.x, currentVertex.coords.y, 10)

            //     // Get all tiles not water near the current vertex
            //     let neighbourhood = this.getNeighbours(land).filter(t => !t.isWater && t.hasVertex(currentVertex))
            //     neighbourhood.push(land);
            //     for (let n of neighbourhood) {
            //         // n.setTint(0xff0000)
            //     }

            //     let nextTile = chance.pickone(neighbourhood);
            //     // nextTile.setTint(0xffff00)

            //     // Get the current vertex on the next tile
            //     let nextVertex = nextTile.getVertex(currentVertex);
            //     let nextVertexRandomNeighbours = chance.shuffle(nextVertex.neighbours);
            //     let nextVertexNeighbour = nextTile.getVertexByIndex(nextVertexRandomNeighbours[0]);

            //     // Get neighbourhodd of this vertex
            //     neighbourhood = this.getNeighbours(nextTile).filter(t => !t.isWater && t.hasVertex(nextVertexNeighbour));




            //     if (isVertexInRiver(nextVertexNeighbour)) {
            //         nextVertexNeighbour = nextTile.getVertexByIndex(nextVertexRandomNeighbours[1]);
            //     }

            //     // neighbourhood = this.getNeighbours(nextTile).filter(t => !t.isWater && t.hasVertex(nextVertexNeighbour))


            //     // // Get its neighbour
            //     // let n1 = nextTile.getNeighbourVertex(nextVertex, 0);
            //     // let n2 = nextTile.getNeighbourVertex(nextVertex, 1);
            //     // let nextVertexNeighbour = n2
            //     riverVertex.push(nextVertexNeighbour)

            //     // Draw line between current vertex and next vertex
            //     graphics.lineBetween(
            //         currentVertex.coords.x, currentVertex.coords.y,
            //         nextVertexNeighbour.coords.x, nextVertexNeighbour.coords.y
            //     );

            //     currentVertex = nextVertexNeighbour;
            //     land = nextTile;

            // }


            // Get random vertex of this tile
            // let vertex = land.randomVertex;
            // graphics.fillCircle(vertex.coords.x, vertex.coords.y, 10)
            // // Get a random neighbour tile that is not water
            // let neighbour = chance.pickone(this.getNeighbours(land).filter(t => !t.isWater));
            // neighbour.setTint(0xff00ff);
            // // Find the same vertex of the selected one
            // let vv = neighbour.findVertex(vertex);
        }

        /**
         * A starting city is a random land tile
         */
        public setStartingCity(tribe: Tribe): City {
            let allLandTiles = this.getAllTiles(t => t.type === TileType.Land);

            let viableLocationFound = false;
            let startingTile = null;
            while (!viableLocationFound) {
                startingTile = chance.pickone(allLandTiles) as Tile;
                // get ring(2) of this tile
                let ring = this.grid.ring(startingTile.q, startingTile.r, 2);
                let tilesInRing = this.getTilesByAxialCoords(ring);
                // tilesInRing.map(t => t.setTint(0xff00ff))
                // The starting location should not be on the border of the map
                if (tilesInRing.length <= 7) {
                    continue;
                }
                // The starting location should not be near too much water
                let nbWaterInRing = tilesInRing.filter(t => t.isWater).length;
                if (nbWaterInRing < tilesInRing.length) {
                    viableLocationFound = true;
                }
            }

            let city = new City({
                scene: this.scene,
                tile: startingTile,
                worldmap: this,
                tribe: tribe
            });

            return city;
        }

        /**
         * Returns the list of tile (with its graphics) corrsponding to the given moving range 
         */
        public getMoveRange(config: { from: Tile; range: number; }): Array<{ tile: Tile, graphic: Phaser.GameObjects.Graphics }> {
            let res: Array<{ tile: Tile, graphic: Phaser.GameObjects.Graphics }> = [];
            let range: Tile[] = [];
            for (let i = config.range; i >= 1; i--) {
                range.push(...this.getTilesByAxialCoords(this.grid.ring(config.from.q, config.from.r, i)))
            }

            for (let n of range) {
                // Check if the path between the 'from' tile and this neighbours is <= to the range number
                if (n.isWater) {
                    continue;
                }
                if (n.hasUnit) {
                    continue;
                }

                let path = this._landgraph.shortestPath(config.from.name, n.name);
                console.log(path.length);
                if (path.length <= 1 || path.length > config.range + 1) {
                    continue;
                }


                res.push({
                    tile: n,
                    graphic: n.getHexPrint(0xff0000)
                });
            }

            return res;
        }

        /**
         * Deactivate all tiles (before activating one generally)
         */
        public deactivateAllOtherTiles(tile: Tile) {
            this.doForAllTiles(t => t.name !== tile.name, t => t.deactivate());
        }

        /**
         * Return the list of neighbours of the given tile
         */
        getNeighbours(t: Tile): Array<Tile> {
            return this.getTilesByAxialCoords(this.grid.neighbors(t.q, t.r));
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
        public doForAllTiles(predicate: (t: Tile) => boolean, action: (t: Tile) => void): Array<Tile> {

            let res = [];

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

            let neighbours = this.getTilesByAxialCoords(this.grid.neighbors(tile.q, tile.r));
            for (let n of neighbours) {
                if (n.isWater) {
                    continue;
                }
                // Road from tile to n
                neighboursSet[n.name] = 1;
            }
            this._landgraph.addVertex(tile.name, neighboursSet);
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

                    graphics.moveTo(tile.position.x, tile.position.y);
                    // get hex by name
                    let hexn = this.getAllTiles(t => t.name === n)[0];
                    let pos = hexn.position;
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
    }
}
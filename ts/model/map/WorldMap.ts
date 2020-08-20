module CIV {
    export class WorldMap extends Phaser.GameObjects.Container {

        /** All tiles of this map, indexed by hexagon XY coordinates. Hex(q, r) is at array[x=r+SIZE][y=q+SIZE]  */
        private _tiles: Array<Array<Tile>> = [];

        /** The total number of tiles on this map */
        nbTiles: number;

        /** The hex grid coordinates (q,r) */
        private _grid: HexGrid;

        /** The walking graph for land units */
        private _landgraph: Graph;

        /** the texture where resources from ll visible tiles will be drawn */
        resourceLayer: Phaser.GameObjects.Container;

        /** All rivers on this map */
        private _rivers: River[] = [];

        constructor(scene: Phaser.Scene) {
            super(scene);

            this.scene.add.existing(this);
            this.x = (this.scene.game.config.width as number) / 2;
            this.y = (this.scene.game.config.height as number) / 2;

        }
        create() {
            this._grid = new HexGrid(97, true);

            this._landgraph = new Graph();

            let mapCoords = this._grid.hexagon(0, 0, Constants.MAP.SIZE, true);
            this.nbTiles = mapCoords.length;
            this.depth = Constants.LAYER.MAP.ROOT;

            console.log("MAP - ", this.nbTiles, "tiles");

            let noiseGen = new FastSimplexNoise(Constants.MAP.WATER.NOISE);
            let noiseForestGen = new FastSimplexNoise(Constants.MAP.FOREST.NOISE);
            let noiseMountainGen = new FastSimplexNoise(Constants.MAP.MOUNTAIN.NOISE);
            for (let c of mapCoords) {

                let center = this._grid.getCenterXY(c.q, c.r);

                let tile = new Tile({
                    scene: this.scene,
                    x: center.x * ratio,
                    y: center.y * ratio,
                    r: c.r,
                    q: c.q,
                    key: 'hex',
                    map: this
                });
                this.push(tile);
                this.add(tile);

                let noise = noiseGen.scaled([c.q, c.r]);
                let noiseForest = noiseForestGen.scaled([c.q, c.r]);
                let noiseMountain = noiseMountainGen.scaled([c.q, c.r]);

                if (noise < Constants.MAP.DEEPWATER) {
                    tile.type = TileType.DeepWater
                    tile.setTexture('deepwater')
                    // tile.setTint(0x053959)
                    Resource.setResources(tile);
                    continue
                }

                if (noise < Constants.MAP.WATER.THRESHOLD) {
                    // tile.setTint(0x1B618C);
                    tile.setTexture('water')
                    tile.type = TileType.Water;
                    // Set resources for this tile
                    Resource.setResources(tile);
                    continue
                }

                // tile.setTint(0xA4BF69);
                // tile.type = TileType.Land;
                // Set resources for this tile

                if (noiseForest < Constants.MAP.FOREST.THRESHOLD) {
                    tile.setTexture('forest')
                    // tile.setTint(0x5E7348)
                    tile.type = TileType.Forest;
                    // Set resources for this tile
                    Resource.setResources(tile);
                    continue
                }
                if (noiseMountain > Constants.MAP.MOUNTAIN.THRESHOLD) {
                    // tile.setTexture("mountain")
                    tile.setTint(0x2f2a2c);
                    tile.type = TileType.Mountain;
                    // Set resources for this tile
                    Resource.setResources(tile);
                    continue
                }

                if (chance.floating({ min: 0, max: 1 }) < 0.2) {
                    tile.setTexture('land2')
                } else {
                    tile.setTexture("land");
                }
                tile.type = TileType.Land;
                Resource.setResources(tile);

            }

            // Arctic on north and south of the map (r = +-MAP.SIZE)
            let nbLineTop = 3;
            let probamin = 1 / nbLineTop;

            for (let i = 0; i <= nbLineTop; i++) {
                let allTop = this.getAllTiles(t => t.rq.r === Constants.MAP.SIZE - i);
                allTop.push(...this.getAllTiles(t => t.rq.r === -Constants.MAP.SIZE + i));
                for (let t of allTop) {
                    if (chance.floating({ min: 0, max: 1 }) < (1 - probamin * i)) {
                        t.setTint(0xffffff)
                        t.setTexture('toundra');
                        t.type = TileType.Toundra;
                    }
                }
            }

            // Add this tile to the land graph
            this.doForAllTiles(t => this.addTileToGraph(t), t => !t.isWater)

            // Create rivers
            try {
                this.doForAllTiles(t => t.computePointsAndEdges());
                let nbRivers = Math.floor(this.nbTiles / 50);
                console.log("MAP -", nbRivers, "rivers");
                let starts = this.getEvenlyLocatedTiles(
                    nbRivers,
                    Constants.MAP.SIZE / 2,
                    this.isRiverStartingLocationCorrect.bind(this, Constants.MAP.SIZE / 4)
                )

                let riversGraphics = Game.INSTANCE.make.graphics({ x: 0, y: 0, add: false });
                riversGraphics.depth = Constants.LAYER.MAP.RIVER;

                for (let s of starts) {
                    let river = new River({
                        map: this,
                        startTile: s,
                        graphics: riversGraphics
                    });
                    this._rivers.push(river);
                    for (let t of river.tiles) {
                        t.hasRiver = true;
                    }
                }
                this.add(riversGraphics);
            } catch (e) {
                console.error(e);
            }


            // TREES /MOUNTAINS !
            this.doForAllTiles(t => {
                let img;
                if (t.type === TileType.Forest) {
                    img = Game.INSTANCE.add.image(t.worldPosition.x, t.worldPosition.y, 'tree');
                    img.setOrigin(0.5, 0.75)
                }
                if (t.type === TileType.Mountain) {
                    img = Game.INSTANCE.add.image(t.worldPosition.x, t.worldPosition.y, 'mountain');
                }

                t.assets.push(img);
                img.scale = ratio;
                img.depth = Constants.LAYER.TREES;
                // this.add(tree);

            }, t => t.type === TileType.Forest || t.type === TileType.Mountain)


            // Special resources
            let resources = this.scene.cache.json.get('resources');
            let numberOfTiles = this.getAllTiles(t => t.isLand).length;
            let totalNumberOfResources = numberOfTiles * 0.1;

            let numberOfResources = Math.floor(totalNumberOfResources / resources.length);

            for (let r of resources) {

                let res = r as ResourceInfo;

                let tiles = this.getEvenlyLocatedTiles(numberOfResources, Constants.MAP.SIZE * 2, t => res.canBeFoundOn.indexOf(t.type) !== -1);
                for (let t of tiles) {
                    t.setTexture(res.key);

                    // Add ressources on this tile
                    for (let key in res.bonus) {
                        let value = parseInt(res.bonus[key]);
                        console.log(key, value);
                        t.resources[ResourceType[key]] += value;
                    }
                }
            }

            console.log("MAP -", this.getAllTiles(t => t.isWater).length, "water tiles");
            console.log("MAP -", this.getAllTiles(t => !t.isWater).length, "land tiles");

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

            // console.time("mask drawing")
            this.resourceLayer.clearMask(true);
            // Mask
            let mask = Game.INSTANCE.make.container({ x: 0, y: 0 });
            this.doForAllTiles(t => {
                let image = t.getHexPrint(0x000000);
                // image.alpha = 0.5
                mask.add(image);
            }, t => !Game.INSTANCE.player.isInFogOfWar(t));

            this.resourceLayer.mask = new Phaser.Display.Masks.BitmapMask(Game.INSTANCE, mask);
            // console.timeEnd("mask drawing")

        }


        /**
         * Returns true if the given tile is a correct starting point for a tribe
         */
        isStartingLocationCorrect(t: Tile): boolean {
            if (!t.isEmpty) {
                return false;
            }
            let ring = this._grid.ring(t.rq.q, t.rq.r, 2);
            let tilesInRing = this.getTilesByAxialCoords(ring);
            // The starting location should not be on the border of the map
            if (tilesInRing.length <= 7) {
                return false;
            }
            // The starting location should not be near too much water nor toundra
            let nbWaterInRing = tilesInRing.filter(t => t.isWater || t.type === TileType.Toundra).length;
            if (nbWaterInRing < tilesInRing.length / 3) {
                return true;
            }
            return false;
        }


        /**
         * Returns true if the given tile can be the start of a river : the distance to a water tile should be less than the given minimum distance
         */
        isRiverStartingLocationCorrect(min: number, t: Tile): boolean {
            if (t.type === TileType.Toundra) {
                return;
            }

            let water = this.getClosestWaterTile(t);
            if (water.distance < min) {
                return false;
            }
            return true;
        }
        /**
         * Returns the water tile the closest to the given tile
         */
        getClosestWaterTile(tile: Tile): { distance: number, tile: Tile } {
            let distance = 1
            while (true) {
                let waterTiles = this.getTilesByAxialCoords(
                    this._grid.ring(tile.rq.q, tile.rq.r, distance)
                ).filter(t => t.type === TileType.Water)
                if (waterTiles.length === 0) {
                    distance++;
                    continue;
                }
                return { distance: distance, tile: chance.pickone(waterTiles) };
            }
        }

        /**
         * Returns the list of tile (with its graphics) corrsponding to the given moving range 
         */
        public getMoveRange(config: { from: Tile; range: number; }): Array<Tile> {
            let res: Tile[] = [];
            let range: Tile[] = [];

            range = this.getRing(config.from, config.range);

            for (let n of range) {
                // Check if the path between the 'from' tile and this neighbours is <= to the range number
                if (n.isWater) {
                    continue;
                }
                if (n.hasUnit) {
                    continue;
                }

                let path = this._landgraph.shortestPath(config.from.name, n.name);
                if (path.length < 1 || path.length >= config.range + 1) {
                    continue
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
            return this.getTilesByAxialCoords(this._grid.neighbors(t.rq.q, t.rq.r));
        }

        /**
         * Returns all tiles (excluding the given tile) in a distance of 'nb' around the given tile.
         */
        getRing(t: Tile, nb: number = 1): Array<Tile> {
            let r = nb;
            let ring = [];
            while (r > 0) {
                ring.push(...this.getTilesByAxialCoords(
                    this._grid.ring(
                        t.rq.q, t.rq.r, r
                    )
                ))
                r--;
            }
            return ring;
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
         * Returns all tiles impacted by this action.
         * All tiles are browsed from the bottom left of the map to to top right
         */
        public doForAllTiles(action: (t: Tile) => void, predicate?: (t: Tile) => boolean): Array<Tile> {

            let res = [];
            if (!predicate) {
                predicate = (t) => true;
            }

            for (let x = this._tiles.length - 1; x >= 0; x--) {
                for (let y = this._tiles[0].length - 1; y >= 0; y--) {
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

            let neighbours = this.getTilesByAxialCoords(this._grid.neighbors(tile.rq.q, tile.rq.r));
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
            // console.time("find path")
            let path = this._landgraph.shortestPath(from, to);
            // console.timeEnd("find path")
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
                    let chosenTiles = [];
                    let allLandTiles = this.getAllTiles(t => !t.isWater && condition(t));

                    for (let j = 0; j < nb; j++) {
                        if (allLandTiles.length === 0) {
                            break;
                        }
                        let tile = chance.pickone(allLandTiles);
                        allLandTiles = allLandTiles.filter(t => HexGrid.axialDistance(t.rq.q, t.rq.r, tile.rq.q, tile.rq.r) >= i);
                        chosenTiles.push(tile);
                    }
                    if (chosenTiles.length === nb) {
                        // console.log("final distance", i)
                        return chosenTiles;
                    }
                }
            }
            console.warn("Impossible to find ", nb, "evenly placed tiles at distance", distanceMax)
            return res;
        }

        destroy() {
            this.doForAllTiles(t => t.destroy());
            if (this.resourceLayer) {
                this.resourceLayer.destroy();
            }

            super.destroy();
        }
    }
}
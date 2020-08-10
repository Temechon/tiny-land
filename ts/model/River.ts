module CIV {
    export class River {

        private map: WorldMap;

        /** Tile that are close to a river (at least two vertices in common) */
        tiles: Tile[] = [];

        /** The list of points the river go through */
        vertices: Phaser.Geom.Point[] = [];

        /** The grahics where the river is drawn */
        graphics: Phaser.GameObjects.Graphics;

        constructor(map: WorldMap) {
            this.map = map;
            this.draw();
        }



        draw() {
            if (this.graphics) {
                this.graphics.clear();
                this.graphics.destroy();
            }
            this.graphics = Game.INSTANCE.add.graphics();

            let river = this.setStartingPosition({ min: 4, max: 10 });

            // Starting point of the river
            let currentVertex = river.start.getRandomVertex();
            this.vertices.push(currentVertex.coords);

            // Get all tiles th river will go through
            let tiles: Tile[] = null;
            while (!tiles) {
                tiles = this.getTilesOfRiver(river.start, river.end);
            }

            // Compute river vertices and draw edges
            for (let i = 0; i < tiles.length - 1; i++) {
                let tile = tiles[i];
                let nextTile = tiles[i + 1];
                // Find the closest common vertex to the current vertex
                let v = this.getClosestTo(currentVertex, tile.getVerticesSharedWith(nextTile));

                let vertices = tile.getShortestEdgePath(currentVertex, v);
                vertices.shift();
                this.vertices.push(...vertices.map(vex => vex.coords))

                currentVertex = nextTile.getVertex(v);
            }

            // Draw the river as Beziers curves
            let path = new Phaser.Curves.Path(this.vertices[0].x, this.vertices[0].y);
            let points = this.vertices.map(p => new Phaser.Math.Vector2(p.x, p.y))
            points.push(new Phaser.Math.Vector2(river.end.x, river.end.y));
            path.splineTo(points);
            this.graphics.lineStyle(30 * ratio, 0x134C73);
            path.draw(this.graphics);

            path = new Phaser.Curves.Path(this.vertices[0].x, this.vertices[0].y);
            points = this.vertices.map(p => new Phaser.Math.Vector2(p.x, p.y))
            path.splineTo(points);
            this.graphics.lineStyle(8 * ratio, 0x165682);
            path.draw(this.graphics);

            // Get all neighbours of all river tiles that are not water and not already in the neighbourhood
            // including the river tiles
            let neighbourshood: Tile[] = [];
            for (let tile of tiles) {
                let neighbours = this.map.getNeighbours(tile);
                neighbourshood.push(...neighbours.filter(t => !t.isWater && !this.isInRiver(t, neighbourshood)));
            }

            // Get all tiles from the neighbourhood that have a common vertex with the river
            let res = []
            for (let v of this.vertices) {
                // Get all tiles from the neighbourhood that has this vertices
                res.push(...neighbourshood.filter(n => n.hasVertexAsPoint(v) && !this.isInRiver(n, res)))
            }

            // Kepp only tiles that have at least two common vertices with the river
            for (let r = 0; r < res.length; r++) {
                let tile = res[r];
                let nbOfVertices = this.vertices.filter(p => tile.hasVertexAsPoint(p)).length;
                if (nbOfVertices <= 1) {
                    res.splice(r, 1);
                    r--;
                }
            }
            this.tiles = res;
        }

        getClosestTo(vex: Vertex, vertices: Vertex[]): Vertex {
            let min = Number.MAX_VALUE, closest: Vertex = null;
            for (let v of vertices) {
                let dist = Phaser.Math.Distance.BetweenPointsSquared(vex.coords, v.coords);
                if (dist < min) {
                    min = dist;
                    closest = v;
                }
            }
            return closest;
        }

        setStartingPosition(config: { min: number, max: number }): { start: Tile, end: Tile } {
            // Get one random tile of land near water
            let land;
            while (true) {

                land = chance.pickone(
                    this.map.getAllTiles((t: Tile) => {
                        if (t.isWater) {
                            return false;
                        }
                        return true;
                    })
                );
                // Get the nearest water tile
                let water = this.getClosestWaterTile(land);
                if (water.distance < config.min || water.distance > config.max) {
                    continue;
                }
                return {
                    start: land,
                    end: water.tile
                }
            }
        }

        /**
         * Returns the water tile the closest to the given tile
         */
        getClosestWaterTile(tile: Tile): { distance: number, tile: Tile } {
            let distance = 1
            while (true) {
                let waterTiles = this.map.getTilesByAxialCoords(this.map.grid.ring(tile.q, tile.r, distance)).filter(t => t.isWater)
                if (waterTiles.length === 0) {
                    distance++;
                    continue;
                }
                return { distance: distance, tile: chance.pickone(waterTiles) };
            }
        }

        isInRiver(t: Tile, river: Tile[]): boolean {
            return river.filter(tt => tt.equals(t)).length > 0
        }

        getTilesOfRiver(from: Tile, to: Tile): Array<Tile> {
            let res = [from];
            let start = from;

            while (true) {
                let neighbours = this.map.getNeighbours(start);
                // Get a random neighbors where the axial distnce is less or equal than the current dist
                let dist = HexGrid.axialDistance(start.q, start.r, to.q, to.r);

                // Distace = 1 => river is finished
                if (dist === 1) {
                    break;
                }

                let possiblePicks = neighbours.filter(t =>
                    HexGrid.axialDistance(t.q, t.r, to.q, to.r) < dist &&
                    !t.isWater &&
                    !this.isInRiver(t, res));

                //If no possible pick, the river cannot be finished
                if (possiblePicks.length === 0) {
                    return null;
                }

                let selected = chance.pickone(possiblePicks);

                res.push(selected)
                start = selected;
            }
            res.push(to);
            return res;
        }

    }
}
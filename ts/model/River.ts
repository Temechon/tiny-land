module CIV {
    export class River {

        private map: WorldMap;

        constructor(map: WorldMap) {
            this.map = map;

            this.draw();
        }

        draw() {


            let graphics = Game.INSTANCE.add.graphics();
            graphics.fillStyle(0xff0000);
            graphics.lineStyle(5, 0xff0000);

            let river = this.setStartingPosition();
            river.start.setTint(0x00ff00);
            river.end.setTint(0x00ffff);

            // Starting point of the river, between water and land
            let currentVertex = river.start.getRandomVertex();
            graphics.fillCircle(currentVertex.coords.x, currentVertex.coords.y, 10)


        }

        setStartingPosition(): { start: Tile, end: Tile } {
            // Get one random tile of land near water
            let riverLength = 0;
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
                if (water.distance < 3 || water.distance > 5) {
                    continue;
                }

                return {
                    start: land,
                    end: water.tile
                }

            }
        }

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

    }
}
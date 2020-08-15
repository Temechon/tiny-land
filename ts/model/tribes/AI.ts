module CIV {
    export class AI extends Tribe {

        constructor(name: string) {
            super(name);

            // this.fogOfWar.render();
        }

        /**
         * The main method of this class. 
         * For now, it creates a unit and explore the world with it.
         */
        play() {
            if (this.units.length === 0) {
                let city = this.cities[0];
                city.produceUnit();
            }
            else {
                let warrior = this.units[0];
                // Get its move range
                let moverange = warrior.map.getMoveRange({
                    from: warrior.currentTile,
                    range: warrior.range
                })
                let nextTile = this._chooseTile(warrior, moverange);
                warrior.move(nextTile);
            }
        }

        /**
         * Choose the best tile to move to : 
         * - The tile that remove the most of fog of war
         * - The tile with the shortest distance to the fog of war
         */
        _chooseTile(unit: Unit, tiles: Array<Tile>): Tile {

            let selectedTile = null;

            // Count the number of fog removed by moving one
            let maxFogRemoved = Number.MIN_VALUE;
            for (let possibleMove of tiles) {
                // Get vision
                let vision = unit.getVision(possibleMove);
                // Count how much tile is in the tribe fog of war
                let nbFog = vision.filter(v => this.fogOfWar.has(v)).length;
                if (nbFog > maxFogRemoved) {
                    maxFogRemoved = nbFog;
                    selectedTile = possibleMove;
                }
            }

            console.log(maxFogRemoved);

            if (maxFogRemoved < 1) {
                // Get distance to fog of war
                let minDistanceToFog = Number.MAX_VALUE;
                for (let possibleMove of tiles) {
                    // Distance to fog of war
                    let distance = this.fogOfWar.getDistanceFrom(possibleMove);
                    if (distance < minDistanceToFog) {
                        minDistanceToFog = distance;
                        selectedTile = possibleMove;
                    }
                }
            }
            // If no selected tile, pck one randomly
            if (!selectedTile) {
                selectedTile = chance.pickone(tiles);
            }

            return selectedTile;
        }

    }
}
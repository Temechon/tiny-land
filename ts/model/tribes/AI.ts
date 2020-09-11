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
            if (this.units.length < 4) {
                let city = this.cities[0];
                if (!city.hasUnit) {
                    city.produceUnit(Game.INSTANCE.allUnits['warrior']);
                }
            }

            // All unit explore the world
            for (let unit of this.units) {
                if (unit.canMove) {
                    // Get its move range
                    let moverange = unit.map.getMoveRange({
                        from: unit.currentTile,
                        movement: unit.infos.movement
                    })

                    // IF the unit can move
                    if (moverange.length !== 0) {
                        let nextTile = this._chooseTile(unit, moverange);

                        // iF the current unit can be seen by the player, move it slowly. 
                        if (Game.INSTANCE.player.isInFogOfWar(unit.currentTile)) {
                            // Otherwise, just move it without animations
                            unit.move(nextTile);

                        } else {
                            // Game.INSTANCE.aiEvents.push(() => {   
                            // Animate main camera to the unit position if this unit is not one of the player
                            // this.scene.cameras.main.centerOn(unit.currentTile.worldPosition.x, unit.currentTile.worldPosition.y);

                            // });
                            Game.INSTANCE.aiEvents.push(() => {
                                return CameraHelper.animateTo(this.scene.cameras.main, unit.currentTile.worldPosition)
                            });
                            // Tempo between two moves
                            Game.INSTANCE.aiEvents.push(() => {
                                return new Promise(resolve => setTimeout(resolve, 100));
                            });

                            Game.INSTANCE.aiEvents.push(() => {
                                return unit.move(nextTile);
                            });
                            // Tempo between two moves
                            Game.INSTANCE.aiEvents.push(() => {
                                return new Promise(resolve => setTimeout(resolve, 500));
                            });
                        }

                    }
                }
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

            if (maxFogRemoved < 1) {
                console.time('path')
                let path = this.fogOfWar.getDistanceFrom(unit.currentTile);
                if (path) {
                    console.log("selected tile here");

                    selectedTile = tiles.filter(t => t.name === path.nextTile)[0];
                }
                console.timeEnd('path')
            }
            // If no selected tile, pck one randomly
            if (!selectedTile) {
                selectedTile = chance.pickone(tiles);
            }

            return selectedTile;
        }

    }
}
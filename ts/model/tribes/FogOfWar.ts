module CIV {

    type Fog = {
        rq: RQ,
        center: Phaser.Types.Math.Vector2Like,
        name: string
    };

    export class FogOfWar {

        private _container: Phaser.GameObjects.Container;

        coords: Array<Fog> = [];

        constructor() {
            // Add all tiles from the map in the fog of war
            Game.INSTANCE.map.doForAllTiles(t => this.add(t));
        }

        add(tile: Tile) {
            let c: Fog = {
                rq: tile.rq,
                center: tile.worldPosition,
                name: tile.name
            }
            this.coords.push(c);
            this._renderTile(c)
        }

        remove(tile: Tile) {
            this.coords = this.coords.filter(c => c.rq.r !== tile.rq.r || c.rq.q !== tile.rq.q)
            this._removeTile(tile.name)

        }

        has(tile: Tile): boolean {
            return this.coords.filter(c => c.rq.r === tile.rq.r && c.rq.q === tile.rq.q).length > 0;
        }

        /**
         * Creates images for each coord
         */
        render() {
            if (!this._container) {
                this._container = Game.INSTANCE.add.container();
                this._container.depth = Constants.LAYER.FOG_OF_WAR;
            }
            for (let c of this.coords) {
                this._renderTile(c);
            }
        }

        /**
         * Creates an image for te given fog cell
         */
        _renderTile(c: Fog) {
            if (this._container) {
                let fog = Game.INSTANCE.make.image({
                    x: c.center.x, y: c.center.y, key: 'hex', add: false, scale: ratio * 1.15
                })
                fog.name = c.name;
                this._container.add(fog)
            }
        }

        /**
         * Remove the image corresponding to the given cell fog
         */
        _removeTile(name: string) {
            if (this._container) {
                let fog = this._container.getByName(name);
                if (fog) {
                    Game.INSTANCE.tweens.add({
                        targets: fog,
                        alpha: 0,
                        scale: ratio * 2,
                        duration: 200,
                        onComplete: () => {
                            this._container.remove(fog, true);
                        }
                    })
                }

            }
        }

        /**
         * Returns the path distance (according to the landing graph) to the nearest fog cell, starting from the current cell
         */
        getDistanceFrom(tile: Tile): { distance: number, nextTile: string } {

            let axialDistance = this.coords.map(fog => {
                return {
                    fogname: fog.name,
                    distance: HexGrid.axialDistance(fog.rq.q, fog.rq.r, tile.rq.q, tile.rq.r)
                }
            });

            axialDistance = axialDistance.sort((a, b) => {
                return a.distance - b.distance
            });

            for (let i = 0; i < axialDistance.length; i++) {
                let axx = axialDistance[i];
                // If a path exist between 'tile' and this fog tile, return it
                let path = Game.INSTANCE.map.getPath(tile.name, axx.fogname);

                if (path.length > 0) {
                    return { distance: axx.distance, nextTile: path[0] };
                }
            }

            // NO path exist to the fog of war
            return null;
        }
    }
}
module CIV {
    export class Player extends Tribe {
        constructor(name: string) {
            super(name);

            // Fog of war
            if (Tribe.DEBUG_FOG_OF_WAR_ON) {
                this.fogOfWar = Game.INSTANCE.make.container({ x: 0, y: 0, add: false });
                this.add(this.fogOfWar);

                Game.INSTANCE.map.doForAllTiles(t => {
                    let fog = Game.INSTANCE.make.image({ x: t.worldPosition.x, y: t.worldPosition.y, key: 'hex', add: false });
                    fog.name = t.name;
                    fog.setTint(0x000000);
                    fog.scale = ratio * 1.1;
                    this.fogOfWar.add(fog);
                });
            }
        }
    }
}
module CIV {
    export class Player extends Tribe {
        constructor(name: string) {
            super(name);

            this.isPlayer = true;

            this.depth = Constants.LAYER.TRIBE_PLAYER;
            // Fog of war
            if (Tribe.DEBUG_FOG_OF_WAR_ON) {
                this.fogOfWar.render();
            }
        }
    }
}
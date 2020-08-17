/**
 * Contains all constants of the game
 */
abstract class Constants {

    static FONT = {
        TEXT: "OpenSans",
        NUMBERS: "KeepCalm"
    };

    public static MAP = {
        /** The map size */
        SIZE: 10, // 15 will be the final size

        /** Noise parameters for water */
        WATER: {
            NOISE: {
                min: 0,
                max: 200,
                octaves: 1,
                frequency: 0.08
            },
            THRESHOLD: 95 // Less is les water
        },
        MOUNTAIN: {
            NOISE: {
                min: 0,
                max: 200,
                octaves: 3,
                frequency: 0.35
            },
            THRESHOLD: 125
        },
        /** Noise parameters for forest */
        FOREST: {
            NOISE: {
                min: 0,
                max: 200,
                octaves: 5,
                frequency: 0.1
            },
            THRESHOLD: 75 // [min; max] : Less is more trees
        }
    };
    public static LAYER = {
        FOG_OF_WAR: 20,
        UNITS: 17,
        RESOURCES_MAP: 10,
        TREES: 5,
        TRIBE_PLAYER: 3,
        TRIBE_ROOT: 2,
        MAP: {
            RIVER: 2,
            ROOT: 1
        }
    }
}
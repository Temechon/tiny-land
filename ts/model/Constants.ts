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
                // min: 0,
                // max: 100,
                // octaves: 2,
                // frequency: 0.08
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
            THRESHOLD: 135
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
        TRIBE_PLAYER: 11,
        FOG_OF_WAR: 10,
        RESOURCES_MAP: 9,
        TRIBE_ROOT: 5,
        MAP: 3
    }
}
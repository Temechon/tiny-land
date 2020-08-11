/**
 * Contains all constants of the game
 */
abstract class Constants {

    public static MAP = {
        /** The map size */
        SIZE: 10, // 20 will be the final size

        /** Noise parameters for water */
        WATER: {
            NOISE: {
                min: 0,
                max: 255,
                octaves: 2,
                frequency: 0.06
            },
            THRESHOLD: 140 // [min; max] : Less is more water
        },
        /** Noise parameters for forest */
        FOREST: {
            NOISE: {
                min: 0,
                max: 255,
                octaves: 4,
                frequency: 0.07,
            },
            THRESHOLD: 160 // [min; max] : Less is more trees
        },
        /** Noise parameters for rocks */
        MOUNTAIN: {
            NOISE: {
                min: 0,
                max: 255,
                octaves: 5,
                frequency: 0.2,
            },
            THRESHOLD: 170 // [min; max] : Less is more rocks
        }
    };
    public static LAYER = {
        RESOURCES_MAP: 9,
        TRIBE_ROOT: 5,
        MAP: 3
    }
}
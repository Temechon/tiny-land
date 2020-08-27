/**
 * Contains all constants of the game
 */
abstract class Constants {

    static FONT = {
        TEXT: "OpenSans",
        NUMBERS: "KeepCalm"
    };

    /** The name of a settler in units.json */
    public static SETTLER_NAME = "Settler";

    public static MAP = {
        /** The map size */
        SIZE: 5, // 15 will be the final size

        /** Noise parameters for water */
        DEEPWATER: 50,
        WATER: {
            NOISE: {
                min: 0,
                max: 200,
                octaves: 1,
                frequency: 0.06
            },
            THRESHOLD: 70 // Less is les water
        },

        BEACH: 75,

        /** Noise parameters for forest */
        FOREST: {
            NOISE: {
                min: 0,
                max: 200,
                octaves: 5,
                frequency: 0.1
            },
            THRESHOLD: 75 // [min; max] : Less is more trees
        },
        MOUNTAIN: {
            NOISE: {
                min: 0,
                max: 200,
                octaves: 3,
                frequency: 0.4
            },
            THRESHOLD: 130
        },
    };
    public static LAYER = {
        FOG_OF_WAR: 20,
        RESOURCES_MAP: 17,
        UNITS: 10,
        TREES: 5,
        TRIBE_PLAYER: 3,
        TRIBE_ROOT: 2,
        MAP: {
            RIVER: 2,
            ROOT: 1
        }
    }

    static EVENTS = {
        CIRCULAR_MENU_ON: "circularmenuon",
        CIRCULAR_MENU_OFF: "circularmenuoff",
        UI_UPDATE: "uiupdate"
    }
}
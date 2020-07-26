/**
 * Hexagons on the map can be one of these kind
 */
enum TileType {
    Land = "land", /* Resource can grow on it */
    Water = "water", /* Only boat can go through */
    Forest = "forest",
    Mountain = "mountain",
    DeepWater = "deepwater" /* Only bigger boat can navigate here */
}

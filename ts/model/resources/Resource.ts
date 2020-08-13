module CIV {

    export enum ResourceType {
        Gold,
        Food,
        Science
    }

    export abstract class Resource {

        type: ResourceType;

        static setResources(tile: Tile) {
            let configGold, configFood, configResearch;

            switch (tile.type) {
                case TileType.Land:
                case TileType.Water:
                    configGold = { values: [1, 2], weights: [1, 0.75] };
                    configFood = { values: [1, 2, 3], weights: [0.75, 1, 1] };
                    configResearch = { values: [0, 1], weights: [0.75, 0.25] };
                    break;
                case TileType.Forest:
                    configGold = { values: [1, 2, 3], weights: [0.75, 1, 1] };
                    configFood = { values: [1, 2], weights: [1, 0.75] };
                    configResearch = { values: [0, 1], weights: [0.5, 0.5] };
                    break;

                case TileType.Mountain:
                    configGold = { values: [1, 2], weights: [1, 0.75] };
                    configFood = { values: [0, 1], weights: [0.5, 0.5] };
                    configResearch = { values: [1, 2, 3], weights: [0.75, 1, 1] };
                    break;
            }

            tile.resources[ResourceType.Gold] = chance.weighted(configGold.values, configGold.weights);
            tile.resources[ResourceType.Food] = chance.weighted(configFood.values, configFood.weights);
            tile.resources[ResourceType.Science] = chance.weighted(configResearch.values, configResearch.weights);
        }
    }
}
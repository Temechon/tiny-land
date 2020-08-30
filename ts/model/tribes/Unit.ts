module CIV {

    enum UnitState {
        IDLE,
        /** This unit has been selected */
        ACTIVATED,
        /** This unit is moving */
        MOVING,
        /** This unit is attacking */
        ATTACKING,
        /** This unit is waiting on the next turn to be able to move again */
        WAITING_NEXT_TURN
    }

    export class Unit extends Phaser.GameObjects.Container implements IClickable {

        infos: UnitInfo;

        /** The set of tile this unit can mvoe to */
        private _moveRange: Array<Tile>;
        private _moveRangeGraphics: Array<Phaser.GameObjects.Graphics>;
        private _text: Phaser.GameObjects.BitmapText;
        private _image: Phaser.GameObjects.Image;

        public currentTile: Tile;
        public map: WorldMap;
        /** The tribe this unit belong to */
        private _tribe: Tribe;
        state: UnitState = UnitState.IDLE;

        /** Create a city for a settler, heal, improve unit... */
        private _specialAction: Phaser.GameObjects.Image;

        constructor(config: {
            scene: Phaser.Scene,
            x: number,
            y: number,
            infos: UnitInfo,
            map: WorldMap,
            tile: Tile,
            tribe: Tribe
        }) {
            super(config.scene);

            this.infos = _.extend({}, config.infos);
            this.infos.hp = this.infos.hpmax

            this.currentTile = config.tile;
            this.map = config.map;
            this._tribe = config.tribe;
            this.depth = Constants.LAYER.UNITS;

            this.x = config.x;
            this.y = config.y;

            let image = this.scene.make.image({ x: 0, y: 0, scale: ratio, key: config.infos.key, add: false });
            this.add(image);
            this._image = image;

            // Display HP
            let style = {
                fontSize: Helpers.font(30),
                fontFamily: Constants.FONT.NUMBERS,
                color: "#fff",
                stroke: '#000',
                strokeThickness: 5 * ratio,
            };
            this._text = this.scene.make.bitmapText({
                x: image.x,
                y: image.y + image.displayHeight / 1.5,
                font: "font_normal",
                size: 30 * ratio,
                text: `${this.infos.hp}`,
                add: false
            }).setOrigin(0.5);

            this.add(this._text);

            this.currentTile.addClickable(this);
        }


        getTexture(): string {
            return this._image.texture.key;
        }

        /**
         * True if this unit can move
         */
        get canMove(): boolean {
            return this.state === UnitState.IDLE;
        }

        setWaitingNextTurn() {
            if (this._tribe.isPlayer) {
                this._image.setTint(0x555555);
            }

            this.state = UnitState.WAITING_NEXT_TURN;
        }

        setIdle() {
            this._image.setTint(0xffffff);
            this.state = UnitState.IDLE;
        }

        deactivate() {
            if (this._moveRangeGraphics) {
                this._moveRangeGraphics.forEach(i => i.destroy());
                this._moveRangeGraphics = null;
            }
            if (this.state === UnitState.ACTIVATED) {
                this.state = UnitState.IDLE
            }
            if (this._specialAction) {
                this._specialAction.destroy();
            }
        }

        activate() {
            // Check if the city belongs to the player
            if (!this._tribe.isPlayer) {
                return;
            }

            if (this.state === UnitState.WAITING_NEXT_TURN) {
                // Only display something like stat, but can't move
            } else if (this.canMove) {
                this.state = UnitState.ACTIVATED;

                // Check if this unit can attack someone
                this._displayAttack(this.canAttackOnTiles());

                // Display move range
                this._moveRange = this.map.getMoveRange({
                    from: this.currentTile,
                    movement: this.infos.movement
                });

                for (let tile of this._moveRange) {
                    let h = tile.getHexPrint(0x00ffaa);
                    h.x -= this.x
                    h.y -= this.y
                    h.scale *= 0.75;
                    this._moveRangeGraphics.push(h);
                    h.alpha = 0.5
                    this.add(h);
                    // Game.INSTANCE.add.existing(h);
                    h.on('pointerup', this.move.bind(this, tile));
                }

                // Special case for colons
                if (this.infos.name === Constants.SETTLER_NAME) {
                    console.log("name settler!")
                    if (City.canCreateHere(this.currentTile, this._tribe)) {

                        let img = this.scene.add.image(0, 0, 'settler_create');
                        this.add(img);
                        img.depth = 100;
                        img.scale = ratio;
                        img.setOrigin(0.5, 1.5);
                        img.setInteractive();
                        img.on('pointerdown', () => {
                            this.currentTile.removeClickable(this);
                            this.destroy();
                            this._tribe.setCityOn(this.currentTile);
                        })
                        this._specialAction = img;
                    }
                }
            }
        }

        /**
         * Display hexes where the unit can attack
         */
        private _displayAttack(attackTiles: Tile[]) {
            this._moveRangeGraphics = [];
            for (let tile of attackTiles) {
                let h = tile.getHexPrint(0xff3388);
                h.x -= this.x
                h.y -= this.y
                h.scale *= 0.75;
                this._moveRangeGraphics.push(h);
                h.alpha = 0.5
                this.add(h);
                h.on('pointerup', this.attack.bind(this, tile));
            }

        }

        /**
         * Returns true if the unit can attack another one (of a different tribe).
         * The enemy should be in range (ring(range)) and not in fog of war;
         * Returns the list of tile the unit can attack to.
         */
        canAttackOnTiles(): Array<Tile> {
            let res = [];
            let range = this.map.getRing(this.currentTile, this.infos.range);
            for (let tile of range) {
                if (this._tribe.fogOfWar.has(tile)) {
                    // Nothing to do here
                    continue;
                }

                if (tile.hasUnit && tile.unit._tribe !== this._tribe) {
                    res.push(tile);
                }
            }
            return res;
        }

        /**
         * Move this unit to the given tile.
         */
        move(tile: Tile) {
            this.state = UnitState.MOVING;

            Game.INSTANCE.add.tween({
                targets: this,
                x: tile.worldPosition.x,
                y: tile.worldPosition.y,
                duration: 50,
                onComplete: this.afterMove.bind(this)
            })

            // Deactivate this unit
            this.deactivate();
            // Remove this unit from the current tile
            this.currentTile.removeClickable(this);
            // Add this unit to the given tile
            this.currentTile = tile;
            this.currentTile.addClickable(this);

            // Update fog of war
            let vision = this.getVision();
            this._tribe.removeFogOfWar(vision);
        }

        /**
         * Attack the unit on the given tile.
         */
        attack(tile: Tile) {
            this.state = UnitState.ATTACKING;

            // Get unit on the other side
            let enemy = tile.unit;

            // get terrain modifier for defence
            let terrainModifierAttacker = this.currentTile.infos.defenseModifier;
            let terrainModifierDefencer = tile.infos.defenseModifier;

            // Animation and compute damage
            // Here, the unit is attacking the enemy
            Game.INSTANCE.add.tween({
                targets: this,
                x: tile.worldPosition.x,
                y: tile.worldPosition.y,
                duration: 150,
                ease: Phaser.Math.Easing.Expo.InOut,
                onComplete: () => {
                    // Compute damage
                    let hpRatio = this.infos.hp / this.infos.hpmax * 2;
                    let baseDamageAttacker = this.infos.strength * (chance.floating({ min: 1, max: 1.2 }) - terrainModifierDefencer) * hpRatio;
                    console.log("Attacker deals", Phaser.Math.Clamp(Math.round(baseDamageAttacker), 0, enemy.infos.hp))
                    enemy.infos.hp -= Phaser.Math.Clamp(Math.round(baseDamageAttacker), 0, enemy.infos.hp);
                    enemy._text.text = enemy.infos.hp.toString();

                    if (enemy.infos.hp <= 0) {
                        enemy.die();
                        // Move to the enemy tile
                        this.move(tile);
                    } else {
                        // Move the attacker back to its tile
                        Game.INSTANCE.add.tween({
                            targets: this,
                            x: this.currentTile.worldPosition.x,
                            y: this.currentTile.worldPosition.y,
                            duration: 150,
                            ease: Phaser.Math.Easing.Expo.InOut
                        });

                        // IF the enemy didn't die, it defends itself
                        Game.INSTANCE.add.tween({
                            targets: enemy,
                            delay: 150,
                            x: this.currentTile.worldPosition.x,
                            y: this.currentTile.worldPosition.y,
                            ease: Phaser.Math.Easing.Expo.InOut,
                            duration: 150,
                            yoyo: true,
                            onComplete: () => {
                                let hpRatioDefencer = enemy.infos.hp / enemy.infos.hpmax * 2;
                                let baseDamageDefenser = enemy.infos.strength * (chance.floating({ min: 0.9, max: 1.1 }) - terrainModifierAttacker) * hpRatioDefencer;
                                console.log("Defencer deals", Phaser.Math.Clamp(Math.round(baseDamageDefenser), 0, enemy.infos.hp))

                                this.infos.hp -= Phaser.Math.Clamp(Math.round(baseDamageDefenser), 0, this.infos.hp);

                                this._text.text = this.infos.hp.toString();

                                if (this.infos.hp <= 0) {
                                    this.die();
                                }
                            }
                        })
                    }
                }
            })

            // Deactivate this unit
            this.deactivate();
        }

        /**
         * After movement, we check if this unit can attack another one. If so, engage attack mode
         */
        afterMove() {
            if (this._tribe.isPlayer) {
                let attackTiles = this.canAttackOnTiles();

                if (attackTiles.length === 0) {
                    this.setWaitingNextTurn();
                    return;
                }
                this._displayAttack(attackTiles);
            } else {
                // IA
                // TODO
                this.setWaitingNextTurn();
            }

            console.log("ATTACK MODE")
        }

        /**
         * Make this unit die... Destroy from the world and remove from the tribe
         */
        die() {
            // Deactivate this unit
            this.deactivate();
            // Remove this unit from the current tile
            this.currentTile.removeClickable(this);
            // Remove this unit from its tribe
            let i = this._tribe.units.indexOf(this);
            this._tribe.units.splice(i, 1);

            // DEAD
            this.destroy();
        }

        /**
         * Returns the list of tiles this unit can see, starting from the given tile.
         * If no tile is given, the vision is from the unit currentile
         */
        getVision(tile?: Tile): Array<Tile> {
            let vision = this.infos.vision;

            // Increase if the unit is on a mountain
            if (this.currentTile.tileType === TileType.Mountain) {
                vision++;
            }

            if (!tile) {
                tile = this.currentTile;
            }

            let res = [];

            for (let i = vision; i >= 1; i--) {
                res.push(...this.map.getRing(tile, i))
            }
            return res;
        }

        destroy() {
            if (this._moveRangeGraphics) {
                for (let g of this._moveRangeGraphics) {
                    g.destroy();
                }
            }
            super.destroy();
        }
    }
}
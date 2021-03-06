module CIV {

    export class HexGrid {

        public tileSize: number;
        public tileSpacing: number = 0;
        public pointyTiles: boolean;

        constructor(tilesize: number, pointy: boolean) {
            this.tileSize = tilesize;
            this.pointyTiles = pointy;
        }

        public ring(q, r, radius): Array<{ q: number, r: number }> {
            var i, j, len, moveDirection, moveDirectionIndex, moveDirections, ref, result;
            result = [];
            moveDirections = [[1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0], [1, -1]];
            for (moveDirectionIndex = i = 0, len = moveDirections.length; i < len; moveDirectionIndex = ++i) {
                moveDirection = moveDirections[moveDirectionIndex];
                for (j = 0, ref = radius - 1; 0 <= ref ? j <= ref : j >= ref; 0 <= ref ? j++ : j--) {
                    q += moveDirection[0];
                    r += moveDirection[1];
                    if (moveDirectionIndex !== 0) {
                        result.push({
                            q: q,
                            r: r
                        });
                    }
                }
            }
            return result;
        };

        public hexagon(q, r, radius, solid): Array<{ q: number, r: number }> {
            var currentRing, i, ref, result;
            result = [];
            if (solid) {
                result.push({
                    q: q,
                    r: r
                });
            }
            for (currentRing = i = 1, ref = radius; 1 <= ref ? i <= ref : i >= ref; currentRing = 1 <= ref ? ++i : --i) {
                result = result.concat(this.ring(q, r, currentRing));
            }
            return result;
        };

        public neighbors(q, r): Array<{ q: number, r: number }> {
            var i, len, neighbor, neighbors, result;
            result = [];
            neighbors = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
            for (i = 0, len = neighbors.length; i < len; i++) {
                neighbor = neighbors[i];
                result.push({
                    q: q + neighbor[0],
                    r: r + neighbor[1]
                });
            }
            return result;
        };

        public getCenterXY(q, r): { x: number, y: number } {
            var x, y;
            if (this.pointyTiles) {
                x = (this.tileSize + this.tileSpacing) * Math.sqrt(3) * (q + r / 2);
                y = -((this.tileSize + this.tileSpacing) * 3 / 2 * r);
            } else {
                x = (this.tileSize + this.tileSpacing) * 3 / 2 * q;
                y = -((this.tileSize + this.tileSpacing) * Math.sqrt(3) * (r + q / 2));
            }
            return {
                x: x,
                y: y
            };
        };

        public static axialDistance(q1, r1, q2, r2) {
            return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - q2 - r2)) / 2;
        };

        public pixelToAxial(x, y) {
            var cube, decimalQR, roundedCube;
            decimalQR = this.pixelToDecimalQR(x, y);
            cube = this.axialToCube(decimalQR);
            roundedCube = this.roundCube(cube);
            return this.cubeToAxial(roundedCube);
        };

        public pixelToDecimalQR(x, y, scale?) {
            var q, r;
            if (typeof scale !== "number") {
                scale = 1;
            }
            if (this.pointyTiles) {
                q = (1 / 3 * Math.sqrt(3) * x - 1 / 3 * -y) / (this.tileSize + this.tileSpacing);
                r = 2 / 3 * -y / (this.tileSize + this.tileSpacing);
            } else {
                q = 2 / 3 * x / (this.tileSize + this.tileSpacing);
                r = (1 / 3 * Math.sqrt(3) * -y - 1 / 3 * x) / (this.tileSize + this.tileSpacing);
            }
            q /= scale;
            r /= scale;
            return {
                q: q,
                r: r
            };
        };

        public roundCube(coordinates) {
            var dx, dy, dz, rx, ry, rz;
            rx = Math.round(coordinates.x);
            ry = Math.round(coordinates.y);
            rz = Math.round(coordinates.z);
            dx = Math.abs(rx - coordinates.x);
            dy = Math.abs(ry - coordinates.y);
            dz = Math.abs(rz - coordinates.z);
            if (dx > dy && dx > dz) {
                rx = -ry - rz;
            } else if (dy > dz) {
                ry = -rx - rz;
            } else {
                rz = -rx - ry;
            }
            return {
                x: rx,
                y: ry,
                z: rz
            };
        };

        public cubeToAxial(cube) {
            return {
                q: cube.x,
                r: cube.y
            };
        };

        public axialToCube(axial) {
            return {
                x: axial.q,
                y: axial.r,
                z: -axial.q - axial.r
            };
        };

        public static getPoints(config: {
            width: number,
            height: number,
            x: number,
            y: number
        }): Array<Phaser.Geom.Point> {
            let points = [];
            for (let i = 0; i < 6; i++) {
                points[i] = new Phaser.Geom.Point();
            }

            let x = config.x;
            let y = config.y;
            var w = config.width;
            var h = config.height;
            var halfW = w / 2;
            var quarterW = w / 4;
            var halfH = h / 2;
            var quarterH = h / 4;

            points[0].x = x + halfW;
            points[0].y = y - quarterH;

            points[1].x = x + halfW;
            points[1].y = y + quarterH;

            points[2].x = x;
            points[2].y = y + halfH;

            points[3].x = x - halfW;
            points[3].y = y + quarterH;

            points[4].x = x - halfW;
            points[4].y = y - quarterH;

            points[5].x = x;
            points[5].y = y - halfH;

            return points;
        }

    }

}

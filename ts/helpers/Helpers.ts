module CIV {

    export class Helpers {


        /**
         * Returns the string to be used as a style to create a phaser text
         * @param _size 
         * @param _family 
         */
        public static font(_size: number, _family: string): string {
            let px = _size * ratio;
            return px + "px " + _family;
        }


        /**
         * Returns the size (width/height) of the given container
         */
        static getSize(con: Phaser.GameObjects.Container, width: number, height: number) {

            //set the top position to the bottom of the game
            var top = 100000;
            var bottom = 0;
            //set the left to the right of the game
            var left = 100000;
            var right = 0;
            //
            //
            //loop through the children
            //
            con.iterate((child) => {
                //get the positions of the child
                var childX = child.x;
                var childY = child.y;


                var childW = width//child.displayWidth;
                var childH = height//child.displayHeight; 

                var childTop = childY - childH / 2;
                var childBottom = childY + childH / 2;
                var childLeft = childX - childW / 2;
                var childRight = childX + childW / 2;


                //test the positions against
                //top, bottom, left and right
                //
                if (childBottom > bottom) {
                    bottom = childBottom;
                }
                if (childTop < top) {
                    top = childTop;
                }
                if (childLeft < left) {
                    left = childLeft;
                }
                if (childRight > right) {
                    right = childRight;
                }
            });
            //
            //calculate the square
            var h = Math.abs(top - bottom);
            var w = Math.abs(right - left);
            //set the container size
            return { top: top, left: left, width: w, height: h }
        }
    }
}
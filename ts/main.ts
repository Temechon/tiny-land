var app = {

    loadFonts: () => {
        // Load fonts
        let fonts = ['KeepCalm', 'OpenSans'];
        let fontloaded = 0;
        for (let f of fonts) {
            new FontFaceObserver(f).load().then(() => {
                console.log(f + ' loaded!')
                if (fontloaded === fonts.length - 1) {
                    app.initialize();
                }
                else {
                    fontloaded++;
                }
            });
        }
    },

    initialize: function () {

        console.log(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);


        const config = {
            type: Phaser.AUTO,
            backgroundColor: '#112E40',
            scale: {
                mode: Phaser.Scale.FIT,
                width: window.innerWidth * devicePixelRatio,
                height: window.innerHeight * devicePixelRatio,
            },
            scene: [
                CIV.Boot,
                CIV.Home,
                CIV.Game,
                CIV.GameUI,
                CIV.Loading,
                CIV.End
            ]
        };

        const game = new Phaser.Game(config);
    }

};

app.loadFonts();
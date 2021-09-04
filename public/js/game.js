function Game() {
    let that, game, player, cursors;
    let platforms, background, ground, ceiling, walls;
    let scoreBox, itemsBox, playButton;
    let soundSend, soundOops, soundClick, soundPortal;
    let respawnTime = 0;

    let playerAttributes = {
        ethAddress: null,
        allTokens: {},
        tokenId: null,
        tokenUri: null,
        svgData: null,
        score: 0,
        highScore: 0
    }

    const config = {
        // Phaser Config
        phaser: {
            type: Phaser.AUTO,
            width: 1280,
            height: 720,
            backgroundColor: "#474747",
            parent: "game-wrapper",
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 300 },
                    debug: true
                }
            },
            scene: {
                preload: preload,
                create: create,
                update: update
            }
        },
        // Game settings
        settings: {
            velocity: 10,
            jumpHeight: -300,
            gravityY: 500
        }
    }

    this.launch = function(user) {
        if (!user) {
            console.log("Please log in with Metamask!")
        } else {
            playerAttributes.ethAddress = user.get("ethAddress");
            console.log(playerAttributes.ethAddress + " " + "logged in");

            game = new Phaser.Game(config.phaser)
        }
    }

    this.launch(new Auth().getUser());

    async function setPlayerAttributes() {
        // Get NFTs data (Only Aavegotchis)
        const query = new Moralis.Query("PolygonNFTOwners") || Moralis.Query("EthNFTOwners");
        query.equalTo("name", "Aavegotchi");
        const results = await query.find();
        console.log("Successfully retrieved " + results.length + " results.");

        for (let i = 0; i < results.length; i++) {
            const object = results[i];

            let tokenData = await Moralis.Cloud.run("getTokenData",{tokenUri:object.get('token_uri')});

            playerAttributes.allTokens[object.get('token_id')] = tokenData.data;

            // Chose one for now (Add option for users to choose a gotchi)
            if (i === 0) {
                playerAttributes.tokenId = object.get('token_id')
                playerAttributes.tokenUri = object.get('token_uri')
                playerAttributes.svgData = playerAttributes.allTokens[playerAttributes.tokenId]["image_data"]
            }
        }

        console.log(playerAttributes.allTokens);
    }

    async function initPlayer() {
        player = that.physics.add.sprite(360, 250, 'player').setScale(1)
            .setGravityY(config.settings.gravityY)
            .refreshBody();
        player.setBounce(0.3);
        that.physics.add.collider(player, [platforms, walls]);
        // that.physics.add.collider(player, walls);
    }

    // Walls, enemies, and items
    function addWall() {
        const count = Math.floor(Math.random() * 7) + 1;
        const distance = Phaser.Math.Between(600, 900);

        // let wall = walls.create(1080 + distance, 720, "wall").setOrigin(0, 0);
        // wall.body.offset.y = +10;

        let wall = that.add.image(1080 + distance, 360, "wall");
        walls.add(wall);

        // if (count > 6) {
        //
        // } else {
        //     wall = this.walls.create(1280 + distance, 720, "wall").setOrigin(0, 1);
        //     wall.body.offset.y = +10;
        // }

        // wall.setImmovable();
    }

    // preload assets
    async function preload () {
        that = this;
        this.load.image('background', 'assets/tiles/tile20.png');
        this.load.image('ground', 'assets/tiles/tile30.png');
        this.load.image('ceiling', 'assets/tiles/tile40.png');
        this.load.image('wall', 'assets/tiles/tile26.png');

        this.load.audio('send', 'assets/sounds/send.mp3');
        this.load.audio('oops', 'assets/sounds/oops.mp3');
        this.load.audio('click', 'assets/sounds/click.mp3');
        this.load.audio('portal', 'assets/sounds/portal.mp3');

        await setPlayerAttributes();

        const svgData = await removeGotchiBackground(playerAttributes.svgData, "gotchi-selector");

        const svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
        const url = URL.createObjectURL(svgBlob);

        this.load.image('player',url);

        this.load.on('filecomplete', function() {
            initPlayer()
        }, this);

        this.load.start()
    }

    // initial setup
    async function create () {
        background = this.add.tileSprite(640,412,1280,608,"background");

        platforms = this.physics.add.staticGroup();
        ground = this.add.tileSprite(640,664,2560,112,"ground");
        platforms.add(ground);
        ceiling = this.add.tileSprite(640,56,1280,112,"ceiling");
        platforms.add(ceiling);

        walls = this.physics.add.group();
        that.physics.add.collider(platforms, walls);

        soundSend = this.sound.add('send', {volume: 0.2});
        soundOops = this.sound.add('oops', {volume: 0.2});
        soundClick = this.sound.add('click', {volume: 0.2});
        soundPortal = this.sound.add('portal', {volume: 0.2});

        scoreBox = this.add.text(40, 24, "000000", {fill: "#ffffff", font: '400 28px CustomFont', resolution: 5})
            .setOrigin(0, 0).setAlpha(1);
        scoreBox.setShadow(16, 16, 'rgba(0,0,0,1)', 32);

        itemsBox = this.add.text(280, 24, "~x00", {fill: "#ffffff", font: '400 28px CustomFont', resolution: 5})
            .setOrigin(0, 0).setAlpha(1);
        itemsBox.setShadow(16, 16, 'rgba(0,0,0,1)', 32);

        cursors = this.input.keyboard.createCursorKeys();
    }

    // 60 fps updates
    async function update (time, delta) {
        if(!player)
            return;
    return;
        ground.tilePositionX += config.settings.velocity;
        ceiling.tilePositionX += config.settings.velocity;
        background.tilePositionX += 2;

        Phaser.Actions.Call(walls.getChildren(), function(e) {
            e.x -= config.settings.velocity;
        })

        respawnTime += delta * config.settings.velocity * 0.08;
        if (respawnTime >= 1500) {
            addWall();
            console.log(respawnTime);
            respawnTime = 0;
        }

        if (cursors.left.isDown) {
            player.setVelocityX(-config.settings.velocity/2);
            // ground.tilePositionX -= config.settings.velocity;
            // ceiling.tilePositionX -= config.settings.velocity;
            // background.tilePositionX -= 2;

            Phaser.Actions.Call(walls.getChildren(), function(e) {
                e.x += config.settings.velocity;
            })

        } else if (cursors.right.isDown) {
            player.setVelocityX(config.settings.velocity/2);
            // ground.tilePositionX += config.settings.velocity;
            // ceiling.tilePositionX += config.settings.velocity;
            // background.tilePositionX += 2;

            // Phaser.Actions.Call(walls.getChildren(), function(e) {
            //     e.x -= config.settings.velocity;
            // })

            // respawnTime += delta * config.settings.velocity * 0.08;
            // if (respawnTime >= 1500) {
            //     addWall();
            //     console.log(respawnTime);
            //     respawnTime = 0;
            // }

        } else {
            player.setVelocityX(0);
        }

        if (cursors.up.isDown && player.body.touching.down) {
            player.setVelocityY(config.settings.jumpHeight);
        }
    }
}

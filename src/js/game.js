//globals for socket connection
var Client = {};
Client.socket = io.connect();

//globals
let manager;
let PlayerDatas = [];
let heroNames = ['Normal', 'Ice', 'Ghost', 'Ghosted'];
let userIdx;
let enemyIdx;
let winner;

function setup(){
    manager = new SceneManager();
    manager.showScene( SceneTitle );
}

function draw(){
    manager.draw();
}

class playerData{
    constructor(){
        this.hero;
        this.sprite;
        this.heroSample;
        this.hp;
    }
}

function SceneTitle(){
    let userId;
    this.setup = function(){
        Client.socket.emit('askConnect');
        Client.socket.on('connected', (id)=>{
            userId = id;
        })
    }

    function moveScene(location){
        manager.showScene(location);
        game.destroy(true, false);
    }

    let config = {
        type: Phaser.AUTO,
        parent: document.getElementById('game'),
        width: 960,
        height: 540,
        scene: {
            preload: prepare,
            create: create,
            update: update
        },
    };
    let game = new Phaser.Game(config);

    function prepare(){
        this.load.image('bgBlur', 'assets/backgrounds/bgBlur.png');
        this.load.image('title', 'assets/backgrounds/title.png');
        this.load.image('buttonEnter', 'assets/ui/buttonEnter.png');
        this.load.image('buttonEnterOver', 'assets/ui/buttonEnterOver.png');
        this.input.setDefaultCursor('url(assets/ui/hand.cur), pointer');
    }

    function create(){
        this.add.image(480, 270, 'bgBlur');
        this.add.image(480, 180, 'title');
        const button = this.add.sprite(480, 360, 'buttonEnter').setInteractive();
        const buttonOver = this.add.sprite(480, 360, 'buttonEnterOver').setInteractive();
        buttonOver.setVisible(false);

        button.on('pointerover', function(pointer){
            buttonOver.setVisible(true);
            button.setVisible(false);
        })
        buttonOver.on('pointerout', function(pointer){
            button.setVisible(true);
            buttonOver.setVisible(false);
        })
        buttonOver.on('pointerdown', function(pointer){
            Client.socket.emit('askEnter');
        })

        const message = this.add.text(480, 410, '').setStyle({
            fontSize:  '14px',
            color: '#000',
            fontFamily: 'cookierun'
        });
        message.setOrigin(0.5);

        Client.socket.on('wait', ()=>{
            message.setText('Waiting for the Challenger...');
        });

        Client.socket.on('joined', ()=>{
            userIdx = 1;
            enemyIdx = 0;
            PlayerDatas[userIdx] = new playerData;
            PlayerDatas[enemyIdx] = new playerData;
            moveScene(SceneSelectHero);
        });
        Client.socket.on('challenged', (id)=>{
            if (id === userId){
                userIdx = 0;
                enemyIdx = 1;
                PlayerDatas[userIdx] = new playerData;
                PlayerDatas[enemyIdx] = new playerData;
                moveScene(SceneSelectHero);
            }
        });
        Client.socket.on('denied', ()=>{
            message.setText('Sorry, the server is already occupied with a game.');
        });
    }

    function update(){
    }
}

function SceneSelectHero(){
    this.setup = function(){

    }

    let config = {
        type: Phaser.AUTO,
        parent: document.getElementById('game'),
        width: 960,
        height: 540,
        scene: {
            preload: prepare,
            create: create,
            update: update
        },
    };

    function moveScene(location){
        manager.showScene(location);
        game.destroy(true, false);
    }

    let game = new Phaser.Game(config);

    function prepare(){
        this.load.image('bgBlur', 'assets/backgrounds/bgBlur.png');
        this.load.image('selectNormal', 'assets/ui/selectNormal.png');
        this.load.image('selectIce', 'assets/ui/selectIce.png');
        this.load.image('selectGhost', 'assets/ui/selectGhost.png');
        this.load.image('coverBox', 'assets/ui/coverBox.png');
        this.input.setDefaultCursor('url(assets/ui/hand.cur), pointer');
        this.load.image('shadow', 'assets/shadow.png');

        this.load.spritesheet('Normal', 'assets/kirby.png', { frameWidth: 42, frameHeight: 38 });
        this.load.spritesheet('Ice', 'assets/iceKirby.png', { frameWidth: 44, frameHeight: 50 });
        this.load.spritesheet('Ghost', 'assets/ghostKirby.png', { frameWidth: 42, frameHeight: 38 });
    }

    let timer;
    let timerCount = 15;
    function create(){
        this.add.image(480, 270, 'bgBlur');
        this.add.image(180, 390, 'shadow');
        this.add.image(780, 390, 'shadow');
        let heroList = [];

        for (let i=0; i<3; i++){
            let tempList = [];
            const sprite = this.add.sprite(355+125*i, 310, `select${heroNames[i]}`).setInteractive();
            const cover = this.add.image(355+125*i, 310, 'coverBox').setVisible(false);

            game.anims.create({
                key: `${heroNames[i]}idle`,
                frames: this.anims.generateFrameNumbers(heroNames[i], { frames: [ 0, 1 ] }),
                frameRate: 8,
                repeat: -1,
                repeatDelay: 300
            });
            game.anims.create({
                key: `${heroNames[i]}walk`,
                frames: this.anims.generateFrameNumbers(heroNames[i], { start:10, end:19 }),
                frameRate: 8,
                repeat: -1,
            });

            sprite.on('pointerdown', (pointer)=>{
                if(PlayerDatas[enemyIdx].hero===heroNames[i]){
                    const textWarn = this.add.text(480, 150, 'You cannot pick same hero with your opponent!').setStyle({
                        fontSize:  '13px',
                        color: '#000',
                        fontFamily: 'cookierun'
                    });
                    textWarn.setOrigin(0.5);
                    setTimeout(()=>{
                        textWarn.destroy();
                    }, 1000);
                }else if (PlayerDatas[userIdx].hero!==heroNames[i]){
                    if (PlayerDatas[userIdx].heroSample!==undefined){
                        heroList[heroNames.indexOf(PlayerDatas[userIdx].hero)][1].setVisible(false);
                        PlayerDatas[userIdx].heroSample.destroy();
                    }
                    cover.setVisible(true);
                    PlayerDatas[userIdx].hero = heroNames[i];
                    Client.socket.emit('pick', heroNames[i]);
                    PlayerDatas[userIdx].heroSample = this.add.sprite(480+300*Math.pow(-1, userIdx+1), 350, heroNames[i]).setScale(2);
                    PlayerDatas[userIdx].heroSample.play(`${heroNames[i]}walk`);
                    if (userIdx===1){
                        PlayerDatas[userIdx].heroSample.flipX = true;
                    }
                }
            });

            tempList.push(sprite);
            tempList.push(cover);
            heroList.push(tempList);
        }

        Client.socket.on('enemyPicked', (hero)=>{
            if (PlayerDatas[enemyIdx].heroSample!==undefined){
                heroList[heroNames.indexOf(PlayerDatas[enemyIdx].hero)][1].setVisible(false);
                PlayerDatas[enemyIdx].heroSample.destroy();
            }
            PlayerDatas[enemyIdx].hero = hero;
            heroList[heroNames.indexOf(hero)][1].setVisible(true);
            PlayerDatas[enemyIdx].heroSample = this.add.sprite(480+300*Math.pow(-1, enemyIdx+1), 350, hero).setScale(2);
            PlayerDatas[enemyIdx].heroSample.play(`${hero}walk`);
            if (enemyIdx===1){
                PlayerDatas[enemyIdx].heroSample.flipX = true;
            }
        })

        const message = this.add.text(480, 50, 'Select your Hero').setStyle({
            fontSize:  '20px',
            color: '#000',
            fontFamily: 'cookierun'
        });
        message.setOrigin(0.5);
        const timeLimit = this.add.text(480, 85, `${timerCount}`).setStyle({
            fontSize:  '28px',
            color: '#000',
            fontFamily: 'cookierun'
        });
        timeLimit.setOrigin(0.5);
        timer = setInterval(()=>{
            timerCount -= 1;
            timeLimit.setText(`${timerCount}`);
            if (timerCount<1){
                clearInterval(timer);
                moveScene(SceneGame);
            }
        }, 1000);
        const you = this.add.text(180, 100, 'You').setStyle({
            fontSize:  '20px',
            color: '#000',
            fontFamily: 'cookierun'
        });
        you.setOrigin(0.5);
        const opponent = this.add.text(780, 100, 'Opponent').setStyle({
            fontSize:  '20px',
            color: '#000',
            fontFamily: 'cookierun'
        });
        opponent.setOrigin(0.5);
    }

    function update(){
    }
}

function SceneGame(){
    let platforms;
    let bullets;
    let shotguns;
    let QBox;
    let WBox;
    let EBox;
    let RBox;


    function moveScene(location){
        manager.showScene(location);
        game.destroy(true, false);
    }

    const styleOfEffect = {
        fontSize:  '10px',
        color: '#FFF',
    }
    var jumpCount = 0;
    var action = false;
    const currentKey = {
        //input&control data which will be sent to other socket
        left : false,
        right : false,
        up : false,
        fire : false,
        action : false,
        x : 0,
        y : 0
    };

    let HPBox;
    let HPBox_second;
    let playerState = [false, false, false, false, false, false]; //[frozen, shield, shotgun, hitFromLeft, hitFromRight, ghosted]
    let enemyState = [false, false, false, false, false, false];
    let playerTexts = [];
    let collider = [];
    //default cooldowns and durations
    let coolShield = 30000;
    let coolShot = 900;
    let coolShotgun = 50000;
    let coolUlt = 100000;
    let coolList = [coolShot, coolShield, coolShotgun, coolUlt];

    let duraShield = 10000;
    let duraShotgun = 5000;
    let duraUlt = 2000;
    let damage = 10;

    const effectOffsetX = -15;
    const effectOffsetY = -35;
    const effectDura = 300;
    let actionBegin = [false, false, false, false]; //[frozen, shotFromRight, shotFromLeft, gameover]


    var config = {
        type: Phaser.AUTO,
        parent: document.getElementById('game'),
        width: 960,
        height: 540,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {y: 500},
                debug: false
            }
        },
        scene: {
            preload: prepare,
            create: create,
            update: update
        },
    };
    var game = new Phaser.Game(config);
    function prepare(){
        //load assets
        this.load.image('bg', 'assets/bg.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('shotgun', 'assets/shotgun.png');
        this.load.image('icegun', 'assets/icegun.png');
        this.load.image('stage', 'assets/map_graphics.png');
        this.load.image('plat1', 'assets/plat1.png');
        this.load.image('plat2', 'assets/plat2.png');
        this.load.image('plat3', 'assets/plat3.png');
        this.load.image('NormalTab', 'assets/kirbyTab.png');
        this.load.image('IceTab', 'assets/iceTab.png');
        this.load.image('GhostTab', 'assets/ghostTab.png');
        this.load.image('NormalEnemy', 'assets/kirbyEnemy.png');
        this.load.image('IceEnemy', 'assets/iceEnemy.png');
        this.load.image('GhostEnemy', 'assets/ghostEnemy.png');
        this.load.image('cherry', 'assets/sprites/cherry.png');
        this.load.spritesheet('Normal', 'assets/kirby.png', { frameWidth: 42, frameHeight: 38 });
        this.load.spritesheet('Ice', 'assets/iceKirby.png', { frameWidth: 44, frameHeight: 50 });
        this.load.spritesheet('Ghost', 'assets/ghostKirby.png', { frameWidth: 42, frameHeight: 38 });
        this.load.spritesheet('Ghosted', 'assets/sprites/ghosted.png', { frameWidth: 42, frameHeight: 38 });
        this.load.image('activate', 'assets/activate.png');
        this.input.setDefaultCursor('url(assets/ui/hand.cur), pointer');

    };
    
    function create(){
        this.add.image(480, 270, 'bg').setScale(0.5);
        this.add.image(480, 270, 'stage');
    
        //sprite sheet animation presets
        heroNames.forEach((hero)=>{
            this.anims.create({
                key: `${hero}idle`,
                frames: this.anims.generateFrameNumbers(hero, { frames: [ 0, 1 ] }),
                frameRate: 8,
                repeat: -1,
                repeatDelay: 300
            });
            this.anims.create({
                key: `${hero}walk`,
                frames: this.anims.generateFrameNumbers(hero, { start:10, end:19 }),
                frameRate: 8,
                repeat: -1,
            });
            this.anims.create({
                key: `${hero}jump`,
                frames: this.anims.generateFrameNumbers(hero, { frames: [ 22 ] }),
                frameRate: 8,
                repeat: 0,
            });
            this.anims.create({
                key: `${hero}fire`,
                frames: this.anims.generateFrameNumbers(hero, { start:30, end:31 }),
                frameRate: 6,
                repeat: 0,
            });
            this.anims.create({
                key: `${hero}frozen`,
                frames: this.anims.generateFrameNumbers(hero, { start:40, end:42 }),
                frameRate: 10,
                repeat: 0
            })
            this.anims.create({
                key: `${hero}hit`,
                frames: this.anims.generateFrameNumbers(hero, { frames: [50] }),
                frameRate: 6,
                repeat: 0
            })
        })
        
        //add and set players
        PlayerDatas[0].sprite= this.physics.add.sprite(240, 135, PlayerDatas[0].hero);
        PlayerDatas[1].sprite= this.physics.add.sprite(540, 135, PlayerDatas[1].hero);
        PlayerDatas[1].sprite.flipX = true;
        this.add.image(330, 490, PlayerDatas[userIdx].hero+'Tab');
        this.add.image(650, 490, PlayerDatas[enemyIdx].hero+'Enemy');
        
        for (let i = 0; i<2; i++){
            PlayerDatas[i].sprite.body.setGravityY(300);
            PlayerDatas[i].sprite.body.drag.set(50);
            PlayerDatas[i].sprite.play(`${PlayerDatas[i].hero}idle`);
            PlayerDatas[i].hp = 100;
        }
    
        //add platforms
        platforms = this.physics.add.staticGroup();
        platforms.create(443,494, 'plat1').setDepth(-1);
        platforms.create(505,156, 'plat2').setDepth(-1);
        platforms.create(150,353, 'plat2').setDepth(-1);
        platforms.create(375,250, 'plat3').setDepth(-1);
    
        //add bullets as a group
        var Bullet = new Phaser.Class({
            Extends: Phaser.GameObjects.Image,
            initialize:
            function Bullet (scene){
                Phaser.GameObjects.Image.call(this, scene, 0,0, 'bullet');
                this.speed=Phaser.Math.GetSpeed(400,1);
            },
            fire: function(x,y,id){
                if (PlayerDatas[id].sprite.flipX === false){
                    this.speed=Phaser.Math.GetSpeed(-400,1);
                    this.setPosition(x+50,y);
                }else{
                    this.speed=Phaser.Math.GetSpeed(400,1);
                    this.setPosition(x-50,y);
                }
                this.setActive(true);
                this.setVisible(true);
            },
            update: function(time, delta){
                this.x -= this.speed*delta;
                if (this.x<-50 || this.x>965){
                    this.setActive(false);
                    this.setVisible(false);
                }
            }
        });
        bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 10,
            runChildUpdate: true,
            allowGravity: false
        });

        let Cherry = new Phaser.Class({
            Extends: Phaser.GameObjects.Image,
            initialize:
            function Cherry (scene){
                Phaser.GameObjects.Image.call(this, scene, 0,0, 'cherry');
            },
            placeCherry: function (x){
                this.setPosition(x, 0);
                this.setActive(true);
                this.setVisible(true);
                setTimeout(()=>{
                    this.destroy();
                }, coolUlt);
            }
        })
        
        cherries = this.physics.add.group({
            classType: Cherry,
            maxSize: 10,
            runChildUpdate: true,
            allowGravity: true
        })

        let BulletShotgun = new Phaser.Class({
            Extends: Bullet,
            initialize:
            function BulletShotgun (scene){
                Phaser.GameObjects.Image.call(this, scene, 0,0, 'shotgun');
                this.speed=Phaser.Math.GetSpeed(400,1);
            }
        });
        shotguns = this.physics.add.group({
            classType: BulletShotgun,
            maxSize: 10,
            runChildUpdate: true,
            allowGravity: false
        });

        let BulletIcegun = new Phaser.Class({
            Extends: Bullet,
            initialize:
            function BulletShotgun (scene){
                Phaser.GameObjects.Image.call(this, scene, 0,0, 'icegun');
                this.speed=Phaser.Math.GetSpeed(400,1);
            }
        });
        iceguns = this.physics.add.group({
            classType: BulletIcegun,
            maxSize: 10,
            runChildUpdate: true,
            allowGravity: false
        });
    
        //add physics
        collider[0] = this.physics.add.collider(PlayerDatas[0].sprite, platforms);
        collider[1] = this.physics.add.collider(PlayerDatas[1].sprite, platforms);
        this.physics.add.collider(cherries, platforms);


        this.physics.add.collider(PlayerDatas[0].sprite, PlayerDatas[1].sprite);
        this.physics.add.overlap(PlayerDatas[0].sprite, bullets, playerHit);
        this.physics.add.overlap(PlayerDatas[1].sprite, bullets, playerSecondHit);
        this.physics.add.overlap(PlayerDatas[0].sprite, shotguns, playerHit);
        this.physics.add.overlap(PlayerDatas[1].sprite, shotguns, playerSecondHit);

        this.physics.add.overlap(PlayerDatas[0].sprite, iceguns, playerHitIce);
        this.physics.add.overlap(PlayerDatas[1].sprite, iceguns, playerSecondHitIce);

        this.physics.add.overlap(PlayerDatas[0].sprite, cherries, playerHitCherry);
        this.physics.add.overlap(PlayerDatas[1].sprite, cherries, playerHitCherry);


        cursors = this.input.keyboard.createCursorKeys();
        spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        playerTexts[0] = this.add.text(PlayerDatas[0].sprite.x, PlayerDatas[0].sprite.y, '').setStyle(styleOfEffect);
        playerTexts[1] = this.add.text(PlayerDatas[1].sprite.x, PlayerDatas[1].sprite.y, '').setStyle(styleOfEffect);
        HPBox = new HpBar(this, 365, 517, 155);
        HPBox_second = new HpBar(this, 650, 515, 55)
        QBox = new CooldownBox(this, 286, 467, coolShot);
        WBox = new CooldownBox(this, 326, 467, coolShield);
        EBox = new CooldownBox(this, 366, 467, coolShotgun);
        RBox = new CooldownBox(this, 406, 467, coolUlt);
    };

    class HpBar {
        constructor (scene, x, y, w)
        {
            this.bar = new Phaser.GameObjects.Graphics(scene);
            
            this.value = 100;
            this.width = w;
            this.height = 13;
            this.borderWidth = 1;
            this.x = x-this.width/2-this.borderWidth;
            this.y = y-this.height/2-this.borderWidth;
            
            this.ratio = this.width / 100;
            this.draw();
            scene.add.existing(this.bar);
        }
    
        update (hp)
        {
            if (hp<0){
                this.value = 0;
            }else{
                this.value = hp;
            }
            this.draw();
        }
    
        draw ()
        {
            this.bar.clear();
            this.bar.fillStyle(0x000000);
            this.bar.fillRect(this.x, this.y, this.width+2*this.borderWidth, this.height+2*this.borderWidth);
            this.bar.fillStyle(0xffffff);
            this.bar.fillRect(this.x+this.borderWidth, this.y+this.borderWidth, this.width, this.height);
    
            if (this.value < 30)
            {
                this.bar.fillStyle(0xff0000);
            }
            else
            {
                this.bar.fillStyle(0x00ff00);
            }
            this.bar.fillRect(this.x+this.borderWidth, this.y+this.borderWidth, Math.floor(this.ratio * this.value), this.height);
        }
    }

    class CooldownBox {
        constructor (scene, x, y, cool)
        {
            this.box = new Phaser.GameObjects.Graphics(scene);
            this.cool = cool;
            this.value = this.cool;
            this.width = 35;
            this.height = 35;
            this.x = x;
            this.y = y;
            
            this.ratio = this.width / this.cool;
            this.draw();
            scene.add.existing(this.box);
        }
    
        update (current)
        {
            this.value = current;
            this.draw();
        }
    
        setCool (cool)
        {
            this.cool = cool;
            this.ratio = this.width / this.cool;
        }

        draw ()
        {
            this.box.clear();
            this.box.fillStyle(0x000000, 0.7);
            this.box.fillRect(this.x, this.y, Math.floor(this.ratio * this.value), this.height);
        }
    }

    function update(time){
        //give motion to player, and at the same time, set variables to be sent
        currentKey.left = false;
        currentKey.right = false;
        currentKey.up = false;
        currentKey.fire = false;
        currentKey.ice = false;
        currentKey.state = playerState;
        currentKey.cherries = [];
        currentKey.x= PlayerDatas[userIdx].sprite.x;
        currentKey.y= PlayerDatas[userIdx].sprite.y;
        // coolBoard.setText(`Q: ${coolDown(coolList[0], time)} W: ${coolDown(coolList[1], time)} E: ${coolDown(coolList[2], time)} R: ${coolDown(coolList[3], time)}`);
        HPBox.update(PlayerDatas[userIdx].hp);
        HPBox_second.update(PlayerDatas[enemyIdx].hp);
        QBox.update(coolDown(coolList[0], time));
        WBox.update(coolDown(coolList[1], time));
        EBox.update(coolDown(coolList[2], time));
        RBox.update(coolDown(coolList[3], time));

        if (cursors.left.isDown){
            if (action===false){
                currentKey.left = true;
                PlayerDatas[userIdx].sprite.setVelocityX(-160);
                PlayerDatas[userIdx].sprite.flipX = true;
                PlayerDatas[userIdx].sprite.play(`${PlayerDatas[userIdx].hero}walk`, true);
            }
        }
        else if (cursors.right.isDown){
            if (action===false){
                currentKey.right = true;
                PlayerDatas[userIdx].sprite.setVelocityX(160);
                PlayerDatas[userIdx].sprite.flipX = false;
                PlayerDatas[userIdx].sprite.play(`${PlayerDatas[userIdx].hero}walk`, true);
            }
        }else{   
            if (action===false){
                PlayerDatas[userIdx].sprite.setVelocityX(0);
                PlayerDatas[userIdx].sprite.play(`${PlayerDatas[userIdx].hero}idle`, true);
            }
        }
        
        let isUpDown = Phaser.Input.Keyboard.JustDown(keyUp);
        let isBodyTouch = PlayerDatas[userIdx].sprite.body.touching.down;
        //double-jump algorithm
        if (isUpDown && (isBodyTouch || jumpCount <2)){
            currentKey.up = true;
            PlayerDatas[userIdx].sprite.setVelocityY(-350);
            ++jumpCount;
        }
        if (!isUpDown && isBodyTouch){
            jumpCount = 0;
        }
        if (!isBodyTouch){
            PlayerDatas[userIdx].sprite.play(`${PlayerDatas[userIdx].hero}jump`, true);
        }
    
        let keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        let isQDown = Phaser.Input.Keyboard.JustDown(keyQ);
        let keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        let isWDown = Phaser.Input.Keyboard.JustDown(keyW);
        let keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        let isEDown = Phaser.Input.Keyboard.JustDown(keyE);
        let keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        let isRDown = Phaser.Input.Keyboard.JustDown(keyR);
        
        function doShot(){
            if (time>coolList[0]){
                if (playerState[2]===true){
                    var bullet = shotguns.get();
                }else{
                    var bullet = bullets.get();
                }
                if (bullet){
                    currentKey.fire = true;
                    action = true;
                    currentKey.action = true;
                    PlayerDatas[userIdx].sprite.anims.play(`${PlayerDatas[userIdx].hero}fire`, true);
                    //to give shooting animation, give time delay
                    setTimeout(()=>{
                        action = false;
                        currentKey.action = false;
                    }, 300)
                    bullet.fire(PlayerDatas[userIdx].sprite.x, PlayerDatas[userIdx].sprite.y, userIdx);
                    coolList[0] = time+coolShot;
                }
            }   
        }
        function doShield(){
            if (time>coolList[1]){
                playerState[1] = true;
                setTimeout(()=>{
                    playerState[1] = false;
                }, duraShield)
                coolList[1] = time+coolShield;
            }
        }
        function doShotgun(){
            if (time>coolList[2]){
                playerState[2] = true;
                coolShot = coolShot*3;
                QBox.setCool(coolShot);
                setTimeout(()=>{
                    playerState[2] = false;
                    coolShot = coolShot/3;
                    QBox.cool = coolShot;
                }, duraShotgun)
                coolList[2] = time+coolShotgun;
            }
        }
        function doIce(){
            if (time>coolList[3]){
                var bullet = iceguns.get();
                if (bullet){
                    currentKey.ice = true;
                    action = true;
                    currentKey.action = true;
                    PlayerDatas[userIdx].sprite.anims.play(`${PlayerDatas[userIdx].hero}fire`, true);
                    //to give shooting animation, give time delay
                    setTimeout(()=>{
                        action = false;
                        currentKey.action = false;
                    }, 300)
                    bullet.fire(PlayerDatas[userIdx].sprite.x, PlayerDatas[userIdx].sprite.y, userIdx);
                }
                coolList[3] = time+coolUlt;
            }
        }

        const doGhost = () => {
            if (time>coolList[3]){
                PlayerDatas[userIdx].sprite.setTexture('Ghosted');
                PlayerDatas[userIdx].hero = 'Ghosted';
                playerState[5] = true;

                setTimeout(()=>{
                    PlayerDatas[userIdx].sprite.setTexture('Ghost');
                    PlayerDatas[userIdx].hero = 'Ghost';
                    playerState[5] = false;
                }, duraUlt)
                coolList[3] = time + coolUlt;
            }
        }

        const doNormal = () => {
            if (time>coolList[3]){
                const countCherry = Math.floor(Math.random()*3)+2;
                for (let i=0; i<countCherry; i++){
                    const locationCherry = Math.floor(Math.random()*400)+200;
                    currentKey.cherries.push(locationCherry);
                    let cherry = cherries.get();
                    if (cherry){
                        cherry.placeCherry(locationCherry);
                    }
                }
                coolList[3] = time + coolUlt;
            }
        }

        if (isQDown){
            doShot();
        }
        if (isWDown){
            doShield();
        }
        if (isEDown){
            doShotgun();
        }
        if (isRDown){
            if (PlayerDatas[userIdx].hero === 'Normal'){
                doNormal();
            }else if (PlayerDatas[userIdx].hero === 'Ice'){
                doIce();
            }else if (PlayerDatas[userIdx].hero === 'Ghost'){
                doGhost();
            }
        }
            
        //send the input data to other socket via server
        Client.socket.emit('playerUpdate', currentKey);
    
        let isBodyTouch_second = PlayerDatas[enemyIdx].sprite.body.touching.down;
        if (!isBodyTouch_second){
            PlayerDatas[enemyIdx].sprite.play(`${PlayerDatas[enemyIdx].hero}jump`, true);
        }
        let actionDelay = 0;
        
        
        //receive the input data and control second player
        Client.socket.on('playerUpdate', (data)=>{
            enemyState = [...data.state];
            PlayerDatas[enemyIdx].sprite.setX(data.x);
            PlayerDatas[enemyIdx].sprite.setY(data.y);
            if (data.left){
                if (data.action===false){
                    PlayerDatas[enemyIdx].sprite.setVelocityX(-160);
                    PlayerDatas[enemyIdx].sprite.flipX = true;
                    PlayerDatas[enemyIdx].sprite.play(`${PlayerDatas[enemyIdx].hero}walk`, true);
                }
            }else if (data.right){
                if (data.action===false){
                    PlayerDatas[enemyIdx].sprite.setVelocityX(160);
                    PlayerDatas[enemyIdx].sprite.flipX = false;
                    PlayerDatas[enemyIdx].sprite.play(`${PlayerDatas[enemyIdx].hero}walk`, true);
                }
            }else{   
                if (data.action===false){
                    PlayerDatas[enemyIdx].sprite.setVelocityX(0);
                    PlayerDatas[enemyIdx].sprite.play(`${PlayerDatas[enemyIdx].hero}idle`, true);
                }
            };
            if (data.up){
                PlayerDatas[enemyIdx].sprite.setVelocityY(-350);
            };
            if (data.fire===true && time>actionDelay){
                if (enemyState[2]===true){
                    var bullet = shotguns.get();
                }else{
                    var bullet = bullets.get();
                }
                PlayerDatas[enemyIdx].sprite.anims.play(`${PlayerDatas[enemyIdx].hero}fire`, true);
                if (bullet){
                    bullet.fire(PlayerDatas[enemyIdx].sprite.x, PlayerDatas[enemyIdx].sprite.y, enemyIdx);
                    actionDelay=time+coolShot;
                }
            };
            if (data.ice===true){
                var bullet = iceguns.get();
                PlayerDatas[enemyIdx].sprite.anims.play(`${PlayerDatas[enemyIdx].hero}fire`, true);
                if (bullet){
                    bullet.fire(PlayerDatas[enemyIdx].sprite.x, PlayerDatas[enemyIdx].sprite.y, enemyIdx);
                }
            };
            if (enemyState[0]===true && actionBegin[0]===false){
                PlayerDatas[enemyIdx].sprite.anims.play(`${PlayerDatas[enemyIdx].hero}frozen`, true);
                actionBegin[0]=true;
            }else if (enemyState[0]!==true){
                actionBegin[0]=false;
            };

            if (enemyState[3]===true && actionBegin[1]===false){
                PlayerDatas[enemyIdx].sprite.anims.play(`${PlayerDatas[enemyIdx].hero}hit`, true);
                PlayerDatas[enemyIdx].sprite.setVelocityX(-80);
                actionBegin[1]=true;
            }else if (enemyState[3]!==true && actionBegin[1]===true){
                PlayerDatas[enemyIdx].sprite.setVelocityX(0);
                actionBegin[1]=false;
            }

            if (enemyState[4]===true && actionBegin[2]===false){
                PlayerDatas[enemyIdx].sprite.anims.play(`${PlayerDatas[enemyIdx].hero}hit`, true);
                PlayerDatas[enemyIdx].sprite.setVelocityX(80);
                actionBegin[2]=true;
            }else if (enemyState[4]!==true && actionBegin[2]===true){
                PlayerDatas[enemyIdx].sprite.setVelocityX(0);
                actionBegin[2]=false;
            }
            
            if (enemyState[5]===true){
                PlayerDatas[enemyIdx].sprite.setVisible(false);
            }else{
                PlayerDatas[enemyIdx].sprite.setVisible(true);
            }

            if (data.cherries!==[]){
                for (let i=0; i<data.cherries.length; i++){
                    let cherry = cherries.get();
                    if (cherry){
                        cherry.placeCherry(data.cherries[i]);
                    }
                }
            }
        })

        for (let i=0; i<2; i++){
            if ((PlayerDatas[i].hp<=0 || PlayerDatas[i].sprite.y> 490) && actionBegin[3]===false){
                actionBegin[3]=true;
                action=true;
                PlayerDatas[i].sprite.setFrame(50);
                this.scene.pause('default');
                let angle = 0;
                setTimeout(()=>{
                    this.scene.resume('default');
                    PlayerDatas[(i+1)%2].sprite.body.enable = false;
                    this.physics.world.removeCollider(collider[i]);
                    PlayerDatas[i].sprite.setVelocityY(-350);
                    setInterval(()=>{
                        angle+=0.1;
                        PlayerDatas[i].sprite.setRotation(angle);
                    }, 20);
                }, 1500)
                setTimeout(()=>{
                    winner = (i+1)%2;
                    moveScene(SceneOver);
                }, 4000);
            }
        }

    }

    this.setup = function(){
    }

    function playerHit(sprite, bullet){
        bullets.killAndHide(bullet);
        shotguns.killAndHide(bullet);
        bullet.body.enable=false;
        bullet.destroy();
        if (userIdx===0){
            playerTexts[0].x = PlayerDatas[0].sprite.x+effectOffsetX;
            playerTexts[0].y = PlayerDatas[0].sprite.y+effectOffsetY;
            if (playerState[1]===true){
                playerTexts[0].setText('Shielded!');
            }else if (enemyState[2]===true){
                playerTexts[0].setText('-30');
                PlayerDatas[userIdx].hp-=damage*3/10;
                action = true;
                currentKey.action = true;
                if (bullet.speed>0){
                    PlayerDatas[0].sprite.setVelocityX(-80);
                    playerState[3] = true;
                }else{
                    PlayerDatas[0].sprite.setVelocityX(80);
                    playerState[4] = true;
                }
                PlayerDatas[0].sprite.anims.play(`${PlayerDatas[0].hero}hit`, true);
            }else{
                playerTexts[0].setText('-10')
                PlayerDatas[userIdx].hp-=damage/10;
                action = true;
                currentKey.action = true;
                if (bullet.speed>0){
                    PlayerDatas[0].sprite.setVelocityX(-80);
                    playerState[3] = true;
                }else{
                    PlayerDatas[0].sprite.setVelocityX(80);
                    playerState[4] = true;
                }
                PlayerDatas[0].sprite.anims.play(`${PlayerDatas[0].hero}hit`, true);
            }
            setTimeout(()=>{
                action=false;
                currentKey.action=false;
                playerState[3] = false;
                playerState[4] = false;
                playerTexts[0].setText('');
                PlayerDatas[0].sprite.setVelocityX(0);
            }, effectDura)
        }else{
            playerTexts[1].x = PlayerDatas[0].sprite.x+effectOffsetX;
            playerTexts[1].y = PlayerDatas[0].sprite.y+effectOffsetY;
            if (enemyState[1]===true){
                playerTexts[1].setText('Shielded!');
            }else if (playerState[2]===true){
                playerTexts[1].setText('-30')
                PlayerDatas[enemyIdx].hp-=damage*3;
            }else{
                playerTexts[1].setText('-10')
                PlayerDatas[enemyIdx].hp-=damage;
            }
            setTimeout(()=>{
                playerTexts[1].setText('');
            }, effectDura)
        }
    }
    function playerSecondHit(sprite, bullet){
        bullets.killAndHide(bullet);
        shotguns.killAndHide(bullet);
        bullet.body.enable=false;
        bullet.destroy();
        if (userIdx===1){
            playerTexts[0].x = PlayerDatas[1].sprite.x+effectOffsetX;
            playerTexts[0].y = PlayerDatas[1].sprite.y+effectOffsetY;
            if (playerState[1]===true){
                playerTexts[0].setText('Shielded!')
            }else if (enemyState[2]===true){
                playerTexts[0].setText('-30')
                PlayerDatas[userIdx].hp-=damage*3/10;
                action = true;
                currentKey.action = true;
                if (bullet.speed>0){
                    playerState[3] = true;
                    PlayerDatas[1].sprite.setVelocityX(-80);
                }else{
                    playerState[4] = true;
                    PlayerDatas[1].sprite.setVelocityX(80);
                }
                PlayerDatas[1].sprite.anims.play(`${PlayerDatas[1].hero}hit`, true);
            }else{
                playerTexts[0].setText('-10')
                PlayerDatas[userIdx].hp-=damage/10;
                action = true;
                currentKey.action = true;
                if (bullet.speed>0){
                    playerState[3] = true;
                    PlayerDatas[1].sprite.setVelocityX(-80);
                }else{
                    playerState[4] = true;
                    PlayerDatas[1].sprite.setVelocityX(80);
                }
                PlayerDatas[1].sprite.anims.play(`${PlayerDatas[1].hero}hit`, true);
            }
            setTimeout(()=>{
                playerTexts[0].setText('');
                action = false;
                currentKey.action = false;
                playerState[3] = false;
                playerState[4] = false;
                playerTexts[0].setText('');
                PlayerDatas[1].sprite.setVelocityX(0);
            }, effectDura)
        }else{
            playerTexts[1].x = PlayerDatas[1].sprite.x+effectOffsetX;
            playerTexts[1].y = PlayerDatas[1].sprite.y+effectOffsetY;
            if (enemyState[1]===true){
                playerTexts[1].setText('Shielded!')
            }else if (playerState[2]===true){
                playerTexts[1].setText('-30')
                PlayerDatas[enemyIdx].hp-=damage*3;
            }else{
                playerTexts[1].setText('-10')
                PlayerDatas[enemyIdx].hp-=damage;
            }
            setTimeout(()=>{
                playerTexts[1].setText('');
            }, effectDura)
        }
    }
    function playerHitIce(sprite, bullet){
        iceguns.killAndHide(bullet);
        bullet.body.enable=false;
        bullet.destroy();
        if (userIdx===0){
            playerTexts[0].x = PlayerDatas[0].sprite.x+effectOffsetX;
            playerTexts[0].y = PlayerDatas[0].sprite.y+effectOffsetY;
            if (playerState[1]===true){
                playerTexts[0].setText('Shielded!');
            }else{
                playerTexts[0].setText('Frozen!');
                action = true;
                currentKey.action = true;
                PlayerDatas[0].sprite.anims.play(`${PlayerDatas[0].hero}frozen`, true);
                playerState[0] = true;
                setTimeout(()=>{
                    action = false;
                    currentKey.action = false;
                    playerState[0] = false;
                }, duraUlt)
            }
            setTimeout(()=>{
                playerTexts[0].setText('');
            }, effectDura)
        }else{
            playerTexts[1].x = PlayerDatas[0].sprite.x+effectOffsetX;
            playerTexts[1].y = PlayerDatas[0].sprite.y+effectOffsetY;
            if (enemyState[1]===true){
                playerTexts[1].setText('Shielded!');
            }else{
                playerTexts[1].setText('Frozen!')
            }
            setTimeout(()=>{
                playerTexts[1].setText('');
            }, effectDura)
        }
    }
    function playerSecondHitIce(sprite, bullet){
        iceguns.killAndHide(bullet);
        bullet.body.enable=false;
        bullet.destroy();
        if (userIdx===1){
            playerTexts[0].x = PlayerDatas[1].sprite.x+effectOffsetX;
            playerTexts[0].y = PlayerDatas[1].sprite.y+effectOffsetY;
            if (playerState[1]===true){
                playerTexts[0].setText('Shielded!');
            }else{
                playerTexts[0].setText('Frozen!')
                action = true;
                currentKey.action = true;
                PlayerDatas[1].sprite.anims.play(`${PlayerDatas[1].hero}frozen`, true);
                playerState[0] = true;
                setTimeout(()=>{
                    action = false;
                    currentKey.action = false;
                    playerState[0] = false;
                }, duraUlt)
            }
            setTimeout(()=>{
                playerTexts[0].setText('');
            }, effectDura)
        }else{
            playerTexts[1].x = PlayerDatas[1].sprite.x+effectOffsetX;
            playerTexts[1].y = PlayerDatas[1].sprite.y+effectOffsetY;
            if (enemyState[1]===true){
                playerTexts[1].setText('Shielded!');
            }else{
                playerTexts[1].setText('Frozen!');
            }
            setTimeout(()=>{
                playerTexts[1].setText('');
            }, effectDura)
        }
    }
    function playerHitCherry(sprite, cherry){
        if (sprite.texture.key === 'Normal'){
            for (let i=0; i<2; i++){
                if (PlayerDatas[i].hero==='Normal'){
                    cherries.killAndHide(cherry);
                    cherry.body.enable=false;
                    cherry.destroy();
                    if (PlayerDatas[i].hp<=90){ //full hp
                        PlayerDatas[i].hp+=10;
                    }
                    
                } 
            }
        }
    }
    function coolDown(lastTime, time){
        if (lastTime-time<=0){
            return 0
        }else{
            return Math.floor(lastTime-time)
        }
    }
}

function SceneOver(){

    this.setup = function(){
    }

    let config = {
        type: Phaser.AUTO,
        parent: document.getElementById('game'),
        width: 960,
        height: 540,
        scene: {
            preload: prepare,
            create: create,
            update: update
        },
    };
    let game = new Phaser.Game(config);

    function prepare(){
        this.load.image('bgBlur', 'assets/backgrounds/bgBlur.png');
        this.load.image('shadow', 'assets/shadow.png');
        this.load.spritesheet('Normal', 'assets/kirby.png', { frameWidth: 42, frameHeight: 38 });
        this.load.spritesheet('Ice', 'assets/iceKirby.png', { frameWidth: 44, frameHeight: 50 });
        this.load.spritesheet('Ghost', 'assets/ghostKirby.png', { frameWidth: 42, frameHeight: 38 });
        this.input.setDefaultCursor('url(assets/ui/hand.cur), pointer');
    }

    function create(){
        this.add.image(480, 270, 'bgBlur');
        this.add.image(480, 320, 'shadow');
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers(PlayerDatas[winner].hero, { start:10, end:19 }),
            frameRate: 10,
            repeat: -1,
        });
        const message = this.add.text(480, 200, 'Game Over').setStyle({
            fontSize:  '20px',
            color: '#000',
            fontFamily: 'cookierun'
        });
        message.setOrigin(0.5);

        const winnerSprite = this.add.sprite(480, 300, PlayerDatas[winner].hero).setScale(2);
        winnerSprite.play('walk');

        const messageWinner = this.add.text(480, 400, `Huge victory of ${PlayerDatas[winner].hero}, Congratulation!`).setStyle({
            fontSize:  '15px',
            color: '#000',
            fontFamily: 'cookierun'
        });
        messageWinner.setOrigin(0.5);

    }

    function update(){
    }
}
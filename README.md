# Kirbyland

## Basic info

- **Your KAIST ID**: 20190686
- **Your name**: Han Jeonghoon
- **Your email**: gkswjdgns59@kaist.ac.kr

## Brief overview

Kirbyland is online shooting game for 2 people.

- node.js, socket io is used to build server and comminicate between sockets
- phaser 3 is used to build physics engine
- express, p5.scenemanager is used to framework

I've done hosting by Heroku, but since server is not good enough to provide smooth game, I recommend you to access it locally.
By terminal command `node server.js`, you can locally serve the project and access it in 8081 port.

dependency: phaser, socket io, node.js, express

<br>

## Detailed description

- Details about the project, its objectives, how it works, how to use it, ...
- Describe the structure of the code, classes or modules
- Provide details about specific functionalities or functions

1. structure

     For framework structure, the basic express sturcture is used. It includes server-side javascript, index apge html, main javascript for game and static files such as fonts and images.

1. code details: `server.js`

    - Overview: It gets asks from clients' socket and answers for them. Also, it sends data to opponent.
    - Communication between sockets at each scene will be dealt below.
    - This is a example code snippet of `server.js`. It counts the number of player connected and answer them to start game or wait.
    ```Javascript
    socket.on('askEnter', ()=>{
        if (server.playersOnGame.length === 0){
            server.playersOnGame.push(socket.player.id);
            socket.emit('wait');
        }else if  (server.playersOnGame.length === 1){
            server.playersOnGame.push(socket.player.id);
            socket.emit('joined');
            socket.broadcast.emit('challenged', server.playersOnGame[0]);
        }else{
            socket.emit('denied');
        }
    })
    ```

2. code details: `game.js`

    - Overview: With p5.scenemanager, 4 scenes are used linearly. Each scene is built with Phaser.Game, so their structures are really similar.
    - Globals

        1. manager: It manages each scene. This global variable is continously called to switch between scenes.

        ```Javascript
            function setup(){
                manager = new SceneManager();
                manager.showScene( SceneTitle );
            }

            function draw(){
                manager.draw();
            }
        ```
        1. playerData: 
        

        2. playerData
    - SceneTitle
      - Role
        - Open a game room with 2 people
      - Main Functions
        - Each scene has a same sturcture. Building `Phaser.Game` by config, preload images in `prepare()`, add images and interactions in `create` and handle changes during interactions in `update()`.
        - `create()`
          - button is called as images but by `setInteractive()`, so input can be detected such as mouse actions.
        - some cards are made in new class playerData. It is binded inside of list `PlayerDatas` which can help distinguishing the controller by user's index
      - Server communications
        - `askConnect`: report connection, receives own Id by response, `connected`
        - `askEnter`: ask to start a game, receives `wait`, `joined`, `challenged`, or `denied` considering the number of user connected currently.
    - SceneSelectHero
      - Role: User and opponent select a hero to play in the time limit.
      - Main Functions:
        - `prepare()`: load spritesheets as well as images to display animations. Interactive sprite is defined inside of for loop since it can shorten the code
        - `create()`: animations are defined and selected sprites are displayed on the screen. 
      - Server communications
        - `pick`: send and recieve opponent's selection
    - SceneGame
      - Role: part of main game. handle user inputs to both move my sprite on the screen and send data through servor and move my sprite on opponent's creeen.
      - Main Functions
        - `prepare()`: load images, spritesheets, cursor
        - `create()`: add images, animations, sprites. add physics, gravity, collider. define classes which form physics groups and add ui(hp bar class, cooldown box class, texts)
          - some sprites are defined in class here and use `get()` to add on the canvas.
          - ```Javascript
            var Bullet = new Phaser.Class({
                Extends: Phaser.GameObjects.Image,
                initialize:
                function Bullet (scene){
                    Phaser.GameObjects.Image.call(this, scene, 0,0, 'bullet');
                    this.speed=Phaser.Math.GetSpeed(400,1);
                },
                fire: function(x,y,id){
                    ...
                },
                update: function(time, delta){
                    this.x -= this.speed*delta;
                    ...
                }
            });
            ```
          - other type of bullets are made by extending this class
          - some ui elements are defined here and use `update()` to be re-draw on the canvas
          - ```Javascript
            class HpBar {
                constructor (scene, x, y, w)
                {
                    this.bar = new Phaser.GameObjects.Graphics(scene);
                    ...
                }
            
                update (hp)
                {
                    ...
                    this.draw();
                }
            
                draw ()
                {
                    ...
                }
            }
        ```
        - `update()`: update ui and read user input and move sprites. also save user input in currentKey object and send to other socket. define some skills and calculate its cooldown. Monitor HP and y values to finish the game.
        - deals with collisions, check the state of sprite to show different reactions.
      - Server communications
        - `currenKey`: an object consisting some states(key downs, states, coordinate) which are prepared to be sent to opponents.
        - `playerUpdate`: send and recieve states and input to control opponent player on user's screen or in opposite
    - SceneOver
      - Role: display the winner of the game

## Resources

1. Video link: https://youtu.be/CGu_Ii7Pkj0
2. Link to a server: https://kirbyland.herokuapp.com/

## Credits

I initially tried to learn node.js, socket.io, express and phaser 3 by reading and understanding other's project codes.

Those 2 projects are what I have learned from.

- https://github.com/Jerenaux/basic-mmo-phaser
- https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-1/

Plus, I got help from examples of Phaser 3 provided on its own site.
- https://phaser.io/examples/v3/view/animation/create-animation-from-sprite-sheet
- https://phaser.io/examples/v3/view/physics/arcade/bullets-group

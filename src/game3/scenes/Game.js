import Phaser from 'phaser'
import CountdownController from './CountdownController'

// to do: make playable on mobile with on-screen tap commands and re-sizing/scaling --- put text explaining keys to play --- add sound for win and lose and alien

let keyA;
let keyS;
let keyD;
let keyW;

let btnLeft;
let btnDown;
let btnRight;
let btnUp;
let btnOpen;

var isClicking = false;

let win;
let lose;
let alien;

// Add game instructions text
let instructions = `
Move: WASD keys or on-screen buttons.
Open: 'Space' or 'Open' button.
`

const levelOne = [
    [1, 0, 3],
    [2, 4, 1],
    [3, 4, 2]
]

const levelTwo = [
    [3, 4, 1],
    [2, 1, 4],
    [2, 0, 3]
]

const levelThree = [
    [4, 2, 4],
    [2, 1, 0],
    [3, 1, 3]
]

const levelFour = [
    [2, 1, 3],
    [0, 4, 1],
    [4, 3, 2]
]

const levelFive = [
    [0, 1, 3],
    [2, 4, 1],
    [2, 4, 3]
]

const levelSix = [
    [1, 1, 4],
    [2, 3, 2],
    [4, 3, 0]
]

const levelSeven = [
    [1, 2, 0],
    [3, 3, 1],
    [4, 2, 4]
]

const levelEight = [
    [2, 2, 4],
    [1, 3, 1],
    [0, 3, 4]
]

const levelNine = [
    [2, 1, 4],
    [2, 0, 4],
    [3, 3, 1]
]


let level = levelOne || levelTwo || levelThree || levelFour || levelFive || levelSix || levelSeven || levelEight || levelNine;

export default class Game extends Phaser.Scene
{
    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors

    /** @type {Phaser.Physics.Arcade.Sprite} */
    player

    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    boxGroup

    /** @type {Phaser.Physics.Arcade.Sprite} */
    activeBox

    /** @type {Phaser.GameObjects.Group} */
    itemsGroup

    /** @type {{ box: Phaser.Physics.Arcade.Sprite, item: Phaser.GameObjects.Sprite}[]} */
    selectedBoxes = []

    /** @type {CountdownController} */
    countdown

    matchesCount = 0
    
    constructor()
    {
        super('game');
        this.gameOver = false;
    }

    init()
    {
        this.cursors = this.input.keyboard.createCursorKeys()
    }

    create()
    {
        const roll = Math.floor(Math.random() * 9);
        if (roll === 0) {
            level = levelOne;
        } 
        else if (roll === 1) {
            level = levelTwo;
        }
        else if (roll === 2){
            level = levelThree
        }
        else if (roll === 3){
            level = levelFour
        }
        else if (roll === 4){
            level = levelFive
        }
        else if (roll === 5){
            level = levelSix
        }
        else if (roll === 6){
            level = levelSeven
        }
        else if (roll === 7){
            level = levelEight
        }
        else {
            level = levelNine;
        }
        
        const { width, height } = this.scale

        
        let instructionText = this.add.text(10, 10, instructions, {
            fontSize: '12px',
            fill: '#ffffff'
        });

        this.player = this.physics.add.sprite(width * 0.5, height * 0.6, 'bork', 0)
            .setSize(40, 16)
            .setOffset(12, 38)
	    	.play('down-idle')	// 👈 play the animation

        this.player.setCollideWorldBounds(true)
    
        // Set lives.
        this.playerLives = 3;

        //add timer event for lives
        this.time.addEvent({
            delay: 20000,    // 20000 milliseconds = 20 seconds
            callback: this.updateLives,
            callbackScope: this,
            loop: true
        });

        this.boxGroup = this.physics.add.staticGroup()

        this.createBoxes()

        this.itemsGroup = this.add.group()

        const timerLabel = this.add.text(width * 0.5, 50, '60', { fontFamily: 'Verdana', fontSize: 48, color: '#00ff00'})
            .setOrigin(0.5)

        this.countdown = new CountdownController(this, timerLabel)
        this.countdown.start(this.handleCountdownFinished.bind(this))

        this.physics.add.collider(this.player, this.boxGroup, this.handlePlayerBoxCollide, undefined, this)

        keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        
        btnLeft = this.add.image(width * 0.1, height * 0.9, 'btnLeft', 0);
            btnLeft.setInteractive();
            btnLeft.setScale(1.2);
            btnLeft.on ('pointerdown', () => {
                btnLeft.isDown = true;
            });
            btnLeft.on ('pointerup', () => {
                btnLeft.isDown = false;
            });
            btnLeft.on ('pointerupoutside', () => {
                btnLeft.isDown = false;
            });

        btnDown = this.add.image(width * 0.9, height * 0.9, 'btnDown', 0)
            btnDown.setInteractive();
            btnDown.setScale(1.2);
            btnDown.on ('pointerdown', () => {
                btnDown.isDown = true;
            });
            btnDown.on ('pointerup', () => {
                btnDown.isDown = false;
            });
            btnDown.on ('pointerupoutside', () => {
                btnDown.isDown = false;
            });

        btnRight = this.add.image(width * 0.22, height * 0.9, 'btnRight', 0)
            btnRight.setInteractive();
            btnRight.setScale(1.2);
            btnRight.on ('pointerdown', () => {
                btnRight.isDown = true;
            });
            btnRight.on ('pointerup', () => {
                btnRight.isDown = false;
            });
            btnRight.on ('pointerupoutside', () => {
                btnRight.isDown = false;
            });

        btnUp = this.add.image(width * 0.78, height * 0.9, 'btnUp', 0)
            btnUp.setInteractive();
            btnUp.setScale(1.2);
            btnUp.on ('pointerdown', () => {
                btnUp.isDown = true;
            });
            btnUp.on ('pointerup', () => {
                btnUp.isDown = false;
            });
            btnUp.on ('pointerupoutside', () => {
                btnUp.isDown = false;
            });

        btnOpen = this.add.image(width * 0.5, height * 0.9, 'btnOpen', 0)
            btnOpen.setInteractive();
            btnOpen.setScale(1.2);
            btnOpen.on ('pointerdown', () => {
                btnOpen.isDown = true;
            });
            btnOpen.on ('pointerup', () => {
                btnOpen.isDown = false;
            });
            btnOpen.on ('pointerupoutside', () => {
                btnOpen.isDown = false;
            });

        alien = this.sound.add("alien", { loop: false });

        this.add.image(0, 0, 'background').setOrigin(0, 0);
    }

    createBoxes()
    {
        const width = this.scale.width
        let xPer = 0.25
        let y = 150
        for (let row = 0; row < level.length; ++row)
        {
            for (let col = 0; col < level[row].length; ++col)
            {
                /** @type {Phaser.Physics.Arcade.Sprite} */
                const box = this.boxGroup.get(width * xPer, y, 'bork', 10)
                    box.setSize(64, 32)
                        .setOffset(0, 32)
                        .setData('itemType', level[row][col])
                xPer += 0.25
            }

            xPer = 0.25
            y+= 150
        }
    }

    handleCountdownFinished()
    {
        this.gameOver = true;
        this.player.active = false
        this.player.setVelocity(0, 0)
        this.game.destroy(true);
        // then, remove the DOM container
        document.body.style.height = "";
        window.oncontextmenu = null;
        document.body.style.userSelect = "";
        // Get score from remaining lives.
        let score = this.playerLives;
        // Finish game.
        Game.onFinishGame(score);

        const { width, height }= this.scale
        this.add.text(width * 0.5, height * 0.9, 'You Lose! Womp Womp', { fontFamily: 'Verdana', fontSize: 48, backgroundColor: '#FF0000', color: '#ffffff'})
            .setOrigin(0.5)
    }

    /** 
     * 
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Phaser.Physics.Arcade.Sprite} box
     */
    handlePlayerBoxCollide(player, box)
    {
        const opened = box.getData('opened')

        if (opened)
        {
            return
        }

        if (this.activeBox)
        {
            return
        }

        this.activeBox = box

        this.activeBox.setFrame(11)
    }

    /**
     * 
     * @param {Phaser.Physics.Arcade.Sprite} box 
     */
    openBox(box)
    {
        if (!box)
        {
            return
        }

        const itemType = box.getData('itemType')

        /** @type {Phaser.GameObjects.Sprite} */
        let item

        switch (itemType)
        {
            case 0:
                item = this.itemsGroup.get(box.x, box.y)
                item.setTexture('spaceViking')
                break

            case 1:
                item = this.itemsGroup.get(box.x, box.y)
                item.setTexture('drone')
                break
                
            case 2: 
                item = this.itemsGroup.get(box.x, box.y)
                item.setTexture('aether')
                break

            case 3: 
                item = this.itemsGroup.get(box.x, box.y)
                item.setTexture('slork')
                break

            case 4: 
                item = this.itemsGroup.get(box.x, box.y)
                item.setTexture('alientopus')
                break                
        }

        if (!item)
        {
            return
        }

        box.setData('opened', true)

        item.setData('sorted', true)
        item.setDepth(2000)

        item.scale = 0
        item.alpha = 0

        this.selectedBoxes.push({ box, item})

        this.tweens.add({
            targets: item,
            y: '-=30',
            alpha: 1,
            scale: .5,
            duration: 300,
            onComplete: () => {
                if (itemType === 0)
                {
                    this.handlespaceVikingSelected()
                    return
                }

                if (this.selectedBoxes.length < 2)
                {
                    return
                }

                this.checkForMatch()
            }
        })

        this.activeBox.setFrame(10)
        this.activeBox = undefined
    }

    handlespaceVikingSelected()
    {
        const { box, item } = this.selectedBoxes.pop()

        item.setTint(0xff0000)
        this.cameras.main.shake(500);
        box.setFrame(12);
        alien.play();

        if (Game.gameTrait === "Houdini") {
        this.time.delayedCall(2000, () => {
            item.setTint(0xffffff)
            box.setFrame(10)
            box.setData('opened', false)

            this.tweens.add({
                targets: item,
                y: '+= 50',
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => 
                    this.player.active = true
            })
        })
    }

        else {
            this.player.active = false
            this.player.setVelocity(0, 0)

            this.time.delayedCall(10000, () => {
                item.setTint(0xffffff)
                box.setFrame(10)
                box.setData('opened', false)

                this.tweens.add({
                    targets: item,
                    y: '+= 50',
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    onComplete: () => 
                        this.player.active = true
                })
            })
    }
    }

    checkForMatch()
    {
        const second = this.selectedBoxes.pop()
        const first = this.selectedBoxes.pop()

        if (first.item.texture !== second.item.texture)
        {
            this.tweens.add({
                targets: [first.item, second.item],
                y: '+= 50',
                alpha: 0,
                scale: 0,
                duration: 300,
                delay: 1000,
                onComplete: () => {
                    first.box.setData('opened', false)
                    second.box.setData('opened', false)
                }
            })
            return
        }

        ++this.matchesCount

        this.time.delayedCall(100, () => {
            first.box.setFrame(11)
            second.box.setFrame(11)

            if (this.matchesCount >= 4){
                this.gameOver = true;
                // game won
                this.countdown.stop()
                this.player.active = false
                this.player.setVelocity(0, 0)
                this.game.destroy(true);
                // then, remove the DOM container
                document.body.style.height = "";
                window.oncontextmenu = null;
                document.body.style.userSelect = "";
                // Get score from remaining lives.
                let score = this.playerLives;
                // Finish game.
                Game.onFinishGame(score);

                const { width, height } = this.scale
                this.add.text(width * 0.5, height * 0.9, 'You Win!', { fontFamily: 'Verdana', fontSize: 48, backgroundColor: '#FFD700', color: '#000000'})
                .setOrigin(0.5)
            }
        })
    }

    update(time, delta)
    {
        const speedModifier = delta / (1 / 60) / 1000;

        // Your game update logic here ...

        this.updatePlayer();
    }

    updatePlayer()
    {
        if (!this.player.active)
        {
            return
        }

        let speed = 200

        // double speed if Maverick

        if (Game.gameTrait === "Maverick") {
            speed = 350
        }

        if (keyA.isDown || btnLeft.isDown)
        {
            this.player.setVelocity(-speed, 0)
            this.player.play('left-walk', true)
        }

        else if (keyD.isDown || btnRight.isDown)
        {
            this.player.setVelocity(speed, 0)
            this.player.play('right-walk', true)
        }
        else if (keyW.isDown || btnUp.isDown)
        {
            this.player.setVelocity(0, -speed)
            this.player.play('up-walk', true)
        }
        else if (keyS.isDown || btnDown.isDown)
        {

            this.player.setVelocity(0, speed)
            this.player.play('down-walk', true)
        }
        else
        {
            this.player.setVelocity(0, 0)
            const key = this.player.anims.currentAnim.key
            const parts = key.split('-')
            const direction = parts[0]
            this.player.play(`${direction}-idle`)
        }

        const spaceJustPressed = Phaser.Input.Keyboard.JustUp(this.cursors.space) || btnOpen.isDown
        if (spaceJustPressed && this.activeBox)
        {
            this.openBox(this.activeBox)
        }
    }

    updateActiveBox()
    {
        if (!this.activeBox)
        {
            return
        }

        const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.activeBox.x, this.activeBox.y
        )

        if (distance < 64)
        {
            return
        }

        this.activeBox.setFrame(10)
        this.activeBox = undefined
    }

    updateLives() {
        if (!this.gameOver) {
            this.playerLives--;
            console.log(this.playerLives)
        }
    }

    update()
    {
        this.updatePlayer()

        this.updateActiveBox()

        this.children.each(c => {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            // @ts-ignore
            const child = c

            if (child.getData('sorted'))
            {
                return
            }

            child.setDepth(child.y)
        })

        this.countdown.update()

        if (!this.input.activePointer.isDown) {
            btnLeft.isDown = false;
            btnRight.isDown = false;
            btnUp.isDown = false;
            btnDown.isDown = false;
        }
    
        this.updatePlayer();
    
        this.updateActiveBox();
    
        this.children.each(c => {
            // ...
        });
    }
    
}
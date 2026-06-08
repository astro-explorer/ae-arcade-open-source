import Phaser from 'phaser'

export default class Preloader extends Phaser.Scene
{
    constructor()
    {
        super('preloader')
    }

    preload()
    {
        this.load.spritesheet('bork', 'assets/game3/bork_tilesheet.png', {
            frameWidth: 64
        })

        this.load.image('spaceViking', 'assets/game3/spaceViking.png')
        this.load.image('drone', 'assets/game3/drone.png')
        this.load.image('aether', 'assets/game3/aether.png')
        this.load.image('slork', 'assets/game3/slork.png')
        this.load.image('alientopus', 'assets/game3/alientopus.png')
        this.load.image('background', 'assets/game3/shipFloor.png')

        this.load.image('btnLeft', 'assets/game3/left.png')
        this.load.image('btnDown', 'assets/game3/down.png')
        this.load.image('btnRight', 'assets/game3/right.png')
        this.load.image('btnUp', 'assets/game3/up.png')
        this.load.image('btnOpen', 'assets/game3/open.png')
        
        this.load.audio("alien", 'assets/game3/alien.wav');
    }

    create()
    {        
        this.anims.create({
            key: 'down-idle',
            frames: [{ key: 'bork', frame: 0 }]
        })
    
        this.anims.create({
            key: 'up-idle',
            frames: [{ key: 'bork', frame: 3 }]
        })
    
        this.anims.create({
            key: 'left-idle',
            frames: [{ key: 'bork', frame: 8 }]
        })
    
        this.anims.create({
            key: 'right-idle',
            frames: [{ key: 'bork', frame: 6 }]
        })
    
        this.anims.create({
            key: 'down-walk',
            frames: this.anims.generateFrameNumbers('bork', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        })
    
        this.anims.create({
            key: 'up-walk',
            frames: this.anims.generateFrameNumbers('bork', { start: 3, end: 5 }),
            frameRate: 10,
            repeat: -1
        })
    
        this.anims.create({
            key: 'left-walk',
            frames: this.anims.generateFrameNumbers('bork', { start: 8, end: 9 }),
            frameRate: 10,
            repeat: -1
        })
    
        this.anims.create({
            key: 'right-walk',
            frames: this.anims.generateFrameNumbers('bork', { start: 6, end: 7 }),
            frameRate: 10,
            repeat: -1
        })

        // start game scene
        this.scene.start('game')
    }
}
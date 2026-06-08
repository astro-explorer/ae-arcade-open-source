import { Scene, GameObjects } from 'phaser'

export class TitleScreen extends Scene
{
    gameName: GameObjects.Text
    bork: GameObjects.Image
    howTo: GameObjects.Text
    use: GameObjects.Text
    collect: GameObjects.Text
    avoid: GameObjects.Text
    countdownMsg: GameObjects.Text
    countdown: number = 5

    preload ()
    {
        this.load.setPath('assets/game5')
        this.load.image('bork', 'bork-sprite-art.png')
    }

    constructor ()
    {
        super('TitleScreen')
    }

    create ()
    {
        this.bork = this.add.image(304, 130, 'bork')

        this.gameName = this.add.text(304, 75, 'LUNAR LABYRINTH', {
            fontSize: 48, color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5)

        this.use = this.add.text(304, 180, 'Collect all the Aether', {
            fontFamily: 'Arial', fontSize: 22, color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5)

        this.collect = this.add.text(304, 230, 'Collect power-ups to boost speed', {
            fontFamily: 'Arial', fontSize: 22, color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5)

        this.avoid = this.add.text(304, 285, 'AVOID ENEMIES - THEY ARE NEVER EDIBLE', {
            fontFamily: 'Arial', fontSize: 22, color: '#fffc3b',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5)

        this.countdownMsg = this.add.text(304, 350, '5', {
            fontFamily: 'Arial',
            fontSize: 38,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5)

        this.time.addEvent({
            delay: 1000,
            callback: this.updateCountdown,
            callbackScope: this,
            loop: true
        })
    }

    updateCountdown() {
        this.countdown -= 1

        if(this.countdown > 0){
            this.countdownMsg.setText('' + this.countdown)
        }

        if (this.countdown == 0) {
            this.time.removeAllEvents()
            this.scene.start('Game')
        }
    }
}

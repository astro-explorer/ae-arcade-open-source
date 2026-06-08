import Phaser from 'phaser'

const createHeroAnims = (anims: Phaser.Animations.AnimationManager) => {
	anims.create({
		key: 'hero-move-down',
		frameRate: 4,
        frames: anims.generateFrameNames('bork-atlas', { prefix: 'bork-', suffix: '.png', start: 2, end: 3 }),
        repeat: -1
	})
	anims.create({
		key: 'hero-move-up',
		frameRate: 4,
        frames: anims.generateFrameNames('bork-atlas', { prefix: 'bork-', suffix: '.png', start: 5, end: 6 }),
        repeat: -1
	})
	anims.create({
		key: 'hero-move-right',
		frameRate: 4,
        frames: anims.generateFrameNames('bork-atlas', { prefix: 'bork-', suffix: '.png', start: 7, end: 8 }),
        repeat: -1
	})
	anims.create({
		key: 'hero-move-left',
		frameRate: 4,
        frames: anims.generateFrameNames('bork-atlas', { prefix: 'bork-', suffix: '.png', start: 9, end: 10 }),
        repeat: -1
	})

	anims.create({
		key: 'hero-idle-down',
		frames: [{ key: 'bork-atlas', frame: 'bork-1.png' }]
	})
	anims.create({
		key: 'hero-idle-up',
		frames: [{ key: 'bork-atlas', frame: 'bork-4.png' }]
	})
	anims.create({
		key: 'hero-idle-right',
		frames: [{ key: 'bork-atlas', frame: 'bork-7.png' }]
	})
	anims.create({
		key: 'hero-idle-left',
		frames: [{ key: 'bork-atlas', frame: 'bork-10.png' }]
	})
}

export default createHeroAnims

export {
	createHeroAnims
}

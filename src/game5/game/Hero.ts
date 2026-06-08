import Phaser from 'phaser'

import { heroEvents } from '../events/HeroEvents'

enum Moves
{
	None,
	Left,
	Right,
	Up,
	Down
}

enum HeroState
{
	Normal,
	Powered
}

export default class Hero extends Phaser.Physics.Arcade.Sprite
{
	heroState = HeroState.Normal
	spawnPoint: { x: number, y: number }

	normalSpeed = 80
    poweredSpeed = 100
    poweredDuration = 5000
	normalTint = 0xffffff
    poweredTint = 0xFF1493

	queuedMove = Moves.None
	lastKeyDown = Moves.None
	lastMoveDirection: Moves = Moves.None
	queuedMoveAccumulator = 0
	
	poweredAccumulator = 0
	revertDelay?: Phaser.Time.TimerEvent
	

	public boostText: Phaser.GameObjects.Text

	constructor(scene: Phaser.Scene, x: number, y: number, texture: string)
	{
		super(scene, x, y, texture)
		scene.add.existing(this)
		this.initializePhysics()
		this.spawnPoint = { x, y }
		this.setTint(this.normalTint)
		this.play('hero-idle-down')
		this.boostText = this.scene.add.text(304, 233, 'SPEED BOOST!', {
			fontFamily: 'Arial Black',
			fontSize: '14px',
			color: '#fe03f0'
		}).setOrigin(0.5)
		this.boostText.setVisible(false)
	}

	get isPowered()
	{
		return this.heroState === HeroState.Powered
	}

	get facingVector()
	{
		const vec = new Phaser.Math.Vector2()
		vec.setToPolar(this.rotation)
		return vec
	}

	initializePhysics() {
        this.scene.physics.world.enable(this)
        const body = this.body as Phaser.Physics.Arcade.Body
        body.setCircle(16) 
        this.setSpeed(this.normalSpeed)
    }

	canEatDot(dot: Phaser.Physics.Arcade.Sprite)
	{
		if(this.body){
			const heroPos = this.body.position
			const body = dot.body as Phaser.Physics.Arcade.Body
			const dotPos = body.position.clone()
			dotPos.x -= body.offset.x
			dotPos.y -= body.offset.y

			return Phaser.Math.Distance.BetweenPointsSquared(heroPos, dotPos) <= 100
		}
	}

	eatPowerDot(dot: Phaser.Physics.Arcade.Sprite)
	{
		if (this.heroState === HeroState.Powered && this.revertDelay) {
            this.revertDelay.remove(false)
        }
		this.heroState = HeroState.Powered
		this.boostText.setVisible(true)
		this.poweredAccumulator = 0
        this.setSpeed(this.poweredSpeed)
		this.setTint(this.poweredTint)
		dot.destroy(true)
		heroEvents.emit('powered-start')

        this.revertDelay = this.scene.time.delayedCall(this.poweredDuration, () => {
            this.revertToNormal()
        }, [], this)
	}

	revertToNormal() {
        this.heroState = HeroState.Normal
		this.boostText.setVisible(false)
        this.setSpeed(this.normalSpeed)
        this.setTint(this.normalTint) 
        heroEvents.emit('powered-end')
		this.revertDelay 
    }

	resetHero() {
		if (this.heroState === HeroState.Powered) {
			this.revertToNormal()
			heroEvents.emit('powered-end')
		this.revertDelay 
		}
		this.setPosition(this.spawnPoint.x, this.spawnPoint.y)
	}

	setSpeed(speed: number) {
		const body = this.body as Phaser.Physics.Arcade.Body
        body.maxVelocity.set(speed, speed)
    }

	preUpdate(t: number, dt: number)
	{
		super.preUpdate(t, dt)

		this.scene.physics.world.wrapObject(this, 32)

		if(this.body) {
			if (this.body.velocity.lengthSq() === 0) {
				this.play('hero-idle-down', true) 
			} 
		
			if (this.heroState === HeroState.Powered) {
				this.poweredAccumulator += dt
				if (this.poweredAccumulator >= this.poweredDuration) {
					this.revertToNormal()
				}
			}
		}
	}

	handleMovement(dt: number, keys: { cursors: Phaser.Types.Input.Keyboard.CursorKeys, wsad: { up: Phaser.Input.Keyboard.Key, down: Phaser.Input.Keyboard.Key, left: Phaser.Input.Keyboard.Key, right: Phaser.Input.Keyboard.Key } }, boardLayer: Phaser.Tilemaps.TilemapLayer)
	{
		const threshold = 10
		const currentSpeed = this.heroState === HeroState.Powered ? this.poweredSpeed : this.normalSpeed 

		const x = (Math.floor(this.x / 32) * 32) + 16
		const y = (Math.floor(this.y / 32) * 32) + 16

		if(!this.body){
			return
		}
		const vel = this.body.velocity

		const keysDown = this.getKeysDownState(keys.cursors, keys.wsad)

		if (vel.lengthSq() > 0.2) {
			if (Math.abs(vel.x) > Math.abs(vel.y)) {
				if (vel.x > 0) {
					this.play('hero-move-right', true)
					this.lastMoveDirection = Moves.Right
				} else {
					this.play('hero-move-left', true)
					this.lastMoveDirection = Moves.Left
				}
			} else {
				if (vel.y > 0) {
					this.play('hero-move-down', true)
					this.lastMoveDirection = Moves.Down
				} else {
					this.play('hero-move-up', true)
					this.lastMoveDirection = Moves.Up
				}
			}
		} else {
			switch (this.lastMoveDirection) {
				case Moves.Right:
					this.play('hero-idle-right')
					break
				case Moves.Left:
					this.play('hero-idle-left')
					break
				case Moves.Up:
					this.play('hero-idle-up')
					break
				case Moves.Down:
					this.play('hero-idle-down')
					break
			}
			this.lastKeyDown = Moves.None
		}

		
		if (vel.lengthSq() < 0.01) {
			if (keysDown.right) {
				this.play('hero-idle-right')
				this.lastMoveDirection = Moves.Right
			} else if (keysDown.left) {
				this.play('hero-idle-left')
				this.lastMoveDirection = Moves.Left
			} else if (keysDown.down) {
				this.play('hero-idle-down')
				this.lastMoveDirection = Moves.Down
			} else if (keysDown.up) {
				this.play('hero-idle-up')
				this.lastMoveDirection = Moves.Up
			}
		}
		
		if (keysDown.left && vel.x >= 0)
		{
			if (!boardLayer.getTileAtWorldXY(this.x - 32, this.y))
			{
				if (vel.y === 0 || Math.abs(y - this.y) <= threshold)
				{
					this.queuedMove = Moves.Left
				}	
			}
		}
		else if (keysDown.right && vel.x <= 0)
		{
			if (!boardLayer.getTileAtWorldXY(this.x + 32, this.y))
			{
				if (vel.y === 0 || Math.abs(y - this.y) <= threshold)
				{
					this.queuedMove = Moves.Right
				}
			}
		}
		else if (keysDown.up && vel.y >= 0)
		{
			if (!boardLayer.getTileAtWorldXY(this.x, this.y - 32))
			{
				if (vel.x === 0 || Math.abs(x - this.x) <= threshold)
				{
					this.queuedMove = Moves.Up
				}
			}
		}
		else if (keysDown.down && vel.y <= 0)
		{
			if (!boardLayer.getTileAtWorldXY(this.x, this.y + 32))
			{
				if (vel.x === 0 || Math.abs(x - this.x) <= threshold)
				{
					this.queuedMove = Moves.Down
				}
			}
		}

		if (this.queuedMove !== Moves.None)
		{
			this.queuedMoveAccumulator += dt
			if (this.queuedMoveAccumulator >= 200)
			{
				this.queuedMove = Moves.None
				this.queuedMoveAccumulator = 0
			}
		}

		switch (this.queuedMove)
		{
			case Moves.None:
				break

			case Moves.Left:
			{
				if (Math.abs(y - this.y) <= 2)
				{
					this.lastKeyDown = this.queuedMove
					this.queuedMove = Moves.None
				}
				break
			}

			case Moves.Right:
			{
				if (Math.abs(y - this.y) <= 2)
				{
					this.lastKeyDown = this.queuedMove
					this.queuedMove = Moves.None
				}
				break
			}

			case Moves.Up:
			{
				if (Math.abs(x - this.x) <= 2)
				{
					this.lastKeyDown = this.queuedMove
					this.queuedMove = Moves.None
				}
				break
			}

			case Moves.Down:
			{
				if (Math.abs(x - this.x) <= 2)
				{
					this.lastKeyDown = this.queuedMove
					this.queuedMove = Moves.None
				}
				break
			}
		}

		switch (this.lastKeyDown)
		{
			case Moves.Left:
			{
				const y = (Math.floor((this.body.y + 16) / 32) * 32) // + 16
				this.body.y = y
				this.setVelocity(-currentSpeed, 0)
				break
			}

			case Moves.Right:
			{
				const y = (Math.floor((this.body.y + 16) / 32) * 32) // + 16
				this.body.y = y
				this.setVelocity(currentSpeed, 0)
				break
			}

			case Moves.Up:
			{
				const x = Math.floor((this.body.x + 16) / 32) * 32
				this.body.x = x
				this.setVelocity(0, -currentSpeed)
				break
			}

			case Moves.Down:
			{
				const x = Math.floor((this.body.x + 16) / 32) * 32
				this.body.x = x
				this.setVelocity(0, currentSpeed)
				break
			}
		
			default:
				break
		}
	}

	getKeysDownState(cursors: Phaser.Types.Input.Keyboard.CursorKeys, wasd: { up: Phaser.Input.Keyboard.Key, down: Phaser.Input.Keyboard.Key, left: Phaser.Input.Keyboard.Key, right: Phaser.Input.Keyboard.Key })
	{
		return {
			left: cursors.left.isDown || wasd.left.isDown,
			right: cursors.right.isDown || wasd.right.isDown,
			up: cursors.up.isDown || wasd.up.isDown,
			down: cursors.down.isDown || wasd.down.isDown
		}
	}
}

Phaser.GameObjects.GameObjectFactory.register('hero', function (this: Phaser.GameObjects.GameObjectFactory, x: number, y: number, texture: string) {
	const hero = new Hero(this.scene, x, y, texture)

	this.displayList.add(hero)
	this.updateList.add(hero)

	this.scene.physics.world.enableBody(hero, Phaser.Physics.Arcade.DYNAMIC_BODY)

	const body = hero.body as Phaser.Physics.Arcade.Body
	body.setCircle(16)
		.setFriction(0, 0)

	return hero
})

declare global
{
	namespace Phaser.GameObjects
	{
		interface GameObjectFactory
		{
			hero(x: number, y: number, texture: string): Hero
		}
	}
}
import Phaser from 'phaser'

import { IGhostAI, getOrderedDirections, getOppositeDirection } from './IGhostAI'
import Hero from '../Hero'
import Ghost from '../Ghost'

import { determineDirectionFromTarget } from './utils/determineDirectionFromTarget'

import { borkTrait } from '../../scenes/Game'

//red ghost
export default class ChaseHeroAI implements IGhostAI
{
	private readonly hero: Hero
	private readonly ghost: Ghost
	private readonly board: Phaser.Tilemaps.TilemapLayer

	get speed()
	{
		if(borkTrait == 'Maverick') {
			return 50
		} else {
			return 60
		}
	}

	get targetPosition()
	{
		if (this.hero && this.hero.body) {
			return {
				x: this.hero.x,
				y: this.hero.y
			}
		}
		// Return some default position if hero or hero's body is undefined
		// Adjust these coordinates to a safe fallback position
		return { x: 0, y: 0 }
	}

	constructor(hero: Hero, ghost: Ghost, board: Phaser.Tilemaps.TilemapLayer)
	{
		this.hero = hero
		this.ghost = ghost
		this.board = board

		if (!hero || !hero.body) {
			console.error("Hero is not properly initialized:", hero)
		}
	}

	pickDirection()
	{
		let tx = 0
    	let ty = 0

		if (this.hero && this.hero.body) {
			tx = this.hero.body.position.x
			ty = this.hero.body.position.y
		}

		const backwardsPosition = getOppositeDirection(this.ghost.currentDirection)
		const directions = getOrderedDirections(dir => dir !== backwardsPosition)

		return determineDirectionFromTarget(
			this.ghost.x, this.ghost.y,
			tx, ty,
			directions,
			this.board
		)
	}
}
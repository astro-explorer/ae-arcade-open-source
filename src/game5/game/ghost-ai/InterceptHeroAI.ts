import Phaser from 'phaser'

import { IGhostAI, getOppositeDirection, getOrderedDirections } from './IGhostAI'
import Hero from '../Hero'
import Ghost from '../Ghost'

import { determineDirectionFromTarget } from './utils/determineDirectionFromTarget'
import { TileSize } from './consts/TileConfig'

import { borkTrait } from '../../scenes/Game'

//pink ghost
export default class InterceptHeroAI implements IGhostAI
{
	hero: Hero
	ghost: Ghost
	board: Phaser.Tilemaps.TilemapLayer
	mimicOriginal = false

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
		const heroDir = this.hero.facingVector

		if (this.mimicOriginal && heroDir.y === -1)
		{
			// set x to -1 to replicate original pac-man bug
			heroDir.x = -1
		}

		const tx = this.hero.x + TileSize * (heroDir.x * 4)
		const ty = this.hero.y + TileSize * (heroDir.y * 4)

		return { x: tx, y: ty }
	}

	constructor(hero: Hero, ghost: Ghost, board: Phaser.Tilemaps.TilemapLayer, mimicOriginal = false)
	{
		this.hero = hero
		this.ghost = ghost
		this.board = board
		this.mimicOriginal = mimicOriginal
	}

	pickDirection()
	{
		const backwardsDirection = getOppositeDirection(this.ghost.currentDirection)
		const directions = getOrderedDirections(dir => dir !== backwardsDirection)

		const targetPos = this.targetPosition
		const tx = targetPos.x
		const ty = targetPos.y

		return determineDirectionFromTarget(this.ghost.x, this.ghost.y, tx, ty, directions, this.board)
	}
}

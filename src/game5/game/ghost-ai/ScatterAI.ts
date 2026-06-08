import Phaser from 'phaser'

import { IGhostAI, getOrderedDirections, getOppositeDirection } from './IGhostAI'
import Ghost from '../Ghost'

import determineDirectionFromTarget from './utils/determineDirectionFromTarget'

export default class ScatterAI implements IGhostAI
{
	targetX: number
	targetY: number
	ghost: Ghost
	boardLayer: Phaser.Tilemaps.TilemapLayer

	get speed()
	{
		return 100
	}

	get targetPosition()
	{
		return {
			x: this.targetX,
			y: this.targetY
		}
	}

	constructor(targetX: number, targetY: number, ghost: Ghost, board: Phaser.Tilemaps.TilemapLayer)
	{
		this.targetX = targetX
		this.targetY = targetY
		this.ghost = ghost
		this.boardLayer = board
	}

	pickDirection()
	{
		const backwardsDirection = getOppositeDirection(this.ghost.currentDirection)
		const directions = getOrderedDirections(dir => dir !== backwardsDirection)

		return determineDirectionFromTarget(
			this.ghost.x, this.ghost.y,
			this.targetX, this.targetY,
			directions,
			this.boardLayer
		)
	}
}

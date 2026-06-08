import { borkTrait } from './io'

let triesRemainingValue = 3
if(borkTrait == 'Houdini') {
	triesRemainingValue = 4
}

export function getTriesRemaining() {
    return triesRemainingValue
}

export function setTriesRemaining(value: number) {
    triesRemainingValue = value
}

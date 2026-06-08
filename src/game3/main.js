import Phaser from 'phaser';
import Preloader from './scenes/Preloader';
import Game from './scenes/Game';

export function startGame3({ gameTrait, onFinishGame }) {
    Game.gameTrait = gameTrait
    Game.onFinishGame = onFinishGame
    
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        parent: "phaser-container",
        backgroundColor: '#808080',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
            },
        },
        scene: [Preloader, Game],
    };

    return new Phaser.Game(config);
}

export default startGame3;

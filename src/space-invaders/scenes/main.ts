import { AssetType, SoundType } from "../interface/assets";
import { Bullet } from "../interface/bullet";
import { AssetManager } from "../interface/manager/asset-manager";
import { AlienManager } from "../interface/manager/alien-manager";
import { Ship } from "../interface/ship";
import {
  AnimationFactory,
  AnimationType,
} from "../interface/factory/animation-factory";
import { Alien } from "../interface/alien";
import { Kaboom } from "../interface/kaboom";
import { EnemyBullet } from "../interface/enemy-bullet";
import { ScoreManager } from "../interface/manager/score-manager";
import { GameState } from "../interface/game-state";
import { urlParams } from "../../urlParams";

export class MainScene extends Phaser.Scene {
  state: GameState;
  assetManager: AssetManager;
  animationFactory: AnimationFactory;
  scoreManager: ScoreManager;
  bulletTime = 0;
  firingTimer = 0;
  starfield: Phaser.GameObjects.TileSprite;
  player: Phaser.Physics.Arcade.Sprite;
  alienManager: AlienManager;
  keys: { [key: string]: Phaser.Input.Keyboard.Key };
  countdownText: Phaser.GameObjects.Text;
  scoreText: Phaser.GameObjects.Text;
  customConfig: any;
  #gamepad?: Phaser.Input.Gamepad.Gamepad;

  constructor() {
    super({
      key: "MainScene",
    });
  }

  preload() {
    this.load.image(AssetType.Starfield, "/background.v2.jpg");
    this.load.image(AssetType.EnemyBullet, "/assets/images/goo_shot.png");

    const isGlizzy = urlParams.get("glizzy") !== null;
    if (isGlizzy) {
      this.load.image(AssetType.Bullet, "/assets/images/mustard.png");
      this.load.image(AssetType.Alien, "/assets/images/hotdog.png");
    } else {
      this.load.image(AssetType.Bullet, "/assets/images/bullet.png");
      this.load.image(AssetType.Alien, "/assets/images/viking.png");
    }

    this.load.image(AssetType.Ship, "/assets/images/bork.png");
    this.load.spritesheet(AssetType.Kaboom, "/assets/images/explode.png", {
      frameWidth: 128,
      frameHeight: 128,
    });

    this.sound.volume = 0;
    this.load.audio(SoundType.Shoot, "/assets/audio/shoot.wav");
    this.load.audio(SoundType.Kaboom, "/assets/audio/explosion.wav");
    this.load.audio(SoundType.InvaderKilled, "/assets/audio/invaderkilled.wav");
  }

  create() {
    // Support controllers.
    this.#gamepad = this.input.gamepad.pad1;
    this.input.gamepad.once("connected", () => {
      this.#gamepad = this.input.gamepad.pad1;
    });

    this.customConfig = (this.game as any).customConfig;
    this.state = GameState.Paused;
    this.starfield = this.add
      .tileSprite(0, 0, 800, 700, AssetType.Starfield)
      .setOrigin(0, 0);
    this.assetManager = new AssetManager(this);
    this.animationFactory = new AnimationFactory(this);
    this.keys = {
      a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
    };
    this.player = Ship.create(this);
    this.alienManager = new AlienManager(this);
    this.scoreManager = new ScoreManager(this);

    this.scoreText = this.add.text(16, 16, "Score: ...", {
      align: "left",
      fontSize: "24px",
    });
    this.scoreText.setVisible(!!this.customConfig.challengeMode);

    let countdownRemaining = 3;
    this.countdownText = this.add.text(0, 370, "Game starts in 3 seconds", {
      align: "center",
      fontSize: "24px",
      fixedWidth: this.game.canvas.width,
    });
    const countdownInterval = setInterval(() => {
      // Tick.
      countdownRemaining -= 1;

      // Cleanup.
      if (countdownRemaining === 0) {
        clearInterval(countdownInterval);
        this.state = GameState.Playing;
        this.countdownText.destroy();
        return;
      }

      // Update text.
      this.countdownText.text = `Game starts in ${countdownRemaining} seconds`;
    }, 1000);

    this.input.on("pointerdown", (pointer: any) => {
      pointer.active = true;

      switch (this.state) {
        case GameState.Win:
        case GameState.GameOver:
          this.restart();
          break;
      }
    });
  }

  update() {
    this._shipMovementHandler();

    // Bail if game is paused.
    if (this.state === GameState.Paused) {
      return;
    }

    this.starfield.tilePositionY -= 1;
    if (this.time.now > this.firingTimer) {
      this._enemyFires();
    }

    // Autofire.
    this._fireBullet();

    this.physics.overlap(
      this.assetManager.bullets,
      this.alienManager.aliens,
      this._bulletHitAliens,
      null,
      this
    );
    this.physics.overlap(
      this.assetManager.enemyBullets,
      this.player,
      this._enemyBulletHitPlayer,
      null,
      this
    );
  }

  private _shipMovementHandler() {
    // Limit player X.
    const paddingX = 100;
    const minX = paddingX;
    const maxX = this.game.canvas.width - paddingX;
    if (this.player.x < minX) {
      this.player.x = minX;
    }
    if (this.player.x > maxX) {
      this.player.x = maxX;
    }

    // Determine new velocity.
    let velocityX = 0;

    // Listen for taps.
    if (this.input.activePointer.isDown) {
      const deltaX = this.input.activePointer.x - this.player.x;
      if (Math.abs(deltaX) > 50) {
        velocityX = deltaX > 0 ? 200 : -200;
      }
    }

    // Listen for keys.
    if (
      this.keys.left.isDown ||
      this.keys.a.isDown ||
      this.#gamepad?.left ||
      this.#gamepad?.leftStick?.x! < -0.25
    ) {
      velocityX = -200;
    } else if (
      this.keys.d.isDown ||
      this.keys.right.isDown ||
      this.#gamepad?.right ||
      this.#gamepad?.leftStick?.x! > 0.25
    ) {
      velocityX = 200;
    }

    // Update velocity.
    let playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setVelocity(velocityX, 0);
  }

  private _bulletHitAliens(bullet: Bullet, alien: Alien) {
    let explosion: Kaboom = this.assetManager.explosions.get();
    bullet.kill();
    alien.kill(explosion);
    this.scoreManager.increaseScore();
    this.scoreText.setText(`Score: ${this.scoreManager.score}`);
    if (!this.alienManager.hasAliveAliens) {
      if (!!this.customConfig.challengeMode) {
        this.alienManager.reset();
      } else {
        this._finishGame();
      }
      // this.scoreManager.increaseScore(10);
      // this.scoreManager.setWinText();
      // this.state = GameState.Win;
    }
  }

  private _enemyBulletHitPlayer(ship, enemyBullet: EnemyBullet) {
    let explosion: Kaboom = this.assetManager.explosions.get();
    enemyBullet.kill();

    this.scoreManager.loseLife();

    explosion.setPosition(this.player.x, this.player.y);
    explosion.play(AnimationType.Kaboom);
    // this.sound.play(SoundType.Kaboom);
    if (this.scoreManager.noMoreLives) {
      this._finishGame();
      // this.scoreManager.setGameOverText();
      // this.assetManager.gameOver();
      // this.state = GameState.GameOver;
      // this.player.disableBody(true, true);
    }
  }

  private _finishGame() {
    document.body.style.height = "";

    window.oncontextmenu = null;
    document.body.style.userSelect = "";

    if (this.#gamepad) {
      this.#gamepad.destroy();
    }
    this.game.destroy(true);
    this.customConfig.onFinishGame(
      this.scoreManager.livesRemaining,
      this.scoreManager.score
    );
  }

  private _enemyFires() {
    if (!this.player.active) {
      return;
    }
    let enemyBullet: EnemyBullet = this.assetManager.enemyBullets.get();
    let randomEnemy = this.alienManager.getRandomAliveEnemy();
    if (enemyBullet && randomEnemy) {
      enemyBullet.setPosition(randomEnemy.x, randomEnemy.y);
      const speed = 240 + this.scoreManager.score;
      this.physics.moveToObject(enemyBullet, this.player, speed);
      const delay = 500 - this.scoreManager.score * 2;
      this.firingTimer = this.time.now + delay;
    }
  }

  private _fireBullet() {
    if (!this.player.active) {
      return;
    }

    if (this.state !== GameState.Playing) {
      return;
    }

    if (this.time.now > this.bulletTime) {
      let bullet: Bullet = this.assetManager.bullets.get();
      if (bullet) {
        bullet.shoot(this.player.x, this.player.y - 18);

        const delay = this.customConfig.gameTrait === "Maverick" ? 375 : 500;

        this.bulletTime = this.time.now + delay;
      }
    }
  }

  restart() {
    this.state = GameState.Playing;
    this.player.enableBody(true, this.player.x, this.player.y, true, true);
    this.scoreManager.resetLives();
    this.scoreManager.hideText();
    this.alienManager.reset();
    this.assetManager.reset();
  }
}

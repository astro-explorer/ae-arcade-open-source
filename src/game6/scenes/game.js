import Player from "../gameobjects/player";
import Generator from "../gameobjects/generator";

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: "game" });
    this.player = null;
    this.score = -5;
    this.scoreText = null;
    this.lives = 3;
    this.livesText = null;
    this.movingLeft = false;
    this.movingRight = false;
    this.stars = true;
    this.velocityX = 0;
    this.wrapRect;

    // Modify these for traits
    this.extraLife = false;
    if (Game.gameTrait === "Houdini") {
      this.extraLife = true;
    }
    this.easy = false;
    if (Game.gameTrait === "Maverick") {
      this.easy = true;
    }
    console.log("Game Trait: ", Game.gameTrait);

    // URL params
    // Endless vs arcade mode
    this.endless = Game.challengeMode || urlParams.get("endless") != null;
    // Seed for enemy randomness
    this.seed = Game.seed || urlParams.get("seed") || Date.now();
    // Glizzy mode
    this.glizzy = urlParams.get("glizzy") != null;
    // Replay mode
    this.replay = !!Game.replayData;
    this.replayData = this.replay ? JSON.parse(Game.replayData) : [];
  }

  init(data) {
    this.name = data.name;
    this.number = data.number;
    this.score = -5;
    this.lives = 3;
    this.velocityX = 0;
    this.movingLeft = false;
    this.movingRight = false;
  }

  /*
    We use the `preload` method to load all the assets that we need for the game.
    We also set the score to 0 in the registry, so we can access it from other scenes.
    */
  preload() {
    this.registry.set("score", this.score);
    this.registry.set("lives", this.lives);
    this.load.bitmapFont(
      "arcade",
      "assets/game6/fonts/arcade.png",
      "assets/game6/fonts/arcade.xml"
    );
    this.load.spritesheet("player", "assets/game6/images/player.png", {
      frameWidth: 64,
      frameHeight: 72,
    });
    this.load.spritesheet("arrow", "assets/game6/images/arrow.png", {
      frameWidth: 62,
      frameHeight: 65,
    });

    if (this.glizzy) {
      this.load.spritesheet("enemy", "assets/images/hotdog.png", {
        frameWidth: 32,
        frameHeight: 32,
      });
    } else {
      this.load.spritesheet("enemy", "assets/game6/images/enemy.png", {
        frameWidth: 70,
        frameHeight: 70,
      });
    }
  }

  /*
Here we do several things.

- We use the `create` method to initialize the game.
- We set some variables to store width and height that we may need later.,
- We set the background color, and create the player, the enemies, and the coins.
- We also create the keyboard input to listen to the space key.
- Also, we add a collider between the player and the enemies and an overlap
between the player and the coins. The key part there is to set a function that will be called when the player overlaps with a coin or hits an obstacle.
*/
  create() {
    this.width = this.sys.game.config.width;
    this.height = this.sys.game.config.height;
    this.center_width = this.width / 2;
    this.center_height = this.height / 2;
    this.worldTop = this.width / 16;
    this.worldBottom = this.width / 2
    this.timeline = this.add.timeline()

    this.cameras.main.setBackgroundColor(0x000000);
    this.physics.world.setBounds(0, this.worldTop, this.width, this.worldBottom - this.worldTop, false, false, true, true)
    this.enemies = this.add.group();
    this.LEFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.RIGHT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.A = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.D = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.S = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.player = new Player(this, this.center_width, 250);
    this.player.init();
    this.scoreText = this.add
      .bitmapText(this.width / 8, 25, "arcade", "Score: 0", 15)
      .setOrigin(0.5);
    this.livesText = this.add
      .bitmapText(
        this.width - this.width / 8,
        25,
        "arcade",
        "Lives: " + this.lives,
        15
      )
      .setOrigin(0.5);

    if (this.glizzy) {
      this.add
        .bitmapText(this.center_width, 25, "arcade", "Glizzy Gauntlet", 40)
        .setOrigin(0.5);
    } else {
      this.add
        .bitmapText(this.center_width, 25, "arcade", "Gravity Gauntlet", 40)
        .setOrigin(0.5);
    }

    this.timerText = this.add
      .bitmapText(
        this.center_width,
        this.height / 5 * 4,
        "arcade",
        -this.score,
        50
      )
      .setOrigin(0.5);

    if (this.glizzy) {
      this.message = this.add
        .bitmapText(
          this.center_width,
          (this.height / 16) * 10,
          "arcade",
          "Avoid the glizzies!",
          25
        )
        .setOrigin(0.5);
    } else if (this.replay) {
      this.message = this.add
        .bitmapText(
          this.center_width,
          (this.height / 16) * 10,
          "arcade",
          "click here to exit replay",
          25
        )
        .setOrigin(0.5);
      this.message.setInteractive();
      this.message.on("pointerdown", () => {
        this.game.destroy(true);
        document.body.style.height = "";
        window.oncontextmenu = null;
        document.body.style.userSelect = "";
        Game.onFinishGame(0, 0, "");
      });
    } else {
      this.message = this.add
        .bitmapText(
          this.center_width,
          (this.height / 16) * 10,
          "arcade",
          "Avoid the enemies!",
          25
        )
        .setOrigin(0.5);
    }

    this.subMessage = this.add
      .bitmapText(
        this.center_width,
        (this.height / 16) * 11,
        "arcade",
        "controls: LEFT, RIGHT, A, D",
        15
      )
      .setOrigin(0.5);

    this.physics.world.on("worldbounds", (body, up, down, _left, _right) => {
      if (up || down) {
        body.gameObject.toggleFlipY()
      }
    });

    this.input.on('pointerdown', (pointer) => {
      pointer.active = true;
    })

    if (!this.replay) {
      this.physics.add.overlap(
        this.player,
        this.enemies,
        this.hitObstacle,
        () => {
          return true;
        },
        this
      );
    }

    this.time.paused = true;
    /*
    We use `updateScoreEvent` to update the score every 100ms so the player can see the score increasing as long as he survives.
    */
    this.updateScoreEvent = this.time.addEvent({
      delay: 1000,
      callback: () => this.updateScore(),
      callbackScope: this,
      loop: true,
    });

    if (this.replay) {
      const startEvent = this.replayData[0];
      this.replayData.forEach((event) => {
        let at = event[1] - startEvent[1]
        let action;

        switch (event[0]) {
          case "l":
            action = this.moveLeft;
            break;
          case "r":
            action = this.moveRight;
            break;
          case "s":
            action = this.stopX;
            break;
          case "h":
            action = this.hitObstacle;
            break;
        }

        if (action) {
          this.timeline.add({
            at: at,
            run: action,
            target: this,
          });
        }
      });
    }

    this.wrapRect = new Phaser.Geom.Rectangle(0, 0, 800, 800);
    this.recordInput("i", this.time.now);
    this.time.paused = false;
    this.generator = new Generator(this);
    this.timeline.play()
  }

  /*
This method is called when the player hits an obstacle. We stop the updateScoreEvent so the score doesn't increase anymore.

And obviously, we finish the scene.
*/
  hitObstacle(player, obstacle) {
    if (this.player.invincible) { return };
    //obstacle.destroy();
    this.recordInput("h", this.time.now);
    this.player.damage();
    this.cameras.main.shake(250, 0.025);
    this.updateLives();

    if (this.lives <= 0){
      if (!this.extraLife) {
        this.updateScoreEvent.destroy();
        this.finishScene();
      }
      this.extraLife = false;
    }

    this.updateMessage(null, this.lives);
  }

  /*
This is the game loop. The function is called every frame.

Here is where we can check if a key was pressed or the situation of the player to act accordingly. We use the `update` method to check if the player pressed the space key.
*/
  update() {
    this.player.body.setVelocityX(this.velocityX);
    Phaser.Actions.WrapInRectangle([this.player], this.wrapRect, 0);

    if (this.replay) { return }

    if (Phaser.Input.Keyboard.JustDown(this.S)) {
      this.stars = !this.stars;
    }

    const justDownLeft =
      Phaser.Input.Keyboard.JustDown(this.LEFT) ||
      Phaser.Input.Keyboard.JustDown(this.A);
    const justUpLeft =
      Phaser.Input.Keyboard.JustUp(this.LEFT) ||
      Phaser.Input.Keyboard.JustUp(this.A);
    const justDownRight =
      Phaser.Input.Keyboard.JustDown(this.RIGHT) ||
      Phaser.Input.Keyboard.JustDown(this.D);
    const justUpRight =
      Phaser.Input.Keyboard.JustUp(this.RIGHT) ||
      Phaser.Input.Keyboard.JustUp(this.D);

    if (this.input.activePointer.isDown) {
      if (this.input.activePointer.x > this.center_width && !this.movingRight) {
        this.movingLeft = false;
        this.moveRight();
      }
      if (this.input.activePointer.x < this.center_width && !this.movingLeft) {
        this.movingRight = false;
        this.moveLeft();
      }
    } else if (
      !this.LEFT.isDown &&
      !this.A.isDown &&
      !this.RIGHT.isDown &&
      !this.D.isDown
    ) {
      this.stopX();
    }

    if (justDownRight) {
      this.moveRight();
    }
    if (justDownLeft) {
      this.moveLeft()
    }
    if (justUpRight) {
      this.movingRight = false;
      this.movingLeft ? this.moveLeft() : this.stopX();
    }
    if (justUpLeft) {
      this.movingLeft = false;
      this.movingRight ? this.moveRight() : this.stopX();
    }
  }

  moveRight() {
    if (this.velocityX === 500) {
      return;
    }
    this.recordInput("r", this.time.now);
    this.movingRight = true;
    this.velocityX = 500;
    this.player.setFlipX(false);
  }

  moveLeft() {
    if (this.velocityX === -500) {
      return;
    }
    this.recordInput("l", this.time.now);
    this.movingLeft = true;
    this.velocityX = -500;
    this.player.setFlipX(true);
  }

  stopX() {
    if (this.velocityX === 0) {
      return;
    }
    this.recordInput("s", this.time.now);
    this.movingRight = false;
    this.movingLeft = false;
    this.velocityX = 0;
  }

  /*
What should we do when we finish the game scene?

- Play the dead sound
- Set the score in the registry to show it in the `gameover` scene.
- Start the `gameover` scene.

*/
  finishScene() {
    this.stopX();
    this.registry.set("score", this.score);
    this.registry.set("lives", this.lives);
    this.registry.set("replay", JSON.stringify(this.replayData));
    this.scene.start("gameover");
  }

  /*
This method is called every 100ms and it is used to update the score and show it on the screen.
*/
  updateScore() {
    this.score ++;

    if (this.score === 30 && !this.endless) {
      this.finishScene();
    }

    if (this.score < 0) {
      this.timerText.setText(-this.score);
    } else if (this.score === 0) {
      this.timerText.setText(null);
    } else {
      this.scoreText.setText("Score: " + this.score);
    }

    this.updateMessage(this.score, null)
  }

  updateMessage(score, lives) {
    if (this.replay) {
      return;
    }

    var newText;

    switch (lives) {
      case 0:
        newText = "I'll let you have one more";
        break
      case 1:
        newText = "last chance!"
        break
      case 2:
        newText = this.glizzy ? "I said AVOID the glizzies!" : "I said AVOID the enemies!";
        break
    }

    switch (score) {
      case 5:
        newText = "WATCH OUT! ON THE LEFT!"
        break;
      case 10:
        newText = "we're just getting started"
        break;
      case 20:
        newText = "is this getting faster?"
        break;
      case 30:
        newText = "YOU WIN!"
        break;
      case 32:
        newText = "jk, it never ends..."
        break;
      case 34:
        newText = "it just gets harder and harder"
        break;
      case 45:
        newText = "how long can you last?"
        break;
      case 80:
        newText = "are you cheating?"
        break;
    }

    if (newText) { this.message.setText(newText) }
  }

  updateLives(lives = 1) {
    this.lives -= lives;
    this.livesText.setText("Lives: " + this.lives);
  }

  recordInput(input, time) {
    if (this.replay) { return }
    this.replayData.push([input, Math.round(time)]);
  }
}

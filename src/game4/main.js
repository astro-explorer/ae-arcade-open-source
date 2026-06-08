import Phaser from "phaser";

export function startGame4({ gameTrait, onFinishGame }) {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
    scene: {
      preload: preload,
      create: create,
      update: update,
    },
    parent: "phaser-container",
    callbacks: {
      postBoot: function (game) {
        game.getTime = function () {
          return Date.now();
        };
      },
    },
  };

  const game = new Phaser.Game(config);
  game.gameTrait = gameTrait;
  let kills = 0,
    Lives = 3,
    Missiles = 3;
  if (game.gameTrait === "Houdini") {
    Lives = 4;
  }
  let killsText, LivesText, MissilesText;
  let player, obstacles, bullets;
  let teleportMode = false;
  let gameStarted = false; // this will be true when the game starts
  let lastTeleportTime = 0;
  const teleportCooldown = 5000; // 5000 milliseconds or 5 seconds
  const blueGray = 0x7f7faf; // This is an arbitrary blue-gray color, you can adjust to your liking

  const tints = {
    2: 0xff9999, // light red after losing 1 life
    1: 0xff6666, // darker red after losing 2 lives
    0: 0xff3333, // very dark red after losing all 3 lives
  };

  function preload() {
    this.load.image("player", "/assets/game4/player.png");
    this.load.image("obstacle", "/assets/game4/obstacle.png");
    this.load.image("strongObstacle", "/assets/game4/strongObstacle.png");
    this.load.image(
      "strongObstacle_damaged",
      "/assets/game4/strongObstacle_damaged.png"
    );
    this.load.image("bullet", "/assets/game4/bullet.png");
    this.load.image("background", "/assets/game4/background.png");
    this.load.spritesheet("explosion", "assets/game4/explosion.png", {
      frameWidth: 24,
      frameHeight: 24,
    });
  }

  function create() {
    this.add.image(0, 0, "background").setOrigin(0, 0);

    // Add instructions
    let instructionText = this.add
      .text(
        config.width / 2,
        config.height / 2 - 50,
        "Kill 20 evil space vikings to win. Click/tap to shoot. Hit the blue teleport button then a location to teleport. You get one teleport every 5 seconds. GLHF.",
        {
          fontSize: "32px",
          fill: "#fff",
          align: "center", // This property centers the text content
          wordWrap: { width: 750, useAdvancedWrap: true },
        }
      )
      .setOrigin(0.5, 0.5);

    let countdownText = this.add
      .text(config.width / 2, config.height / 2 + 50, "5", {
        fontSize: "54px",
        fill: "#fff",
      })
      .setOrigin(0.5, 0.5);

    let countdown = 5;
    this.time.addEvent({
      delay: 1000,
      repeat: 4,
      callback: () => {
        countdown--;
        countdownText.setText(countdown.toString());

        if (countdown === 0) {
          instructionText.setVisible(false);
          countdownText.setVisible(false);
          gameStarted = true; // set the flag true when countdown reaches 0
          startGame(this); // Call a function to initiate game mechanics
        }
      },
    });
  }

  function startGame(scene) {
    scene.cursors = scene.input.keyboard.createCursorKeys();
    scene.WKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    const buttonWidth = 100;
    const buttonHeight = 50;
    const buttonX = config.width / 2 - buttonWidth / 2;
    const buttonY = config.height - buttonHeight - 10;

    // Create a blue rectangle for the button background
    let teleportButtonBG = scene.add
      .rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x0000ff)
      .setOrigin(0, 0)
      .setInteractive()
      .setAlpha(1);

    // Create the button text centered within the blue rectangle
    let teleportButtonText = scene.add
      .text(config.width / 2, buttonY + buttonHeight / 2, "Teleport", {
        fontSize: "16px",
        fill: "#fff",
      })
      .setOrigin(0.5, 0.5);

    teleportButtonBG.on("pointerdown", (event) => {
      let currentTime = game.getTime();
      if (currentTime - lastTeleportTime >= teleportCooldown) {
        teleportMode = true;
        player.setTint(0x0000ff); // set player color to blue
        lastTeleportTime = currentTime;

        // Start the fade-out tween to indicate it's in cooldown
        scene.tweens.add({
          targets: teleportButtonBG,
          alpha: 0.5, // reduce the alpha to simulate fading
          duration: 200, // time for the fade effect. Can be adjusted
          onComplete: () => {
            teleportButtonBG.setFillStyle(blueGray);
          },
        });

        // Start the fade-in tween to original blue after the cooldown
        scene.time.delayedCall(teleportCooldown, () => {
          scene.tweens.add({
            targets: teleportButtonBG,
            alpha: 1, // restore the alpha
            duration: 200, // time for the fade effect. Can be adjusted
            onComplete: () => {
              teleportButtonBG.setFillStyle(0x0000ff);
            },
          });
        });

        event.data.originalEvent.preventDefault();
      }
    });

    teleportButtonBG.on("pointerup", (event) => {
      event.data.originalEvent.preventDefault();
    });

    player = scene.physics.add.sprite(
      config.width / 2,
      config.height / 2,
      "player"
    );
    player.setCollideWorldBounds(true);

    bullets = scene.physics.add.group();
    obstacles = scene.physics.add.group();

    scene.anims.create({
      key: "explode",
      frames: scene.anims.generateFrameNumbers("explosion", {
        start: 0,
        end: 2,
      }),
      frameRate: 10,
      repeat: 0,
    });

    scene.input.on("pointerup", (pointer) => {
      if (teleportMode) {
        player.x = pointer.x;
        player.y = pointer.y;
        teleportMode = false;

        if (Lives === 3) {
          player.clearTint();
        } else if (tints[Lives]) {
          player.setTint(tints[Lives]);
        }
      } else {
        const angle = Phaser.Math.Angle.Between(
          player.x,
          player.y,
          pointer.x,
          pointer.y
        );
        player.rotation = angle + Math.PI / 2;
        shoot(scene, pointer.x, pointer.y);
      }
    });

    killsText = scene.add.text(10, 10, "Kills: 0", {
      fontSize: "16px",
      fill: "#fff",
    });
    LivesText = scene.add.text(10, 30, "Lives: 3", {
      fontSize: "16px",
      fill: "#fff",
    });
    MissilesText = scene.add.text(10, 50, "Missiles: 3", {
      fontSize: "16px",
      fill: "#fff",
    });

    let reloadDelay = scene.gameTrait === "maverick" ? 500 : 1500;

    scene.time.addEvent({
      delay: reloadDelay,
      callback: () => {
        if (Missiles < 3) {
          Missiles++;
          MissilesText.setText("Missiles: " + Missiles);
        }
      },
      callbackScope: scene,
      loop: true,
    });

    scene.time.addEvent({
      delay: 1000,
      callback: spawnObstacle,
      callbackScope: scene,
      loop: true,
    });

    scene.physics.add.collider(
      bullets,
      obstacles,
      bulletHitsObstacle,
      null,
      scene
    );
    scene.physics.add.collider(
      player,
      obstacles,
      playerHitsObstacle,
      null,
      scene
    );
  }

  function update() {
    if (!gameStarted) return;
    // Update the position of damageImage to follow their respective obstacles
    obstacles.getChildren().forEach((obstacle) => {
      if (obstacle.getData("isStrong")) {
        obstacle.damageImage.x = obstacle.x;
        obstacle.damageImage.y = obstacle.y;
      }
    });
  }

  function enableTeleportMode() {
    teleportMode = true;
  }

  function startThrust(scene) {
    isThrusting = true;
    // After 1 second, stop thrusting
    scene.time.addEvent({
      delay: 1000, // thrust duration of 1 second
      callback: () => {
        isThrusting = false;
        player.setVelocity(0, 0); // Stop the player's movement
        startGasCooldown(scene);
      },
    });
  }

  function shoot(scene, targetX, targetY) {
    if (!gameStarted) return;

    if (Missiles <= 0) return;

    const bullet = bullets.create(player.x, player.y, "bullet");
    const angle = Phaser.Math.Angle.Between(
      player.x,
      player.y,
      targetX,
      targetY
    );
    scene.physics.velocityFromRotation(angle, 200, bullet.body.velocity);
    bullet.rotation = angle + Math.PI / 2;

    Missiles--;
    MissilesText.setText("Missiles: " + Missiles);
  }

  function spawnObstacle() {
    if (!gameStarted) return;

    let x, y;

    do {
      x = Phaser.Math.Between(-100, config.width + 100);
      y = Phaser.Math.Between(-100, config.height + 100);
    } while (isInsideScreen(x, y) || isTooCloseToPlayer(x, y, 100));

    const type = Phaser.Math.Between(0, 1); // 0 for regular, 1 for strong
    const obstacle = obstacles.create(
      x,
      y,
      type ? "strongObstacle" : "obstacle"
    );
    obstacle.hitsLeft = type ? 2 : 1;
    obstacle.setImmovable(true);
    this.physics.moveToObject(obstacle, player, 50);

    if (type) {
      obstacle.damageImage = this.add
        .image(x, y, "strongObstacle_damaged")
        .setVisible(false);
      obstacle.damageImage.setDepth(1); // Make sure the damage image appears on top
      obstacle.setData("isStrong", true); // Identify the obstacle as strong for the update loop
    }
  }

  function isInsideScreen(x, y) {
    return x >= 0 && x <= config.width && y >= 0 && y <= config.height;
  }

  function isTooCloseToPlayer(x, y, minDistance) {
    const dx = player.x - x;
    const dy = player.y - y;
    return dx * dx + dy * dy < minDistance * minDistance;
  }

  function bulletHitsObstacle(bullet, obstacle) {
    if (!gameStarted) return;

    bullet.destroy();

    obstacle.hitsLeft--;

    // Check if the obstacle is a strongObstacle and it has been hit once
    if (obstacle.hitsLeft === 1 && obstacle.damageImage) {
      obstacle.setVisible(false); // Hide the main sprite
      obstacle.damageImage.setVisible(true); // Show the damaged image
      obstacle.damageImage.x = obstacle.x; // Ensure damage image position matches
      obstacle.damageImage.y = obstacle.y;
    } else if (obstacle.hitsLeft <= 0) {
      obstacle.destroy();
      if (obstacle.damageImage) {
        // Destroy the damage image too, if present
        obstacle.damageImage.destroy();
      }

      // Add explosion sprite and play the animation
      var explosion = this.add
        .sprite(obstacle.x, obstacle.y, "explosion")
        .setOrigin(0.5, 0.5);
      explosion.play("explode");

      explosion.once("animationcomplete", () => {
        explosion.destroy();
      });

      kills++;
      killsText.setText("Kills: " + kills);

      if (kills >= 20) {
        this.add.text(config.width / 2 - 50, config.height / 2, "You Win!", {
          fontSize: "32px",
          fill: "#fff",
        });
        this.physics.pause();
        // Get violent.
        this.game.destroy(true);
        // then, remove the DOM container
        document.body.style.height = "";
        window.oncontextmenu = null;
        document.body.style.userSelect = "";

        onFinishGame(Lives);
      }
    }
  }

  function playerHitsObstacle(player, obstacle) {
    if (!gameStarted) return;

    obstacle.destroy();

    Lives--;
    LivesText.setText("Lives: " + Lives);

    // Tint the player based on the remaining lives
    if (tints[Lives]) {
      player.setTint(tints[Lives]);
    }

    if (Lives <= 0) {
      this.add.text(config.width / 2 - 50, config.height / 2, "Game Over", {
        fontSize: "32px",
        fill: "#fff",
      });
      this.physics.pause();
      // Cleanup.
      document.body.style.height = "";
      window.oncontextmenu = null;
      document.body.style.userSelect = "";

      // Get violent.
      this.game.destroy(true);
      // then, remove the DOM container
      document.body.style.height = "";
      window.oncontextmenu = null;
      document.body.style.userSelect = "";
      onFinishGame(Lives);
    }

    // Add explosionx sprite and play the animation
    var explosion = this.add
      .sprite(obstacle.x, obstacle.y, "explosion")
      .setOrigin(0.5, 0.5);
    explosion.play("explode");

    explosion.once("animationcomplete", () => {
      explosion.destroy();
    });
  }
}

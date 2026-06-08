class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player");
    this.setOrigin(0.5, 0.5);
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.setScale(0.75);
    this.invincible = false;
  }

  init() {
    this.body.setSize(this.width / 2, this.height * 0.75, true);
    this.scene.time.delayedCall(
      5000,
      () => this.body.setVelocity(0, 500),
      null,
      this
    );
    this.scene.time.delayedCall(
      3000,
      () => this.body.setCollideWorldBounds(true, 0, 1, true),
      null,
      this
    );

    this.scene.tweens.add({
      targets: this,
      x: { from: 0, to: this.scene.width / 2 },
      duration: 3000,
      onComplete: null,
    });

    this.animate()
  }

  animate() {
    this.scene.anims.create({
      key: "player",
      frames: this.scene.anims.generateFrameNumbers("player", {
        start: 0,
        end: 2,
      }),
      frameRate: 6,
    });
    this.play({ key: "player", repeat: -1 });
  }

  damage() {
    this.invincible = true;
    this.scene.tweens.add({
      targets: this,
      angle: { from: 0, to: 720 },
      duration: 500,
      onComplete: null,
    });
    this.scene.time.delayedCall(
      500,
      () => {
        this.invincible = false;
      },
      null,
      this
    );
  }

  spin() {
    this.scene.tweens.add({
      targets: this,
      angle: { from: 0, to: 720 },
      duration: 2000,
      repeat: -1,
      onComplete: null,
    });
  }
}

export default Player;

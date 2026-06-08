export default class Generator {
  constructor(scene) {
    this.scene = scene;
    this.rand = new Phaser.Math.RandomDataGenerator([scene.seed]);
    this.initialDelta = this.scene.easy ? 950 : 750;
    this.generateStars();
    this.generateBounds();
    this.generateArrows();
    this.scene.timeline.add({
      at: 5000,
      run: () => {
        this.generateEnemy(5000, this.initialDelta)
      },
      target: this,
    });
  }

  generateStars() {
    if (this.scene.stars) { new Star(this.scene) };

    this.scene.time.delayedCall(
      Phaser.Math.Between(10, 30),
      () => this.generateStars(),
      null,
      this
    );
  }

  generateBounds() {
    new Bounds(this.scene, 1200, this.scene.worldTop);
    new Bounds(this.scene, 1200, this.scene.worldBottom);
  }

  generateArrows() {
    const width = this.scene.width
    const height = this.scene.height
    new Arrow(this.scene, width - (width / 8), height - (height / 5))
    new Arrow(this.scene, width / 8, height - height / 5).setFlipX(true);
  }

  generateEnemy(time, delta) {
    var nextDelta = 350
    if (delta > nextDelta) {
      const gameTime = time - 5000
      nextDelta = this.initialDelta - Math.floor(gameTime / 1000) * 5;
    }

    const nextTime = nextDelta + time;
    this.scene.timeline.add({
      at: nextTime,
      run: () => {
        this.generateEnemy(nextTime, nextDelta);
      },
      target: this,
    });

    const direction =
      this.scene.score < 0 || Math.floor(this.scene.score / 5) % 2 == 0
        ? -1
        : 1;
    const enemyX = direction <  0 ? 821 : -21

    this.scene.enemies.add(
      new Enemy(
        this.scene,
        enemyX,
        this.rand.between(this.scene.worldTop + 30, this.scene.worldBottom - 30)
      )
    );
  }
}


/*
This is a game object that represents a star. It's a simple square with a random position. We use a tween to move it from right to left, and then destroy it when it's out of the screen.
*/
class Star extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    const finalY = y || Phaser.Math.Between(scene.worldTop, scene.worldBottom);
    super(scene, 800, finalY, 2, 2, 0xffffff);
    scene.add.existing(this);

    this.init();
  }

  init() {
    this.setAlpha(1);

    this.scene.tweens.add({
      targets: this,
      x: { from: this.scene.width + 1, to: -1 },
      duration: 2000 / this.scale,
      onComplete: () => {
        this.destroy();
      },
    });

    this.scene.tweens.add({
      targets: this,
      duration: Phaser.Math.Between(400, 1000),
      delay: 0,
      alpha: 0.25,
      repeat: -1,
      yoyo: true,
    });
  }
}

class Bounds extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 800, 2, 0xffffff);
    scene.add.existing(this);

    this.init();
  }

  init() {
    this.scene.tweens.add({
      targets: this,
      x: { from: 1200, to: 400 },
      duration: 2000 / this.scale,
      onComplete: null,
    });

    this.scene.tweens.add({
      targets: this,
      duration: 400,
      delay: 0,
      alpha: 0,
      repeat: -1,
      yoyo: true,
    });
  }
}

class Arrow extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "arrow");
    this.setOrigin(0.5, 0.5);
    this.scene.add.existing(this);
    this.setScale(1.5);
  }
}

/*
This is a game object that represents a enemy. It is part of the enemies group that we created in the `game` scene. It can kill the player if it touches it.
*/
class Enemy extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "enemy");
    this.setOrigin(0.5);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    scene.glizzy ? this.setScale(1.75) : this.setScale(0.6);
    this.leftPause = this.displayWidth / 2;
    this.rightPause = scene.width - this.leftPause;
    this.direction = x < scene.center_width ? 1 : -1
    this.start = this.direction > 0 ? this.leftPause : this.rightPause;
    this.end = this.direction > 0 ? this.rightPause : this.leftPause;

    this.init();
  }

  init() {
    this.body.setSize(this.width * 0.75, this.height * 0.75, true);
    this.scene.tweens.add({
      targets: this,
      x: { from: this.start - this.direction * this.displayWidth, to: this.start },
      duration: 100,
      onComplete: null,
    });
    this.scene.time.delayedCall(700, () => this.animate(), null, this);
    if (this.direction === -1) {
      this.setFlipX(true);
    }
  }

  animate() {
    if (!this.scene) {
      return;
    }

    this.scene.tweens.add({
      targets: this,
      x: { from: this.start, to: this.end },
      duration: 1290,
      onComplete: () => {
        this.destroy();
      },
    });

    this.scene.tweens.add({
      targets: this,
      angle: { from: 0, to: this.direction * 1000 },
      duration: 3000,
      onComplete: null,
    });
  }
}

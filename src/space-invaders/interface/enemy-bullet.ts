import { AssetType } from "./assets";

export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, AssetType.EnemyBullet);
    this.setScale(0.05);
  }

  kill() {
    this.destroy();
  }
}

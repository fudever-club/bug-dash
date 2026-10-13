// FU-DEVER BUG DASH - Precise Circle Collision System

import { GAME_CONFIG } from "../config.js";

export class CollisionSystem {
  /**
   * Check collision between player and a falling object
   * @param {number} playerX 
   * @param {number} playerY 
   * @param {number} playerRadius 
   * @param {Object} item 
   * @returns {boolean}
   */
  static check(playerX, playerY, playerRadius, item) {
    const dx = item.x - playerX;
    const dy = item.y - playerY;
    const distance = Math.hypot(dx, dy);
    return distance < (playerRadius + item.radius);
  }

  /**
   * Scan items array and return colliding item index or -1
   */
  static findFirstCollision(playerX, items) {
    const playerY = GAME_CONFIG.playerY;
    const radius = GAME_CONFIG.playerRadius;

    for (let i = 0; i < items.length; i++) {
      if (this.check(playerX, playerY, radius, items[i])) {
        return i;
      }
    }
    return -1;
  }
}

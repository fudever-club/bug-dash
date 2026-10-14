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
  static check(playerX, playerY, playerRadius, item, isJumping = false, isSliding = false) {
    const dx = item.x - playerX;
    const dy = item.y - playerY;
    const distance = Math.hypot(dx, dy);
    if (distance >= (playerRadius + item.radius)) return false;

    // Vertical Obstacle Evasion:
    if (item.isObstacle) {
      // Leaping over ground obstacles (Syntax Error bugs, Database crashes)
      if (isJumping && (item.type === "bug" || item.type === "bug_crash" || item.type === "drop_db" || item.type === "grade_f")) {
        return false;
      }
      // Sliding under high/overhead obstacles (Deadline 23:59 clocks, Merge conflicts)
      if (isSliding && (item.type === "deadline" || item.type === "conflict")) {
        return false;
      }
    }

    return true;
  }

  /**
   * Scan items array and return colliding item index or -1
   */
  static findFirstCollision(playerX, items, playerY = GAME_CONFIG.playerY, radius = GAME_CONFIG.playerRadius, isJumping = false, isSliding = false) {
    for (let i = 0; i < items.length; i++) {
      if (this.check(playerX, playerY, radius, items[i], isJumping, isSliding)) {
        return i;
      }
    }
    return -1;
  }
}

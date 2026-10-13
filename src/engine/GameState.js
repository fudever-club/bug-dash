// FU-DEVER BUG DASH - Finite State Machine & Gameplay State Manager

import { GAME_CONFIG } from "../config.js";

export const GameStates = {
  IDLE: "idle",
  COUNTDOWN: "countdown",
  PLAYING: "playing",
  GAMEOVER: "gameover",
  VICTORY: "victory"
};

export class GameStateManager {
  constructor(callbacks = {}) {
    this.state = GameStates.IDLE;
    this.score = 0;
    this.timeLeft = GAME_CONFIG.sessionDuration; // 60s
    this.lives = GAME_CONFIG.initialLives;       // 3
    this.combo = 1;
    this.comboTimer = 0;
    this.highestStreak = 0;
    this.currentStreak = 0;
    this.timeSurvived = 0;
    this.callbacks = {
      onStateChange: callbacks.onStateChange || (() => {}),
      onScoreUpdate: callbacks.onScoreUpdate || (() => {}),
      onLivesUpdate: callbacks.onLivesUpdate || (() => {}),
      onTimerUpdate: callbacks.onTimerUpdate || (() => {}),
      onComboUpdate: callbacks.onComboUpdate || (() => {}),
    };
  }

  setState(newState) {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.callbacks.onStateChange(newState, oldState);
    }
  }

  startSession() {
    this.score = 0;
    this.timeLeft = GAME_CONFIG.sessionDuration;
    this.lives = GAME_CONFIG.initialLives;
    this.combo = 1;
    this.comboTimer = 0;
    this.highestStreak = 0;
    this.currentStreak = 0;
    this.timeSurvived = 0;

    this.setState(GameStates.PLAYING);
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onLivesUpdate(this.lives);
    this.callbacks.onTimerUpdate(this.timeLeft);
    this.callbacks.onComboUpdate(this.combo, false);
  }

  update(dt) {
    if (this.state !== GameStates.PLAYING) return;

    this.timeLeft -= dt;
    this.timeSurvived += dt;

    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.timeSurvived = GAME_CONFIG.sessionDuration;
      this.callbacks.onTimerUpdate(this.timeLeft);
      this.setState(GameStates.VICTORY);
      return;
    }
    this.callbacks.onTimerUpdate(this.timeLeft);

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.callbacks.onComboUpdate(this.combo, false);
      }
    }
  }

  takeDamage(amount = 1) {
    if (this.state !== GameStates.PLAYING) return;

    this.lives = Math.max(0, this.lives - amount);
    this.currentStreak = 0;
    this.callbacks.onLivesUpdate(this.lives);

    if (this.lives <= 0) {
      this.setState(GameStates.GAMEOVER);
    }
  }

  deductScore(amount) {
    if (this.state !== GameStates.PLAYING) return;

    this.score = Math.max(0, this.score - amount);
    this.combo = 1;
    this.currentStreak = 0;
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onComboUpdate(this.combo, false);
  }

  addReward(points, isBuff = false) {
    if (this.state !== GameStates.PLAYING) return;

    this.score += points * this.combo;
    this.currentStreak++;
    if (this.currentStreak > this.highestStreak) {
      this.highestStreak = this.currentStreak;
    }

    if (isBuff) {
      this.combo = 2;
      this.comboTimer = 5.0; // 5 seconds duration
      this.callbacks.onComboUpdate(this.combo, true);
    }

    this.callbacks.onScoreUpdate(this.score);
  }

  getSummary() {
    return {
      score: this.score,
      timeSurvived: Math.min(GAME_CONFIG.sessionDuration, Math.round(this.timeSurvived)),
      highestStreak: this.highestStreak,
      livesRemaining: this.lives,
      isVictory: this.state === GameStates.VICTORY
    };
  }
}

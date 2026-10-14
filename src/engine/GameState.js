// FU-DEVER BUG DASH - Finite State Machine & Gameplay State Manager

import { GAME_CONFIG, GAME_MODES } from "../config.js";

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
    this.gameMode = GAME_MODES.CLASSIC;
    this.opponentState = null;
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
      onEliminated: callbacks.onEliminated || (() => {}),
      onTimeUp: callbacks.onTimeUp || (() => {}),
      onAttackTrigger: callbacks.onAttackTrigger || (() => {}),
    };
  }

  setGameMode(mode) {
    this.gameMode = mode;
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
    this.feverTimer = 0;
    this.invulnerableTimer = 0;
    this.highestStreak = 0;
    this.currentStreak = 0;
    this.timeSurvived = 0;

    this.setState(GameStates.PLAYING);
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onLivesUpdate(this.lives);
    this.callbacks.onTimerUpdate(this.timeLeft);
    this.callbacks.onComboUpdate(this.combo, false);
  }

  get isInvulnerable() {
    return this.invulnerableTimer > 0;
  }

  get isFever() {
    return this.feverTimer > 0;
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
      this.callbacks.onTimeUp();
      return;
    }
    this.callbacks.onTimerUpdate(this.timeLeft);

    // Invulnerability timer decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Fever mode timer decay
    if (this.feverTimer > 0) {
      this.feverTimer -= dt;
      if (this.feverTimer <= 0) {
        this.combo = 1;
        this.callbacks.onComboUpdate(this.combo, false);
      }
    } else if (this.comboTimer > 0) {
      // Standard coffee combo timer decay
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.callbacks.onComboUpdate(this.combo, false);
      }
    }
  }

  takeDamage(amount = 1) {
    if (this.state !== GameStates.PLAYING) return false;
    // Immunized during i-frames or Fever Mode
    if (this.invulnerableTimer > 0 || this.feverTimer > 0) return false;

    this.lives = Math.max(0, this.lives - amount);
    this.currentStreak = 0;
    this.invulnerableTimer = GAME_CONFIG.invulnerableDuration || 1.2;
    this.callbacks.onLivesUpdate(this.lives);

    if (this.lives <= 0) {
      this.setState(GameStates.GAMEOVER);
      this.callbacks.onEliminated();
    }
    return true;
  }

  deductScore(amount) {
    if (this.state !== GameStates.PLAYING) return;
    // Protected during Fever Mode
    if (this.feverTimer > 0) return;

    this.score = Math.max(0, this.score - amount);
    this.combo = 1;
    this.currentStreak = 0;
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onComboUpdate(this.combo, false);
  }

  addReward(points, buffType = null) {
    if (this.state !== GameStates.PLAYING) return;

    this.score += points * this.combo;
    this.currentStreak++;
    if (this.currentStreak > this.highestStreak) {
      this.highestStreak = this.currentStreak;
    }

    if (buffType === "fever") {
      // Nitro Bug Buster Rush: x3 combo, invulnerable
      this.feverTimer = GAME_CONFIG.feverDuration || 5.0;
      this.combo = 3;
      this.callbacks.onComboUpdate(this.combo, true);
    } else if (buffType === "x2") {
      this.combo = 2;
      this.comboTimer = 5.0;
      this.callbacks.onComboUpdate(this.combo, true);
    }

    // In 1v1 Duel Mode: Trigger attack against opponent on 5x streaks or coffee buff!
    if (this.gameMode === GAME_MODES.DUEL) {
      if (buffType === "fever" || buffType === "x2" || (this.currentStreak > 0 && this.currentStreak % 5 === 0)) {
        this.callbacks.onAttackTrigger("deadline_surge");
      }
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

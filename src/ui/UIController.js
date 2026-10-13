// FU-DEVER BUG DASH - UI & DOM Controller
// Handles HUD updates, modals, PIP camera overlay, and live leaderboard rendering.

import { ApiClient } from "../api/apiClient.js";
import { sound } from "../audio/SoundEngine.js";

const $ = id => document.getElementById(id);

export class UIController {
  constructor(callbacks = {}) {
    this.callbacks = {
      onStartGame: callbacks.onStartGame || (() => {}),
      onRestartGame: callbacks.onRestartGame || (() => {}),
      onCalibrate: callbacks.onCalibrate || (() => {}),
      onToggleSound: callbacks.onToggleSound || (() => {}),
      onToggleDebug: callbacks.onToggleDebug || (() => {}),
      onLaneSelect: callbacks.onLaneSelect || (() => {}),
      onStartCamera: callbacks.onStartCamera || (() => {}),
    };

    this.showDebug = false;
    this.initElements();
    this.bindEvents();
    this.refreshLeaderboard();
  }

  initElements() {
    this.dom = {
      canvasScore: $("canvasScore"),
      timerVal: $("timerVal"),
      canvasCombo: $("canvasCombo"),
      statusLed: $("statusLed"),
      fpsBadge: $("fpsBadge"),
      pipLed: $("pipLed"),
      pipStatusText: $("pipStatusText"),
      currentLaneText: $("currentLaneText"),
      btnSound: $("btnSound"),
      iconSoundOn: $("iconSoundOn"),
      iconSoundOff: $("iconSoundOff"),
      btnHelp: $("btnHelp"),
      btnCloseHelp: $("btnCloseHelp"),
      helpModal: $("helpModal"),
      startCamera: $("startCamera"),
      btnCameraText: $("btnCameraText"),
      startScreenModal: $("startScreenModal"),
      gameOverModal: $("gameOverModal"),
      victoryModal: $("victoryModal"),
      gameOverScoreDesc: $("gameOverScoreDesc"),
      victoryScoreDesc: $("victoryScoreDesc"),
      btnStartGame: $("btnStartGame"),
      btnRestartGame: $("btnRestartGame"),
      btnVictoryRestart: $("btnVictoryRestart"),
      recal: $("recal"),
      thr: $("thr"),
      thrVal: $("thrVal"),
      btnToggleDebug: $("btnToggleDebug"),
      debugToggleLabel: $("debugToggleLabel"),
      leaderboardList: $("leaderboardList"),
      overlayCanvas: $("overlay"),
      video: $("video")
    };
  }

  bindEvents() {
    // Sound Toggle
    if (this.dom.btnSound) {
      this.dom.btnSound.onclick = () => {
        const enabled = sound.toggleSound();
        this.updateSoundIcons(enabled);
      };
    }

    // Help Modal
    if (this.dom.btnHelp) {
      this.dom.btnHelp.onclick = () => {
        this.dom.helpModal.classList.add("open");
        sound.playClick();
      };
    }
    if (this.dom.btnCloseHelp) {
      this.dom.btnCloseHelp.onclick = () => {
        this.dom.helpModal.classList.remove("open");
        sound.playClick();
      };
    }
    if (this.dom.helpModal) {
      this.dom.helpModal.onclick = (e) => {
        if (e.target === this.dom.helpModal) {
          this.dom.helpModal.classList.remove("open");
        }
      };
    }

    // Start Camera Button
    if (this.dom.startCamera) {
      this.dom.startCamera.onclick = () => {
        sound.playClick();
        this.callbacks.onStartCamera();
      };
    }

    // Game Action Buttons
    if (this.dom.btnStartGame) {
      this.dom.btnStartGame.onclick = () => {
        sound.playClick();
        this.callbacks.onStartGame();
      };
    }
    if (this.dom.btnRestartGame) {
      this.dom.btnRestartGame.onclick = () => {
        sound.playClick();
        this.callbacks.onRestartGame();
      };
    }
    if (this.dom.btnVictoryRestart) {
      this.dom.btnVictoryRestart.onclick = () => {
        sound.playClick();
        this.callbacks.onRestartGame();
      };
    }

    // Calibrate Center
    if (this.dom.recal) {
      this.dom.recal.onclick = () => {
        sound.playClick();
        this.callbacks.onCalibrate();
      };
    }

    // Threshold Slider
    if (this.dom.thr) {
      this.dom.thr.oninput = (e) => {
        const val = e.target.value;
        if (this.dom.thrVal) this.dom.thrVal.textContent = val + "%";
      };
    }

    // Toggle Debug
    if (this.dom.btnToggleDebug) {
      this.dom.btnToggleDebug.onclick = () => {
        sound.playClick();
        this.showDebug = !this.showDebug;
        if (this.dom.debugToggleLabel) {
          this.dom.debugToggleLabel.textContent = this.showDebug ? "Tắt Debug Grid (D)" : "Bật Debug Grid (D)";
        }
        this.callbacks.onToggleDebug(this.showDebug);
      };
    }

    // Lane clickable buttons
    [0, 1, 2].forEach(i => {
      const el = $("l" + i);
      if (el) {
        el.onclick = () => {
          this.callbacks.onLaneSelect(i);
        };
      }
    });
  }

  updateSoundIcons(enabled) {
    if (this.dom.iconSoundOn) this.dom.iconSoundOn.style.display = enabled ? "block" : "none";
    if (this.dom.iconSoundOff) this.dom.iconSoundOff.style.display = enabled ? "none" : "block";
  }

  updateScore(score) {
    if (this.dom.canvasScore) {
      this.dom.canvasScore.textContent = score.toString().padStart(4, "0");
    }
  }

  updateTimer(timeLeft) {
    if (this.dom.timerVal) {
      const m = Math.floor(timeLeft / 60);
      const s = Math.floor(timeLeft % 60);
      this.dom.timerVal.textContent = `0${m}:${s < 10 ? "0" : ""}${s}`;
    }
  }

  updateLives(lives) {
    for (let i = 1; i <= 3; i++) {
      const el = $("heart" + i);
      if (el) {
        el.classList.toggle("lost", i > lives);
      }
    }
  }

  updateCombo(combo, isBuffed) {
    if (this.dom.canvasCombo) {
      if (isBuffed || combo > 1) {
        this.dom.canvasCombo.textContent = `${combo}X BUFF!`;
        this.dom.canvasCombo.style.color = "var(--dever-cyan)";
      } else {
        this.dom.canvasCombo.textContent = "1X";
        this.dom.canvasCombo.style.color = "var(--fpt-orange)";
      }
    }
  }

  updateLaneUI(lane) {
    [0, 1, 2].forEach(i => {
      const el = $("l" + i);
      if (el) el.classList.toggle("active", lane === i);
    });

    const names = ["LÀN TRÁI (L0)", "LÀN GIỮA (L1)", "LÀN PHẢI (L2)"];
    if (this.dom.currentLaneText) {
      this.dom.currentLaneText.textContent = names[lane] || "LÀN GIỮA (L1)";
    }
  }

  updateCameraStatus(phase, fps) {
    const isLocked = phase === "lock";
    if (this.dom.statusLed) this.dom.statusLed.classList.toggle("on", isLocked);
    if (this.dom.pipLed) this.dom.pipLed.classList.toggle("on", isLocked);

    const msgs = {
      wait: "ĐỨNG VÀO KHUNG VÀNG",
      cand: "GIỮ YÊN 1S...",
      lock: "ĐÃ KHÓA NGƯỜI CHƠI",
      lost: "TÌM LẠI MẶT..."
    };
    if (this.dom.pipStatusText) {
      this.dom.pipStatusText.textContent = msgs[phase] || "CHỜ CAMERA";
    }

    if (fps !== undefined && this.dom.fpsBadge) {
      this.dom.fpsBadge.textContent = `${fps} FPS`;
    }
  }

  drawVisionOverlay(trackerStatus, faces, roi) {
    const cv = this.dom.overlayCanvas;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const video = this.dom.video;

    cv.width = video.videoWidth || 320;
    cv.height = video.videoHeight || 240;
    const W = cv.width;
    const H = cv.height;

    ctx.clearRect(0, 0, W, H);

    // 1. Draw Starting ROI Box when waiting
    if (trackerStatus.phase === "wait" || trackerStatus.phase === "cand") {
      ctx.lineWidth = 2;
      ctx.strokeStyle = trackerStatus.phase === "cand" ? "#f59e0b" : "rgba(245, 158, 11, 0.4)";
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(roi.x0 * W, H * 0.15, (roi.x1 - roi.x0) * W, H * 0.7);
      ctx.setLineDash([]);
    }

    // 2. Draw face bounding boxes
    faces.forEach(f => {
      const isLocked = trackerStatus.phase === "lock" && trackerStatus.box;
      if (isLocked) {
        const bx = (1 - f.x - f.w) * W;
        const by = f.y * H;
        const bw = f.w * W;
        const bh = f.h * H;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#10b981";
        ctx.strokeRect(bx, by, bw, bh);
      } else if (this.showDebug) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.strokeRect((1 - f.x - f.w) * W, f.y * H, f.w * W, f.h * H);
      }
    });
  }

  showStartScreen() {
    if (this.dom.startScreenModal) this.dom.startScreenModal.classList.remove("hidden");
    if (this.dom.gameOverModal) this.dom.gameOverModal.classList.add("hidden");
    if (this.dom.victoryModal) this.dom.victoryModal.classList.add("hidden");
  }

  hideAllModals() {
    if (this.dom.startScreenModal) this.dom.startScreenModal.classList.add("hidden");
    if (this.dom.gameOverModal) this.dom.gameOverModal.classList.add("hidden");
    if (this.dom.victoryModal) this.dom.victoryModal.classList.add("hidden");
  }

  showGameOver(summary) {
    if (this.dom.gameOverScoreDesc) {
      this.dom.gameOverScoreDesc.textContent = `Bạn đã dừng lại tại giây thứ ${summary.timeSurvived} với ${summary.score} PTS!`;
    }
    if (this.dom.gameOverModal) this.dom.gameOverModal.classList.remove("hidden");
    this.promptScoreSubmission(summary);
  }

  showVictory(summary) {
    if (this.dom.victoryScoreDesc) {
      this.dom.victoryScoreDesc.textContent = `Bạn đã hoàn thành xuất sắc thử thách với tổng điểm ${summary.score.toLocaleString()} PTS!`;
    }
    if (this.dom.victoryModal) this.dom.victoryModal.classList.remove("hidden");
    this.promptScoreSubmission(summary);
  }

  async promptScoreSubmission(summary) {
    // If score > 100, prompt name to record in leaderboard
    if (summary.score >= 50) {
      setTimeout(async () => {
        const name = window.prompt(`Xuất sắc! Nhập tên bạn để lưu bảng vàng FU-DEVER (${summary.score} PTS):`, "Dev FPTU");
        if (name && name.trim()) {
          const res = await ApiClient.submitScore({
            name: name.trim(),
            score: summary.score,
            streak: summary.highestStreak || 1,
            timeSurvived: summary.timeSurvived
          });
          if (res && res.success) {
            this.refreshLeaderboard();
          }
        }
      }, 500);
    }
  }

  async refreshLeaderboard() {
    const list = await ApiClient.getLeaderboard(10);
    if (!this.dom.leaderboardList) return;

    this.dom.leaderboardList.innerHTML = list.map((item, idx) => {
      const rankNum = item.rank || (idx + 1);
      const displayName = item.k_class 
        ? `${this.escapeHtml(item.name)} (${this.escapeHtml(item.k_class)})` 
        : this.escapeHtml(item.name);

      return `
        <div class="board-row ${rankNum === 1 ? 'gold' : ''}">
          <span class="board-rank">#${rankNum}</span>
          <span class="board-name">${displayName}</span>
          <span class="board-score">${item.score.toLocaleString()}</span>
        </div>
      `;
    }).join("");
  }

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }
}

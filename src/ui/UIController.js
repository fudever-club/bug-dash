// FU-DEVER BUG DASH - UI & DOM Controller
// Handles HUD updates, modals, PIP camera overlay, and live leaderboard rendering.

import { ApiClient } from "../api/apiClient.js";
import { sound } from "../audio/SoundEngine.js";
import { MODE_METADATA } from "../config.js";

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
      onSelectGameMode: callbacks.onSelectGameMode || (() => {}),
      onSelectDuelType: callbacks.onSelectDuelType || (() => {}),
      onStartSplitMatch: callbacks.onStartSplitMatch || (() => {}),
      onToggleSteeringMode: callbacks.onToggleSteeringMode || (() => {}),
      onSelectSteeringMode: callbacks.onSelectSteeringMode || (() => {}),
      onSelectInputSource: callbacks.onSelectInputSource || (() => {}),
    };

    this.showDebug = false;
    this.currentActiveInputSource = "face";
    this.currentActiveStartMode = "classic";
    this.currentHelpTabMode = "classic";
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
      btnCloseHelpX: $("btnCloseHelpX"),
      helpModal: $("helpModal"),
      helpModeTabs: $("helpModeTabs"),
      helpContentContainer: $("helpContentContainer"),
      startCamera: $("startCamera"),
      btnCameraText: $("btnCameraText"),
      startScreenModal: $("startScreenModal"),
      startModalBadge: $("startModalBadge"),
      startModalTitle: $("startModalTitle"),
      startModalDesc: $("startModalDesc"),
      startRulesGrid: $("startRulesGrid"),
      btnStartSwitchFace: $("btnStartSwitchFace"),
      btnStartSwitchHand: $("btnStartSwitchHand"),
      startModalTipsText: $("startModalTipsText"),
      startModalMascot: $("startModalMascot"),
      btnStartGameText: $("btnStartGameText"),
      gameOverModal: $("gameOverModal"),
      victoryModal: $("victoryModal"),
      gameOverScoreDesc: $("gameOverScoreDesc"),
      victoryScoreDesc: $("victoryScoreDesc"),
      btnStartGame: $("btnStartGame"),
      btnRestartGame: $("btnRestartGame"),
      btnVictoryRestart: $("btnVictoryRestart"),
      btnPolaroidGameOver: $("btnPolaroidGameOver"),
      btnPolaroidVictory: $("btnPolaroidVictory"),
      btnInputFace: $("btnInputFace"),
      btnInputHand: $("btnInputHand"),
      controlInputBadge: $("controlInputBadge"),
      steeringModeBadge: $("steeringModeBadge"),
      btnModeSnap3: $("btnModeSnap3"),
      btnModeAnalog: $("btnModeAnalog"),
      tabModeClassic: $("tabModeClassic"),
      tabModeCatcher: $("tabModeCatcher"),
      tabModeHighway: $("tabModeHighway"),
      tabModeSlicer: $("tabModeSlicer"),
      tabModeFlappy: $("tabModeFlappy"),
      tabModeDuel: $("tabModeDuel"),
      duelLobbyModal: $("duelLobbyModal"),
      duelPlayerName: $("duelPlayerName"),
      btnDuelTabWifi: $("btnDuelTabWifi"),
      btnDuelTabSplit: $("btnDuelTabSplit"),
      duelWifiSection: $("duelWifiSection"),
      duelSplitSection: $("duelSplitSection"),
      splitP1Badge: $("splitP1Badge"),
      splitP2Badge: $("splitP2Badge"),
      btnStartSplitMatch: $("btnStartSplitMatch"),
      btnCloseSplitLobby: $("btnCloseSplitLobby"),
      btnDuelCreateRoom: $("btnDuelCreateRoom"),
      duelCreatedCodeBox: $("duelCreatedCodeBox"),
      duelRoomCodeText: $("duelRoomCodeText"),
      duelHostStatus: $("duelHostStatus"),
      duelJoinCodeInput: $("duelJoinCodeInput"),
      btnDuelJoinRoom: $("btnDuelJoinRoom"),
      duelLobbyMsg: $("duelLobbyMsg"),
      btnDuelStartMatch: $("btnDuelStartMatch"),
      btnCloseDuelLobby: $("btnCloseDuelLobby"),
      duelResultModal: $("duelResultModal"),
      duelResultTitle: $("duelResultTitle"),
      duelResultDesc: $("duelResultDesc"),
      duelMyScore: $("duelMyScore"),
      duelOpponentScore: $("duelOpponentScore"),
      btnDuelPlayAgain: $("btnDuelPlayAgain"),
      btnDuelExit: $("btnDuelExit"),
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

    // Game Mode Tabs
    if (this.dom.tabModeClassic) {
      this.dom.tabModeClassic.onclick = () => {
        sound.playClick();
        if (this.callbacks.onSelectGameMode) this.callbacks.onSelectGameMode("classic");
      };
    }
    if (this.dom.tabModeCatcher) {
      this.dom.tabModeCatcher.onclick = () => {
        sound.playClick();
        if (this.callbacks.onSelectGameMode) this.callbacks.onSelectGameMode("catcher");
      };
    }
    if (this.dom.tabModeHighway) {
      this.dom.tabModeHighway.onclick = () => {
        sound.playClick();
        if (this.callbacks.onSelectGameMode) this.callbacks.onSelectGameMode("highway");
      };
    }
    if (this.dom.tabModeSlicer) {
      this.dom.tabModeSlicer.onclick = () => {
        sound.playClick();
        if (this.callbacks.onSelectGameMode) this.callbacks.onSelectGameMode("slicer");
      };
    }
    if (this.dom.tabModeFlappy) {
      this.dom.tabModeFlappy.onclick = () => {
        sound.playClick();
        if (this.callbacks.onSelectGameMode) this.callbacks.onSelectGameMode("flappy");
      };
    }
    if (this.dom.tabModeDuel) {
      this.dom.tabModeDuel.onclick = () => {
        sound.playClick();
        if (this.callbacks.onSelectGameMode) this.callbacks.onSelectGameMode("duel");
      };
    }

    // Duel Sub-Tab Switcher: 2 Máy Wi-Fi vs 1 Máy Chung Camera
    if (this.dom.btnDuelTabWifi) {
      this.dom.btnDuelTabWifi.onclick = () => {
        sound.playClick();
        this.dom.btnDuelTabWifi.classList.add("active-mode");
        if (this.dom.btnDuelTabSplit) this.dom.btnDuelTabSplit.classList.remove("active-mode");
        if (this.dom.duelWifiSection) this.dom.duelWifiSection.classList.remove("hidden");
        if (this.dom.duelSplitSection) this.dom.duelSplitSection.classList.add("hidden");
        if (this.callbacks.onSelectDuelType) this.callbacks.onSelectDuelType("wifi");
      };
    }
    if (this.dom.btnDuelTabSplit) {
      this.dom.btnDuelTabSplit.onclick = () => {
        sound.playClick();
        this.dom.btnDuelTabSplit.classList.add("active-mode");
        if (this.dom.btnDuelTabWifi) this.dom.btnDuelTabWifi.classList.remove("active-mode");
        if (this.dom.duelSplitSection) this.dom.duelSplitSection.classList.remove("hidden");
        if (this.dom.duelWifiSection) this.dom.duelWifiSection.classList.add("hidden");
        if (this.callbacks.onSelectDuelType) this.callbacks.onSelectDuelType("split");
      };
    }

    if (this.dom.btnStartSplitMatch) {
      this.dom.btnStartSplitMatch.onclick = () => {
        sound.playClick();
        if (this.callbacks.onStartSplitMatch) this.callbacks.onStartSplitMatch();
      };
    }

    if (this.dom.btnCloseSplitLobby) {
      this.dom.btnCloseSplitLobby.onclick = () => {
        sound.playClick();
        this.hideAllModals();
        if (this.callbacks.onSelectGameMode) this.callbacks.onSelectGameMode("classic");
      };
    }

    // Input Source Toggle (Face vs Hand)
    if (this.dom.btnInputFace) {
      this.dom.btnInputFace.onclick = () => {
        sound.playClick();
        if (this.callbacks.onSelectInputSource) this.callbacks.onSelectInputSource("face");
      };
    }
    if (this.dom.btnInputHand) {
      this.dom.btnInputHand.onclick = () => {
        sound.playClick();
        if (this.callbacks.onSelectInputSource) this.callbacks.onSelectInputSource("hand");
      };
    }

    // Steering Mode Switch
    if (this.dom.btnModeSnap3) {
      this.dom.btnModeSnap3.onclick = () => {
        sound.playClick();
        if (this.callbacks.onSelectSteeringMode) {
          this.callbacks.onSelectSteeringMode("snap3");
        } else if (this.callbacks.onToggleSteeringMode) {
          this.callbacks.onToggleSteeringMode();
        }
      };
    }
    if (this.dom.btnModeAnalog) {
      this.dom.btnModeAnalog.onclick = () => {
        sound.playClick();
        if (this.callbacks.onSetSteeringMode) {
          this.callbacks.onSetSteeringMode("analog");
        } else if (this.callbacks.onToggleSteeringMode) {
          this.callbacks.onToggleSteeringMode();
        }
      };
    }

    // Duel Lobby Event Handlers
    if (this.dom.btnDuelCreateRoom) {
      this.dom.btnDuelCreateRoom.onclick = () => {
        sound.playClick();
        const name = (this.dom.duelPlayerName && this.dom.duelPlayerName.value.trim()) || "Host Dev";
        if (this.callbacks.onDuelCreateRoom) this.callbacks.onDuelCreateRoom(name);
      };
    }

    if (this.dom.btnDuelJoinRoom) {
      this.dom.btnDuelJoinRoom.onclick = () => {
        sound.playClick();
        const code = (this.dom.duelJoinCodeInput && this.dom.duelJoinCodeInput.value.trim()) || "";
        const name = (this.dom.duelPlayerName && this.dom.duelPlayerName.value.trim()) || "Challenger Dev";
        if (!code) {
          this.setDuelLobbyMessage("Vui lòng nhập mã phòng 4 số!");
          return;
        }
        if (this.callbacks.onDuelJoinRoom) this.callbacks.onDuelJoinRoom(code, name);
      };
    }

    if (this.dom.btnDuelStartMatch) {
      this.dom.btnDuelStartMatch.onclick = () => {
        sound.playClick();
        if (this.callbacks.onDuelStartMatch) this.callbacks.onDuelStartMatch();
      };
    }

    if (this.dom.btnCloseDuelLobby) {
      this.dom.btnCloseDuelLobby.onclick = () => {
        sound.playClick();
        this.hideAllModals();
        if (this.callbacks.onSelectGameMode) this.callbacks.onSelectGameMode("classic");
      };
    }

    if (this.dom.btnDuelPlayAgain) {
      this.dom.btnDuelPlayAgain.onclick = () => {
        sound.playClick();
        this.showDuelLobby();
      };
    }

    if (this.dom.btnDuelExit) {
      this.dom.btnDuelExit.onclick = () => {
        sound.playClick();
        this.hideAllModals();
        this.showStartScreen();
        if (this.callbacks.onSelectGameMode) this.callbacks.onSelectGameMode("classic");
      };
    }

    // Polaroid capture buttons
    if (this.dom.btnPolaroidGameOver) {
      this.dom.btnPolaroidGameOver.onclick = () => {
        sound.playClick();
        this.generatePolaroid(this.lastSummary || { score: 0, timeSurvived: 30 });
      };
    }
    if (this.dom.btnPolaroidVictory) {
      this.dom.btnPolaroidVictory.onclick = () => {
        sound.playClick();
        this.generatePolaroid(this.lastSummary || { score: 100, timeSurvived: 60 });
      };
    }

    // Start Modal Switcher: Face vs Hand
    if (this.dom.btnStartSwitchFace) {
      this.dom.btnStartSwitchFace.onclick = () => {
        sound.playClick();
        this.setInputSourceMode("face");
        if (this.callbacks.onSelectInputSource) this.callbacks.onSelectInputSource("face");
      };
    }
    if (this.dom.btnStartSwitchHand) {
      this.dom.btnStartSwitchHand.onclick = () => {
        sound.playClick();
        this.setInputSourceMode("hand");
        if (this.callbacks.onSelectInputSource) this.callbacks.onSelectInputSource("hand");
      };
    }

    // Help Modal
    if (this.dom.btnHelp) {
      this.dom.btnHelp.onclick = () => {
        sound.playClick();
        this.openHelpModal(this.currentActiveStartMode || "classic");
      };
    }
    if (this.dom.btnCloseHelp) {
      this.dom.btnCloseHelp.onclick = () => {
        this.dom.helpModal.classList.remove("open");
        sound.playClick();
      };
    }
    if (this.dom.btnCloseHelpX) {
      this.dom.btnCloseHelpX.onclick = () => {
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

    // Help Modal Mode Tabs
    if (this.dom.helpModeTabs) {
      const tabBtns = this.dom.helpModeTabs.querySelectorAll(".help-tab-btn");
      tabBtns.forEach(btn => {
        btn.onclick = () => {
          sound.playClick();
          tabBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const mode = btn.dataset.helpMode || "classic";
          this.renderHelpContent(mode);
        };
      });
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

    const names = ["LÀN TRÁI", "LÀN GIỮA", "LÀN PHẢI"];
    if (this.dom.currentLaneText) {
      this.dom.currentLaneText.textContent = names[lane] || "LÀN GIỮA";
    }
  }

  updateCameraStatus(phase, fps) {
    const isLocked = phase === "lock";
    if (this.dom.statusLed) this.dom.statusLed.classList.toggle("on", isLocked);
    if (this.dom.pipLed) this.dom.pipLed.classList.toggle("on", isLocked);

    const msgs = {
      wait: "NHÌN VÀO GƯƠNG ĐỂ BẮT ĐẦU",
      cand: "GIỮ YÊN 1 GIÂY...",
      lock: "SẴN SÀNG CHIẾN ĐẤU!",
      lost: "ĐANG TÌM LẠI BẠN..."
    };
    if (this.dom.pipStatusText) {
      this.dom.pipStatusText.textContent = msgs[phase] || "CHỜ CAMERA";
    }

    if (fps !== undefined && this.dom.fpsBadge) {
      this.dom.fpsBadge.textContent = `${fps} FPS`;
    }
  }

  updateSteeringModeUI(mode) {
    const isAnalog = mode === "analog";
    if (this.dom.steeringModeBadge) {
      this.dom.steeringModeBadge.textContent = isAnalog ? "LẮC TỰ DO" : "3 LÀN NHẠY";
      this.dom.steeringModeBadge.style.color = isAnalog ? "#06b6d4" : "var(--fpt-orange)";
    }
    if (this.dom.btnModeSnap3) {
      this.dom.btnModeSnap3.classList.toggle("active-mode", !isAnalog);
    }
    if (this.dom.btnModeAnalog) {
      this.dom.btnModeAnalog.classList.toggle("active-mode", isAnalog);
    }
  }

  updateInputSourceUI(source) {
    this.currentActiveInputSource = source;
    const isHand = source === "hand";
    if (this.dom.controlInputBadge) {
      this.dom.controlInputBadge.textContent = isHand ? "BÀN TAY" : "LẮC ĐẦU";
      this.dom.controlInputBadge.style.color = isHand ? "#10b981" : "var(--fpt-orange)";
    }
    if (this.dom.btnInputFace) {
      this.dom.btnInputFace.classList.toggle("active-mode", !isHand);
    }
    if (this.dom.btnInputHand) {
      this.dom.btnInputHand.classList.toggle("active-mode", isHand);
    }
    if (this.dom.btnStartSwitchFace) {
      this.dom.btnStartSwitchFace.classList.toggle("active", !isHand);
    }
    if (this.dom.btnStartSwitchHand) {
      this.dom.btnStartSwitchHand.classList.toggle("active", isHand);
    }
    if (this.dom.pipStatusText) {
      this.dom.pipStatusText.textContent = isHand ? "GIƠ TAY ĐỂ ĐIỀU KHIỂN" : "NHÌN VÀO GƯƠNG ĐỂ BẮT ĐẦU";
    }
    this.renderStartModalRules();
  }

  drawVisionOverlay(trackerStatus, faces, roi, isSplitScreen = false, dualStatus = null, handStatus = null, inputSource = "face", gameMode = "classic") {
    const cv = this.dom.overlayCanvas;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const video = this.dom.video;

    cv.width = video.videoWidth || 320;
    cv.height = video.videoHeight || 240;
    const W = cv.width;
    const H = cv.height;

    ctx.clearRect(0, 0, W, H);

    // ==========================================
    // HAND TRACKING OVERLAY (MediaPipe Skeleton)
    // ==========================================
    if (inputSource === "hand") {
      if (!handStatus || !handStatus.landmarks) {
        ctx.fillStyle = "rgba(5, 8, 17, 0.70)";
        ctx.beginPath();
        ctx.roundRect(W * 0.08, H * 0.38, W * 0.84, 34, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#10b981";
        ctx.font = "700 10.5px 'Be Vietnam Pro', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GIƠ BÀN TAY TRƯỚC CAMERA ĐỂ ĐIỀU KHIỂN", W * 0.5, H * 0.38 + 21);
        return;
      }

      const pts = handStatus.landmarks;

      // Draw bone connections
      const bones = [
        [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8],       // Index
        [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
        [0, 13], [13, 14], [14, 15], [15, 16],// Ring
        [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
        [5, 9], [9, 13], [13, 17]              // Palm base
      ];

      ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
      ctx.lineWidth = 2.5;
      bones.forEach(([i, j]) => {
        if (pts[i] && pts[j]) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x * W, pts[i].y * H);
          ctx.lineTo(pts[j].x * W, pts[j].y * H);
          ctx.stroke();
        }
      });

      // Draw landmark joints
      pts.forEach((pt, idx) => {
        const px = pt.x * W;
        const py = pt.y * H;
        const isTip = (idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20);
        ctx.fillStyle = isTip ? "#38bdf8" : "#10b981";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = isTip ? 8 : 4;
        ctx.beginPath();
        ctx.arc(px, py, isTip ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Palm Center Target Ring
      const cx = handStatus.palmX * W;
      const cy = handStatus.palmY * H;
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Realtime Gesture Feedback Pill
      let gestureText = "LÁI BÀN TAY (TRÁI / PHẢI)";
      let gestureColor = "#10b981";
      if (gameMode === "flappy") {
        gestureText = "BAY BÁM THEO BÀN TAY (LÊN / XUỐNG)";
        gestureColor = "#06b6d4";
      } else if (handStatus.isHighHand) {
        gestureText = "NHẢY LÊN (JUMP)";
        gestureColor = "#38bdf8";
      } else if (handStatus.isLowHand) {
        gestureText = "TRƯỢT XUỐNG (SLIDE)";
        gestureColor = "#f59e0b";
      }

      ctx.fillStyle = "rgba(5, 8, 17, 0.85)";
      ctx.beginPath();
      ctx.roundRect(W * 0.12, H - 28, W * 0.76, 22, 6);
      ctx.fill();
      ctx.strokeStyle = gestureColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = gestureColor;
      ctx.font = "800 10px 'Be Vietnam Pro', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(gestureText, W * 0.5, H - 14);
      return;
    }

    // ==========================================
    // SPLIT-SCREEN 1-CAMERA MULTIPLAYER OVERLAY
    // ==========================================
    if (isSplitScreen && dualStatus) {
      // 1. Center Divider Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(W * 0.5, 0); ctx.lineTo(W * 0.5, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. ROI Boxes for P1 (Left: 0.05 .. 0.48) and P2 (Right: 0.52 .. 0.95)
      // P1 ROI
      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.05 * W, H * 0.15, 0.43 * W, H * 0.7);

      // P2 ROI
      ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
      ctx.strokeRect(0.52 * W, H * 0.15, 0.43 * W, H * 0.7);

      // 3. Draw P1 Status & Face Box
      const p1 = dualStatus.p1;
      if (p1 && p1.box) {
        const bx = (1 - p1.box.x - p1.box.w) * W;
        const by = p1.box.y * H;
        const bw = p1.box.w * W;
        const bh = p1.box.h * H;

        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = "#06b6d4";
        ctx.fillRect(bx, by - 18, 64, 18);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 10px 'Be Vietnam Pro', sans-serif";
        ctx.fillText(p1.phase === "lock" ? "P1 LOCKED" : "P1 DÒ MẶT", bx + 4, by - 5);
      }

      // 4. Draw P2 Status & Face Box
      const p2 = dualStatus.p2;
      if (p2 && p2.box) {
        const bx = (1 - p2.box.x - p2.box.w) * W;
        const by = p2.box.y * H;
        const bw = p2.box.w * W;
        const bh = p2.box.h * H;

        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(bx, by - 18, 64, 18);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 10px 'Be Vietnam Pro', sans-serif";
        ctx.fillText(p2.phase === "lock" ? "P2 LOCKED" : "P2 DÒ MẶT", bx + 4, by - 5);
      }

      // Update Lobby Badges if present
      if (this.dom.splitP1Badge && p1) {
        const isLocked = p1.phase === "lock";
        this.dom.splitP1Badge.textContent = isLocked ? "P1: ĐÃ SẴN SÀNG" : "P1: ĐANG DÒ MẶT...";
        this.dom.splitP1Badge.style.color = isLocked ? "#10b981" : "#f59e0b";
      }
      if (this.dom.splitP2Badge && p2) {
        const isLocked = p2.phase === "lock";
        this.dom.splitP2Badge.textContent = isLocked ? "P2: ĐÃ SẴN SÀNG" : "P2: ĐANG DÒ MẶT...";
        this.dom.splitP2Badge.style.color = isLocked ? "#10b981" : "#f59e0b";
      }
      return;
    }

    // ==========================================
    // SINGLE PLAYER OVERLAY
    // ==========================================
    // 1. Draw Starting ROI Box when waiting
    if (trackerStatus.phase === "wait" || trackerStatus.phase === "cand") {
      ctx.lineWidth = 2;
      ctx.strokeStyle = trackerStatus.phase === "cand" ? "#f59e0b" : "rgba(245, 158, 11, 0.4)";
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(roi.x0 * W, H * 0.15, (roi.x1 - roi.x0) * W, H * 0.7);
      ctx.setLineDash([]);

      if (trackerStatus.phase === "wait") {
        ctx.fillStyle = "rgba(245, 158, 11, 0.85)";
        ctx.font = "bold 10px 'Be Vietnam Pro', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("KHUNG NHẬN DIỆN MẶT", W * 0.5, H * 0.15 - 6);
      }
    }

    // 2. Draw face bounding boxes (Arcade Corner Reticle)
    faces.forEach(f => {
      const isLocked = trackerStatus.phase === "lock" && trackerStatus.box;
      if (isLocked) {
        const bx = (1 - f.x - f.w) * W;
        const by = f.y * H;
        const bw = f.w * W;
        const bh = f.h * H;

        // Subtle glowing border
        ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);

        // Arcade Gamer Corner Brackets
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        const cornerLen = Math.min(18, bw * 0.28);

        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerLen, by);
        // Top-right
        ctx.moveTo(bx + bw - cornerLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cornerLen);
        // Bottom-left
        ctx.moveTo(bx, by + bh - cornerLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerLen, by + bh);
        // Bottom-right
        ctx.moveTo(bx + bw - cornerLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // Pilot Badge
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.roundRect(bx, by - 20, 72, 18, 4);
        ctx.fill();
        ctx.fillStyle = "#060911";
        ctx.font = "800 10px 'Be Vietnam Pro', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("SẴN SÀNG", bx + 6, by - 7);
      } else if (trackerStatus.phase === "cand") {
        const bx = (1 - f.x - f.w) * W;
        const by = f.y * H;
        const bw = f.w * W;
        const bh = f.h * H;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#f59e0b";
        ctx.strokeRect(bx, by, bw, bh);

        // Lock progress bar
        const prog = trackerStatus.candProgress || 0;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(bx, by - 12, bw, 8);
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(bx, by - 12, bw * prog, 8);
      } else if (this.showDebug) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.strokeRect((1 - f.x - f.w) * W, f.y * H, f.w * W, f.h * H);
      }
    });

    // 3. Head Tilt Horizon & Steer Tension Gauge (Visual Feedback)
    if (trackerStatus.phase === "lock") {
      const roll = trackerStatus.rollAngle || 0;
      const deg = Math.round(roll * 180 / Math.PI);
      const centerX = W / 2;
      const centerY = H - 24;

      // Flappy Nose Reticle Indicator & Banner
      if (gameMode === "flappy") {
        const nx = (trackerStatus.noseX !== undefined ? (1 - trackerStatus.noseX) : 0.5) * W;
        const ny = (trackerStatus.noseY !== undefined ? trackerStatus.noseY : 0.5) * H;

        ctx.save();
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(nx, ny, 7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#06b6d4";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("🎯 MŨI DẪN ĐƯỜNG", nx, ny - 11);
        ctx.restore();

        ctx.fillStyle = "rgba(6, 182, 212, 0.90)";
        ctx.beginPath();
        ctx.roundRect(W * 0.16, 10, W * 0.68, 22, 6);
        ctx.fill();
        ctx.fillStyle = "#050811";
        ctx.font = "800 10.5px 'Be Vietnam Pro', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎯 BAY BÁM THEO MŨI (LÊN / XUỐNG)", W * 0.5, 25);
      } else if (trackerStatus.isJump) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.90)";
        ctx.beginPath();
        ctx.roundRect(W * 0.22, 10, W * 0.56, 22, 6);
        ctx.fill();
        ctx.fillStyle = "#050811";
        ctx.font = "800 11px 'Be Vietnam Pro', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⬆ NHẢY QUA BUG (JUMP)!", W * 0.5, 25);
      } else if (trackerStatus.isDuck) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.90)";
        ctx.beginPath();
        ctx.roundRect(W * 0.22, 10, W * 0.56, 22, 6);
        ctx.fill();
        ctx.fillStyle = "#050811";
        ctx.font = "800 11px 'Be Vietnam Pro', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⬇ TRƯỢT NÉ DEADLINE (SLIDE)!", W * 0.5, 25);
      }

      // Curved Arc Base Track
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(centerX, centerY - 8, 44, Math.PI * 0.2, Math.PI * 0.8, false);
      ctx.stroke();

      // Steering Marker Dot
      const markerAngle = Math.PI * 0.5 + Math.max(-0.62, Math.min(0.62, roll * 1.5));
      const mx = centerX + Math.cos(markerAngle) * 44;
      const my = centerY - 8 + Math.sin(markerAngle) * 44;

      const tension = trackerStatus.steerTension || 0;
      const absTension = Math.min(1.5, Math.abs(tension));
      const isTriggered = absTension >= 1.0;

      const dotColor = isTriggered ? "#10b981" : (Math.abs(deg) > 7 ? "#f59e0b" : "#38bdf8");
      ctx.fillStyle = dotColor;
      ctx.shadowColor = dotColor;
      ctx.shadowBlur = isTriggered ? 12 : 6;
      ctx.beginPath();
      ctx.arc(mx, my, isTriggered ? 5.5 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Steer Tension Progress Gauge (Bottom Dual Bar)
      const barW = W * 0.72;
      const barH = 5;
      const barX = (W - barW) / 2;
      const barY = H - 10;
      const halfW = barW / 2;

      // Background track
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.fillRect(barX, barY, barW, barH);

      // Center divider
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(centerX - 1, barY - 2, 2, barH + 4);

      // Fill tension towards Left or Right
      if (tension < 0) {
        // Left steer
        const fillW = Math.min(1.0, Math.abs(tension)) * halfW;
        ctx.fillStyle = isTriggered ? "#10b981" : "#f59e0b";
        ctx.fillRect(centerX - fillW, barY, fillW, barH);
      } else if (tension > 0) {
        // Right steer
        const fillW = Math.min(1.0, tension) * halfW;
        ctx.fillStyle = isTriggered ? "#10b981" : "#f59e0b";
        ctx.fillRect(centerX, barY, fillW, barH);
      }

      // Text Status
      ctx.fillStyle = isTriggered ? "#10b981" : (Math.abs(deg) > 7 ? "#f59e0b" : "#ffffff");
      ctx.font = "700 9.5px 'Be Vietnam Pro', sans-serif";
      ctx.textAlign = "center";
      const tensionPercent = Math.round(Math.min(100, absTension * 100));
      const steerLabel = tension < -0.15 
        ? `LÁI TRÁI ${tensionPercent}%` 
        : (tension > 0.15 ? `LÁI PHẢI ${tensionPercent}%` : "TÂM CHUẨN");
      ctx.fillText(`${steerLabel} (${deg > 0 ? '+' : ''}${deg}°)`, centerX, centerY + 2);
    }
  }

  updateGameModeUI(mode) {
    if (this.dom.tabModeClassic) this.dom.tabModeClassic.classList.toggle("active", mode === "classic");
    if (this.dom.tabModeCatcher) this.dom.tabModeCatcher.classList.toggle("active", mode === "catcher");
    if (this.dom.tabModeHighway) this.dom.tabModeHighway.classList.toggle("active", mode === "highway");
    if (this.dom.tabModeSlicer) this.dom.tabModeSlicer.classList.toggle("active", mode === "slicer");
    if (this.dom.tabModeFlappy) this.dom.tabModeFlappy.classList.toggle("active", mode === "flappy");
    if (this.dom.tabModeDuel) this.dom.tabModeDuel.classList.toggle("active", mode === "duel" || mode === "splitscreen");
  }

  showStartScreenForMode(mode = "classic") {
    this.hideAllModals();
    this.currentActiveStartMode = mode;
    const meta = MODE_METADATA[mode] || MODE_METADATA["classic"];
    if (this.dom.startModalBadge) {
      this.dom.startModalBadge.textContent = meta.badge;
      this.dom.startModalBadge.style.color = meta.badgeColor || "var(--fpt-orange)";
    }
    if (this.dom.startModalTitle) {
      this.dom.startModalTitle.textContent = meta.title;
    }
    if (this.dom.startModalDesc) {
      this.dom.startModalDesc.textContent = meta.desc;
    }
    if (this.dom.startModalMascot && meta.mascot) {
      this.dom.startModalMascot.src = meta.mascot;
    }
    if (this.dom.btnStartGameText) {
      this.dom.btnStartGameText.textContent = meta.ctaText;
    }
    if (this.dom.startModalTipsText && meta.tips) {
      this.dom.startModalTipsText.textContent = meta.tips;
    }

    // Render rules based on current active sensor
    this.renderStartModalRules();

    if (this.dom.startScreenModal) this.dom.startScreenModal.classList.remove("hidden");
  }

  renderStartModalRules() {
    const mode = this.currentActiveStartMode || "classic";
    const meta = MODE_METADATA[mode] || MODE_METADATA["classic"];
    const isHand = this.currentActiveInputSource === "hand";
    const rules = isHand ? (meta.handRules || meta.rules) : (meta.faceRules || meta.rules);

    if (this.dom.btnStartSwitchFace) this.dom.btnStartSwitchFace.classList.toggle("active", !isHand);
    if (this.dom.btnStartSwitchHand) this.dom.btnStartSwitchHand.classList.toggle("active", isHand);

    if (this.dom.startRulesGrid && rules) {
      this.dom.startRulesGrid.innerHTML = rules.map(r => `
        <div class="rule-card">
          <span class="rule-badge ${r.badgeClass}">${r.badge}</span>
          <strong>${r.title}</strong>
          <span>${r.desc}</span>
        </div>
      `).join("");
    }
  }

  setInputSourceMode(src) {
    this.currentActiveInputSource = src;
    this.updateInputSourceUI(src);
    this.renderStartModalRules();
  }

  openHelpModal(mode = "classic") {
    this.currentHelpTabMode = mode;
    if (this.dom.helpModeTabs) {
      const tabBtns = this.dom.helpModeTabs.querySelectorAll(".help-tab-btn");
      tabBtns.forEach(b => {
        b.classList.toggle("active", (b.dataset.helpMode === mode) || (mode === "splitscreen" && b.dataset.helpMode === "duel"));
      });
    }
    this.renderHelpContent(mode === "splitscreen" ? "duel" : mode);
    if (this.dom.helpModal) {
      this.dom.helpModal.classList.add("open");
    }
  }

  renderHelpContent(mode = "classic") {
    if (!this.dom.helpContentContainer) return;
    const meta = MODE_METADATA[mode] || MODE_METADATA["classic"];
    const faceRules = meta.faceRules || [];
    const handRules = meta.handRules || [];

    this.dom.helpContentContainer.innerHTML = `
      <div class="help-mode-banner">
        <div>
          <h4>${meta.title}</h4>
          <p>${meta.desc}</p>
        </div>
        <span class="modal-mode-badge" style="color:${meta.badgeColor || 'var(--fpt-orange)'}; border-color:${meta.badgeColor || 'var(--fpt-orange)'};">
          ${meta.badge}
        </span>
      </div>

      <div class="help-columns-grid">
        <!-- Cột Trái: Cảm Biến Khuôn Mặt -->
        <div class="help-sensor-card card-face">
          <div class="help-sensor-card-title">
            <span style="display:flex; align-items:center; gap:8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              ĐIỀU KHIỂN BẰNG KHUÔN MẶT
            </span>
            <span style="font-size:10px; color:#38bdf8; background:rgba(56,189,248,0.15); padding:2px 8px; border-radius:12px;">FACE TRACK</span>
          </div>

          ${faceRules.map((r, i) => `
            <div class="help-step-item">
              <span class="step-num-badge">${i + 1}</span>
              <div class="step-content">
                <strong>${r.title} <span class="rule-badge ${r.badgeClass}" style="margin-left:4px; font-size:8.5px; padding:1px 5px;">${r.badge}</span></strong>
                <span>${r.desc}</span>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- Cột Phải: Cảm Biến Bàn Tay -->
        <div class="help-sensor-card card-hand">
          <div class="help-sensor-card-title">
            <span style="display:flex; align-items:center; gap:8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
              ĐIỀU KHIỂN BẰNG BÀN TAY
            </span>
            <span style="font-size:10px; color:#34d399; background:rgba(52,211,153,0.15); padding:2px 8px; border-radius:12px;">HAND GESTURE</span>
          </div>

          ${handRules.map((r, i) => `
            <div class="help-step-item">
              <span class="step-num-badge">${i + 1}</span>
              <div class="step-content">
                <strong>${r.title} <span class="rule-badge ${r.badgeClass}" style="margin-left:4px; font-size:8.5px; padding:1px 5px;">${r.badge}</span></strong>
                <span>${r.desc}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Mẹo Chơi Đạt Điểm Cao -->
      <div class="start-tips-box" style="max-width:100%;">
        <span class="tips-pill">CHIẾN THUẬT BOOTH</span>
        <span>${meta.tips || "Giữ khoảng cách với camera khoảng 1 mét và căn giữa khung hình để đạt độ nhạy phản xạ cao nhất!"}</span>
      </div>
    `;
  }

  showStartScreen(mode = "classic") {
    this.showStartScreenForMode(mode);
  }

  hideAllModals() {
    if (this.dom.startScreenModal) this.dom.startScreenModal.classList.add("hidden");
    if (this.dom.gameOverModal) this.dom.gameOverModal.classList.add("hidden");
    if (this.dom.victoryModal) this.dom.victoryModal.classList.add("hidden");
    if (this.dom.duelLobbyModal) this.dom.duelLobbyModal.classList.add("hidden");
    if (this.dom.duelResultModal) this.dom.duelResultModal.classList.add("hidden");
  }

  showDuelLobby() {
    this.hideAllModals();
    if (this.dom.duelLobbyModal) this.dom.duelLobbyModal.classList.remove("hidden");
    if (this.dom.btnDuelStartMatch) this.dom.btnDuelStartMatch.classList.add("hidden");
    if (this.dom.btnDuelTabWifi) this.dom.btnDuelTabWifi.classList.add("active-mode");
    if (this.dom.btnDuelTabSplit) this.dom.btnDuelTabSplit.classList.remove("active-mode");
    if (this.dom.duelWifiSection) this.dom.duelWifiSection.classList.remove("hidden");
    if (this.dom.duelSplitSection) this.dom.duelSplitSection.classList.add("hidden");
    this.setDuelLobbyMessage("");
  }

  setDuelRoomCode(code) {
    if (this.dom.duelCreatedCodeBox) this.dom.duelCreatedCodeBox.classList.remove("hidden");
    if (this.dom.duelRoomCodeText) this.dom.duelRoomCodeText.textContent = code;
    if (this.dom.duelHostStatus) this.dom.duelHostStatus.textContent = "Chờ máy 2 nhập mã...";
  }

  setDuelOpponentJoined(opponentName) {
    if (this.dom.duelHostStatus) {
      this.dom.duelHostStatus.textContent = `${opponentName} ĐÃ SẴN SÀNG!`;
      this.dom.duelHostStatus.style.color = "#10b981";
    }
    if (this.dom.btnDuelStartMatch) {
      this.dom.btnDuelStartMatch.classList.remove("hidden");
    }
    this.setDuelLobbyMessage(`Đối thủ "${opponentName}" đã vào phòng. Bấm Bắt Đầu để chiến!`);
  }

  setDuelLobbyMessage(msg) {
    if (this.dom.duelLobbyMsg) {
      this.dom.duelLobbyMsg.textContent = msg || "";
    }
  }

  showDuelResult(isWinner, result) {
    this.hideAllModals();
    if (!this.dom.duelResultModal) return;

    if (this.dom.duelResultTitle) {
      if (result.winnerRole === 'draw') {
        this.dom.duelResultTitle.textContent = "KẾT QUẢ: HÒA NHAU!";
        this.dom.duelResultTitle.style.color = "var(--dever-amber)";
      } else if (isWinner) {
        this.dom.duelResultTitle.textContent = "BẠN ĐÃ CHIẾN THẮNG!";
        this.dom.duelResultTitle.style.color = "var(--emerald-ok)";
      } else {
        this.dom.duelResultTitle.textContent = "BẠN ĐÃ THUA CUỘC!";
        this.dom.duelResultTitle.style.color = "var(--crimson-bad)";
      }
    }

    if (this.dom.duelResultDesc) {
      if (result.reason === 'knockout') {
        this.dom.duelResultDesc.textContent = isWinner ? "Đối thủ đã mất hết mạng trước bạn!" : "Bạn đã bị deadline đè bẹp trước đối thủ!";
      } else {
        this.dom.duelResultDesc.textContent = `Hết 60 giây đối kháng kịch tính!`;
      }
    }

    if (this.dom.duelMyScore) {
      const myScore = result.hostScore !== undefined ? (isWinner ? Math.max(result.hostScore, result.guestScore) : Math.min(result.hostScore, result.guestScore)) : 0;
      this.dom.duelMyScore.textContent = myScore.toLocaleString();
    }
    if (this.dom.duelOpponentScore) {
      const oppScore = result.guestScore !== undefined ? (isWinner ? Math.min(result.hostScore, result.guestScore) : Math.max(result.hostScore, result.guestScore)) : 0;
      this.dom.duelOpponentScore.textContent = oppScore.toLocaleString();
    }

    this.dom.duelResultModal.classList.remove("hidden");
  }

  showGameOver(summary) {
    this.lastSummary = summary;
    if (this.dom.gameOverScoreDesc) {
      this.dom.gameOverScoreDesc.textContent = `Bạn đã dừng lại tại giây thứ ${summary.timeSurvived} với ${summary.score} PTS!`;
    }
    if (this.dom.gameOverModal) this.dom.gameOverModal.classList.remove("hidden");
    this.promptScoreSubmission(summary);
  }

  showVictory(summary) {
    this.lastSummary = summary;
    if (this.dom.victoryScoreDesc) {
      this.dom.victoryScoreDesc.textContent = `Bạn đã hoàn thành xuất sắc thử thách với tổng điểm ${summary.score.toLocaleString()} PTS!`;
    }
    if (this.dom.victoryModal) this.dom.victoryModal.classList.remove("hidden");
    this.promptScoreSubmission(summary);
  }

  generatePolaroid(summary) {
    const video = this.dom.video;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 760;
    const ctx = canvas.getContext("2d");

    // 1. Polaroid White Paper Frame
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 760);

    // Subtle drop shadow / inner edge
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 598, 758);

    // 2. Photo Area (Mirrored video snapshot)
    const photoX = 30;
    const photoY = 30;
    const photoW = 540;
    const photoH = 540;

    ctx.save();
    ctx.beginPath();
    ctx.rect(photoX, photoY, photoW, photoH);
    ctx.clip();

    if (video && video.videoWidth > 0) {
      // Flip snapshot horizontally so it matches mirror preview
      ctx.translate(photoX + photoW, photoY);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, photoW, photoH);
    } else {
      ctx.fillStyle = "#0a1122";
      ctx.fillRect(photoX, photoY, photoW, photoH);
    }
    ctx.restore();

    // Photo inner border
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    // 3. Caption / Polaroid Label Area
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 24px 'Be Vietnam Pro', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("FU-DEVER BUG DASH 2026", 36, 620);

    ctx.fillStyle = "#f26f21";
    ctx.font = "800 32px 'JetBrains Mono', monospace";
    ctx.fillText(`${summary.score.toLocaleString()} PTS`, 36, 665);

    ctx.fillStyle = "#475569";
    ctx.font = "600 14px 'Be Vietnam Pro', sans-serif";
    ctx.fillText(`Thời gian: ${summary.timeSurvived}s  •  Chuỗi né: ${summary.highestStreak || 1}x`, 36, 700);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("FPT UNIVERSITY DA NANG", 564, 700);

    // Download file
    const link = document.createElement("a");
    link.download = `bug_dash_polaroid_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async promptScoreSubmission(summary) {
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

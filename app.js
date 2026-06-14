/**
 * Kraliyet Satrancı - Ana Uygulama Kodu (app.js)
 * Oyun akışı, etkileşimler, Web Audio ses sentezleyici ve tahta görselleştirme.
 */

document.addEventListener('DOMContentLoaded', () => {
    // === OYUN DURUMU (STATE) ===
    let game = new Chess();
    let gameMode = 'ai'; // 'ai', 'local' veya 'online'
    let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard', 'impossible'
    let playerColor = 'w'; // 'w', 'b', veya 'random' (Oyuncunun rengi)
    let localPlayer1Color = 'w'; // 2 kişilik modda 1. oyuncunun rengi
    let playType = 'same'; // 'same' (Aynı cihazda) veya 'online' (Farklı cihazda)
    
    // Çevrimiçi Çok Oyunculu Durum Değişkenleri
    let peer = null;
    let conn = null;
    let isHost = false;
    let myOnlineColor = 'w'; // Çevrimiçi moddaki rengimiz ('w' veya 'b')
    
    let activePlayerColor = 'w'; // Sıradaki oyuncu rengi ('w' veya 'b')
    let selectedSquare = null;
    let selectedSquareEl = null;
    let activeHighlights = [];
    let isGameActive = false;
    let isSoundEnabled = true;
    let orientation = 'w'; // 'w' (Beyaz altta) veya 'b' (Siyah altta)
    
    // Web Audio API Context (Tıklanma sonrası oluşturulacak)
    let audioCtx = null;

    // === DOM ELEMENTLERİ ===
    const screens = {
        mainMenu: document.getElementById('screen-main-menu'),
        learn: document.getElementById('screen-learn'),
        vsComputerSettings: document.getElementById('screen-vs-computer-settings'),
        twoPlayerSettings: document.getElementById('screen-two-player-settings'),
        multiplayerLobby: document.getElementById('screen-multiplayer-lobby'),
        joiningLobby: document.getElementById('screen-joining-lobby'),
        game: document.getElementById('screen-game')
    };

    // Butonlar
    const btnLearn = document.getElementById('btn-learn');
    const btnPlayAi = document.getElementById('btn-play-ai');
    const btnPlayLocal = document.getElementById('btn-play-local');
    const btnStartAi = document.getElementById('btn-start-ai');
    const btnStartLocal = document.getElementById('btn-start-local');
    const btnAbort = document.getElementById('btn-abort');
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const btnPlayAgain = document.getElementById('btn-play-again');
    const btnGoHome = document.getElementById('btn-go-home');
    
    // Çevrimiçi Mod Arayüz Butonları
    const btnLocalSame = document.getElementById('btn-local-same');
    const btnLocalOnline = document.getElementById('btn-local-online');
    const btnBackLobby = document.getElementById('btn-back-lobby');
    const btnCancelLobby = document.getElementById('btn-cancel-lobby');
    const btnCopyLink = document.getElementById('btn-copy-link');
    const btnCancelJoining = document.getElementById('btn-cancel-joining');
    
    // Arama / Katıl ve Sohbet Arayüzü
    const txtJoinSearch = document.getElementById('txt-join-search');
    const btnJoinSearch = document.getElementById('btn-join-search');
    const btnChatToggle = document.getElementById('btn-chat-toggle');
    const chatBadge = document.getElementById('chat-badge');
    const chatDrawer = document.getElementById('chat-drawer');
    const btnCloseChat = document.getElementById('btn-close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const txtChatMessage = document.getElementById('txt-chat-message');
    const btnSendMessage = document.getElementById('btn-send-message');
    
    // Açıklama Kartları
    const cardLocalRotationInfo = document.getElementById('card-local-rotation-info');
    const cardOnlineStaticInfo = document.getElementById('card-online-static-info');
    
    // Çevrimiçi Girdiler & Yazılar
    const txtShareLink = document.getElementById('txt-share-link');
    const lblLobbyStatus = document.getElementById('lbl-lobby-status');
    const lblWaitingText = document.getElementById('lbl-waiting-text');
    
    // Paneller & Yazılar
    const boardEl = document.getElementById('board');
    const lblGameMode = document.getElementById('lbl-game-mode');
    const lblTurn = document.getElementById('lbl-turn');
    const lblOppName = document.getElementById('lbl-opp-name');
    const lblPlayerName = document.getElementById('lbl-player-name');
    const oppAvatarIcon = document.getElementById('opp-avatar-icon');
    const oppCapturedEl = document.getElementById('opp-captured');
    const playerCapturedEl = document.getElementById('player-captured');
    const aiThinkingIndicator = document.getElementById('ai-thinking-indicator');
    
    // Modallar
    const promotionModal = document.getElementById('promotion-modal');
    const gameOverModal = document.getElementById('game-over-modal');
    const gameOverTitle = document.getElementById('game-over-title');
    const gameOverDetail = document.getElementById('game-over-detail');

    // === VEKTÖREL SVG SATRANÇ TAŞLARI ===
    // Wikipedia standart geleneksel satranç taşlarının tam vektör kodları (orijinal ve son derece anlaşılır)
    const PIECE_SVGS = {
        // Beyaz Taşlar (White)
        wP: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke-linecap="round"/>
              </g>
            </svg>`,
        wR: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/>
                <path d="M34 14l-3 3H14l-3-3"/>
                <path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/>
                <path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/>
                <path d="M11 14h23" fill="none" stroke-linejoin="miter"/>
              </g>
            </svg>`,
        wN: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#ffffff; stroke:#000000;"/>
                <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style="fill:#ffffff; stroke:#000000;"/>
                <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#000000; stroke:#000000;"/>
                <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style="fill:#000000; stroke:#000000;"/>
              </g>
            </svg>`,
        wB: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <g fill="#fff" stroke-linecap="butt">
                  <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>
                </g>
                <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke-linejoin="miter"/>
              </g>
            </svg>`,
        wQ: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <g fill="#fff" stroke="none">
                  <circle cx="8" cy="12" r="2"/>
                  <circle cx="24.5" cy="7.5" r="2"/>
                  <circle cx="41" cy="12" r="2"/>
                  <circle cx="16" cy="8.5" r="2"/>
                  <circle cx="33" cy="9" r="2"/>
                </g>
                <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12zM9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" fill="#fff" stroke-linecap="butt"/>
                <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none"/>
              </g>
            </svg>`,
        wK: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/>
                <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" stroke-linecap="butt" stroke-linejoin="miter"/>
                <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" fill="#fff"/>
                <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/>
              </g>
            </svg>`,

        // Siyah Taşlar (Black)
        bP: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#000" stroke-linecap="round"/>
              </g>
            </svg>`,
        bR: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z" fill="#000" stroke-linecap="butt"/>
                <path d="M14 29.5v-13h17v13H14z" fill="#000" stroke-linecap="butt" stroke-linejoin="miter"/>
                <path d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z" fill="#000" stroke-linecap="butt"/>
                <path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="miter"/>
              </g>
            </svg>`,
        bN: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#000000; stroke:#000000;"/>
                <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style="fill:#000000; stroke:#000000;"/>
                <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#ececec; stroke:#ececec;"/>
                <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style="fill:#ececec; stroke:#ececec;"/>
                <path d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z " style="fill:#ececec; stroke:none;"/>
              </g>
            </svg>`,
        bB: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2zm6-4c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" fill="#000" stroke-linecap="butt"/>
                <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke="#fff" stroke-linejoin="miter"/>
              </g>
            </svg>`,
        bQ: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <g fill="#000" stroke="none">
                  <circle cx="6" cy="12" r="2.75"/>
                  <circle cx="14" cy="9" r="2.75"/>
                  <circle cx="22.5" cy="8" r="2.75"/>
                  <circle cx="31" cy="9" r="2.75"/>
                  <circle cx="39" cy="12" r="2.75"/>
                </g>
                <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26zM9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" fill="#000" stroke-linecap="butt"/>
                <path d="M11 38.5a35 35 1 0 0 23 0" fill="none" stroke-linecap="butt"/>
                <path d="M11 29a35 35 1 0 1 23 0M12.5 31.5h20M11.5 34.5a35 35 1 0 0 22 0M10.5 37.5a35 35 1 0 0 24 0" fill="none" stroke="#fff"/>
              </g>
            </svg>`,
        bK: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22.5 11.63V6" stroke-linejoin="miter"/>
                <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#000" stroke-linecap="butt" stroke-linejoin="miter"/>
                <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" fill="#000"/>
                <path d="M20 8h5" stroke-linejoin="miter"/>
                <path d="M32 29.5s8.5-4 6.03-9.65C34.15 14 25 18 22.5 24.5l.01 2.1-.01-2.1C20 18 9.906 14 6.997 19.85c-2.497 5.65 4.853 9 4.853 9M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#fff"/>
              </g>
            </svg>`
    };

    /**
     * SVG Taş kodunun renklendirilmiş halini döner
     */
    function getPieceSvgString(type, color) {
        const key = `${color}${type.toUpperCase()}`;
        const svg = PIECE_SVGS[key];
        if (!svg) return '';
        
        // CSS ile ek müdahaleler (gölge, boyut) yapabilmek için sınıf ekliyoruz
        const colorClass = color === 'w' ? 'white-piece' : 'black-piece';
        return svg.replace('<svg', `<svg class="chess-svg-piece ${colorClass}"`);
    }

    // === SES SENTEZLEYİCİ (WEB AUDIO API) ===
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playSound(type) {
        if (!isSoundEnabled) return;
        try {
            initAudio();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            const now = audioCtx.currentTime;
            
            if (type === 'move') {
                // Hafif tık sesi (Sinüs dalgası + Hızlı sönümlenme)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
                
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(now);
                osc.stop(now + 0.08);
            } 
            else if (type === 'capture') {
                // Taş alma sesi (Hafif beyaz gürültü + Sinüs dalgası birleşimi)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
                
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(now);
                osc.stop(now + 0.12);
            } 
            else if (type === 'check') {
                // İki tonlu uyarı sinyali
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(660, now + 0.1);
                
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.setValueAtTime(0.2, now + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(now);
                osc.stop(now + 0.25);
            } 
            else if (type === 'win') {
                // Mutlu arpej melodisi (Majör)
                const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
                notes.forEach((freq, index) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + index * 0.12);
                    
                    gain.gain.setValueAtTime(0.15, now + index * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.12 + 0.3);
                    
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    
                    osc.start(now + index * 0.12);
                    osc.stop(now + index * 0.12 + 0.3);
                });
            } 
            else if (type === 'lose') {
                // Hüzünlü melodi (Minör veya İnen bas)
                const notes = [392.00, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
                notes.forEach((freq, index) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + index * 0.15);
                    
                    gain.gain.setValueAtTime(0.15, now + index * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.15 + 0.4);
                    
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    
                    osc.start(now + index * 0.15);
                    osc.stop(now + index * 0.15 + 0.4);
                });
            }
        } catch(e) {
            console.warn("Audio Context init or playback failed:", e);
        }
    }

    // === EKRAN YÖNETİMİ VE GEÇİŞLER ===
    function showScreen(screenKey) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });
        screens[screenKey].classList.add('active');
        
        // Modal kapatmaları
        promotionModal.classList.remove('active');
        gameOverModal.classList.remove('active');
    }

    // Geri butonlarının genel tanımlaması (Ana menüye döner)
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen('mainMenu');
        });
    });

    document.querySelectorAll('.main-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen('mainMenu');
        });
    });

    // Menü Buton Olayları
    btnLearn.addEventListener('click', () => {
        showScreen('learn');
    });

    btnPlayAi.addEventListener('click', () => {
        showScreen('vsComputerSettings');
    });

    btnPlayLocal.addEventListener('click', () => {
        showScreen('twoPlayerSettings');
    });

    // Ses Açma / Kapatma
    btnSoundToggle.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        const icon = btnSoundToggle.querySelector('i');
        if (isSoundEnabled) {
            icon.className = 'fa-solid fa-volume-high';
            btnSoundToggle.title = 'Sesi Kapat';
        } else {
            icon.className = 'fa-solid fa-volume-xmark';
            btnSoundToggle.title = 'Sesi Aç';
        }
    });

    // Öğrenme Ekranı - Akordeon Kontrolü
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Diğer tüm akordeonları kapat
            document.querySelectorAll('.accordion-item').forEach(el => {
                el.classList.remove('active');
            });
            
            // Eğer aktif değilse bunu aç
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Zorluk Seviyesi Seçimi
    const difficultyButtons = document.querySelectorAll('#screen-vs-computer-settings .option-btn');
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aiDifficulty = btn.dataset.difficulty;
        });
    });

    // Bilgisayara Karşı Renk Seçimi
    const aiColorButtons = document.querySelectorAll('#screen-vs-computer-settings .color-btn');
    aiColorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            aiColorButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            playerColor = btn.dataset.color;
        });
    });

    // 2 Kişilik Mod Renk Seçimi
    const localColorButtons = document.querySelectorAll('#screen-two-player-settings .color-btn');
    localColorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            localColorButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            localPlayer1Color = btn.dataset.colorLocal;
        });
    });

    // Oyunu yarıda kesme (Geri Dön / Pes Et)
    btnAbort.addEventListener('click', () => {
        if (gameMode === 'online') {
            if (conn && conn.open) {
                conn.send({ type: 'resign' });
            }
            closeConnection();
        }
        isGameActive = false;
        showScreen('mainMenu');
    });

    // === OYUN TAHTASI ÇİZİMİ VE GÖRSEL YÖNETİM ===
    /**
     * Tahta ızgarasını (DOM) temizler ve sıfırdan kurar
     */
    function renderBoardSkeleton() {
        boardEl.innerHTML = '';
        
        // Satranç tahtası normalde a8'den başlar (sol üst)
        // Eğer orientation 'b' ise (Siyah altta) tahta sırasını tersine çevirmeliyiz.
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
        
        const displayRanks = orientation === 'w' ? ranks : [...ranks].reverse();
        const displayFiles = orientation === 'w' ? files : [...files].reverse();
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const rankNum = displayRanks[r];
                const fileLetter = displayFiles[c];
                const squareName = `${fileLetter}${rankNum}`;
                
                const squareEl = document.createElement('div');
                squareEl.className = `square ${((r + c) % 2 === 0) ? 'light' : 'dark'}`;
                squareEl.dataset.square = squareName;
                
                // Koordinat harf ve sayılarını ekleme
                // Sayılar sadece en sol kolonda, Harfler sadece en alt satırda gösterilir
                if (c === 0) {
                    squareEl.dataset.rank = rankNum;
                    squareEl.classList.add('show-rank');
                }
                if (r === 7) {
                    squareEl.dataset.file = fileLetter;
                    squareEl.classList.add('show-file');
                }
                
                // Event Dinleyicileri (Tıkla-Taşı)
                squareEl.addEventListener('click', () => handleSquareClick(squareName, squareEl));
                
                // Sürükle-Bırak Dragover & Drop
                squareEl.addEventListener('dragover', handleDragOver);
                squareEl.addEventListener('drop', (e) => handleDrop(e, squareName));
                
                boardEl.appendChild(squareEl);
            }
        }
    }

    /**
     * Mevcut game durumuna göre tahtadaki taşları günceller
     */
    function updatePieces() {
        // Tüm karelerdeki eski taşları temizle
        document.querySelectorAll('.square').forEach(sq => {
            sq.innerHTML = '';
        });
        
        const boardState = game.board(); // 8x8 matris (null veya {type, color})
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = boardState[r][c];
                if (piece) {
                    // chess.js matrisi her zaman Beyaz a8=0,0 formatındadır.
                    // Kare adını a1-h8 formatına çeviriyoruz:
                    const squareName = `${files[c]}${8 - r}`;
                    const squareEl = document.querySelector(`.square[data-square="${squareName}"]`);
                    
                    if (squareEl) {
                        const pieceEl = document.createElement('div');
                        pieceEl.className = `piece`;
                        pieceEl.dataset.piece = `${piece.color}${piece.type}`;
                        pieceEl.dataset.sourceSquare = squareName;
                        pieceEl.innerHTML = getPieceSvgString(piece.type, piece.color);
                        
                        // Sürüklenebilirlik
                        pieceEl.draggable = true;
                        pieceEl.addEventListener('dragstart', (e) => handleDragStart(e, squareName, pieceEl));
                        pieceEl.addEventListener('dragend', handleDragEnd);
                        
                        squareEl.appendChild(pieceEl);
                    }
                }
            }
        }
        
        // Şah tehdidi (Check) varsa şah karesini kırmızı yap
        clearCheckHighlight();
        if (game.in_check()) {
            highlightCheckKing();
        }
        
        // Yenen taşları hesapla ve panelleri güncelle
        updateCapturedPieces();
    }

    // === HAMLE ETKİLEŞİM YÖNETİMİ (CLICK & DRAG) ===
    let dragSourceSquare = null;
    let dragPieceEl = null;

    function handleDragStart(e, squareName, pieceEl) {
        if (!isGameActive) return;
        if (gameMode === 'ai' && game.turn() !== playerColor) {
            e.preventDefault();
            return;
        }
        if (gameMode === 'online' && game.turn() !== myOnlineColor) {
            e.preventDefault();
            return;
        }
        
        dragSourceSquare = squareName;
        dragPieceEl = pieceEl;
        pieceEl.classList.add('dragging');
        
        // Sürüklenen taşı seç ve hamle yerlerini göster
        selectSquare(squareName, pieceEl.parentElement);
        
        // Transfer datasını ata
        e.dataTransfer.setData('text/plain', squareName);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd() {
        if (dragPieceEl) {
            dragPieceEl.classList.remove('dragging');
        }
        dragSourceSquare = null;
        dragPieceEl = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e, targetSquare) {
        e.preventDefault();
        const sourceSquare = e.dataTransfer.getData('text/plain');
        if (sourceSquare && sourceSquare !== targetSquare) {
            attemptMove(sourceSquare, targetSquare);
        }
    }

    function handleSquareClick(squareName, squareEl) {
        if (!isGameActive) return;
        
        // Yapay zeka modunda sıra yapay zekadaysa hamleye izin verme
        if (gameMode === 'ai' && game.turn() !== playerColor) return;
        
        // Çevrimiçi modda sıra rakipteyse hamleye izin verme
        if (gameMode === 'online' && game.turn() !== myOnlineColor) return;
        
        const piece = game.get(squareName);
        
        // Zaten bir kare seçilmişse ve tıklanan kare geçerli bir hedefse
        if (selectedSquare && activeHighlights.includes(squareName)) {
            attemptMove(selectedSquare, squareName);
            return;
        }
        
        // Yeni bir taş seçimi
        if (piece && piece.color === game.turn()) {
            selectSquare(squareName, squareEl);
        } else {
            clearSelection();
        }
    }

    function selectSquare(squareName, squareEl) {
        clearSelection();
        
        selectedSquare = squareName;
        selectedSquareEl = squareEl;
        squareEl.classList.add('selected-square');
        
        // Geçerli hamleleri hesapla ve göster
        const moves = game.moves({ square: squareName, verbose: true });
        moves.forEach(m => {
            const targetSquare = m.to;
            const targetEl = document.querySelector(`.square[data-square="${targetSquare}"]`);
            if (targetEl) {
                if (m.captured) {
                    targetEl.classList.add('highlight-capture');
                } else {
                    targetEl.classList.add('highlight-move');
                }
                activeHighlights.push(targetSquare);
            }
        });
    }

    function clearSelection() {
        if (selectedSquareEl) {
            selectedSquareEl.classList.remove('selected-square');
        }
        selectedSquare = null;
        selectedSquareEl = null;
        
        document.querySelectorAll('.square').forEach(sq => {
            sq.classList.remove('highlight-move');
            sq.classList.remove('highlight-capture');
        });
        activeHighlights = [];
    }

    function clearCheckHighlight() {
        document.querySelectorAll('.square').forEach(sq => {
            sq.classList.remove('check-square');
        });
    }

    function highlightCheckKing() {
        const turn = game.turn();
        const boardState = game.board();
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = boardState[r][c];
                if (piece && piece.type === 'k' && piece.color === turn) {
                    const squareName = `${files[c]}${8 - r}`;
                    const kingSquare = document.querySelector(`.square[data-square="${squareName}"]`);
                    if (kingSquare) {
                        kingSquare.classList.add('check-square');
                    }
                    return;
                }
            }
        }
    }

    // === OYUN HAMLE MEKANİKLERİ VE AI DÖNGÜSÜ ===
    let pendingPromotionMove = null;

    /**
     * Bir hamle yapmayı dener. Terfi durumunu kontrol eder.
     */
    function attemptMove(from, to) {
        // Hamlenin geçerliliğini ve piyon terfisi gerektirip gerektirmediğini bul
        const moves = game.moves({ square: from, verbose: true });
        const move = moves.find(m => m.from === from && m.to === to);
        
        if (!move) {
            clearSelection();
            return;
        }
        
        // Terfi kontrolü
        if (move.flags.includes('p')) {
            // Terfi popup'ını aç ve seçim bekle
            pendingPromotionMove = { from, to };
            openPromotionModal(game.turn());
            return;
        }
        
        // Normal hamle
        executeMove({ from, to });
    }

    function executeMove(moveObj) {
        const isCapture = game.get(moveObj.to) !== null || (game.get(moveObj.from) && game.get(moveObj.from).type === 'p' && moveObj.to === game.fen().split(' ')[3]);
        
        // Çevrimiçi modda hamleyi bizim yapıp yapmadığımızı anlamak için mevcut hamle sırasını saklayalım
        const wasMyTurn = (gameMode === 'online' && game.turn() === myOnlineColor);
        
        const resultMove = game.move(moveObj);
        
        if (resultMove) {
            clearSelection();
            
            // Hamle sesini çal
            if (game.in_check()) {
                playSound('check');
            } else if (isCapture || resultMove.captured) {
                playSound('capture');
            } else {
                playSound('move');
            }
            
            // Taşları görsel olarak güncelle
            updatePieces();
            
            // Sıra durumunu güncelle
            updateGameHeader();
            
            // Oyun sonu denetimi
            if (checkGameOver()) return;
            
            // Çevrimiçi modda hamleyi karşı tarafa gönder
            if (gameMode === 'online' && wasMyTurn && conn && conn.open) {
                conn.send({ type: 'move', move: moveObj });
            }
            
            // Tahtayı döndür (2 kişilik modda) veya AI turunu başlat
            if (gameMode === 'local') {
                rotateBoardForTurn();
            } else if (gameMode === 'ai') {
                triggerAiTurn();
            }
        }
    }

    // Terfi Modalı Yönetimi
    function openPromotionModal(color) {
        // Modal içindeki taş ikonlarını renklendir
        const options = promotionModal.querySelectorAll('.promo-option');
        options.forEach(opt => {
            const pieceType = opt.dataset.promo;
            const iconEl = opt.querySelector('.piece-icon');
            iconEl.innerHTML = getPieceSvgString(pieceType, color);
        });
        promotionModal.classList.add('active');
    }

    // Terfi seçeneğine tıklanma
    promotionModal.querySelectorAll('.promo-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const pieceType = opt.dataset.promo;
            if (pendingPromotionMove) {
                executeMove({
                    from: pendingPromotionMove.from,
                    to: pendingPromotionMove.to,
                    promotion: pieceType
                });
                pendingPromotionMove = null;
            }
            promotionModal.classList.remove('active');
        });
    });

    /**
     * Yerel 2 kişilik modda sırası gelen oyuncuya göre tahtayı ve taşları 180 derece döndürür
     */
    function rotateBoardForTurn() {
        const turn = game.turn();
        
        // Rotasyon işlemini css ile pürüzsüzce tetikle
        // 100ms gecikme ile hamle tık sesinden sonra dönmesi göze daha iyi gelir
        setTimeout(() => {
            if (turn === 'b') {
                boardEl.classList.add('rotated');
            } else {
                boardEl.classList.remove('rotated');
            }
        }, 150);
    }

    /**
     * Bilgisayarın hamle sırasını tetikler (Asenkron)
     */
    function triggerAiTurn() {
        if (!isGameActive || game.turn() === playerColor) return;
        
        // Düşünme spinner'ını göster
        aiThinkingIndicator.classList.add('active');
        
        // JS tek kanallı (single-thread) olduğu için arama motorunu asenkron tetikleyip arayüzü dondurmayız
        setTimeout(() => {
            const startTime = performance.now();
            const aiMove = window.ChessAI.getBestMove(game, aiDifficulty);
            
            // Eğer AI düşünmesi 300ms'den az sürdüyse, premium hissettirmek için yapay zeka düşünüyormuş gibi
            // en az 400ms bekleterek hamleyi yapalım.
            const elapsed = performance.now() - startTime;
            const delay = Math.max(400 - elapsed, 0);
            
            setTimeout(() => {
                aiThinkingIndicator.classList.remove('active');
                if (aiMove) {
                    executeMove(aiMove);
                }
            }, delay);
        }, 50);
    }

    // === YENEN TAŞLARIN HESAPLANMASI ===
    const STARTING_PIECES = {
        w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
        b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 }
    };

    function updateCapturedPieces() {
        const boardState = game.board();
        
        // Tahtada kalan taşları say
        const remaining = {
            w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
            b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
        };
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = boardState[r][c];
                if (piece) {
                    remaining[piece.color][piece.type]++;
                }
            }
        }
        
        // Yenen taşları hesapla (Başlangıç - Kalan)
        const captured = {
            w: {}, // Beyazın yenen taşları (Siyahın kazandıkları)
            b: {}  // Siyahın yenen taşları (Beyazın kazandıkları)
        };
        
        const types = ['p', 'n', 'b', 'r', 'q'];
        
        types.forEach(t => {
            captured.w[t] = STARTING_PIECES.w[t] - remaining.w[t];
            captured.b[t] = STARTING_PIECES.b[t] - remaining.b[t];
        });
        
        // Arayüzü güncelle
        // Beyazın yenen taşları Siyahın panelinde gösterilir (opp veya player panel)
        // Siyahın yenen taşları Beyazın panelinde gösterilir.
        
        // Hangi panelin kime ait olduğunu belirle
        let userColor = (gameMode === 'ai') ? playerColor : 'w';
        
        const userCapturedEl = playerCapturedEl;
        const oppCapturedElTarget = oppCapturedEl;
        
        userCapturedEl.innerHTML = '';
        oppCapturedElTarget.innerHTML = '';
        
        // Kullanıcı Beyaz ise:
        // Kullanıcı yenen siyah taşları toplar (b).
        // Rakip yenen beyaz taşları toplar (w).
        const userCapturedColor = (userColor === 'w') ? 'b' : 'w';
        const oppCapturedColor = (userColor === 'w') ? 'w' : 'b';
        
        renderCapturedList(userCapturedEl, captured[userCapturedColor], userCapturedColor);
        renderCapturedList(oppCapturedElTarget, captured[oppCapturedColor], oppCapturedColor);
    }

    function renderCapturedList(container, pieceCounts, color) {
        // Değerli taşları en sona yerleştirmek için tipleri sıralı çekelim: p, n, b, r, q
        const types = ['p', 'n', 'b', 'r', 'q'];
        types.forEach(t => {
            const count = pieceCounts[t];
            for (let i = 0; i < count; i++) {
                const item = document.createElement('div');
                item.className = 'captured-piece';
                item.innerHTML = getPieceSvgString(t, color);
                container.appendChild(item);
            }
        });
    }

    // === ÜST BİLGİ ALANININ GÜNCELLEMESİ ===
    function updateGameHeader() {
        const turn = game.turn();
        
        if (gameMode === 'local') {
            const turnText = turn === 'w' ? 'Beyaz Oyuncu' : 'Siyah Oyuncu';
            lblTurn.textContent = `Sıra: ${turnText}`;
        } else if (gameMode === 'online') {
            const turnText = turn === myOnlineColor ? 'Sende' : 'Rakipte';
            lblTurn.textContent = `Sıra: ${turnText}`;
        } else {
            const turnText = turn === playerColor ? 'Sende' : 'Bilgisayarda';
            lblTurn.textContent = `Sıra: ${turnText}`;
        }
    }

    // === OYUN BİTİŞ DENETİMİ ===
    /**
     * Oyunun bitip bitmediğini denetler ve bitmişse modal pencerelerini tetikler.
     * @returns {boolean} Oyun bittiyse true döner
     */
    function checkGameOver() {
        if (!game.game_over()) return false;
        
        isGameActive = false;
        let titleText = 'Oyun Bitti';
        let detailText = '';
        let won = false;
        
        const turn = game.turn();
        
        if (game.in_checkmate()) {
            // Şah Mat
            if (gameMode === 'local') {
                const winner = turn === 'w' ? 'Siyah' : 'Beyaz';
                titleText = `${winner} Kazandı!`;
                detailText = 'Şah mat ile oyun kazanıldı.';
                playSound(winner === 'Beyaz' ? 'win' : 'lose'); // Yerel modda basitçe çal
            } else if (gameMode === 'online') {
                const playerWon = (turn !== myOnlineColor);
                won = playerWon;
                if (playerWon) {
                    titleText = 'Tebrikler, Kazandınız!';
                    detailText = 'Rakibi şah mat ettiniz!';
                    playSound('win');
                } else {
                    titleText = 'Kaybettiniz!';
                    detailText = 'Rakip sizi şah mat etti.';
                    playSound('lose');
                }
            } else {
                // Bilgisayara karşı
                const playerWon = (turn !== playerColor);
                won = playerWon;
                if (playerWon) {
                    titleText = 'Tebrikler, Kazandınız!';
                    detailText = 'Bilgisayarı şah mat ettiniz!';
                    playSound('win');
                } else {
                    titleText = 'Kaybettiniz!';
                    detailText = 'Bilgisayar sizi şah mat etti.';
                    playSound('lose');
                }
            }
        } 
        else if (game.in_draw()) {
            // Beraberlik durumları
            titleText = 'Beraberlik!';
            playSound('lose'); // Beraberlikte nötr/hüzünlü çal
            
            if (game.in_stalemate()) {
                detailText = 'Oyun pat (stalemate) ile sona erdi. Hamle sırası kendisinde olan oyuncunun şahı tehdit altında olmamasına rağmen yapacak yasal hamlesi yok.';
            } else if (game.insufficient_material()) {
                detailText = 'Yetersiz güç nedeniyle beraberlik. İki tarafın da mat yapacak taşı kalmadı.';
            } else if (game.in_threefold_repetition()) {
                detailText = 'Aynı konum tahtada 3 kez tekrarlandığı için beraberlik ilan edildi.';
            } else {
                detailText = '50 hamle kuralı veya anlaşmalı beraberlik.';
            }
        }
        
        // Çevrimiçi oyunda yeniden oyna seçeneğini gizle
        if (gameMode === 'online') {
            btnPlayAgain.classList.add('hidden');
        } else {
            btnPlayAgain.classList.remove('hidden');
        }

        // Modalı göster
        setTimeout(() => {
            gameOverTitle.textContent = titleText;
            gameOverDetail.textContent = detailText;
            gameOverModal.classList.add('active');
        }, 800); // Oyuncunun son hamleyi tahtada rahatça görebilmesi için gecikmeli açılır
        
        // Çevrimiçi moddaysa bağlantıyı düzgünce kapat
        if (gameMode === 'online') {
            closeConnection();
        }
        
        return true;
    }

    // === OYUNU BAŞLATMA AYARLARI ===
    
    // Bilgisayara Karşı Başlat
    btnStartAi.addEventListener('click', () => {
        initAudio();
        gameMode = 'ai';
        isGameActive = true;
        game.reset();
        
        // Sohbeti Sıfırla
        chatMessages.innerHTML = '';
        chatBadge.classList.add('hidden');
        chatDrawer.classList.remove('active');
        
        // Rengi netleştir (Rastgele seçeneği için)
        let chosenColor = playerColor;
        if (chosenColor === 'random') {
            chosenColor = Math.random() < 0.5 ? 'w' : 'b';
        }
        playerColor = chosenColor;
        orientation = chosenColor; // Oyuncu rengi altta dursun
        
        // Yapay zeka zorluğunu yazdır
        const diffText = {
            'easy': 'Kolay',
            'medium': 'Orta',
            'hard': 'Zor',
            'impossible': 'İmkansız'
        }[aiDifficulty];
        
        // Panelleri kur
        lblGameMode.textContent = `Yapay Zeka (${diffText})`;
        lblOppName.textContent = `Bilgisayar (${diffText})`;
        oppAvatarIcon.className = 'fa-solid fa-robot';
        lblPlayerName.textContent = 'Sen';
        
        // Tahta yönünü ayarla ve çiz
        boardEl.classList.remove('rotated');
        renderBoardSkeleton();
        updatePieces();
        
        updateGameHeader();
        showScreen('game');
        
        // Bilgisayar Beyaz ise ilk hamleyi yapsın
        if (playerColor === 'b') {
            triggerAiTurn();
        }
    });

    // 2 Kişilik Modu Başlat
    btnStartLocal.addEventListener('click', () => {
        initAudio();
        
        if (playType === 'online') {
            // Çevrimiçi oyun kurma ekranını aç ve PeerJS başlat
            showScreen('multiplayerLobby');
            initPeer(true);
        } else {
            gameMode = 'local';
            isGameActive = true;
            game.reset();
            
            // Sohbeti Sıfırla
            chatMessages.innerHTML = '';
            chatBadge.classList.add('hidden');
            chatDrawer.classList.remove('active');
            
            // Rengi netleştir
            let chosenColor = localPlayer1Color;
            if (chosenColor === 'random') {
                chosenColor = Math.random() < 0.5 ? 'w' : 'b';
            }
            localPlayer1Color = chosenColor;
            
            // 2 kişilik modda tahta yönü her zaman Beyaz altta olacak şekilde başlar
            orientation = 'w';
            
            lblGameMode.textContent = '2 Oyuncu';
            lblOppName.textContent = localPlayer1Color === 'w' ? '2. Oyuncu (Siyah)' : '2. Oyuncu (Beyaz)';
            oppAvatarIcon.className = 'fa-solid fa-user-ninja';
            lblPlayerName.textContent = localPlayer1Color === 'w' ? '1. Oyuncu (Beyaz)' : '1. Oyuncu (Siyah)';
            
            boardEl.classList.remove('rotated');
            renderBoardSkeleton();
            updatePieces();
            
            updateGameHeader();
            showScreen('game');
        }
    });

    // === 2 KİŞİLİK MOD SEÇENEK BUTONLARI VE ETKİLEŞİMLERİ ===
    btnLocalSame.addEventListener('click', () => {
        playType = 'same';
        btnLocalSame.classList.add('active');
        btnLocalOnline.classList.remove('active');
        cardLocalRotationInfo.classList.remove('hidden');
        cardOnlineStaticInfo.classList.add('hidden');
    });
    
    btnLocalOnline.addEventListener('click', () => {
        playType = 'online';
        btnLocalOnline.classList.add('active');
        btnLocalSame.classList.remove('active');
        cardOnlineStaticInfo.classList.remove('hidden');
        cardLocalRotationInfo.classList.add('hidden');
    });

    btnCancelLobby.addEventListener('click', () => {
        closeConnection();
        showScreen('mainMenu');
    });
    
    btnBackLobby.addEventListener('click', () => {
        closeConnection();
        showScreen('mainMenu');
    });

    if (btnCancelJoining) {
        btnCancelJoining.addEventListener('click', () => {
            closeConnection();
            showScreen('mainMenu');
        });
    }

    btnCopyLink.addEventListener('click', () => {
        txtShareLink.select();
        txtShareLink.setSelectionRange(0, 99999);
        
        try {
            navigator.clipboard.writeText(txtShareLink.value);
            const icon = btnCopyLink.querySelector('i');
            icon.className = 'fa-solid fa-check';
            btnCopyLink.style.borderColor = 'var(--accent-green)';
            btnCopyLink.style.color = 'var(--accent-green)';
            
            setTimeout(() => {
                icon.className = 'fa-solid fa-copy';
                btnCopyLink.style.borderColor = '';
                btnCopyLink.style.color = '';
            }, 2000);
        } catch (err) {
            console.error("Link kopyalama başarısız:", err);
        }
    });

    // === PEERJS (WEBRTC) ÇEVRİMİÇİ BAĞLANTI YÖNETİMİ ===
    function initPeer(isHostRole, joinId = null) {
        closeConnection();
        isHost = isHostRole;
        
        // PeerJS bulut sunucusuna rastgele bir ID ile bağlanırız
        peer = new Peer(undefined, {
            debug: 2
        });
        
        peer.on('open', (id) => {
            if (isHost) {
                // Oda sahibiyse, katılım bağlantısı üret
                const joinLink = `${window.location.origin}${window.location.pathname}?join=${id}`;
                txtShareLink.value = joinLink;
                lblLobbyStatus.textContent = "Oda Hazır!";
                lblWaitingText.textContent = "Rakip bekleniyor...";
            } else {
                // Katılımcıysa, oda sahibine bağlan
                if (joinId) {
                    connectToHost(joinId);
                }
            }
        });
        
        peer.on('connection', (connection) => {
            if (isHost) {
                conn = connection;
                setupConnectionListeners();
            }
        });
        
        peer.on('error', (err) => {
            console.error("PeerJS hatası:", err);
            let errMsg = "Bağlantı esnasında bir hata oluştu.";
            if (err.type === 'peer-not-found') {
                errMsg = "Oda bulunamadı! Bağlantı geçersiz veya oda sahibi ayrılmış olabilir.";
            } else if (err.type === 'network') {
                errMsg = "Ağ hatası! İnternet bağlantınızı kontrol edin.";
            }
            alert(errMsg);
            closeConnection();
            showScreen('mainMenu');
        });
    }

    function connectToHost(hostId) {
        conn = peer.connect(hostId, {
            reliable: true
        });
        setupConnectionListeners();
    }

    function setupConnectionListeners() {
        conn.on('open', () => {
            if (isHost) {
                // Oda sahibi oyunu başlatma paketini gönderir
                let hostColor = localPlayer1Color;
                if (hostColor === 'random') {
                    hostColor = Math.random() < 0.5 ? 'w' : 'b';
                }
                myOnlineColor = hostColor;
                
                // Rakibe rengini haber ver
                conn.send({ type: 'init', hostColor: hostColor });
                
                startOnlineGame();
            }
        });
        
        conn.on('data', (data) => {
            if (!data) return;
            
            if (data.type === 'init') {
                // Katılımcı oyun başlatma paketini aldı
                const hostColor = data.hostColor;
                myOnlineColor = (hostColor === 'w') ? 'b' : 'w';
                startOnlineGame();
            }
            else if (data.type === 'move') {
                // Rakibin hamlesini uygula
                executeMove(data.move);
            }
            else if (data.type === 'chat') {
                // Rakip mesaj yolladı
                addChatMessage('Rakip', data.text, 'other');
                
                // Sohbet kapalıysa uyarı rozetini göster
                if (!chatDrawer.classList.contains('active')) {
                    chatBadge.classList.remove('hidden');
                }
            }
            else if (data.type === 'resign') {
                // Rakip pes etti
                isGameActive = false;
                setTimeout(() => {
                    gameOverTitle.textContent = "Rakip Pes Etti!";
                    gameOverDetail.textContent = "Rakibiniz pes etti. Oyunu kazandınız!";
                    playSound('win');
                    
                    btnPlayAgain.classList.add('hidden');
                    gameOverModal.classList.add('active');
                }, 100);
                closeConnection();
            }
        });
        
        conn.on('close', () => {
            handleDisconnection();
        });
        
        conn.on('error', (err) => {
            console.error("Veri kanalı hatası:", err);
            handleDisconnection();
        });
    }

    function startOnlineGame() {
        initAudio();
        gameMode = 'online';
        isGameActive = true;
        game.reset();
        
        // Sohbeti Sıfırla
        chatMessages.innerHTML = '';
        chatBadge.classList.add('hidden');
        chatDrawer.classList.remove('active');
        
        // Hangi tarafsak o renk altta sabit kalsın (online modda dönme yok)
        playerColor = myOnlineColor;
        orientation = myOnlineColor;
        
        lblGameMode.textContent = 'Çevrimiçi Oyun';
        lblOppName.textContent = myOnlineColor === 'w' ? 'Rakip (Siyah)' : 'Rakip (Beyaz)';
        oppAvatarIcon.className = 'fa-solid fa-user-ninja';
        lblPlayerName.textContent = myOnlineColor === 'w' ? 'Sen (Beyaz)' : 'Sen (Siyah)';
        
        boardEl.classList.remove('rotated');
        renderBoardSkeleton();
        updatePieces();
        
        updateGameHeader();
        showScreen('game');
    }

    function handleDisconnection() {
        if (isGameActive && gameMode === 'online') {
            isGameActive = false;
            setTimeout(() => {
                gameOverTitle.textContent = "Bağlantı Kesildi!";
                gameOverDetail.textContent = "Rakip ile bağlantı koptu veya rakip ayrıldı.";
                playSound('lose');
                
                btnPlayAgain.classList.add('hidden');
                gameOverModal.classList.add('active');
            }, 100);
        }
        closeConnection();
    }

    function closeConnection() {
        if (conn) {
            try { conn.close(); } catch(e) {}
            conn = null;
        }
        if (peer) {
            try { peer.destroy(); } catch(e) {}
            peer = null;
        }
    }

    // === URL KATILIM PARAMETRESİ KONTROLÜ (GUEST GİRİŞİ) ===
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');
    if (joinId) {
        showScreen('joiningLobby');
        initAudio();
        isHost = false;
        
        // URL'yi temizleyerek sayfa yenilendiğinde tekrar katılım denemesini önleriz
        window.history.replaceState({}, document.title, window.location.pathname);
        
        initPeer(false, joinId);
    }

    // === ARAMA / KATILMA BAR GÖREVLERİ ===
    if (btnJoinSearch) {
        btnJoinSearch.addEventListener('click', executeSearchJoin);
        txtJoinSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                executeSearchJoin();
            }
        });
    }

    function executeSearchJoin() {
        let val = txtJoinSearch.value.trim();
        if (!val) return;
        
        txtJoinSearch.value = '';
        
        let peerId = val;
        // Link yapıştırılmışsa join parametresini ayıkla
        if (val.includes('join=')) {
            try {
                const url = new URL(val);
                peerId = url.searchParams.get('join') || val;
            } catch (e) {
                const match = val.match(/join=([^&]+)/);
                if (match) peerId = match[1];
            }
        }
        
        // Odaya bağlanmayı başlat
        showScreen('joiningLobby');
        initAudio();
        isHost = false;
        
        initPeer(false, peerId);
    }

    // === SOHBET (CHAT) MEKANİZMASI ===
    function addChatMessage(sender, text, type) {
        const msgEl = document.createElement('div');
        msgEl.className = `chat-msg ${type}`;
        
        const senderEl = document.createElement('div');
        senderEl.className = 'msg-sender';
        senderEl.textContent = sender;
        
        const textEl = document.createElement('span');
        textEl.textContent = text;
        
        msgEl.appendChild(senderEl);
        msgEl.appendChild(textEl);
        chatMessages.appendChild(msgEl);
        
        // En alta kaydır
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function sendChatMessage() {
        const text = txtChatMessage.value.trim();
        if (!text) return;
        
        txtChatMessage.value = '';
        
        if (gameMode === 'online') {
            const senderName = myOnlineColor === 'w' ? 'Beyaz' : 'Siyah';
            if (conn && conn.open) {
                conn.send({ type: 'chat', text: text, sender: senderName });
            }
            addChatMessage('Sen', text, 'self');
        } else if (gameMode === 'local') {
            // Sıra kimdeyse o gönderici olur
            const senderName = game.turn() === 'w' ? 'Beyaz' : 'Siyah';
            addChatMessage(senderName, text, 'self');
        } else {
            addChatMessage('Sen', text, 'self');
            
            // Yapay zeka modunda eğlenceli robot yanıtı
            if (gameMode === 'ai') {
                setTimeout(() => {
                    const aiReplies = [
                        "İyi hamle! Ama beni yenmek o kadar kolay değil.",
                        "Stratejini beğendim.",
                        "Konsantre oluyorum, sessizlik lütfen!",
                        "Şahımı koruma altına almalıyım.",
                        "Satranç aceleye gelmez."
                    ];
                    const randomReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
                    addChatMessage('Bilgisayar', randomReply, 'other');
                    
                    if (!chatDrawer.classList.contains('active')) {
                        chatBadge.classList.remove('hidden');
                    }
                }, 1000);
            }
        }
    }

    if (btnChatToggle) {
        btnChatToggle.addEventListener('click', () => {
            chatDrawer.classList.toggle('active');
            if (chatDrawer.classList.contains('active')) {
                chatBadge.classList.add('hidden');
                txtChatMessage.focus();
            }
        });
    }

    if (btnCloseChat) {
        btnCloseChat.addEventListener('click', () => {
            chatDrawer.classList.remove('active');
        });
    }

    if (btnSendMessage) {
        btnSendMessage.addEventListener('click', sendChatMessage);
        txtChatMessage.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }

    // Oyun Sonu Yeniden Oyna Butonu
    btnPlayAgain.addEventListener('click', () => {
        gameOverModal.classList.remove('active');
        if (gameMode === 'ai') {
            btnStartAi.click();
        } else {
            btnStartLocal.click();
        }
    });

    // Oyun Sonu Ana Ekrana Dön
    btnGoHome.addEventListener('click', () => {
        showScreen('mainMenu');
    });
});

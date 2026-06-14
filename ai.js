/**
 * Kraliyet Satrancı - Yapay Zeka Motoru (ai.js)
 * Minimax Arama Algoritması, Alpha-Beta Budaması ve Konum Değerlendirme Tabloları
 */

// Taş değerleri (Milipuan cinsinden)
const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

// Konum Değerlendirme Tabloları (Piece-Square Tables - PST)
// Değerler Beyaz perspektifine göredir. Siyah için satırlar ters çevrilir (mirror).
// Pozitif değerler taşın o karede olmasının avantajlı olduğunu gösterir.

const PAWN_PST = [
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
    [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
    [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
    [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
    [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
    [0.5,  1.0, 1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
];

const KNIGHT_PST = [
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
    [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
    [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
    [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
    [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
    [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
    [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
];

const BISHOP_PST = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
    [-1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
    [-1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
    [-1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
    [-1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];

const ROOK_PST = [
    [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [ 0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [ 0.0,   0.0,  0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
];

const QUEEN_PST = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [-0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [ 0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [-1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  0.0,  0.0,  0.5,  0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];

// Açılış / Oyun Ortası Şah Konum Tablosu (Şah Güvenliği için köşe tercih edilir)
const KING_PST = [
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [ 2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0],
    [ 2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0]
];

/**
 * Belirli bir taşın PST tablosundaki değerini alır
 */
function getPiecePstValue(type, color, r, c) {
    let table;
    switch (type) {
        case 'p': table = PAWN_PST; break;
        case 'n': table = KNIGHT_PST; break;
        case 'b': table = BISHOP_PST; break;
        case 'r': table = ROOK_PST; break;
        case 'q': table = QUEEN_PST; break;
        case 'k': table = KING_PST; break;
        default: return 0;
    }
    
    // Beyaz için yukarıdan aşağıya (0-7), Siyah için aşağıdan yukarıya (7-0) indexleme yapılır
    if (color === 'w') {
        return table[r][c] * 10; // Milipuan seviyesine çekmek için 10 ile çarpıyoruz
    } else {
        return table[7 - r][c] * 10;
    }
}

/**
 * Tahtayı değerlendiren fonksiyon.
 * Pozitif değerler Beyaz oyuncunun, negatif değerler Siyah oyuncunun üstün olduğunu belirtir.
 */
function evaluateBoard(board) {
    let score = 0;
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                const type = piece.type;
                const color = piece.color;
                
                let val = PIECE_VALUES[type] + getPiecePstValue(type, color, r, c);
                
                if (color === 'w') {
                    score += val;
                } else {
                    score -= val;
                }
            }
        }
    }
    
    return score;
}

/**
 * Arama hızını optimize etmek amacıyla hamleleri sıralama (Move Ordering) fonksiyonu.
 * Taş almaları ve piyon terfilerini listenin en önüne taşır (Alpha-Beta budamasını hızlandırır).
 */
function orderMoves(moves) {
    return moves.map(move => {
        let score = 0;
        
        // Rakip taş alma hamlelerine yüksek öncelik ver (MVV-LVA: Most Valuable Victim - Least Valuable Aggressor)
        if (move.captured) {
            score = 10 * PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece];
        }
        
        // Piyon terfilerine öncelik ver
        if (move.promotion) {
            score += 900;
        }
        
        // Şah çekme hamlelerini yukarı taşı
        if (move.san && move.san.includes('+')) {
            score += 500;
        }
        
        return { move, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.move);
}

/**
 * Minimax Arama Algoritması (Alpha-Beta Budaması ile)
 */
function minimax(game, depth, alpha, beta, isMaximizing, nodesCount = { val: 0 }) {
    nodesCount.val++;
    
    // Oyun bittiyse veya maksimum derinliğe ulaşıldıysa tahtayı değerlendir
    if (depth === 0 || game.game_over()) {
        // Oyun bitiş durumları için özel değerlendirmeler
        if (game.in_checkmate()) {
            // Şah mat yapılmışsa: Sıra kimdeyse o mat olmuştur.
            // Beyaz mat olmuşsa (Sıra Beyazda): Çok büyük bir negatif değer dön (Siyah kazanır).
            // Siyah mat olmuşsa (Sıra Siyahda): Çok büyük bir pozitif değer dön (Beyaz kazanır).
            return game.turn() === 'w' ? -100000 - depth : 100000 + depth;
        }
        if (game.in_draw()) {
            return 0; // Beraberlik durumunda skor 0
        }
        return evaluateBoard(game.board());
    }
    
    let rawMoves = game.moves({ verbose: true });
    let moves = orderMoves(rawMoves);
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            let evalVal = minimax(game, depth - 1, alpha, beta, false, nodesCount);
            game.undo();
            
            maxEval = Math.max(maxEval, evalVal);
            alpha = Math.max(alpha, evalVal);
            if (beta <= alpha) {
                break; // Beta budaması
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            let evalVal = minimax(game, depth - 1, alpha, beta, true, nodesCount);
            game.undo();
            
            minEval = Math.min(minEval, evalVal);
            beta = Math.min(beta, evalVal);
            if (beta <= alpha) {
                break; // Alpha budaması
            }
        }
        return minEval;
    }
}

/**
 * Yapay Zekanın En İyi Hamlesini Belirler
 * @param {Object} game - chess.js oyun nesnesi
 * @param {string} difficulty - zorluk seviyesi ('easy', 'medium', 'hard', 'impossible')
 * @returns {Object|null} Seçilen hamle nesnesi
 */
function getBestMove(game, difficulty) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    // --- 1. KOLAY MOD ---
    if (difficulty === 'easy') {
        // %50 ihtimalle tamamen rastgele bir hamle yap
        if (Math.random() < 0.5) {
            return moves[Math.floor(Math.random() * moves.length)];
        }
        // Diğer %50 ihtimalle 1 derinlikli en iyi hamleyi yap
        return searchBestMoveAtDepth(game, 1);
    }
    
    // --- 2. ORTA MOD ---
    if (difficulty === 'medium') {
        return searchBestMoveAtDepth(game, 2);
    }
    
    // --- 3. ZOR MOD ---
    if (difficulty === 'hard') {
        return searchBestMoveAtDepth(game, 3);
    }
    
    // --- 4. İMKANSIZ MOD ---
    if (difficulty === 'impossible') {
        // Normal şartlarda derinlik 4 arama yapılır
        return searchBestMoveAtDepth(game, 4);
    }
    
    // Varsayılan olarak rastgele
    return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Belirlenen derinliğe kadar Minimax araması yaparak en iyi hamleyi bulur.
 */
function searchBestMoveAtDepth(game, depth) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    const turn = game.turn();
    const isMaximizing = (turn === 'w');
    
    let bestMove = null;
    let bestValue = isMaximizing ? -Infinity : Infinity;
    
    // Hamleleri önceliklendir (hızlı budama için)
    const ordered = orderMoves(moves);
    
    const nodesCount = { val: 0 };
    const startTime = performance.now();
    
    for (let i = 0; i < ordered.length; i++) {
        const move = ordered[i];
        game.move(move);
        
        // İç düğümlerde isMaximizing değerini tersine çeviriyoruz
        const val = minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing, nodesCount);
        game.undo();
        
        if (isMaximizing) {
            if (val > bestValue) {
                bestValue = val;
                bestMove = move;
            }
        } else {
            if (val < bestValue) {
                bestValue = val;
                bestMove = move;
            }
        }
    }
    
    const duration = (performance.now() - startTime).toFixed(1);
    console.log(`[AI] Derinlik: ${depth} | Hesaplanan Düğüm: ${nodesCount.val} | Süre: ${duration}ms | En İyi Skor: ${bestValue}`);
    
    // Eğer hamle bulunamazsa (hata önleme) ilk hamleyi dön
    return bestMove || moves[0];
}

// Global nesneye aktar
window.ChessAI = {
    getBestMove: getBestMove
};

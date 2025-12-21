// js/ai.js
import { capacity, neighbors } from "./board.js";

// Original evaluation rules: Corners, Edges, and Threats
function evaluateBoard(board, player, rows, cols) {
    let score = 0, myOrbs = 0, enemyOrbs = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = board[y][x];
            if (cell.owner === -1 || cell.isBlocked) continue;
            const cap = capacity(x, y, rows, cols);
            const isCritical = cell.count === cap - 1;
            if (cell.owner === player) {
                myOrbs += cell.count; score += cell.count * 2;
                if (isCritical) {
                    score += 3;
                    if (cap === 2) score += 5; // Corner
                    else if (cap === 3) score += 3; // Edge
                }
            } else {
                enemyOrbs += cell.count;
                if (isCritical) score -= (6 - cap); // Threat detection
            }
        }
    }
    if (myOrbs > 0 && enemyOrbs === 0) return 10000; // Win
    if (myOrbs === 0 && enemyOrbs > 0) return -10000; // Loss
    return score + (Math.random() * 0.5);
}

// Sandbox simulation for "seeing the future"
function simulateBoardState(initialBoard, x, y, who, rows, cols) {
    const clone = initialBoard.map(row => row.map(c => ({ ...c })));
    clone[y][x].owner = who; clone[y][x].count += 1;
    const q = [];
    for (let yy = 0; yy < rows; yy++) 
        for (let xx = 0; xx < cols; xx++) 
            if (!clone[yy][xx].isBlocked && clone[yy][xx].count >= capacity(xx, yy, rows, cols)) q.push([xx, yy]);
    let loops = 0;
    while (q.length && loops++ < 200) {
        const wave = [...new Set(q.map(([x, y]) => `${x},${y}`))].map(s => s.split(",").map(Number));
        q.length = 0;
        for (const [cx, cy] of wave) {
            const cap = capacity(cx, cy, rows, cols); const cell = clone[cy][cx];
            if (cell.count < cap) continue;
            cell.count -= cap; if (cell.count === 0) cell.owner = -1;
            for (const [nx, ny] of neighbors(cx, cy, rows, cols, clone)) {
                clone[ny][nx].owner = who; clone[ny][nx].count += 1;
                if (clone[ny][nx].count >= capacity(nx, ny, rows, cols)) q.push([nx, ny]);
            }
        }
    }
    return clone;
}

// Deep search logic
function minimax(boardState, depth, isMaximizing, aiPlayerIndex, playersLength, rows, cols, alpha, beta) {
    const currentEval = evaluateBoard(boardState, aiPlayerIndex, rows, cols);
    if (Math.abs(currentEval) >= 10000 || depth === 0) return currentEval;
    const currentPlayer = isMaximizing ? aiPlayerIndex : (aiPlayerIndex + 1) % playersLength;
    const moves = [];
    for (let y = 0; y < rows; y++) 
        for (let x = 0; x < cols; x++) 
            if (!boardState[y][x].isBlocked && (boardState[y][x].owner === -1 || boardState[y][x].owner === currentPlayer)) moves.push({ x, y });
    if (moves.length === 0) return currentEval;
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const m of moves) {
            const nextBoard = simulateBoardState(boardState, m.x, m.y, currentPlayer, rows, cols);
            maxEval = Math.max(maxEval, minimax(nextBoard, depth - 1, false, aiPlayerIndex, playersLength, rows, cols, alpha, beta));
            alpha = Math.max(alpha, maxEval); if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const m of moves) {
            const nextBoard = simulateBoardState(boardState, m.x, m.y, currentPlayer, rows, cols);
            minEval = Math.min(minEval, minimax(nextBoard, depth - 1, true, aiPlayerIndex, playersLength, rows, cols, alpha, beta));
            beta = Math.min(beta, minEval); if (beta <= alpha) break;
        }
        return minEval;
    }
}

// Master Move Picker
export function makeAIMove(board, playerIndex, difficulty, rows, cols, playersLength) {
    const valid = [];
    for (let y = 0; y < rows; y++) 
        for (let x = 0; x < cols; x++) 
            if (!board[y][x].isBlocked && (board[y][x].owner === -1 || board[y][x].owner === playerIndex)) valid.push({ x, y });
    if (!valid.length) return null;

    if (difficulty === "easy") return valid[Math.floor(Math.random() * valid.length)];
    
    // Determine depth: God-Mode for hints
    let depth = (difficulty === "hard") ? 2 : 1;
    if (difficulty === "hint") {
        const occupancy = board.flat().filter(c => c.owner !== -1).length / (rows * cols);
        depth = (occupancy > 0.8) ? 5 : 2; // Desperation win logic
    }

    let bestMove = null, bestVal = -Infinity;
    valid.sort(() => Math.random() - 0.5);
    for (const m of valid) {
        const nextBoard = simulateBoardState(board, m.x, m.y, playerIndex, rows, cols);
        const val = (depth > 1) ? minimax(nextBoard, depth - 1, false, playerIndex, playersLength, rows, cols, -Infinity, Infinity) : evaluateBoard(nextBoard, playerIndex, rows, cols);
        if (val > bestVal) { bestVal = val; bestMove = m; }
    }
    return bestMove || valid[0];
}
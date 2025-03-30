"use strict";
const int = Math.round;
const str = (n) => n.toString();
const abs = Math.abs;
const rnd = (max) => Math.floor(Math.random() * max);
const boardSize = 8;
const maxDepth = 4;
class Move {
    constructor(index, dx, dy) {
        this.index = 0;
        this.dx = 0;
        this.dy = 0;
        this.index = index;
        this.dx = dx;
        this.dy = dy;
    }
}
const white = "white";
const black = "black";
// Returns the opposite color
function opposite(color) {
    return color == white ? black : white;
}
// Single stone
class Stone {
    constructor(x, y, color) {
        this.color = ""; // stone color
        this.x = 0;
        this.y = 0; // stone position
        this.x = x;
        this.y = y;
        this.color = color;
    }
}
class Checkers {
    constructor() {
        this.stones = [];
        this.selectedStone = null;
        this.currentTurn = white;
        this.reset();
    }
    reset() {
        this.stones = [];
        // Place stones
        for (let row = 0; row < 3; row++) {
            for (let col = row % 2; col < boardSize; col += 2) {
                this.stones.push(new Stone(col, row, black));
                this.stones.push(new Stone(boardSize - col - 1, boardSize - row - 1, white));
            }
        }
    }
    setupInput(gameElement) {
        gameElement.addEventListener("click", (e) => {
            if (this.currentTurn !== white)
                return;
            const target = e.target;
            const col = parseInt(target.style.gridColumnStart) - 1;
            const row = parseInt(target.style.gridRowStart) - 1;
            if (isNaN(col) || isNaN(row))
                return;
            const clickedStone = this.stones.find(s => s.x === col && s.y === row);
            if (this.selectedStone === null) {
                // Select a white stone
                if (clickedStone && clickedStone.color === white) {
                    this.selectedStone = clickedStone;
                    this.drawTo(gameElement); // Optional: could highlight selected
                }
            }
            else {
                // Attempt to move to the clicked square
                const legalMoves = this.getMoves(this.stones, this.selectedStone);
                const selectedIndex = this.stones.indexOf(this.selectedStone);
                const move = legalMoves.find(m => {
                    const stone = this.stones[selectedIndex];
                    const targetX = stone.x + m.dx;
                    const targetY = stone.y + m.dy;
                    return targetX === col && targetY === row;
                });
                if (move) {
                    this.moveStone(this.stones, move);
                    this.currentTurn = black;
                    this.selectedStone = null;
                    this.drawTo(gameElement);
                    setTimeout(() => {
                        this.playBlacks();
                        this.currentTurn = white;
                        this.drawTo(gameElement);
                    }, 300); // delay for realism
                }
                else {
                    // Invalid move, clear selection
                    this.selectedStone = null;
                    this.drawTo(gameElement);
                }
            }
        });
    }
    drawTo(gameField) {
        gameField.innerHTML = "";
        // Draw black squares
        for (let row = 0; row < boardSize; row++) {
            for (let col = row % 2; col < boardSize; col += 2) {
                const tag = document.createElement("div");
                tag.style.gridRowStart = str(row + 1);
                tag.style.gridColumnStart = str(col + 1);
                tag.classList.add("square");
                gameField.appendChild(tag);
            }
        }
        // Draw pieces
        for (const stone of this.stones) {
            const tag = document.createElement("div");
            tag.style.gridRowStart = str(stone.y + 1);
            tag.style.gridColumnStart = str(stone.x + 1);
            tag.classList.add(stone.color == white ? "white" : "black");
            gameField.appendChild(tag);
            // Highlight user selected stone
            if (this.selectedStone && stone === this.selectedStone) {
                tag.classList.add("selected");
            }
        }
    }
    deepCopy(stones) {
        return stones.map(s => new Stone(s.x, s.y, s.color));
    }
    moveStone(stones, move) {
        const stone = stones[move.index];
        stone.x += move.dx;
        stone.y += move.dy;
        // Handle capture
        if (abs(move.dx) === 2 && abs(move.dy) === 2) {
            const middleX = stone.x - move.dx / 2;
            const middleY = stone.y - move.dy / 2;
            // Remove the captured stone
            const capturedIndex = stones.findIndex(s => s.x === middleX && s.y === middleY && s.color !== stone.color);
            if (capturedIndex !== -1) {
                stones.splice(capturedIndex, 1);
            }
        }
    }
    // Simply the difference in stones of different color
    evaluateBoard(stones, color) {
        let count = 0;
        for (let stone of stones)
            stone.color == color ? count++ : count--;
        return count;
    }
    // Check if a move is legal
    isLegalMove(stones, move) {
        const targetX = stones[move.index].x + move.dx;
        const targetY = stones[move.index].y + move.dy;
        // Ensure the move stays within the board boundaries
        if (targetX < 0 || targetX >= boardSize || targetY < 0 || targetY >= boardSize) {
            return false;
        }
        // Check if it's a capture move
        if (Math.abs(move.dx) === 2 && Math.abs(move.dy) === 2) {
            const middleX = stones[move.index].x + move.dx / 2;
            const middleY = stones[move.index].y + move.dy / 2;
            // Ensure the middle square has an opponent's stone
            const opponentColor = stones[move.index].color === white ? black : white;
            const middleStone = stones.find(s => s.x === middleX && s.y === middleY && s.color === opponentColor);
            // Ensure the target square is empty
            const targetSquareEmpty = !stones.some(s => s.x === targetX && s.y === targetY);
            return middleStone !== undefined && targetSquareEmpty;
        }
        // Normal move: Ensure the target square is not occupied
        return !stones.some(s => s.x === targetX && s.y === targetY);
    }
    // Return an array of all legal moves, including capture moves
    getMoves(stones, stone) {
        const moves = [];
        const dx = [1, -1];
        const dy = stone.color === white ? [-1] : [1];
        // Check all possible moves (normal and capture)
        for (let x of dx) {
            for (let y of dy) {
                // Check normal move
                const normalMove = new Move(stones.indexOf(stone), x, y);
                if (this.isLegalMove(stones, normalMove))
                    moves.push(normalMove);
                // Capture move
                const captureMove = new Move(stones.indexOf(stone), x * 2, y * 2);
                if (this.isLegalMove(stones, captureMove))
                    moves.push(captureMove);
            }
        }
        return moves;
    }
    // Returns [value, move]
    exploreMove(stones, move, color, depth) {
        // Base case: stop recursion
        if (depth >= maxDepth)
            return [this.evaluateBoard(stones, color), null];
        // Apply the move if given (skip this at the root level)
        if (move != null)
            this.moveStone(stones, move);
        let bestValue = (color === black) ? -Infinity : Infinity;
        let bestMove = null;
        for (let stone of stones)
            if (stone.color == color)
                for (let move of this.getMoves(stones, stone)) {
                    let [value,] = this.exploreMove(this.deepCopy(stones), move, opposite(color), depth + 1);
                    if (color === black && value > bestValue) {
                        bestValue = value;
                        bestMove = move;
                    }
                    else if (color === white && value < bestValue) {
                        bestValue = value;
                        bestMove = move;
                    }
                }
        // Edge case: no valid moves
        if (bestMove == null)
            return [this.evaluateBoard(stones, color), null];
        // Otherwise return the best move
        return [bestValue || 0, bestMove];
    }
    play(color) {
        let [_, bestMove] = this.exploreMove(this.deepCopy(this.stones), null, color, 0);
        if (bestMove != null)
            this.moveStone(this.stones, bestMove);
    }
    playWhites() {
        this.play(white);
    }
    playBlacks() {
        this.play(black);
    }
    autoPlay(game) {
        let currentTurn = white;
        setInterval(() => {
            if (currentTurn == white) {
                this.playWhites();
                currentTurn = black;
            }
            else {
                this.playBlacks();
                currentTurn = white;
            }
            this.drawTo(game);
        }, 1000 / 10);
    }
}
const checkers = new Checkers();
const game = document.getElementById("game");
checkers.drawTo(game);
checkers.setupInput(game);
//# sourceMappingURL=checkers.js.map
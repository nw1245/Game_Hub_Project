const gameTitle = document.querySelector("#gameTitle");
const gameStatus = document.querySelector("#gameStatus");
const gameScore = document.querySelector("#gameScore");
const cards = [...document.querySelectorAll("[data-select-game]")];
const views = [...document.querySelectorAll("[data-game-view]")];
const controlButtons = [...document.querySelectorAll("[data-control]")];
const navLinks = [...document.querySelectorAll(".top-nav a")];

let activeGame = "tetris";

const gameCopy = {
  tetris: {
    title: "Tetris",
    status: "Arrow keys or buttons to move. Clear lines to score."
  },
  snake: {
    title: "Snake",
    status: "Arrow keys or buttons to steer. Space pauses."
  },
  tictactoe: {
    title: "Tic-Tac-Toe",
    status: "Take turns placing marks. First line wins."
  },
  wordle: {
    title: "Wordle",
    status: "Type a five-letter word. Enter locks the row."
  }
};

function selectGame(game) {
  activeGame = game;
  cards.forEach((card) => card.classList.toggle("active-card", card.dataset.selectGame === game));
  views.forEach((view) => view.classList.toggle("current", view.dataset.gameView === game));
  gameTitle.textContent = gameCopy[game].title;
  gameStatus.textContent = gameCopy[game].status;
  updateScore();
}

cards.forEach((card) => {
  card.addEventListener("mouseenter", () => selectGame(card.dataset.selectGame));
  card.addEventListener("focus", () => selectGame(card.dataset.selectGame));
  card.addEventListener("click", () => selectGame(card.dataset.selectGame));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const game = link.dataset.navGame;
    if (gameCopy[game]) selectGame(game);
  });
});

window.addEventListener("hashchange", () => {
  const game = window.location.hash.slice(1);
  if (gameCopy[game]) selectGame(game);
});

function updateScore() {
  if (activeGame === "tetris") {
    gameScore.textContent = `Score ${tetris.score}`;
  } else if (activeGame === "snake") {
    gameScore.textContent = `Score ${snake.score}`;
  } else if (activeGame === "wordle") {
    gameScore.textContent = wordle.done ? wordle.message : `Guess ${wordle.row + 1}/6`;
  } else {
    gameScore.textContent = tic.winner ? tic.winner : "Score -";
  }
}

const tetrisCanvas = document.querySelector("#tetrisBoard");
const tetrisCtx = tetrisCanvas.getContext("2d");
const nextCanvas = document.querySelector("#nextPiece");
const nextCtx = nextCanvas.getContext("2d");
const block = 20;
const cols = 12;
const rows = 20;

const pieces = [
  { color: "#29f4ff", shape: [[1, 1, 1, 1]] },
  { color: "#ffe45c", shape: [[1, 1], [1, 1]] },
  { color: "#ff3df2", shape: [[0, 1, 0], [1, 1, 1]] },
  { color: "#76ff52", shape: [[0, 1, 1], [1, 1, 0]] },
  { color: "#ff4d6d", shape: [[1, 1, 0], [0, 1, 1]] },
  { color: "#ff9f1c", shape: [[1, 0, 0], [1, 1, 1]] },
  { color: "#8ea5ff", shape: [[0, 0, 1], [1, 1, 1]] }
];

function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function randomPiece() {
  const template = pieces[Math.floor(Math.random() * pieces.length)];
  return {
    shape: cloneMatrix(template.shape),
    color: template.color,
    x: 4,
    y: 0
  };
}

const tetris = {
  board: Array.from({ length: rows }, () => Array(cols).fill(null)),
  piece: randomPiece(),
  next: randomPiece(),
  score: 0,
  dropCounter: 0,
  dropInterval: 650,
  lastTime: 0,
  over: false
};

function rotate(matrix) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function tetrisCollision(piece, offsetX = 0, offsetY = 0, shape = piece.shape) {
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;
      const boardX = piece.x + x + offsetX;
      const boardY = piece.y + y + offsetY;
      if (boardX < 0 || boardX >= cols || boardY >= rows) return true;
      if (boardY >= 0 && tetris.board[boardY][boardX]) return true;
    }
  }
  return false;
}

function mergePiece() {
  tetris.piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        const boardY = tetris.piece.y + y;
        if (boardY >= 0) tetris.board[boardY][tetris.piece.x + x] = tetris.piece.color;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;
  for (let y = rows - 1; y >= 0; y -= 1) {
    if (tetris.board[y].every(Boolean)) {
      tetris.board.splice(y, 1);
      tetris.board.unshift(Array(cols).fill(null));
      cleared += 1;
      y += 1;
    }
  }
  if (cleared) {
    tetris.score += [0, 100, 260, 500, 800][cleared];
    tetris.dropInterval = Math.max(240, tetris.dropInterval - cleared * 18);
  }
}

function spawnPiece() {
  tetris.piece = tetris.next;
  tetris.piece.x = 4;
  tetris.piece.y = 0;
  tetris.next = randomPiece();
  if (tetrisCollision(tetris.piece)) {
    tetris.over = true;
    gameStatus.textContent = "Tetris locked out. Restart the cabinet.";
  }
}

function tetrisMove(dx) {
  if (!tetris.over && !tetrisCollision(tetris.piece, dx, 0)) tetris.piece.x += dx;
}

function tetrisDrop() {
  if (tetris.over) return;
  if (!tetrisCollision(tetris.piece, 0, 1)) {
    tetris.piece.y += 1;
  } else {
    mergePiece();
    clearLines();
    spawnPiece();
  }
  tetris.dropCounter = 0;
  updateScore();
}

function tetrisRotate() {
  if (tetris.over) return;
  const nextShape = rotate(tetris.piece.shape);
  if (!tetrisCollision(tetris.piece, 0, 0, nextShape)) {
    tetris.piece.shape = nextShape;
  } else if (!tetrisCollision(tetris.piece, -1, 0, nextShape)) {
    tetris.piece.x -= 1;
    tetris.piece.shape = nextShape;
  } else if (!tetrisCollision(tetris.piece, 1, 0, nextShape)) {
    tetris.piece.x += 1;
    tetris.piece.shape = nextShape;
  }
}

function hardDrop() {
  if (tetris.over) return;
  while (!tetrisCollision(tetris.piece, 0, 1)) {
    tetris.piece.y += 1;
    tetris.score += 2;
  }
  tetrisDrop();
}

function drawBlock(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x, y, size, 3);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x, y + size - 4, size, 4);
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

function drawTetris() {
  tetrisCtx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
  tetrisCtx.fillStyle = "#050712";
  tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
  tetrisCtx.strokeStyle = "rgba(41, 244, 255, 0.12)";
  for (let x = 0; x <= cols; x += 1) {
    tetrisCtx.beginPath();
    tetrisCtx.moveTo(x * block, 0);
    tetrisCtx.lineTo(x * block, tetrisCanvas.height);
    tetrisCtx.stroke();
  }
  for (let y = 0; y <= rows; y += 1) {
    tetrisCtx.beginPath();
    tetrisCtx.moveTo(0, y * block);
    tetrisCtx.lineTo(tetrisCanvas.width, y * block);
    tetrisCtx.stroke();
  }
  tetris.board.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color) drawBlock(tetrisCtx, x * block, y * block, block, color);
    });
  });
  tetris.piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) drawBlock(tetrisCtx, (tetris.piece.x + x) * block, (tetris.piece.y + y) * block, block, tetris.piece.color);
    });
  });

  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextCtx.fillStyle = "#0b0f1d";
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const size = 18;
  const startX = (nextCanvas.width - tetris.next.shape[0].length * size) / 2;
  const startY = (nextCanvas.height - tetris.next.shape.length * size) / 2;
  tetris.next.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) drawBlock(nextCtx, startX + x * size, startY + y * size, size, tetris.next.color);
    });
  });
}

function restartTetris() {
  tetris.board = Array.from({ length: rows }, () => Array(cols).fill(null));
  tetris.piece = randomPiece();
  tetris.next = randomPiece();
  tetris.score = 0;
  tetris.dropInterval = 650;
  tetris.over = false;
  gameStatus.textContent = gameCopy.tetris.status;
  updateScore();
}

function tetrisLoop(time = 0) {
  const delta = time - tetris.lastTime;
  tetris.lastTime = time;
  if (activeGame === "tetris") {
    tetris.dropCounter += delta;
    if (tetris.dropCounter > tetris.dropInterval) tetrisDrop();
  }
  drawTetris();
  requestAnimationFrame(tetrisLoop);
}

const snakeCanvas = document.querySelector("#snakeBoard");
const snakeCtx = snakeCanvas.getContext("2d");
const snakeBest = document.querySelector("#snakeBest");
const snakeSize = 18;
const snakeCells = 20;
const snake = {
  body: [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }],
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  food: { x: 14, y: 10 },
  score: 0,
  best: 0,
  tick: 0,
  speed: 115,
  paused: false,
  over: false
};

function placeFood() {
  do {
    snake.food = {
      x: Math.floor(Math.random() * snakeCells),
      y: Math.floor(Math.random() * snakeCells)
    };
  } while (snake.body.some((part) => part.x === snake.food.x && part.y === snake.food.y));
}

function setSnakeDirection(x, y) {
  if (snake.dir.x + x === 0 && snake.dir.y + y === 0) return;
  snake.nextDir = { x, y };
}

function snakeStep() {
  if (snake.paused || snake.over) return;
  snake.dir = snake.nextDir;
  const head = {
    x: snake.body[0].x + snake.dir.x,
    y: snake.body[0].y + snake.dir.y
  };
  const hitWall = head.x < 0 || head.x >= snakeCells || head.y < 0 || head.y >= snakeCells;
  const hitSelf = snake.body.some((part) => part.x === head.x && part.y === head.y);
  if (hitWall || hitSelf) {
    snake.over = true;
    snake.best = Math.max(snake.best, snake.score);
    snakeBest.textContent = snake.best;
    if (activeGame === "snake") gameStatus.textContent = "Snake crashed. Restart for another run.";
    return;
  }
  snake.body.unshift(head);
  if (head.x === snake.food.x && head.y === snake.food.y) {
    snake.score += 10;
    snake.speed = Math.max(70, snake.speed - 2);
    placeFood();
  } else {
    snake.body.pop();
  }
  updateScore();
}

function drawSnake() {
  snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
  snakeCtx.fillStyle = "#050712";
  snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
  snakeCtx.strokeStyle = "rgba(41, 244, 255, 0.11)";
  for (let i = 0; i <= snakeCells; i += 1) {
    snakeCtx.beginPath();
    snakeCtx.moveTo(i * snakeSize, 0);
    snakeCtx.lineTo(i * snakeSize, snakeCanvas.height);
    snakeCtx.stroke();
    snakeCtx.beginPath();
    snakeCtx.moveTo(0, i * snakeSize);
    snakeCtx.lineTo(snakeCanvas.width, i * snakeSize);
    snakeCtx.stroke();
  }
  drawBlock(snakeCtx, snake.food.x * snakeSize, snake.food.y * snakeSize, snakeSize, "#ff3df2");
  snake.body.forEach((part, index) => {
    drawBlock(snakeCtx, part.x * snakeSize, part.y * snakeSize, snakeSize, index === 0 ? "#ffe45c" : "#76ff52");
  });
}

function restartSnake() {
  snake.body = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
  snake.dir = { x: 1, y: 0 };
  snake.nextDir = { x: 1, y: 0 };
  snake.score = 0;
  snake.speed = 115;
  snake.paused = false;
  snake.over = false;
  placeFood();
  gameStatus.textContent = gameCopy.snake.status;
  updateScore();
}

function snakeLoop(time = 0) {
  if (activeGame === "snake" && time - snake.tick > snake.speed) {
    snake.tick = time;
    snakeStep();
  }
  drawSnake();
  requestAnimationFrame(snakeLoop);
}

const ticButtons = [...document.querySelectorAll(".tic-board button")];
const ticTurn = document.querySelector("#ticTurn");
const tic = {
  board: Array(9).fill(""),
  turn: "X",
  winner: ""
};

const wins = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function findTicWinner() {
  for (const [a, b, c] of wins) {
    if (tic.board[a] && tic.board[a] === tic.board[b] && tic.board[a] === tic.board[c]) {
      return `${tic.board[a]} wins`;
    }
  }
  return tic.board.every(Boolean) ? "Draw" : "";
}

function renderTic() {
  ticButtons.forEach((button, index) => {
    button.textContent = tic.board[index];
    button.className = tic.board[index].toLowerCase();
  });
  ticTurn.textContent = tic.winner || tic.turn;
  updateScore();
}

function playTic(index) {
  if (tic.board[index] || tic.winner) return;
  tic.board[index] = tic.turn;
  tic.winner = findTicWinner();
  if (!tic.winner) tic.turn = tic.turn === "X" ? "O" : "X";
  if (activeGame === "tictactoe") {
    gameStatus.textContent = tic.winner || `${tic.turn}'s turn.`;
  }
  renderTic();
}

function restartTic() {
  tic.board = Array(9).fill("");
  tic.turn = "X";
  tic.winner = "";
  gameStatus.textContent = gameCopy.tictactoe.status;
  renderTic();
}

ticButtons.forEach((button, index) => {
  button.addEventListener("click", () => playTic(index));
});

const wordleBoard = document.querySelector("#wordleBoard");
const wordleKeyboard = document.querySelector("#wordleKeyboard");
const wordleTurn = document.querySelector("#wordleTurn");
const wordleAnswers = [
  "crane", "pixel", "laser", "orbit", "quest", "stack", "snake", "trace",
  "level", "shift", "vivid", "power", "ghost", "spark", "logic", "brave",
  "crown", "flame", "phase", "retro", "press", "block", "neons", "grids"
];
const wordleAllowed = new Set([
  ...wordleAnswers,
  "about", "after", "alert", "audio", "beach", "brain", "candy", "chair",
  "dream", "eager", "earth", "field", "frame", "games", "giant", "heart",
  "house", "input", "jelly", "knife", "light", "magic", "music", "night",
  "other", "party", "plant", "point", "radio", "river", "score", "sound",
  "story", "timer", "tower", "train", "water", "world", "young"
]);
const keyRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const keyRank = { absent: 1, present: 2, correct: 3 };
const wordle = {
  answer: "",
  guesses: Array.from({ length: 6 }, () => Array(5).fill("")),
  marks: Array.from({ length: 6 }, () => Array(5).fill("")),
  row: 0,
  col: 0,
  done: false,
  message: ""
};

function pickWordleAnswer() {
  return wordleAnswers[Math.floor(Math.random() * wordleAnswers.length)].toUpperCase();
}

function buildWordle() {
  wordleBoard.innerHTML = "";
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const tile = document.createElement("span");
      tile.className = "wordle-tile";
      tile.setAttribute("aria-label", `Guess ${row + 1}, letter ${col + 1}`);
      wordleBoard.append(tile);
    }
  }

  wordleKeyboard.innerHTML = "";
  keyRows.forEach((letters, index) => {
    const row = document.createElement("div");
    row.className = "wordle-key-row";
    if (index === 2) row.append(createWordleKey("Enter", "enter"));
    [...letters].forEach((letter) => row.append(createWordleKey(letter, letter)));
    if (index === 2) row.append(createWordleKey("Del", "backspace"));
    wordleKeyboard.append(row);
  });
}

function createWordleKey(label, value) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.wordleKey = value;
  button.setAttribute("aria-label", label === "Del" ? "Delete" : label);
  return button;
}

function renderWordle() {
  const tiles = [...wordleBoard.querySelectorAll(".wordle-tile")];
  tiles.forEach((tile, index) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const letter = wordle.guesses[row][col];
    const mark = wordle.marks[row][col];
    tile.textContent = letter;
    tile.className = `wordle-tile${letter ? " filled" : ""}${mark ? ` ${mark}` : ""}`;
  });
  wordleTurn.textContent = wordle.done ? "--" : `${wordle.row + 1}/6`;
  updateScore();
}

function markWordleGuess(guess) {
  const answer = [...wordle.answer];
  const result = Array(5).fill("absent");
  [...guess].forEach((letter, index) => {
    if (letter === answer[index]) {
      result[index] = "correct";
      answer[index] = "";
    }
  });
  [...guess].forEach((letter, index) => {
    if (result[index] === "correct") return;
    const found = answer.indexOf(letter);
    if (found !== -1) {
      result[index] = "present";
      answer[found] = "";
    }
  });
  return result;
}

function colorWordleKeys(guess, marks) {
  guess.split("").forEach((letter, index) => {
    const button = wordleKeyboard.querySelector(`[data-wordle-key="${letter}"]`);
    const next = marks[index];
    const current = ["correct", "present", "absent"].find((name) => button.classList.contains(name));
    if (!current || keyRank[next] > keyRank[current]) {
      button.classList.remove("correct", "present", "absent");
      button.classList.add(next);
    }
  });
}

function submitWordleGuess() {
  if (wordle.done) return;
  if (wordle.col < 5) {
    gameStatus.textContent = "Need five letters before the signal locks.";
    return;
  }
  const guess = wordle.guesses[wordle.row].join("");
  if (!wordleAllowed.has(guess.toLowerCase())) {
    gameStatus.textContent = "Not in the signal bank. Try another word.";
    return;
  }
  const marks = markWordleGuess(guess);
  wordle.marks[wordle.row] = marks;
  colorWordleKeys(guess, marks);
  if (guess === wordle.answer) {
    wordle.done = true;
    wordle.message = "Solved";
    gameStatus.textContent = `Solved in ${wordle.row + 1}.`;
  } else if (wordle.row === 5) {
    wordle.done = true;
    wordle.message = wordle.answer;
    gameStatus.textContent = `Signal lost. Word was ${wordle.answer}.`;
  } else {
    wordle.row += 1;
    wordle.col = 0;
    gameStatus.textContent = "Next row armed.";
  }
  renderWordle();
}

function typeWordleLetter(letter) {
  if (wordle.done || wordle.col >= 5) return;
  wordle.guesses[wordle.row][wordle.col] = letter.toUpperCase();
  wordle.col += 1;
  renderWordle();
}

function deleteWordleLetter() {
  if (wordle.done || wordle.col === 0) return;
  wordle.col -= 1;
  wordle.guesses[wordle.row][wordle.col] = "";
  renderWordle();
}

function pressWordleKey(value) {
  if (value === "enter") submitWordleGuess();
  if (value === "backspace") deleteWordleLetter();
  if (/^[a-z]$/i.test(value)) typeWordleLetter(value);
}

function restartWordle() {
  wordle.answer = pickWordleAnswer();
  wordle.guesses = Array.from({ length: 6 }, () => Array(5).fill(""));
  wordle.marks = Array.from({ length: 6 }, () => Array(5).fill(""));
  wordle.row = 0;
  wordle.col = 0;
  wordle.done = false;
  wordle.message = "";
  wordleKeyboard.querySelectorAll("button").forEach((button) => {
    button.classList.remove("correct", "present", "absent");
  });
  gameStatus.textContent = gameCopy.wordle.status;
  renderWordle();
}

wordleKeyboard.addEventListener("click", (event) => {
  const button = event.target.closest("[data-wordle-key]");
  if (button) pressWordleKey(button.dataset.wordleKey);
});

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const wordleKey = activeGame === "wordle" && (key === "enter" || key === "backspace" || /^[a-z]$/.test(key));
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "enter"].includes(key) || wordleKey) {
    event.preventDefault();
  }
  if (activeGame === "tetris") {
    if (key === "arrowleft") tetrisMove(-1);
    if (key === "arrowright") tetrisMove(1);
    if (key === "arrowdown") tetrisDrop();
    if (key === "arrowup") tetrisRotate();
    if (key === " " || key === "enter") hardDrop();
  }
  if (activeGame === "snake") {
    if (key === "arrowleft") setSnakeDirection(-1, 0);
    if (key === "arrowright") setSnakeDirection(1, 0);
    if (key === "arrowup") setSnakeDirection(0, -1);
    if (key === "arrowdown") setSnakeDirection(0, 1);
    if (key === " ") snake.paused = !snake.paused;
  }
  if (activeGame === "wordle") {
    pressWordleKey(key);
  }
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const control = button.dataset.control;
    if (activeGame === "tetris") {
      if (control === "left") tetrisMove(-1);
      if (control === "right") tetrisMove(1);
      if (control === "down") tetrisDrop();
      if (control === "up") tetrisRotate();
      if (control === "action") hardDrop();
    }
    if (activeGame === "snake") {
      if (control === "left") setSnakeDirection(-1, 0);
      if (control === "right") setSnakeDirection(1, 0);
      if (control === "up") setSnakeDirection(0, -1);
      if (control === "down") setSnakeDirection(0, 1);
      if (control === "action") snake.paused = !snake.paused;
    }
  });
});

document.querySelector("[data-action='restart-tetris']").addEventListener("click", restartTetris);
document.querySelector("[data-action='restart-snake']").addEventListener("click", restartSnake);
document.querySelector("[data-action='restart-tic']").addEventListener("click", restartTic);
document.querySelector("[data-action='restart-wordle']").addEventListener("click", restartWordle);

buildWordle();
restartWordle();
selectGame(gameCopy[window.location.hash.slice(1)] ? window.location.hash.slice(1) : "tetris");
tetrisLoop();
snakeLoop();
renderTic();

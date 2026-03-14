// ---- Puzzle Model ----

const CellState = {
  EMPTY: 0,
  WILL_BLOCK: 0.5,
  BLOCKED: 1,
  QUEEN: 2,
  EVIL_QUEEN: 3,
};

let puzzle = {
    scale: 8,
    cellStates: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    cellRegionIds: [3,7,0,1,4,6,6,6,3,7,0,1,4,4,6,6,3,7,0,1,1,5,5,6,3,7,0,0,5,5,6,6,3,7,7,5,5,5,6,6,3,3,2,5,5,5,5,5,2,2,2,2,2,5,5,2,2,2,2,2,2,2,2,2],
    regionColors: ["96beff","b3dfa0","b9b29e","bba3e2","dddddd","e4f186","fd7b60","ffc992"],
    border: "000000"
}
let isDragging = false;

// ---- Initialization ----

function configurePuzzle(scale, cellRegionIds, regionColors, border) {
  puzzle.scale = scale;
  puzzle.cellStates = Array(scale ** 2).fill(CellState.EMPTY);
  puzzle.cellRegionIds = cellRegionIds;
  puzzle.regionColors = regionColors;
  puzzle.border = border;
}

function index(x, y) {
  return y * puzzle.scale + x;
}

// ---- Utility Functions ----

function isBlocked(index, p) {
  if (p.cellStates[index] === CellState.BLOCKED) return true;
  const [x,y] = indexToXY(index);
  for (let i = 0; i < p.scale; i++) {
    if(i!==x && p.cellStates[y*p.scale+i] === CellState.QUEEN) return true;
    if(i!==y && p.cellStates[i*p.scale+x] === CellState.QUEEN) return true;
  }
  for (let i = 0; i < 4; i++) {
    const oX = x+(Math.floor(i/2)*2)-1, oY = y+(i%2*2)-1;
    if(oX >= 0 && oX < p.scale
      && oY >= 0 && oY < p.scale
      && p.cellStates[oY*p.scale+oX] === CellState.QUEEN
    ) return true;
  }
  return p.cellRegionIds.some(
    (val, i) => 
      i !== index
      && val === p.cellRegionIds[index]
      && p.cellStates[i] === CellState.QUEEN
  );
}

const deepCopy = (x) => JSON.parse(JSON.stringify(x));

function isBlockedUp(p) {
  const blockedSet = p.cellStates.map((_, a) => isBlocked(a, p));
  const validCellCount = {};
  blockedSet.forEach((val, i) => {
    const [x, y] = indexToXY(i);
    validCellCount['col' + x] = (validCellCount['col' + x] ?? 0) + (val ? 0 : 1);
    validCellCount['row' + y] = (validCellCount['row' + y] ?? 0) + (val ? 0 : 1);
    const key = 'reg' + p.cellRegionIds[i];
    validCellCount[key] = (validCellCount[key] ?? 0) + (val ? 0 : 1);
  });
  return Object.values(validCellCount).some(a => a === 0);
}

function isValid(p) {
  const found = {};
  if (p.cellStates.some((state, i) => {
    if (state === CellState.QUEEN) {
      const [x,y] = indexToXY(i);
      if(
        found['col'+x]
        || found['row'+y]
        || found['reg'+p.cellRegionIds[i]]
        || (y>0 && (
          (x>0 && p.cellStates[i-p.scale-1] === CellState.QUEEN)
          || (x<(p.scale-1) && p.cellStates[i-p.scale+1] === CellState.QUEEN)
        ))
      ) {
        return true;
      }
      found['col'+x] = found['row'+y] = found['reg'+p.cellRegionIds[i]] = true;
    }
  })) {
    return false;
  };
  return !isBlockedUp(p);
}

function enoughQueens(p) {
  return p.cellStates.reduce((sum, state) => sum + (state===CellState.QUEEN), 0) === p.scale;
}

function indexToXY(i) {
  return [i%puzzle.scale, Math.floor(i/puzzle.scale)];
}

// ---- Rendering ----

function renderBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${puzzle.scale}, 40px)`;
  document.getElementById("board").style.backgroundColor = "#" + puzzle.border;
  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  for (let y = 0; y < puzzle.scale; y++) {
    for (let x = 0; x < puzzle.scale; x++) {
      const i = index(x, y);
      const cell = document.createElement("div");

      cell.classList.add("cell");
      cell.dataset.index = i;
      cell.style.setProperty(
        "--bg-color",
        `#${puzzle.regionColors[puzzle.cellRegionIds[i]]}`,
      );
      setBorders(cell, x, y);

      applyCellState(cell, +isBlocked(index(x,y), puzzle) | puzzle.cellStates[i]);

      cell.addEventListener("mousedown", () => {
        isDragging = true;
      });
      cell.addEventListener("mouseup", () => {
        cycleCell(i);
        puzzle.cellStates = puzzle.cellStates.map(Math.round);
        rerender(puzzle);
      });
      const addWillBlock = () => {
        if (puzzle.cellStates[i] === CellState.EMPTY && isDragging) {
          setCell(i, CellState.WILL_BLOCK);
        }
      }
      cell.addEventListener("mouseleave", addWillBlock);
      cell.addEventListener("mouseenter", addWillBlock);

      board.appendChild(cell);
    }
  }
}

function setBorders(cell, x, y) {
  if (x === 0) {
    cell.classList.add("left-edge");
  }
  if (y === 0) {
    cell.classList.add("top-edge");
  }
  if (
    x + 1 >= puzzle.scale ||
    puzzle.cellRegionIds[index(x, y)] !== puzzle.cellRegionIds[index(x + 1, y)]
  ) {
    cell.classList.add("unlike-right");
  }
  if (
    x - 1 < 0 ||
    puzzle.cellRegionIds[index(x, y)] !== puzzle.cellRegionIds[index(x - 1, y)]
  ) {
    cell.classList.add("unlike-left");
  }
  if (
    y - 1 < 0 ||
    puzzle.cellRegionIds[index(x, y)] !== puzzle.cellRegionIds[index(x, y - 1)]
  ) {
    cell.classList.add("unlike-top");
  }
  if (
    y + 1 >= puzzle.scale ||
    puzzle.cellRegionIds[index(x, y)] !== puzzle.cellRegionIds[index(x, y + 1)]
  ) {
    cell.classList.add("unlike-bottom");
  }
}

function applyCellState(cellEl, state) {
  cellEl.classList.remove("empty", "queen", "blocked");
  cellEl.innerHTML = "";
  if (state === CellState.EMPTY) {
    cellEl.classList.add("empty");
  } else if (state === CellState.BLOCKED || state === CellState.WILL_BLOCK) {
    cellEl.classList.add("blocked");
    cellEl.innerHTML = "×";
  } else {
    cellEl.classList.add("queen");
    cellEl.innerHTML = "♕";
  }
  cellEl.style.color = state === CellState.EVIL_QUEEN ? 'red' : null;
}

function updateCell(index) {
  const cellEl = document.querySelector(`.cell[data-index="${index}"]`);
  applyCellState(cellEl, +isBlocked(index, puzzle) | Math.ceil(puzzle.cellStates[index]));
}

function rerender(p) {
  p.cellStates.forEach((_,i) => updateCell(i));
}

// ---- Interaction ----

function cycleCell(i) {
  puzzle.cellStates[i] = isBlocked(i, puzzle)
    ? (puzzle.cellStates[i] === CellState.QUEEN ? CellState.EMPTY : CellState.QUEEN)
    : (Math.round(puzzle.cellStates[i] + 0.9) % 3);
  rerender(puzzle);
}
function setCell(i, value) {
  puzzle.cellStates[i] = value;
  updateCell(i);
}

// ---- Solver Hooks ----

function solve(p) {
  let last = null, curr = null;
  while (last !== (curr = JSON.stringify(p.cellStates))) {
    last = curr;
    solveStep(p);
  }
  if (!isValid(p)){
    return false;
  }
  if (!enoughQueens(p)){
    while (p.cellStates.some(a => a === CellState.EMPTY)) {
      const copy = deepCopy(p)
      const firstSpace = copy.cellStates.findIndex(a => a === CellState.EMPTY);
      copy.cellStates[firstSpace] = CellState.QUEEN;
      if (solve(copy) !== false) {
        p.cellStates[firstSpace] = CellState.QUEEN;
        return solve(p);
      }
      p.cellStates[firstSpace] = CellState.BLOCKED;
    }
    return false;
  }
  return p;
}

function solveStep(p) {
  function getMustHaveQueen() {
    const shouldBeAQueen = {}, validCellCount = {};
    const blockedSet = p.cellStates.map((_, a) => isBlocked(a, p));
    for (let i = 0; i < p.scale ** 2; i++) {
      if (p.cellStates[i] === CellState.EMPTY) {
        const val = blockedSet[i];
        const [x, y] = indexToXY(i);
        validCellCount['col' + x] = [...(validCellCount['col' + x] ?? []), ...(val ? [] : [i])];
        validCellCount['row' + y] = [...(validCellCount['row' + y] ?? []), ...(val ? [] : [i])];
        const key = 'reg' + p.cellRegionIds[i];
        validCellCount[key] = [...(validCellCount[key] ?? []), ...(val ? [] : [i])];
      }
    }
    Object.values(validCellCount).filter(a => a.length === 1).forEach(a => {
      shouldBeAQueen[a[0]] = true;
    })
    return Object.keys(shouldBeAQueen);
  }
  function getBreakingPositions() {
    const shouldBeBlocked = [];
    for (let i = 0; i < p.scale ** 2; i++) {
      if (p.cellStates[i] === CellState.EMPTY) {
        const tempPuzzle = deepCopy(p);
        tempPuzzle.cellStates[i] = CellState.QUEEN;
        if (isBlockedUp(tempPuzzle)) {
          shouldBeBlocked.push(i);
        }
      }
    }
    return shouldBeBlocked;
  }
  getMustHaveQueen().forEach(val => p.cellStates[val] = CellState.QUEEN);
  getBreakingPositions().forEach(val => p.cellStates[val] = CellState.BLOCKED);
}

function resetPuzzle() {
  puzzle.cellStates.fill(CellState.EMPTY);
  renderBoard();
}

// ---- Image Loader ----

const colorToObject = (num) => {
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const sqrDist = (a, b) => {
  a = colorToObject(a);
  b = colorToObject(b);
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
};

async function loadFromImage() {
  const { width, height, pixels } = await uploadImage();

  const getPixel = (x, y) => {
    const offset = 4 * (y * width + x);
    return (
      (pixels[offset] << 16) |
      (pixels[offset + 1] << 8) |
      pixels[offset + 2]
    );
  };
  const corner = getPixel(0, 0);
  let top = 0,
    bottom = 0,
    left = 0,
    right = 0;
  if (
    sqrDist(corner, getPixel(width - 1, 0)) < 64 &&
    sqrDist(corner, getPixel(width - 1, height - 1)) < 64 &&
    sqrDist(corner, getPixel(0, height - 1)) < 64
  ) {
    while (
      top < height &&
      256 > sqrDist(corner, getPixel(Math.ceil(width / 2), top++))
    );
    while (
      bottom < height &&
      256 > sqrDist(corner, getPixel(Math.ceil(width / 2), height - ++bottom))
    );
    while (
      left < width &&
      256 > sqrDist(corner, getPixel(left++, Math.ceil(height / 2)))
    );
    while (
      right < width &&
      256 > sqrDist(corner, getPixel(width - ++right, Math.ceil(height / 2)))
    );
  }
  const topEdge = getPixel(Math.ceil(width / 2), top + 1);
  let border = null;
  if (
    sqrDist(topEdge, getPixel(Math.ceil(width / 2), height - bottom - 1)) <
      64 &&
    sqrDist(topEdge, getPixel(left + 1, Math.ceil(height / 2))) < 64 &&
    sqrDist(topEdge, getPixel(width - 1 - right, Math.ceil(height / 2))) < 64
  ) {
    border = topEdge;
  }

  const counts = {};
  for (let y = top; y < height - bottom - 1; y++) {
    for (let x = left; x < width - right - 1; x++) {
      const pixel = getPixel(x, y);
      counts[pixel] = (counts[pixel] ?? 0) + 1;
    }
  }

  const combined = {};

  for (const key of Object.keys(counts)) {
    const keyNum = Number(key);
    // Find an existing cluster within threshold
    const match = Object.keys(combined).find(
      (c) => sqrDist(keyNum, Number(c)) <= 64,
    );
    if (match) {
      combined[match] += counts[key];
    } else {
      combined[keyNum] = counts[key];
    }
  }

  let entries = Object.entries(combined).filter(
    ([key, count]) =>
      count >= (width * height) / 256 &&
      (border === null || sqrDist(border, key) > 64),
  );

  const scale = entries.length - (border === null ? 1 : 0);
  const regionColors = Object.keys(Object.fromEntries(entries)).map((a) =>
    parseInt(a).toString(16).padStart(6, "0"),
  );
  const cellRegionIds = Array(scale ** 2)
    .fill(null)
    .map((_, i) => {
      const col = i % scale,
        row = Math.floor(i / scale);
      function getOffsetPixel(x, y) {
        return getPixel(
        Math.floor(((col + x) * (width - left - right)) / scale) + left,
        Math.floor(((row + y) * (height - top - bottom)) / scale) + top,
      );
      }
      const counts = {};
      [
        getOffsetPixel(0.25,0.25),
        getOffsetPixel(0.25,0.5),
        getOffsetPixel(0.25,0.75),
        getOffsetPixel(0.5,0.25),
        getOffsetPixel(0.5,0.5),
        getOffsetPixel(0.5,0.75),
        getOffsetPixel(0.75,0.25),
        getOffsetPixel(0.75,0.5),
        getOffsetPixel(0.75,0.75),
      ].forEach(pixel => {
        let bestIdx = 0, bestDist = Infinity;
        entries.forEach(([key], i) => {
          const d = sqrDist(Number(key), pixel);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        });
        counts[bestIdx] = (counts[bestIdx] ?? 0) + 1;
      });

      return Number(Object.entries(counts).reduce(
        (best, [k, v]) => v > best[1] ? [k, v] : best,
        [0, -1]
      )[0]);
    });
  
  const impliedBorder = regionColors.find((_, i) => !cellRegionIds.some(a => a === i));

  configurePuzzle(
    scale,
    cellRegionIds,
    regionColors,
    (border || !impliedBorder)
      ? parseInt(border ?? "15658734")
        .toString(16)
        .padStart(6, "0")
      : impliedBorder,
  );
  renderBoard();
}

function uploadImage() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files[0];
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        resolve({
          width: canvas.width,
          height: canvas.height,
          pixels: imageData.data, // Uint8ClampedArray [R,G,B,A, ...]
        });
      };

      img.src = url;
    };

    input.click();
  });
}

// ---- Startup ----

document.getElementById("solveBtn").addEventListener("click", () => {solve(puzzle); rerender(puzzle);});
document.getElementById("solveStepBtn").addEventListener("click", () => {solveStep(puzzle); rerender(puzzle);});
document.getElementById("resetBtn").addEventListener("click", resetPuzzle);
document.getElementById("loadBtn").addEventListener("click", loadFromImage);

renderBoard();

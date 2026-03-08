// ---- Puzzle Model ----

const CellState = {
  EMPTY: 0,
  BLOCKED: 1,
  QUEEN: 2,
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

      applyCellState(cell, puzzle.cellStates[i]);

      cell.addEventListener("mousedown", () => {
        isDragging = true;
      });
      cell.addEventListener("mouseup", () => {
        cycleCell(i);
      });
      cell.addEventListener("mouseleave", () => {
        if (puzzle.cellStates[i] === CellState.EMPTY && isDragging) {
          setCell(i, CellState.BLOCKED);
        }
      });

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
  } else if (state === CellState.QUEEN) {
    cellEl.classList.add("queen");
    cellEl.innerHTML = "♕";
  } else if (state === CellState.BLOCKED) {
    cellEl.classList.add("blocked");
    cellEl.innerHTML = "×";
  }
}

function updateCell(index) {
  const cellEl = document.querySelector(`.cell[data-index="${index}"]`);
  applyCellState(cellEl, puzzle.cellStates[index]);
}

// ---- Interaction ----

function cycleCell(i) {
  puzzle.cellStates[i] = (puzzle.cellStates[i] + 1) % 3;
  updateCell(i);
}
function setCell(i, value) {
  puzzle.cellStates[i] = value;
  updateCell(i);
}

// ---- Solver Hooks ----

function solveStep() {
  console.log("Solver step not implemented yet");
  // later:
  // - evaluate rules
  // - mark forced blocks
  // - place queens
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
    return (
      (pixels[(offset = 4 * (y * width + x))] << 16) |
      (pixels[offset + 1] << 8) |
      pixels[offset + 2]
    );
  };
  // debugger;
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
      counts[(pixel = getPixel(x, y))] = (counts[pixel] ?? 0) + 1;
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
      const pixel = getPixel(
        Math.floor(((col + 0.5) * (width - left - right)) / scale) + left,
        Math.floor(((row + 0.5) * (height - top - bottom)) / scale) + top,
      );
      return entries.reduce(
        (best, curr, i) =>
          (dist = sqrDist(curr[0], pixel)) < best[1] ? [i, dist] : best,
        [-1, Number.MAX_VALUE],
      )[0];
    });

  configurePuzzle(
    scale,
    cellRegionIds,
    regionColors,
    parseInt(border ?? "15658734")
      .toString(16)
      .padStart(6, "0"),
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

document.getElementById("solveBtn").addEventListener("click", solveStep);
document.getElementById("resetBtn").addEventListener("click", resetPuzzle);
document.getElementById("loadBtn").addEventListener("click", loadFromImage);

renderBoard();

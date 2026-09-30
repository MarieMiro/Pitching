const stage = document.getElementById('stage');

function fit() {
  const scale = Math.min(innerWidth / 1600, innerHeight / 900);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
addEventListener('resize', fit);
fit();

const LOG = 'Неуверенный парень пытается познакомиться с понравившейся девушкой в кафе, однако считает, что сможет понравиться ей, только если их знакомство будет идеальным. После провальной первой попытки герой получает шанс отматывать время назад с помощью часов-кукушки и знакомиться с ней снова и снова, но его неловкость и внешние обстоятельства раз за разом портят «первое» впечатление.';
const log = document.getElementById('log');
LOG.split(' ').forEach((word, i) => {
  const span = document.createElement('span');
  span.className = 'w';
  span.style.animationDelay = (2.4 + i * 0.055) + 's';
  span.textContent = word + ' ';
  log.appendChild(span);
});

// Два кадра фильма чередуются между шестью неудачными дублями.
// Положи реальные файлы take1.jpg и take2.jpg в папку images.
const TAKES = [
  { title: 'Идеальный план', image: 'images/take1.jpg' },
  { title: 'Уронил поднос', image: 'images/take2.jpg' },
  { title: 'Забыл её имя', image: 'images/take1.jpg' },
  { title: 'Ливень за окном', image: 'images/take2.jpg' },
  { title: 'Звонит мама', image: 'images/take1.jpg' },
  { title: 'Кофе на рубашку', image: 'images/take2.jpg' }
];

const frame = document.getElementById('scene');
const takeLabel = document.getElementById('take');
const timecode = document.getElementById('tc');
const view = document.getElementById('view');
const cuckooClock = document.getElementById('hg');
const flash = document.getElementById('flash');
const sandCanvas = document.getElementById('sand');
const btn = document.getElementById('btn');

let takeIndex = 0;
let mode = 'play';
let seconds = 0;
let lastFrame = 0;
let timer = 0;

function showTake() {
  const take = TAKES[takeIndex];
  frame.classList.remove('frame-change');
  void frame.offsetWidth;
  frame.src = take.image;
  takeLabel.textContent = `Дубль ${String(takeIndex + 1).padStart(2, '0')} · ${take.title}`;
  frame.classList.add('frame-change');
}

function formatTime(value) {
  const safe = Math.max(0, value);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const frames = Math.floor((safe % 1) * 25);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

function rewind() {
  if (mode !== 'play') return;
  mode = 'rewind';
  view.classList.add('glitch');
  cuckooClock.classList.toggle('flip');
  flash.classList.add('on');
  setTimeout(() => flash.classList.remove('on'), 90);
  timer = 0;
}

function endRewind() {
  mode = 'play';
  view.classList.remove('glitch');
  sandGrid.fill(0);
  flyingSand.length = 0;
  sandTotal = 0;
  timer = 0;
  seconds = 0;
  takeIndex = 0;
  showTake();
}

btn.addEventListener('click', rewind);
addEventListener('keydown', event => {
  if (event.code === 'Space') {
    event.preventDefault();
    rewind();
  }
});
showTake();

// Песок осыпается в центре слайда; при перемотке частицы взлетают обратно.
const context = sandCanvas.getContext('2d');
context.scale(2, 2);
const sandX = 690;
const sandWidth = 110;
const sandHeight = 304;
const pixelSize = 2;
const sandGrid = new Uint8Array(sandWidth * sandHeight);
const flyingSand = [];
let sandTotal = 0;

const offscreen = document.createElement('canvas');
offscreen.width = sandWidth;
offscreen.height = sandHeight;
const offContext = offscreen.getContext('2d');
const sandImage = offContext.createImageData(sandWidth, sandHeight);
const sandPalette = [
  [224, 202, 152], [212, 189, 140], [198, 174, 124],
  [234, 214, 168], [182, 158, 110], [206, 182, 130]
];

function updateSand() {
  for (let pass = 0; pass < 3; pass++) {
    if (mode === 'play') {
      const x = 54 + (Math.random() < 0.5 ? 0 : 1);
      if (!sandGrid[x]) {
        sandGrid[x] = 1 + (Math.random() * sandPalette.length | 0);
        sandTotal++;
      }
    }

    for (let y = sandHeight - 2; y >= 0; y--) {
      const direction = Math.random() < 0.5 ? 1 : -1;
      for (let step = 0; step < sandWidth; step++) {
        const x = direction > 0 ? step : sandWidth - 1 - step;
        const index = y * sandWidth + x;
        const grain = sandGrid[index];
        if (!grain) continue;

        const down = index + sandWidth;
        if (!sandGrid[down]) {
          sandGrid[down] = grain;
          sandGrid[index] = 0;
          continue;
        }

        const sideX = x + direction;
        const otherX = x - direction;
        if (Math.random() < 0.85 && sideX >= 0 && sideX < sandWidth &&
            !sandGrid[down + direction] && !sandGrid[index + direction]) {
          sandGrid[down + direction] = grain;
          sandGrid[index] = 0;
        } else if (Math.random() < 0.5 && otherX >= 0 && otherX < sandWidth &&
                   !sandGrid[down - direction] && !sandGrid[index - direction]) {
          sandGrid[down - direction] = grain;
          sandGrid[index] = 0;
        }
      }
    }
  }

  if (mode === 'rewind') {
    for (let count = 0; count < 80 && sandTotal > 0; count++) {
      const x = Math.max(0, Math.min(sandWidth - 1, 55 + ((Math.random() + Math.random() - 1) * 50 | 0)));
      let y = 0;
      while (y < sandHeight && !sandGrid[y * sandWidth + x]) y++;
      if (y < sandHeight) {
        sandGrid[y * sandWidth + x] = 0;
        sandTotal--;
        flyingSand.push({
          x: sandX + x * pixelSize,
          y: y * pixelSize,
          vx: (800 - sandX - x * pixelSize) * 0.01 * (Math.random() + 0.3),
          vy: -(5 + Math.random() * 6)
        });
      }
    }
  }

  for (let index = flyingSand.length - 1; index >= 0; index--) {
    const grain = flyingSand[index];
    grain.x += grain.vx;
    grain.y += grain.vy;
    if (grain.y < -10) flyingSand.splice(index, 1);
  }
}

function drawSand() {
  context.clearRect(0, 0, 1600, 900);
  const pixels = sandImage.data;
  for (let index = 0; index < sandGrid.length; index++) {
    const value = sandGrid[index];
    const offset = index * 4;
    if (value) {
      const color = sandPalette[value - 1];
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    } else {
      pixels[offset + 3] = 0;
    }
  }

  offContext.putImageData(sandImage, 0, 0);
  context.imageSmoothingEnabled = false;
  context.drawImage(offscreen, sandX, 0, sandWidth * pixelSize, sandHeight * pixelSize);
  context.fillStyle = '#c9b48a';
  for (const grain of flyingSand) context.fillRect(grain.x, grain.y, 2, 2);
}

function animate(now) {
  const delta = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
  lastFrame = now;
  updateSand();
  drawSand();

  if (mode === 'play') {
    seconds += delta * 3.2;
    timer += delta;
    if (timer > 1.7) {
      timer = 0;
      if (takeIndex < TAKES.length - 1) {
        takeIndex++;
        showTake();
      } else {
        rewind();
      }
    }
  } else {
    seconds = Math.max(0, seconds - delta * 40);
    timer += delta;
    if (takeIndex > 0 && timer > 0.16) {
      timer = 0;
      takeIndex--;
      showTake();
    }
    if (takeIndex === 0 && (sandTotal < 8 || timer > 1.2)) endRewind();
  }

  timecode.textContent = formatTime(seconds);
  requestAnimationFrame(animate);
}

setTimeout(() => requestAnimationFrame(animate), 600);

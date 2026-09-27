
const app = document.getElementById("app");

const SUITS = [
  { id: "spade", symbol: "♠", name: "Spade" },
  { id: "heart", symbol: "♥", name: "Heart" },
  { id: "diamond", symbol: "♦", name: "Diamond" },
  { id: "club", symbol: "♣", name: "Clover" }
];

let game = null;
let setupCount = 4;
let setupJack = 1;

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function suit(id) {
  return SUITS.find(item => item.id === id);
}

function shuffle(array) {
  const copy = [...array];

  // Gunakan random dari browser agar pengacakan benar-benar dilakukan
  // setiap kali fungsi dipanggil.
  if (window.crypto && window.crypto.getRandomValues) {
    const randomBuffer = new Uint32Array(1);

    for (let i = copy.length - 1; i > 0; i--) {
      window.crypto.getRandomValues(randomBuffer);
      const j = randomBuffer[0] % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Fallback jika crypto tidak tersedia.
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function screen(content, cls = "") {
  app.innerHTML = `<div class="screen ${cls}"><div class="wrap">${content}</div></div>`;
}

function button(text, cls = "btn-primary", onclick = "", disabled = false) {
  return `<button class="btn ${cls}" onclick="${onclick}" ${disabled ? "disabled" : ""}>${text}</button>`;
}

function randomizeRoundSymbols() {
  const symbolPool = Array.from(
    { length: game.players.length },
    (_, index) => SUITS[index % SUITS.length].id
  );

  const randomized = shuffle(symbolPool);

  game.players.forEach((player, index) => {
    player.symbol = randomized[index];
    player.guess = null;
  });
}

function alivePlayers() {
  return game.players.filter(player => player.alive);
}

function home() {
  screen(`
    <div class="panel home">
      <span class="crown">♛</span>
      <div class="logo">JACK</div>
      <div class="subtitle">THE GAME OF TRUST</div>
      <div class="suits"><span>♠</span><span>♥</span><span>♦</span><span>♣</span></div>
      <div class="menu">
        ${button("▶ &nbsp; Mulai Game", "btn-primary", "setup()")}
        ${button("📖 &nbsp; Cara Main", "btn-secondary", "rules()")}
      </div>
      <div class="footer-note">Offline • Pass-and-Play • Tidak membutuhkan internet</div>
    </div>
  `);
}

function rules() {
  screen(`
    <div class="panel card">
      <div class="header">
        <div>
          <div class="title">Cara Main Jack</div>
          <div class="muted">Prototype offline</div>
        </div>
      </div>
      <div class="grid grid2">
        <div class="card"><b>1. Simbol rahasia</b><p class="muted">Setiap pemain mendapat ♠ ♥ ♦ atau ♣. Kamu tidak bisa melihat simbolmu sendiri, tetapi bisa melihat simbol pemain lain.</p></div>
        <div class="card"><b>2. Jack</b><p class="muted">Role Jack dipilih secara acak dari seluruh pemain saat game dimulai.</p></div>
        <div class="card"><b>3. Diskusi</b><p class="muted">Diskusi dilakukan langsung antar pemain. Tanyakan “Apa simbolku?” dan pemain lain bebas menjawab benar atau bohong.</p></div>
        <div class="card"><b>4. Semua menebak</b><p class="muted">Setiap ronde semua pemain yang masih hidup, termasuk Jack, wajib menebak simbol mereka sendiri.</p></div>
        <div class="card"><b>5. Salah menebak</b><p class="muted">Pemain yang salah menebak tereliminasi.</p></div>
        <div class="card"><b>6. Tujuan</b><p class="muted">Prototype ini memakai aturan sementara: pemain biasa menang jika semua Jack tereliminasi, Jack menang jika tidak ada pemain biasa yang tersisa.</p></div>
      </div>
      <div class="actions">${button("← Kembali", "btn-secondary", "home()")}</div>
    </div>
  `);
}

function setup() {
  screen(`
    <div class="panel card">
      <div class="header">
        <div>
          <div class="title">Pengaturan Permainan</div>
          <div class="muted">Role Jack diacak dari seluruh pemain setiap game</div>
        </div>
      </div>

      <div class="grid grid2">
        <div class="card">
          <label>Jumlah pemain</label>
          <div class="range-row">
            ${[3,4,5,6,7,8].map(n => `
              <button class="choice ${n === setupCount ? "active" : ""}" id="count-${n}" onclick="setCount(${n})">${n}</button>
            `).join("")}
          </div>

          <label style="margin-top:18px">Jumlah Jack</label>
          <div class="range-row">
            ${[1,2].map(n => `
              <button class="choice ${n === setupJack ? "active" : ""}" id="jack-${n}" onclick="setJackCount(${n})">${n}</button>
            `).join("")}
          </div>
        </div>

        <div class="card">
          <label>Nama pemain</label>
          <div id="names" class="players-form"></div>
        </div>
      </div>

      <div class="actions">
        ${button("← Kembali", "btn-secondary", "home()")}
        ${button("Mulai Permainan →", "btn-primary", "startGame()")}
      </div>
    </div>
  `);

  updateNames(setupCount);
}

function setCount(n) {
  setupCount = n;
  document.querySelectorAll('[id^="count-"]').forEach(el => el.classList.remove("active"));
  document.getElementById(`count-${n}`).classList.add("active");

  const values = Array.from({ length: n }, (_, i) => {
    const old = document.getElementById(`name-${i}`);
    return old ? old.value : "";
  });

  updateNames(n, values);
}

function setJackCount(n) {
  if (n >= setupCount) n = 1;
  setupJack = n;

  document.querySelectorAll('[id^="jack-"]').forEach(el => el.classList.remove("active"));
  document.getElementById(`jack-${n}`).classList.add("active");
}

function updateNames(n, values = []) {
  const defaults = ["Andi","Budi","Citra","Dimas","Eko","Fajar","Gita","Hana"];

  document.getElementById("names").innerHTML = Array.from({ length: n }, (_, i) => {
    const value = values[i] || defaults[i];
    return `<input id="name-${i}" value="${esc(value)}" maxlength="18" placeholder="Nama pemain ${i+1}">`;
  }).join("");
}

function startGame() {
  const names = Array.from({ length: setupCount }, (_, i) => {
    const field = document.getElementById(`name-${i}`);
    return field && field.value.trim() ? field.value.trim() : `Pemain ${i+1}`;
  });

  if (setupJack >= setupCount) setupJack = 1;

  const symbolPool = [];
  for (let i = 0; i < setupCount; i++) {
    symbolPool.push(SUITS[i % SUITS.length].id);
  }

  const shuffledSymbols = shuffle(symbolPool);
  const shuffledPlayers = shuffle(Array.from({ length: setupCount }, (_, i) => i));
  const jackIds = new Set(shuffledPlayers.slice(0, setupJack));

  game = {
    round: 1,
    maxRounds: 10,
    current: 0,
    players: names.map((name, index) => ({
      name,
      symbol: shuffledSymbols[index],
      jack: jackIds.has(index),
      alive: true,
      guess: null
    }))
  };

  // Randomisasi simbol ronde pertama.
  randomizeRoundSymbols();

  // IMPORTANT: every game starts with a handoff screen for Player 1.
  showRolePass();
}

/* =========================
   ROLE REVEAL
   ========================= */

function showRolePass() {
  const player = game.players[game.current];

  screen(`
    <div class="panel secret">
      <div class="secret-icon">📱</div>
      <div class="big-title">Serahkan HP ke ${esc(player.name)}</div>
      <p class="muted">Setiap pemain harus membuka role-nya sendiri.</p>

      <div class="notice">
        Pastikan hanya <b>${esc(player.name)}</b> yang memegang HP.
        Jangan tekan tombol sebelum HP berada di tangan pemain tersebut.
      </div>

      ${button(`${esc(player.name)}, Buka Role Saya →`, "btn-primary", "revealRole()")}

      <div class="progress">
        <div style="width:${(game.current / game.players.length) * 100}%"></div>
      </div>
    </div>
  `);
}

function revealRole() {
  const player = game.players[game.current];

  const roleHtml = player.jack
    ? `<div class="jack">JACK</div><p>Kamu adalah Jack. Buat pemain lain salah menebak simbol mereka.</p>`
    : `<div class="big-title">PEMAIN BIASA</div><p>Kamu bukan Jack. Temukan simbolmu dan buat Jack salah menebak.</p>`;

  screen(`
    <div class="panel secret">
      <div class="muted">Pemain ${game.current + 1} dari ${game.players.length}</div>
      <h1>${esc(player.name)}</h1>
      <div class="secret-icon">${player.jack ? "🃏" : "❓"}</div>
      ${roleHtml}

      <div class="warning">
        ⚠️ Informasi RAHASIA. Hanya ${esc(player.name)} yang boleh melihat layar ini.
      </div>

      ${button("Saya Sudah Melihat →", "btn-primary", "confirmRoleSeen()")}

      <div class="progress">
        <div style="width:${((game.current + 1) / game.players.length) * 100}%"></div>
      </div>
    </div>
  `);
}

function confirmRoleSeen() {
  const player = game.players[game.current];
  const last = game.current === game.players.length - 1;
  const next = last ? null : game.players[game.current + 1];

  screen(`
    <div class="panel secret">
      <div class="secret-icon">🔒</div>
      <div class="big-title">Role ${esc(player.name)} Sudah Dilihat</div>
      <p class="muted">Jangan tampilkan layar role kepada pemain lain.</p>

      <div class="notice">
        ${last
          ? `<b>Semua role sudah dibagikan.</b><br>Ronde 1 siap dimulai.`
          : `<b>Serahkan HP kepada ${esc(next.name)}.</b><br>${esc(next.name)} harus membuka role-nya sendiri.`}
      </div>

      ${button(
        last ? "Mulai Ronde 1 →" : `Serahkan ke ${esc(next.name)} →`,
        "btn-primary",
        "nextRolePlayer()"
      )}
    </div>
  `);
}

function nextRolePlayer() {
  game.current++;

  if (game.current < game.players.length) {
    showRolePass();
    return;
  }

  // Last player is finished -> directly enter Round 1 player directory.
  game.current = 0;
  game.round = 1;
  showSymbolDirectory();
}

/* =========================
   ROUND 1 / SYMBOL DIRECTORY
   ========================= */

function showSymbolDirectory() {
  screen(`
    <div class="panel card">
      <div class="header">
        <div>
          <div class="muted">Ronde ${game.round} • Fase Informasi</div>
          <div class="title">👥 Daftar Semua Pemain</div>
        </div>
        <span class="badge gold">PILIH NAMA</span>
      </div>

      <div class="notice">
        Pilih nama pemain untuk melihat simbol dari sudut pandang pemain tersebut.
        Simbol milik pemain yang dipilih akan selalu disembunyikan.
        <br><br>
        <b>Ronde ini sudah mendapat pengacakan simbol baru.</b>
      </div>

      <div class="player-directory">
        ${game.players.map((player, index) => `
          <button
            class="directory-player ${player.alive ? "" : "directory-dead"}"
            onclick="${player.alive ? `openPlayerView(${index})` : ""}"
            ${player.alive ? "" : "disabled"}
          >
            <span class="directory-dot"></span>
            <span class="directory-name">${esc(player.name)}</span>
            <span class="directory-status">${player.alive ? "Hidup" : "Tereliminasi"}</span>
          </button>
        `).join("")}
      </div>

      <div class="notice center">
        🗣️ Diskusi dilakukan langsung antar pemain, bukan melalui website.
        Tanyakan dan jawab secara lisan.
      </div>

      ${button("Selesai Diskusi → Fase Tebak", "btn-primary", "showGuessIntro()")}
    </div>
  `);
}

function openPlayerView(index) {
  const player = game.players[index];
  if (!player || !player.alive) return;

  screen(`
    <div class="panel card">
      <div class="header">
        <div>
          <div class="muted">Ronde ${game.round} • Informasi Rahasia</div>
          <div class="title">Informasi untuk ${esc(player.name)}</div>
        </div>
        <span class="badge gold">RAHASIA</span>
      </div>

      <div class="warning">
        Pastikan hanya <b>${esc(player.name)}</b> yang sedang melihat layar ini.
        ${esc(player.name)} tidak dapat melihat simbolnya sendiri.
      </div>

      <div class="player-symbol-list">
        ${game.players.map((other, otherIndex) => {
          const own = otherIndex === index;
          const symbolData = suit(other.symbol);

          return `
            <div class="player-symbol-row ${own ? "own-row" : ""} ${other.alive ? "" : "dead-row"}">
              <div class="row-player">
                <span class="directory-dot"></span>
                <b>${esc(other.name)}</b>
                ${own ? `<span class="badge gold">KAMU</span>` : ""}
                ${!other.alive ? `<span class="badge red">MATI</span>` : ""}
              </div>
              <div class="row-symbol ${own ? "hidden-symbol" : symbolData.id}">
                ${own ? "?" : symbolData.symbol}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="notice center">
        🗣️ Sekarang ${esc(player.name)} dapat bertanya langsung kepada pemain lain:
        <b>“Apa simbolku?”</b><br>
        Pemain lain boleh jujur atau berbohong.
      </div>

      ${button("← Kembali ke Daftar Pemain", "btn-secondary", "showSymbolDirectory()")}
    </div>
  `);
}

/* =========================
   GUESS PHASE
   ========================= */

function showGuessIntro() {
  screen(`
    <div class="panel secret">
      <div class="secret-icon">🔮</div>
      <div class="big-title">Fase Tebak</div>
      <p class="muted">Semua pemain yang masih hidup wajib memilih simbolnya sendiri.</p>

      <div class="notice">
        <b>Termasuk Jack.</b><br>
        Semua jawaban akan dikunci terlebih dahulu dan baru dibuka bersama-sama.
      </div>

      ${button("Mulai Tebakan →", "btn-primary", "beginGuessing()")}
    </div>
  `);
}

function beginGuessing() {
  game.current = 0;
  pendingGuess = null;
  showGuessHandoff();
}

let pendingGuess = null;

function showGuessHandoff() {
  while (game.current < game.players.length && !game.players[game.current].alive) {
    game.current++;
  }

  if (game.current >= game.players.length) {
    showLockStatus();
    return;
  }

  const player = game.players[game.current];

  screen(`
    <div class="panel secret">
      <div class="secret-icon">📱</div>
      <div class="big-title">Serahkan HP ke ${esc(player.name)}</div>
      <p class="muted">Hanya ${esc(player.name)} yang boleh membuat tebakan.</p>
      ${button(`${esc(player.name)}, Buka Tebakan →`, "btn-primary", "guessTurn()")}
    </div>
  `);
}

function guessTurn() {
  const player = game.players[game.current];
  pendingGuess = null;

  screen(`
    <div class="panel card">
      <div class="header">
        <div>
          <div class="muted">Ronde ${game.round} • Tebakan</div>
          <div class="title">${esc(player.name)}, pilih simbolmu</div>
        </div>
        <span class="badge gold">RAHASIA</span>
      </div>

      <div class="warning">
        Ingat jawaban yang kamu dapat dari diskusi. Pilih simbol yang menurutmu benar.
      </div>

      <div class="suit-grid">
        ${SUITS.map(item => `
          <button id="guess-${item.id}" class="suit" onclick="selectGuess('${item.id}')">
            <span class="symbol ${item.id}">${item.symbol}</span>
            <span class="name">${item.name}</span>
          </button>
        `).join("")}
      </div>

      <div class="actions">
        ${button("🔒 Kunci Jawaban", "btn-primary", "lockGuess()", true)}
      </div>
    </div>
  `);
}

function selectGuess(id) {
  pendingGuess = id;

  document.querySelectorAll("#guess-grid .suit, .suit").forEach(el => {
    el.classList.remove("selected");
  });

  const selected = document.getElementById(`guess-${id}`);
  if (selected) selected.classList.add("selected");

  const btn = document.querySelector(".actions .btn-primary");
  if (btn) btn.disabled = false;
}

function lockGuess() {
  if (!pendingGuess) return;

  const player = game.players[game.current];
  player.guess = pendingGuess;
  pendingGuess = null;

  let nextIndex = game.current + 1;
  while (nextIndex < game.players.length && !game.players[nextIndex].alive) {
    nextIndex++;
  }

  screen(`
    <div class="panel secret">
      <div class="secret-icon">🔒</div>
      <div class="big-title">Jawaban ${esc(player.name)} Terkunci</div>
      <p class="muted">Jangan ubah atau tunjukkan jawaban ini kepada pemain lain.</p>

      <div class="notice">
        ${nextIndex < game.players.length
          ? `<b>Serahkan HP kepada ${esc(game.players[nextIndex].name)}.</b><br>Pemain berikutnya harus membuka tebakannya sendiri.`
          : `<b>Semua pemain sudah mengunci jawaban.</b><br>Hasil ronde siap dibuka.`}
      </div>

      ${button(
        nextIndex < game.players.length
          ? `Buka Tebakan ${esc(game.players[nextIndex].name)} →`
          : "Buka Hasil Ronde →",
        "btn-primary",
        "openNextGuess()"
      )}
    </div>
  `);
}

function openNextGuess() {
  let nextIndex = game.current + 1;

  while (nextIndex < game.players.length && !game.players[nextIndex].alive) {
    nextIndex++;
  }

  if (nextIndex < game.players.length) {
    game.current = nextIndex;
    showGuessHandoff();
  } else {
    game.current = 0;
    showLockStatus();
  }
}

function showLockStatus() {
  screen(`
    <div class="panel card">
      <div class="header">
        <div>
          <div class="muted">Ronde ${game.round}</div>
          <div class="title">🔒 Semua Jawaban Terkunci</div>
        </div>
      </div>

      <div class="lock-list">
        ${alivePlayers().map(player => `
          <div class="lock-row">
            <span>${esc(player.name)}</span>
            <span class="badge green">Terkunci</span>
          </div>
        `).join("")}
      </div>

      <div class="notice">
        Semua jawaban akan dibuka sekarang. Pemain yang salah akan tereliminasi.
      </div>

      ${button("Buka Hasil Ronde →", "btn-primary", "resolveRound()")}
    </div>
  `);
}

function resolveRound() {
  const results = [];

  game.players.forEach((player, index) => {
    if (!player.alive) return;

    const correct = player.guess === player.symbol;

    results.push({
      index,
      correct,
      guess: player.guess,
      symbol: player.symbol
    });

    if (!correct) {
      player.alive = false;
    }
  });

  game.lastResults = results;
  showResults();
}

function showResults() {
  const results = game.lastResults;

  screen(`
    <div class="panel card">
      <div class="center">
        <div class="muted">Ronde ${game.round} • Hasil</div>
        <div class="title">Hasil Tebakan</div>
      </div>

      <div class="result-grid" style="margin-top:22px">
        ${results.map(result => {
          const player = game.players[result.index];
          const symbolData = suit(result.symbol);

          return `
            <div class="result ${result.correct ? "correct" : "wrong"}">
              <b>${esc(player.name)}</b>
              <div class="big ${symbolData.id}">${symbolData.symbol}</div>
              <div class="small">Tebakan: ${suit(result.guess).symbol}</div>
              <div style="margin-top:10px" class="badge ${result.correct ? "green" : "red"}">
                ${result.correct ? "✓ BENAR" : "✕ SALAH • TERELIMINASI"}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="notice">
        Hasil ronde hanya menunjukkan siapa yang benar dan siapa yang tereliminasi.
        <b>Role semua pemain tetap rahasia.</b>
      </div>

      <div class="actions">
        ${button("Lanjut →", "btn-primary", "nextRound()")}
      </div>
    </div>
  `);
}

function nextRound() {
  const jackAlive = game.players.some(player => player.jack && player.alive);
  const normalAlive = game.players.some(player => !player.jack && player.alive);

  if (!jackAlive || !normalAlive || game.round >= game.maxRounds) {
    finishGame();
    return;
  }

  game.round++;
  game.current = 0;

  // Setiap ronde melakukan randomisasi simbol baru.
  // Simbol BOLEH kebetulan sama seperti ronde sebelumnya.
  randomizeRoundSymbols();

  showSymbolDirectory();
}

/* =========================
   END
   ========================= */

function finishGame() {
  const jackAlive = game.players.some(player => player.jack && player.alive);
  const normalAlive = game.players.some(player => !player.jack && player.alive);

  let title = "GAME SELESAI";
  let text = "Permainan berakhir.";

  if (!jackAlive) {
    title = "PEMAIN BIASA MENANG!";
    text = "Semua Jack telah tereliminasi.";
  } else if (!normalAlive) {
    title = "JACK MENANG!";
    text = "Tidak ada pemain biasa yang tersisa.";
  } else {
    title = "BATAS RONDE TERCAPAI";
    text = "Permainan mencapai batas ronde prototype.";
  }

  screen(`
    <div class="panel secret">
      <div class="secret-icon">${title.includes("JACK") ? "🃏" : "👑"}</div>
      <div class="big-title">${title}</div>
      <p class="muted">${text}</p>
      <div class="notice"><b>Permainan berakhir pada ronde ${game.round}.</b></div>

      <div class="notice final-roles">
        <b>Role pemain akhirnya terungkap:</b>
        <div class="final-role-list">
          ${game.players.map(player => `
            <div class="final-role-row">
              <span>${esc(player.name)}</span>
              <span class="badge ${player.jack ? "red" : "green"}">
                ${player.jack ? "JACK" : "PEMAIN BIASA"}
              </span>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="actions" style="justify-content:center">
        ${button("↻ Main Lagi", "btn-primary", "setup()")}
        ${button("⌂ Menu Utama", "btn-secondary", "home()")}
      </div>
    </div>
  `);
}

home();

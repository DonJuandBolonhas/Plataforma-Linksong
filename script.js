/* =========================================================
   Conexão Sonora — Tela principal de Lançamentos (UC-S08)
   Somente interface. A lógica de categorização automática
   (RN-008: Single / EP / Álbum) será implementada depois.
   ========================================================= */

/* ---------- Dados de exemplo (mock) ---------- */
const releases = [
  { title: "Noites de Verão",   year: 2026, tracks: 1,  category: "single", hue: 265 },
  { title: "Asfalto Quente",    year: 2025, tracks: 3,  category: "single", hue: 190 },
  { title: "Rotas Alternativas",year: 2025, tracks: 5,  category: "ep",     hue: 35  },
  { title: "Eco do Subsolo",    year: 2024, tracks: 6,  category: "ep",     hue: 330 },
  { title: "Maré Cheia",        year: 2023, tracks: 10, category: "album",  hue: 215 },
  { title: "Vinil & Poeira",    year: 2022, tracks: 12, category: "album",  hue: 150 },
];

const CATEGORY_LABEL = { single: "Single", ep: "EP", album: "Álbum" };

/* ---------- Elementos ---------- */
const grid        = document.getElementById("releaseGrid");
const emptyState  = document.getElementById("emptyState");
const modal       = document.getElementById("modal");
const form        = document.getElementById("releaseForm");
const trackList   = document.getElementById("trackList");
const trackCount  = document.getElementById("trackCount");
const tracksEmpty = document.getElementById("tracksEmpty");
const coverInput  = document.getElementById("coverInput");
const coverPreview= document.getElementById("coverPreview");
const coverHint   = document.getElementById("coverHint");

/* ---------- Renderização dos cards ---------- */
function coverArt(hue) {
  return `
    <div class="card__cover-art" style="background:
      radial-gradient(circle at 30% 25%, hsl(${hue} 80% 62%), transparent 60%),
      linear-gradient(135deg, hsl(${hue} 70% 38%), hsl(${(hue + 50) % 360} 70% 22%));">
      <svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>
      </svg>
    </div>`;
}

function cardTemplate(r) {
  const cover = r.cover ? `<img src="${r.cover}" alt="Capa de ${r.title}">` : coverArt(r.hue ?? 260);
  return `
    <article class="card" data-category="${r.category}">
      <div class="card__cover">
        ${cover}
        <div class="card__actions">
          <button class="icon-btn" type="button" aria-label="Editar ${r.title}">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
        </div>
      </div>
      <div class="card__body">
        <div class="card__top">
          <span class="badge badge--${r.category}">${CATEGORY_LABEL[r.category]}</span>
        </div>
        <h3 class="card__title" title="${r.title}">${r.title}</h3>
        <p class="card__meta">${r.year} · ${r.tracks} ${r.tracks === 1 ? "faixa" : "faixas"}</p>
      </div>
    </article>`;
}

function renderReleases() {
  grid.innerHTML = releases.map(cardTemplate).join("");
  const has = releases.length > 0;
  grid.hidden = !has;
  emptyState.hidden = has;
}

/* ---------- Chips de filtro (apenas estado visual) ---------- */
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("chip--active"));
    chip.classList.add("chip--active");
    // TODO: aplicar filtro por categoria
  });
});

/* ---------- Modal ---------- */
function openModal() {
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  if (!trackList.children.length) addTrack();
  document.getElementById("titulo").focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
  form.reset();
  trackList.innerHTML = "";
  coverPreview.hidden = true;
  coverPreview.removeAttribute("src");
  coverHint.hidden = false;
  updateTrackUI();
}

document.getElementById("btnNovo").addEventListener("click", openModal);
document.querySelectorAll("[data-open-modal]").forEach(b => b.addEventListener("click", openModal));
document.getElementById("btnFechar").addEventListener("click", closeModal);
document.getElementById("btnCancelar").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

/* ---------- Faixas ---------- */
function addTrack() {
  const li = document.createElement("li");
  li.className = "track";
  li.innerHTML = `
    <span class="track__num"></span>
    <input type="text" name="faixa" placeholder="Nome da faixa" aria-label="Nome da faixa">
    <input type="text" class="duration" name="duracao" placeholder="mm:ss" maxlength="5" aria-label="Duração">
    <button class="icon-btn icon-btn--danger" type="button" aria-label="Remover faixa">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
    </button>
    <div class="track__link">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>
      <input type="url" class="link-input" name="link" placeholder="Link da música (Spotify, YouTube, SoundCloud...)" aria-label="Link da música">
    </div>`;
  li.querySelector(".icon-btn").addEventListener("click", () => { li.remove(); updateTrackUI(); });
  li.querySelector(".link-input").addEventListener("input", e => e.target.classList.remove("invalid"));
  trackList.appendChild(li);
  updateTrackUI();
  li.querySelector("input").focus();
}

function updateTrackUI() {
  const items = [...trackList.children];
  items.forEach((li, i) => (li.querySelector(".track__num").textContent = i + 1));
  trackCount.textContent = items.length;
  tracksEmpty.hidden = items.length > 0;
  // TODO (RN-008): calcular categoria e atualizar #categoryBadge
  // 1–3 faixas: Single | 4–6: EP | 7+: Álbum
}

document.getElementById("btnAddFaixa").addEventListener("click", addTrack);

/* ---------- Pré-visualização da capa ---------- */
coverInput.addEventListener("change", () => {
  const file = coverInput.files[0];
  if (!file) return;
  coverPreview.src = URL.createObjectURL(file);
  coverPreview.hidden = false;
  coverHint.hidden = true;
});

/* ---------- Submit (placeholder) ---------- */
form.addEventListener("submit", e => {
  e.preventDefault();
  const titulo = document.getElementById("titulo");
  const ano = document.getElementById("ano");
  [titulo, ano].forEach(i => i.classList.toggle("invalid", !i.value.trim()));
  if (!titulo.value.trim() || !ano.value.trim()) return;

  // Links das faixas são opcionais, mas, se preenchidos, precisam ser URLs válidas (http/https)
  let linksOk = true;
  form.querySelectorAll(".link-input").forEach(input => {
    const v = input.value.trim();
    let valid = true;
    if (v) {
      try { valid = ["http:", "https:"].includes(new URL(v).protocol); }
      catch { valid = false; }
    }
    input.classList.toggle("invalid", !valid);
    if (!valid) linksOk = false;
  });
  if (!linksOk) return;
  // TODO: salvar lançamento, categorizar (RN-008) e atualizar a lista
  console.log("Lançamento pronto para ser salvo (lógica pendente).");
});

/* ---------- Init ---------- */
renderReleases();
updateTrackUI();


/* =========================================================
   CONEXÃO SONORA — GERENCIAMENTO DE LANÇAMENTOS
   Cadastro, edição, exclusão, filtros e armazenamento.
   ========================================================= */

const STORAGE_KEY = "conexaoSonora.lancamentos";

let releases = loadReleases();
let editingReleaseId = null;
let currentFilter = "todos";

/* ---------- Categorias ---------- */

const CATEGORY_LABEL = {
  single: "Single",
  ep: "EP",
  album: "Álbum"
};

function getCategory(trackAmount) {
  if (trackAmount <= 3) return "single";
  if (trackAmount <= 6) return "ep";
  return "album";
}

/* ---------- Armazenamento ---------- */

function loadReleases() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Erro ao carregar lançamentos:", error);
    return [];
  }
}

function saveReleases() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(releases));
    return true;
  } catch (error) {
    console.error("Erro ao salvar lançamentos:", error);
    alert("Não foi possível salvar. Verifique o espaço disponível no navegador.");
    return false;
  }
}

/* ---------- Elementos HTML ---------- */

const grid = document.getElementById("releaseGrid");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("modal");
const form = document.getElementById("releaseForm");

const trackList = document.getElementById("trackList");
const trackCount = document.getElementById("trackCount");
const tracksEmpty = document.getElementById("tracksEmpty");

const coverInput = document.getElementById("coverInput");
const coverPreview = document.getElementById("coverPreview");
const coverHint = document.getElementById("coverHint");

const statTotal = document.getElementById("statTotal");
const statSingle = document.getElementById("statSingle");
const statEp = document.getElementById("statEp");
const statAlbum = document.getElementById("statAlbum");

const titulo = document.getElementById("titulo");
const ano = document.getElementById("ano");
const modalTitle = document.getElementById("modalTitle");

const searchInput = document.querySelector(
  '.search input[type="search"]'
);

const sortSelect = document.querySelector(".select");

/* ---------- Segurança de texto ---------- */

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

/* ---------- Cards ---------- */

function cardTemplate(release) {
  const cover = release.cover
    ? `<img src="${release.cover}" alt="Capa de ${escapeHTML(release.title)}">`
    : `
      <div class="card__cover-art">
        <svg viewBox="0 0 24 24" width="54" height="54"
          fill="none" stroke="currentColor" stroke-width="1.4">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="12" r="2.5"/>
        </svg>
      </div>`;

  return `
    <article class="card" data-category="${release.category}">

      <div class="card__cover">
        ${cover}

        <div class="card__actions">

          <button class="icon-btn"
            type="button"
            data-edit-id="${release.id}"
            aria-label="Editar ${escapeHTML(release.title)}">
            <svg viewBox="0 0 24 24" width="17" height="17"
              fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>

          <button class="icon-btn icon-btn--danger"
            type="button"
            data-delete-id="${release.id}"
            aria-label="Excluir ${escapeHTML(release.title)}">
            <svg viewBox="0 0 24 24" width="17" height="17"
              fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/>
              <path d="M8 6V4h8v2"/>
              <path d="M6 6l1 14h10l1-14"/>
            </svg>
          </button>

        </div>
      </div>

      <div class="card__body">
        <div class="card__top">
          <span class="badge badge--${release.category}">
            ${CATEGORY_LABEL[release.category]}
          </span>
        </div>

        <h3 class="card__title" title="${escapeHTML(release.title)}">
          ${escapeHTML(release.title)}
        </h3>

        <p class="card__meta">
          ${release.year} · ${release.tracks}
          ${release.tracks === 1 ? "faixa" : "faixas"}
        </p>
      </div>

    </article>
  `;
}

/* ---------- Renderização ---------- */

function renderReleases() {
  const searchTerm = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  let filteredReleases = releases.filter(release => {
    const matchesCategory =
      currentFilter === "todos" ||
      release.category === currentFilter;

    const matchesSearch =
      release.title.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  // Ordenação
  if (sortSelect) {
    switch (sortSelect.selectedIndex) {
      case 1:
        filteredReleases.sort((a, b) => a.year - b.year);
        break;

      case 2:
        filteredReleases.sort((a, b) =>
          a.title.localeCompare(b.title, "pt-BR")
        );
        break;

      default:
        filteredReleases.sort((a, b) => b.year - a.year);
    }
  }

  grid.innerHTML = filteredReleases
    .map(cardTemplate)
    .join("");

  const hasReleases = filteredReleases.length > 0;

  grid.hidden = !hasReleases;
  emptyState.hidden = hasReleases;

  // Estatísticas consideram todos os lançamentos,
  // independentemente do filtro selecionado.
  statTotal.textContent = releases.length;

  statSingle.textContent = releases.filter(
    r => r.category === "single"
  ).length;

  statEp.textContent = releases.filter(
    r => r.category === "ep"
  ).length;

  statAlbum.textContent = releases.filter(
    r => r.category === "album"
  ).length;

  // Mensagem do estado vazio
  const emptyTitle = emptyState.querySelector("h2");
  const emptyDescription = emptyState.querySelector("p");

  if (emptyTitle && emptyDescription) {
    if (releases.length === 0) {
      emptyTitle.textContent = "Nenhum lançamento por aqui ainda";
      emptyDescription.textContent =
        "Cadastre sua primeira obra e monte a sua discografia digital.";
    } else {
      emptyTitle.textContent = "Nenhum lançamento encontrado";
      emptyDescription.textContent =
        "Não existem lançamentos para os filtros selecionados.";
    }
  }
}

/* ---------- Filtros por categoria ---------- */

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    currentFilter = chip.dataset.filter;

    document.querySelectorAll(".chip").forEach(item => {
      item.classList.remove("chip--active");
    });

    chip.classList.add("chip--active");

    renderReleases();
  });
});

/* ---------- Busca e ordenação ---------- */

if (searchInput) {
  searchInput.addEventListener("input", renderReleases);
}

if (sortSelect) {
  sortSelect.addEventListener("change", renderReleases);
}

/* ---------- Abrir e fechar modal ---------- */

function openModal(release = null) {
  form.reset();
  trackList.innerHTML = "";

  editingReleaseId = release ? release.id : null;

  if (release) {
    modalTitle.textContent = "Editar Lançamento Musical";

    titulo.value = release.title;
    ano.value = release.year;

    if (release.cover) {
      coverPreview.src = release.cover;
      coverPreview.hidden = false;
      coverHint.hidden = true;
    } else {
      coverPreview.hidden = true;
      coverPreview.removeAttribute("src");
      coverHint.hidden = false;
    }

    // Recupera as faixas cadastradas.
    (release.faixaDetalhes || []).forEach(track => {
      addTrack(track);
    });

  } else {
    modalTitle.textContent = "Novo Lançamento Musical";

    coverPreview.hidden = true;
    coverPreview.removeAttribute("src");
    coverHint.hidden = false;

    addTrack();
  }

  updateTrackUI();

  modal.hidden = false;
  document.body.style.overflow = "hidden";

  titulo.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";

  form.reset();
  trackList.innerHTML = "";

  editingReleaseId = null;

  coverPreview.hidden = true;
  coverPreview.removeAttribute("src");
  coverHint.hidden = false;

  modalTitle.textContent = "Novo Lançamento Musical";

  updateTrackUI();
}

document.getElementById("btnNovo")
  .addEventListener("click", () => openModal());

document.querySelectorAll("[data-open-modal]").forEach(button => {
  button.addEventListener("click", () => openModal());
});

document.getElementById("btnFechar")
  .addEventListener("click", closeModal);

document.getElementById("btnCancelar")
  .addEventListener("click", closeModal);

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.hidden) {
    closeModal();
  }
});

/* ---------- Adicionar e remover faixas ---------- */

function addTrack(track = {}) {
  const li = document.createElement("li");

  li.className = "track";

  li.innerHTML = `
    <span class="track__num"></span>

    <input type="text"
      name="faixa"
      placeholder="Nome da faixa"
      aria-label="Nome da faixa">

    <input type="text"
      class="duration"
      name="duracao"
      placeholder="mm:ss"
      maxlength="5"
      aria-label="Duração">

    <button class="icon-btn icon-btn--danger"
      type="button"
      aria-label="Remover faixa">
      <svg viewBox="0 0 24 24" width="17" height="17"
        fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>
      </svg>
    </button>

    <div class="track__link">
      <svg viewBox="0 0 24 24" width="15" height="15"
        fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/>
        <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>
      </svg>

      <input type="url"
        class="link-input"
        name="link"
        placeholder="Link da música (Spotify, YouTube, SoundCloud...)"
        aria-label="Link da música">
    </div>
  `;

  const nomeInput = li.querySelector('[name="faixa"]');
  const duracaoInput = li.querySelector('[name="duracao"]');
  const linkInput = li.querySelector('[name="link"]');

  nomeInput.value = track.nome || "";
  duracaoInput.value = track.duracao || "";
  linkInput.value = track.link || "";

  li.querySelector(".icon-btn").addEventListener("click", () => {
    li.remove();
    updateTrackUI();
  });

  linkInput.addEventListener("input", () => {
    linkInput.classList.remove("invalid");
  });

  trackList.appendChild(li);

  updateTrackUI();
}

function updateTrackUI() {
  const items = [...trackList.children];

  items.forEach((li, index) => {
    li.querySelector(".track__num").textContent = index + 1;
  });

  trackCount.textContent = items.length;
  tracksEmpty.hidden = items.length > 0;

  const category = getCategory(items.length);
  const badge = document.getElementById("categoryBadge");

  badge.textContent = items.length
    ? CATEGORY_LABEL[category]
    : "—";

  badge.className = `badge ${
    items.length ? `badge--${category}` : "badge--muted"
  }`;
}

document.getElementById("btnAddFaixa")
  .addEventListener("click", () => addTrack());

/* ---------- Pré-visualização da capa ---------- */

coverInput.addEventListener("change", () => {
  const file = coverInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Selecione um arquivo de imagem válido.");
    coverInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    coverPreview.src = reader.result;
    coverPreview.hidden = false;
    coverHint.hidden = true;
  };

  reader.readAsDataURL(file);
});

/* ---------- Cadastro e edição ---------- */

form.addEventListener("submit", event => {
  event.preventDefault();

  const anoValue = Number(ano.value);

  titulo.classList.toggle("invalid", !titulo.value.trim());
  ano.classList.toggle("invalid", !ano.value.trim());

  if (!titulo.value.trim() || !ano.value.trim()) {
    alert("Preencha o título e o ano do lançamento.");
    return;
  }

  if (
    !Number.isInteger(anoValue) ||
    anoValue < 1900 ||
    anoValue > 2100
  ) {
    ano.classList.add("invalid");
    alert("Informe um ano válido entre 1900 e 2100.");
    return;
  }

  // Coleta os dados das faixas.
  const faixaDetalhes = [...trackList.querySelectorAll(".track")]
    .map((li, index) => {
      const nome = li.querySelector('[name="faixa"]').value.trim();
      const duracao = li.querySelector('[name="duracao"]').value.trim();
      const link = li.querySelector('[name="link"]').value.trim();
      const linkInput = li.querySelector('[name="link"]');

      let linkValido = true;

      if (link) {
        try {
          const url = new URL(link);
          linkValido = ["http:", "https:"].includes(url.protocol);
        } catch {
          linkValido = false;
        }
      }

      linkInput.classList.toggle("invalid", !linkValido);

      return {
        numero: index + 1,
        nome,
        duracao,
        link,
        linkValido
      };
    });

  if (faixaDetalhes.length === 0) {
    alert("Adicione pelo menos uma faixa.");
    return;
  }

  if (faixaDetalhes.some(track => !track.nome)) {
    alert("Preencha o nome de todas as faixas.");

    const campoVazio = [
      ...trackList.querySelectorAll('[name="faixa"]')
    ].find(input => !input.value.trim());

    campoVazio?.focus();
    return;
  }

  if (faixaDetalhes.some(track => !track.linkValido)) {
    alert("Verifique os links informados. Utilize URLs HTTP ou HTTPS.");
    return;
  }

  const salvarObra = coverDataUrl => {
    const quantidadeFaixas = faixaDetalhes.length;

    const dados = {
      title: titulo.value.trim(),
      year: anoValue,
      tracks: quantidadeFaixas,
      category: getCategory(quantidadeFaixas),
      cover: coverDataUrl,
      faixaDetalhes: faixaDetalhes.map(
        ({ linkValido, ...track }) => track
      )
    };

    if (editingReleaseId !== null) {
      // Edição de lançamento existente.
      const index = releases.findIndex(
        release => release.id === editingReleaseId
      );

      if (index === -1) {
        alert("Lançamento não encontrado.");
        return;
      }

      const releaseAnterior = releases[index];

      releases[index] = {
        ...releaseAnterior,
        ...dados,
        cover: coverDataUrl || releaseAnterior.cover || null
      };

      if (!saveReleases()) {
        releases[index] = releaseAnterior;
        return;
      }

      alert("Lançamento atualizado com sucesso!");

    } else {
      // Cadastro de novo lançamento.
      const novoLancamento = {
        id: Date.now(),
        ...dados
      };

      releases.unshift(novoLancamento);

      if (!saveReleases()) {
        releases.shift();
        return;
      }

      alert("Lançamento cadastrado com sucesso!");
    }

    renderReleases();
    closeModal();
  };

  // Converte a imagem em Data URL para armazená-la no navegador.
  const coverFile = coverInput.files[0];

  if (coverFile) {
    if (!coverFile.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem válido.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => salvarObra(reader.result);

    reader.onerror = () => {
      alert("Não foi possível carregar a imagem da capa.");
    };

    reader.readAsDataURL(coverFile);

  } else {
    const releaseAnterior = editingReleaseId !== null
      ? releases.find(r => r.id === editingReleaseId)
      : null;

    salvarObra(releaseAnterior?.cover || null);
  }
});

/* ---------- Eventos dos cards: editar e excluir ---------- */

grid.addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-id]");
  const deleteButton = event.target.closest("[data-delete-id]");

  if (editButton) {
    const id = Number(editButton.dataset.editId);

    const release = releases.find(item => item.id === id);

    if (release) openModal(release);
  }

  if (deleteButton) {
    const id = Number(deleteButton.dataset.deleteId);

    const release = releases.find(item => item.id === id);

    if (!release) return;

    const confirmar = confirm(
      `Deseja realmente excluir o lançamento "${release.title}"?`
    );

    if (!confirmar) return;

    const index = releases.findIndex(item => item.id === id);
    const [removido] = releases.splice(index, 1);

    if (!saveReleases()) {
      releases.splice(index, 0, removido);
      return;
    }

    renderReleases();

    alert("Lançamento excluído com sucesso!");
  }
});

/* ---------- Inicialização ---------- */

renderReleases();
updateTrackUI();

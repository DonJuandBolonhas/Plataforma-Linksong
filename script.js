/* =========================================================
   CONEXÃO SONORA — GERENCIAMENTO DE LANÇAMENTOS
   Integração com Supabase (Postgres + Storage).
   ========================================================= */

import { supabase } from "./supabase-client.js";

const COVERS_BUCKET = "midia";

/* ---------- Estado ---------- */

let releases = [];
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

/* ---------- Elementos HTML ---------- */

const grid = document.getElementById("releaseGrid");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("modal");
const form = document.getElementById("releaseForm");
const submitButton = document.getElementById("btnPublicar");

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

const searchInput = document.querySelector('.search input[type="search"]');
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

/* =========================================================
   SUPABASE — ACESSO A DADOS
   ========================================================= */

/** Carrega os lançamentos e suas respectivas faixas. */
async function fetchReleases() {
  const { data, error } = await supabase
    .from("midia")
    .select(`
      id,
      titulo,
      tipo,
      dataEnvio,
      capa_url,
      faixas (
        id,
        numero,
        nome,
        duracao,
        link
      )
    `)
    .order("dataEnvio", { ascending: false });

  if (error) {
    console.error("Erro ao carregar lançamentos:", error);
    alert("Não foi possível carregar seus lançamentos.");
    return;
  }

  releases = (data || []).map(release => {
    const faixas = [...(release.faixas || [])]
      .sort((a, b) => Number(a.numero) - Number(b.numero));

    return {
      id: release.id,
      title: release.titulo,
      year: release.dataEnvio || "",
      cover: release.capa_url,
      tracks: faixas.length,
      category: release.tipo,
      faixaDetalhes: faixas.map(track => ({
        numero: track.numero,
        nome: track.nome,
        duracao: track.duracao || "",
        link: track.link || ""
      }))
    };
  });

  renderReleases();
}

/** Envia a imagem para o Supabase Storage. */
async function uploadCover(file) {
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(COVERS_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/** Recupera o caminho do arquivo através da URL pública. */
function coverPathFromUrl(url) {
  if (!url) return null;

  const marker = `/${COVERS_BUCKET}/`;
  const index = url.indexOf(marker);

  return index === -1
    ? null
    : decodeURIComponent(url.slice(index + marker.length));
}

/** Remove uma imagem do Storage. */
async function removeCover(url) {
  const path = coverPathFromUrl(url);

  if (!path) return;

  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .remove([path]);

  if (error) {
    console.warn("Não foi possível remover a capa:", error);
  }
}

/** Cadastra ou atualiza o lançamento e suas faixas. */
async function persistRelease(dados, coverUrl) {
  let releaseId = editingReleaseId;

  const categoria = getCategory(dados.faixaDetalhes.length);

  // Dados da tabela midia.
  const dadosMidia = {
    titulo: dados.title,
    tipo: categoria,
    dataEnvio: String(dados.year),
    capa_url: coverUrl,
    url: null
  };

  // 1. Cadastro ou edição da mídia.
  if (releaseId !== null) {

    const { error } = await supabase
      .from("midia")
      .update(dadosMidia)
      .eq("id", releaseId);

    if (error) throw error;

    // 2. Remove as faixas anteriores.
    const { error: deleteError } = await supabase
      .from("faixas")
      .delete()
      .eq("id_midia", releaseId);

    if (deleteError) throw deleteError;

  } else {

    const { data, error } = await supabase
      .from("midia")
      .insert(dadosMidia)
      .select("id")
      .single();

    if (error) throw error;

    releaseId = data.id;
  }

  // 3. Prepara as faixas para inserção.
  const faixasParaInserir = dados.faixaDetalhes.map(track => ({
    numero: track.numero,
    nome: track.nome,
    duracao: track.duracao || null,
    link: track.link || null,
    id_midia: releaseId
  }));

  // 4. Insere as faixas na tabela faixas.
  const { error: tracksError } = await supabase
    .from("faixas")
    .insert(faixasParaInserir);

  if (tracksError) throw tracksError;
}

/* =========================================================
   CARDS DOS LANÇAMENTOS
   ========================================================= */

function cardTemplate(release) {
  const cover = release.cover
    ? `<img src="${escapeHTML(release.cover)}" alt="Capa de ${escapeHTML(release.title)}">`
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
            data-edit-id="${escapeHTML(release.id)}"
            aria-label="Editar ${escapeHTML(release.title)}">
            <svg viewBox="0 0 24 24" width="17" height="17"
              fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>

          <button class="icon-btn icon-btn--danger"
            type="button"
            data-delete-id="${escapeHTML(release.id)}"
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
          ${escapeHTML(release.year)} · ${release.tracks}
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

  // Ordenação.
  if (sortSelect) {
    switch (sortSelect.selectedIndex) {
      case 1:
        filteredReleases.sort((a, b) =>
          Number(a.year) - Number(b.year)
        );
        break;

      case 2:
        filteredReleases.sort((a, b) =>
          a.title.localeCompare(b.title, "pt-BR")
        );
        break;

      default:
        filteredReleases.sort((a, b) =>
          Number(b.year) - Number(a.year)
        );
    }
  }

  grid.innerHTML = filteredReleases
    .map(cardTemplate)
    .join("");

  const hasReleases = filteredReleases.length > 0;

  grid.hidden = !hasReleases;
  emptyState.hidden = hasReleases;

  // Estatísticas de todos os lançamentos.
  statTotal.textContent = releases.length;

  statSingle.textContent =
    releases.filter(r => r.category === "single").length;

  statEp.textContent =
    releases.filter(r => r.category === "ep").length;

  statAlbum.textContent =
    releases.filter(r => r.category === "album").length;

  // Mensagem do estado vazio.
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

  // Remove a faixa selecionada.
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

/** Atualiza a numeração, quantidade e categoria das faixas. */
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

form.addEventListener("submit", async event => {
  event.preventDefault();

  const anoValue = ano.value.trim();

  titulo.classList.toggle("invalid", !titulo.value.trim());
  ano.classList.toggle("invalid", !anoValue);

  // Validação do título e ano.
  if (!titulo.value.trim() || !anoValue) {
    alert("Preencha o título e o ano do lançamento.");
    return;
  }

  if (!/^\d{4}$/.test(anoValue) ||
      Number(anoValue) < 1900 ||
      Number(anoValue) > 2100) {
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

  // Verifica se existe pelo menos uma faixa.
  if (faixaDetalhes.length === 0) {
    alert("Adicione pelo menos uma faixa.");
    return;
  }

  // Verifica se todas as faixas possuem nome.
  if (faixaDetalhes.some(track => !track.nome)) {
    alert("Preencha o nome de todas as faixas.");

    const campoVazio = [
      ...trackList.querySelectorAll('[name="faixa"]')
    ].find(input => !input.value.trim());

    campoVazio?.focus();
    return;
  }

  // Verifica os links.
  if (faixaDetalhes.some(track => !track.linkValido)) {
    alert("Verifique os links informados. Utilize URLs HTTP ou HTTPS.");
    return;
  }

  const coverFile = coverInput.files[0];

  if (coverFile && !coverFile.type.startsWith("image/")) {
    alert("Selecione um arquivo de imagem válido.");
    return;
  }

  // Recupera o lançamento anterior em caso de edição.
  const releaseAnterior = editingReleaseId !== null
    ? releases.find(r => String(r.id) === String(editingReleaseId))
    : null;

  // Organiza os dados do lançamento.
  const dados = {
    title: titulo.value.trim(),
    year: anoValue,
    faixaDetalhes: faixaDetalhes.map(({ linkValido, ...track }) => track)
  };

  const eraEdicao = editingReleaseId !== null;

  // Evita cliques duplos enquanto salva.
  submitButton.disabled = true;

  const textoOriginal = submitButton.textContent;
  submitButton.textContent = "Salvando...";

  let novaCapaUrl = null;

  try {
    // 1. Mantém a capa antiga ou envia uma nova.
    let coverUrl = releaseAnterior?.cover || null;

    if (coverFile) {
      novaCapaUrl = await uploadCover(coverFile);
      coverUrl = novaCapaUrl;
    }

    // 2. Salva o lançamento e suas faixas no banco.
    await persistRelease(dados, coverUrl);

    // 3. Remove a capa antiga caso tenha sido substituída.
    if (coverFile && releaseAnterior?.cover) {
      await removeCover(releaseAnterior.cover);
    }

    // 4. Atualiza os lançamentos exibidos.
    await fetchReleases();

    // 5. Fecha o modal.
    closeModal();

    alert(eraEdicao
      ? "Lançamento atualizado com sucesso!"
      : "Lançamento cadastrado com sucesso!");

  } catch (error) {
    console.error("Erro ao salvar lançamento:", error);

    // Remove a nova capa caso o cadastro tenha falhado.
    if (novaCapaUrl) {
      await removeCover(novaCapaUrl);
    }

    alert("Não foi possível salvar o lançamento. Tente novamente.");

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = textoOriginal;
  }
});

/* ---------- Eventos dos cards: editar e excluir ---------- */

grid.addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit-id]");
  const deleteButton = event.target.closest("[data-delete-id]");

  // Edição do lançamento.
  if (editButton) {
    const id = editButton.dataset.editId;

    const release = releases.find(item =>
      String(item.id) === id
    );

    if (release) openModal(release);
  }

  // Exclusão do lançamento.
  if (deleteButton) {
    const id = deleteButton.dataset.deleteId;

    const release = releases.find(item =>
      String(item.id) === id
    );

    if (!release) return;

    const confirmar = confirm(
      `Deseja realmente excluir o lançamento "${release.title}"?`
    );

    if (!confirmar) return;

    deleteButton.disabled = true;

    try {
      // 1. Exclui as faixas relacionadas.
      const { error: tracksError } = await supabase
        .from("faixas")
        .delete()
        .eq("id_midia", id);

      if (tracksError) throw tracksError;

      // 2. Exclui o lançamento.
      const { error } = await supabase
        .from("midia")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // 3. Remove a capa do Storage.
      await removeCover(release.cover);

      // 4. Atualiza a interface.
      await fetchReleases();

      alert("Lançamento excluído com sucesso!");

    } catch (error) {
      console.error("Erro ao excluir lançamento:", error);
      alert("Não foi possível excluir o lançamento.");
      deleteButton.disabled = false;
    }
  }
});

/* ---------- Inicialização ---------- */

updateTrackUI();
await fetchReleases();
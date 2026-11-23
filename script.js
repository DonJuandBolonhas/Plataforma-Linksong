
/* =========================================================
   CONEXÃO SONORA — Gestão de Lançamentos Musicais
   Funcionalidades: cadastro, edição, exclusão e persistência.
   ========================================================= */

const STORAGE_KEY = "conexaoSonora.lancamentos";

let releases = loadReleases();
let editingReleaseId = null;

const CATEGORY_LABEL = {
    single: "Single",
    ep: "EP",
    album: "Álbum"
};

/* ---------- Elementos do HTML ---------- */

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

const submitButton = form.querySelector('[type="submit"]');

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

        alert(
            "Não foi possível salvar os dados. " +
            "Verifique o espaço disponível no navegador."
        );

        return false;
    }
}

/* ---------- Classificação automática ---------- */

function getCategory(trackAmount) {
    if (trackAmount <= 3) return "single";
    if (trackAmount <= 6) return "ep";
    return "album";
}

/* ---------- Segurança na exibição de textos ---------- */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

/* ---------- Capa do lançamento ---------- */

function coverArt() {
    return `
        <div class="card__cover-art">
            <svg viewBox="0 0 24 24"
                width="54"
                height="54"
                fill="none"
                stroke="#fff"
                stroke-width="1.4"
                stroke-linecap="round"
                stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <circle cx="12" cy="12" r="2.5"/>
            </svg>
        </div>
    `;
}

/* ---------- Modelo visual dos cards ---------- */

function cardTemplate(release) {
    const title = escapeHTML(release.title);
    const category = escapeHTML(release.category);
    const year = escapeHTML(release.year);

    const cover = release.cover
        ? `<img src="${release.cover}" alt="Capa de ${title}">`
        : coverArt();

    return `
        <article class="card" data-category="${category}">

            <div class="card__cover">
                ${cover}

                <div class="card__actions">

                    <button
                        class="icon-btn"
                        type="button"
                        data-edit-id="${release.id}"
                        aria-label="Editar ${title}">

                        <svg viewBox="0 0 24 24"
                            width="17"
                            height="17"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>

                    </button>

                    <button
                        class="icon-btn icon-btn--danger"
                        type="button"
                        data-delete-id="${release.id}"
                        aria-label="Excluir ${title}">

                        <svg viewBox="0 0 24 24"
                            width="17"
                            height="17"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M8 6V4h8v2"/>
                            <path d="M6 6l1 14h10l1-14"/>
                        </svg>

                    </button>

                </div>
            </div>

            <div class="card__body">

                <div class="card__top">
                    <span class="badge badge--${category}">
                        ${CATEGORY_LABEL[release.category]}
                    </span>
                </div>

                <h3 class="card__title" title="${title}">
                    ${title}
                </h3>

                <p class="card__meta">
                    ${year} · ${release.tracks}
                    ${release.tracks === 1 ? "faixa" : "faixas"}
                </p>

            </div>
        </article>
    `;
}

/* ---------- Renderização dos lançamentos ---------- */

function renderReleases() {
    grid.innerHTML = releases.map(cardTemplate).join("");

    const hasReleases = releases.length > 0;

    grid.hidden = !hasReleases;
    emptyState.hidden = hasReleases;

    statTotal.textContent = releases.length;

    statSingle.textContent = releases.filter(
        release => release.category === "single"
    ).length;

    statEp.textContent = releases.filter(
        release => release.category === "ep"
    ).length;

    statAlbum.textContent = releases.filter(
        release => release.category === "album"
    ).length;
}

/* ---------- Ações dos cards: editar e excluir ---------- */

grid.addEventListener("click", event => {

    // Edição
    const editButton = event.target.closest("[data-edit-id]");

    if (editButton) {
        const releaseId = Number(editButton.dataset.editId);

        const release = releases.find(
            item => item.id === releaseId
        );

        if (release) {
            openModal(release);
        }

        return;
    }

    // Exclusão
    const deleteButton = event.target.closest("[data-delete-id]");

    if (deleteButton) {
        const releaseId = Number(deleteButton.dataset.deleteId);

        const release = releases.find(
            item => item.id === releaseId
        );

        if (!release) return;

        const confirmar = confirm(
            `Tem certeza que deseja excluir "${release.title}"?`
        );

        if (!confirmar) return;

        const releasesAnteriores = releases;

        releases = releases.filter(
            item => item.id !== releaseId
        );

        if (!saveReleases()) {
            releases = releasesAnteriores;
            return;
        }

        renderReleases();

        alert("Lançamento excluído com sucesso!");
    }
});

/* ---------- Modal: cadastro e edição ---------- */

function openModal(release = null) {

    editingReleaseId = release ? release.id : null;

    modal.hidden = false;
    document.body.style.overflow = "hidden";

    form.reset();
    trackList.innerHTML = "";

    coverPreview.hidden = true;
    coverPreview.removeAttribute("src");
    coverHint.hidden = false;

    if (release) {

        // Preenche os dados para edição
        modalTitle.textContent = "Editar Lançamento Musical";
        submitButton.textContent = "Salvar alterações";

        titulo.value = release.title;
        ano.value = release.year;

        if (release.cover) {
            coverPreview.src = release.cover;
            coverPreview.hidden = false;
            coverHint.hidden = true;
        }

        if (release.faixaDetalhes?.length) {
            release.faixaDetalhes.forEach(track => {
                addTrack(track);
            });
        } else {
            addTrack();
        }

    } else {

        // Prepara o formulário para novo cadastro
        modalTitle.textContent = "Novo Lançamento Musical";
        submitButton.textContent = "Salvar lançamento";

        addTrack();
    }

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
    submitButton.textContent = "Salvar lançamento";

    updateTrackUI();
}

/* ---------- Eventos do modal ---------- */

document.getElementById("btnNovo").addEventListener("click", () => {
    openModal();
});

document.querySelectorAll("[data-open-modal]").forEach(button => {
    button.addEventListener("click", () => openModal());
});

document.getElementById("btnFechar").addEventListener("click", closeModal);
document.getElementById("btnCancelar").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) {
        closeModal();
    }
});

/* ---------- Gerenciamento das faixas ---------- */

function addTrack(track = {}) {

    const li = document.createElement("li");
    li.className = "track";

    li.innerHTML = `
        <span class="track__num"></span>

        <input
            type="text"
            name="faixa"
            placeholder="Nome da faixa"
            aria-label="Nome da faixa">

        <input
            type="text"
            class="duration"
            name="duracao"
            placeholder="mm:ss"
            maxlength="5"
            aria-label="Duração">

        <button
            class="icon-btn icon-btn--danger"
            type="button"
            aria-label="Remover faixa">

            <svg viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>
            </svg>

        </button>

        <div class="track__link">

            <svg viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/>
                <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>
            </svg>

            <input
                type="url"
                class="link-input"
                name="link"
                placeholder="Link da música (Spotify, YouTube, SoundCloud...)"
                aria-label="Link da música">

        </div>
    `;

    li.querySelector('[name="faixa"]').value = track.nome || "";
    li.querySelector('[name="duracao"]').value = track.duracao || "";
    li.querySelector('[name="link"]').value = track.link || "";

    // Remover faixa
    li.querySelector(".icon-btn").addEventListener("click", () => {
        li.remove();
        updateTrackUI();
    });

    li.querySelector(".link-input").addEventListener("input", event => {
        event.target.classList.remove("invalid");
    });

    trackList.appendChild(li);

    updateTrackUI();

    li.querySelector('[name="faixa"]').focus();
}

/* ---------- Atualização visual das faixas ---------- */

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
        items.length
            ? `badge--${category}`
            : "badge--muted"
    }`;
}

document.getElementById("btnAddFaixa").addEventListener("click", () => {
    addTrack();
});

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

    reader.onerror = () => {
        alert("Não foi possível carregar a imagem da capa.");
    };

    reader.readAsDataURL(file);
});

/* ---------- Cadastro e edição de lançamentos ---------- */

form.addEventListener("submit", event => {

    event.preventDefault();

    const tituloValue = titulo.value.trim();
    const anoValue = Number(ano.value);

    titulo.classList.toggle("invalid", !tituloValue);
    ano.classList.toggle("invalid", !ano.value.trim());

    if (!tituloValue || !ano.value.trim()) {
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

    // Coleta os dados das faixas
    const faixaDetalhes = [...trackList.querySelectorAll(".track")]
        .map((li, index) => {

            const nome = li.querySelector('[name="faixa"]').value.trim();
            const duracao = li.querySelector('[name="duracao"]').value.trim();
            const link = li.querySelector('[name="link"]').value.trim();
            const linkInput = li.querySelector('[name="link"]');

            let linkValido = true;

            if (link) {
                try {
                    linkValido = ["http:", "https:"].includes(
                        new URL(link).protocol
                    );
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

    if (!faixaDetalhes.length) {
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
        alert("Informe links válidos utilizando HTTP ou HTTPS.");
        return;
    }

    const salvarLancamento = coverDataUrl => {

        const quantidadeFaixas = faixaDetalhes.length;

        const dadosLancamento = {
            id: editingReleaseId ?? Date.now(),
            title: tituloValue,
            year: anoValue,
            tracks: quantidadeFaixas,
            category: getCategory(quantidadeFaixas),
            cover: coverDataUrl,
            faixaDetalhes: faixaDetalhes.map(
                ({ linkValido, ...track }) => track
            )
        };

        if (editingReleaseId !== null) {

            // Atualiza o lançamento existente
            const index = releases.findIndex(
                item => item.id === editingReleaseId
            );

            if (index === -1) return;

            const releaseAnterior = releases[index];

            releases[index] = dadosLancamento;

            if (!saveReleases()) {
                releases[index] = releaseAnterior;
                return;
            }

            alert("Lançamento atualizado com sucesso!");

        } else {

            // Cadastra um novo lançamento
            releases.unshift(dadosLancamento);

            if (!saveReleases()) {
                releases.shift();
                return;
            }

            alert("Lançamento cadastrado com sucesso!");
        }

        renderReleases();
        closeModal();
    };

    // Mantém a capa anterior caso nenhuma nova seja selecionada
    const coverFile = coverInput.files[0];

    if (coverFile) {

        const reader = new FileReader();

        reader.onload = () => {
            salvarLancamento(reader.result);
        };

        reader.onerror = () => {
            alert("Não foi possível carregar a imagem da capa.");
        };

        reader.readAsDataURL(coverFile);

    } else {

        const releaseAnterior = releases.find(
            item => item.id === editingReleaseId
        );

        salvarLancamento(releaseAnterior?.cover || null);
    }
});

/* ---------- Filtros visuais ---------- */

document.querySelectorAll(".chip").forEach(chip => {

    chip.addEventListener("click", () => {

        document.querySelectorAll(".chip").forEach(item => {
            item.classList.remove("chip--active");
        });

        chip.classList.add("chip--active");

        // A aplicação do filtro por categoria pode ser implementada aqui.
    });
});

/* ---------- Inicialização ---------- */

renderReleases();
updateTrackUI();

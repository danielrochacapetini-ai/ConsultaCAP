/**
 * APP.JS - Lógica do Sistema de Consulta de Peças
 * Marcopolo São Mateus
 */

// Estado da navegação
let estadoAtual = {
    tela: 'home', // home, categorias, pecas, peca
    modelo: null,
    categoria: null,
    peca: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderizarHome();
    configurarBusca();
});

// ============================================
// NAVEGAÇÃO
// ============================================

function navegarPara(tela, param) {
    switch (tela) {
        case 'home':
            estadoAtual = { tela: 'home', modelo: null, categoria: null, peca: null };
            renderizarHome();
            break;
        case 'categorias':
            estadoAtual = { tela: 'categorias', modelo: param, categoria: null, peca: null };
            renderizarCategorias(param);
            break;
        case 'pecas':
            estadoAtual = { ...estadoAtual, tela: 'pecas', categoria: param, peca: null };
            renderizarPecas(estadoAtual.modelo, param);
            break;
        case 'peca':
            estadoAtual = { ...estadoAtual, tela: 'peca', peca: param };
            abrirModal(param);
            break;
    }
    atualizarBreadcrumb();
}

function atualizarBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    let html = '<a href="#" onclick="navegarPara(\'home\')">INÍCIO</a>';

    if (estadoAtual.modelo) {
        const modelo = MODELOS.find(m => m.id === estadoAtual.modelo);
        html += `<span>›</span><a href="#" onclick="navegarPara('categorias', '${estadoAtual.modelo}')">${modelo.nome}</a>`;
    }

    if (estadoAtual.categoria) {
        const categoria = CATEGORIAS.find(c => c.id === estadoAtual.categoria);
        html += `<span>›</span><a href="#" onclick="navegarPara('pecas', '${estadoAtual.categoria}')">${categoria.nome}</a>`;
    }

    breadcrumb.innerHTML = html;
}

// ============================================
// RENDERIZAÇÃO
// ============================================

function renderizarHome() {
    const main = document.getElementById('mainContent');
    let html = '<div class="cards-grid">';

    MODELOS.forEach(modelo => {
        const qtdPecas = pecas.filter(p => p.modelo === modelo.id).length;
        html += `
            <div class="card" onclick="navegarPara('categorias', '${modelo.id}')">
                <div class="card-icon">
                    ${getIconeModelo()}
                </div>
                <h3>${modelo.nome}</h3>
                <p>${qtdPecas} peça${qtdPecas !== 1 ? 's' : ''} cadastrada${qtdPecas !== 1 ? 's' : ''}</p>
            </div>
        `;
    });

    html += '</div>';
    main.innerHTML = html;
}

function renderizarCategorias(modeloId) {
    const main = document.getElementById('mainContent');
    let html = '<div class="cards-grid">';

    CATEGORIAS.forEach(cat => {
        const qtdPecas = pecas.filter(p => p.modelo === modeloId && p.categoria === cat.id).length;
        html += `
            <div class="card" onclick="navegarPara('pecas', '${cat.id}')">
                <div class="card-icon categoria-icon">
                    ${getIconeCategoria(cat.id)}
                </div>
                <h3>${cat.nome}</h3>
                <p>${qtdPecas} peça${qtdPecas !== 1 ? 's' : ''}</p>
            </div>
        `;
    });

    html += '</div>';
    main.innerHTML = html;
}

function renderizarPecas(modeloId, categoriaId) {
    const main = document.getElementById('mainContent');
    const pecasFiltradas = pecas.filter(p => p.modelo === modeloId && p.categoria === categoriaId);

    if (pecasFiltradas.length === 0) {
        main.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="#CCC">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
                </svg>
                <h3>NENHUMA PEÇA CADASTRADA</h3>
                <p>Ainda não há peças nesta categoria para este modelo.</p>
            </div>
        `;
        return;
    }

    let html = '<div class="pecas-grid">';

    pecasFiltradas.forEach((peca, index) => {
        html += `
            <div class="peca-card" onclick="navegarPara('peca', ${pecas.indexOf(peca)})">
                <img class="peca-imagem" src="${peca.imagem}" alt="${peca.nome}" onerror="this.src='placeholder.svg'">
                <div class="peca-info">
                    <div class="peca-nome">${peca.nome}</div>
                    <div class="peca-codigo">${peca.codigo}</div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    main.innerHTML = html;
}

// ============================================
// MODAL
// ============================================

function abrirModal(pecaIndex) {
    const peca = pecas[pecaIndex];
    if (!peca) return;

    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    const modalNome = document.getElementById('modalNome');
    const modalCodigo = document.getElementById('modalCodigo');

    modalImage.src = peca.imagem;
    modalImage.alt = peca.nome;
    modalNome.textContent = peca.nome;
    modalCodigo.textContent = `Código: ${peca.codigo}`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Fechar modal com ESC ou clicando fora
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharModal();
});

document.addEventListener('click', (e) => {
    const modal = document.getElementById('modal');
    if (e.target === modal) fecharModal();
});

// ============================================
// BUSCA
// ============================================

function configurarBusca() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');

    input.addEventListener('input', (e) => {
        const termo = e.target.value.trim().toUpperCase();

        if (termo.length < 2) {
            results.classList.remove('active');
            results.innerHTML = '';
            return;
        }

        const resultados = pecas.filter(p =>
            p.nome.toUpperCase().includes(termo) ||
            p.codigo.toUpperCase().includes(termo)
        );

        if (resultados.length === 0) {
            results.innerHTML = '<div class="search-result-item"><span class="result-nome">Nenhum resultado encontrado</span></div>';
            results.classList.add('active');
            return;
        }

        let html = '';
        resultados.slice(0, 15).forEach((peca, i) => {
            const modelo = MODELOS.find(m => m.id === peca.modelo);
            const categoria = CATEGORIAS.find(c => c.id === peca.categoria);
            html += `
                <div class="search-result-item" onclick="irParaPecaBusca('${peca.modelo}', '${peca.categoria}', ${pecas.indexOf(peca)})">
                    <div class="result-nome">${peca.nome}</div>
                    <div class="result-codigo">${peca.codigo}</div>
                    <div class="result-caminho">${modelo.nome} › ${categoria.nome}</div>
                </div>
            `;
        });

        if (resultados.length > 15) {
            html += `<div class="search-result-item"><span class="result-caminho">... e mais ${resultados.length - 15} resultados</span></div>`;
        }

        results.innerHTML = html;
        results.classList.add('active');
    });

    // Fechar resultados ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-area')) {
            results.classList.remove('active');
        }
    });
}

function irParaPecaBusca(modeloId, categoriaId, pecaIndex) {
    estadoAtual = { tela: 'pecas', modelo: modeloId, categoria: categoriaId, peca: pecaIndex };
    renderizarPecas(modeloId, categoriaId);
    atualizarBreadcrumb();
    abrirModal(pecaIndex);

    // Limpar busca
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').classList.remove('active');
}

// ============================================
// ÍCONES SVG
// ============================================

function getIconeModelo() {
    return `<svg viewBox="0 0 24 24" fill="white">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>`;
}

function getIconeCategoria(categoriaId) {
    const icones = {
        FABRICADOS: `<svg viewBox="0 0 24 24" fill="white"><path d="M22 7l-2-2h-4l-2-2H4L2 5v14l2 2h16l2-2V7zm-6 0H8V5h8v2z"/></svg>`,
        PLASTICOS: `<svg viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>`,
        PERFIS: `<svg viewBox="0 0 24 24" fill="white"><path d="M3 17h18v2H3v-2zm0-5h18v2H3v-2zm0-5h18v2H3V7z"/><path d="M3 3h18v2H3V3z"/></svg>`,
        ILUMINACAO: `<svg viewBox="0 0 24 24" fill="white"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>`,
        ADESIVOS: `<svg viewBox="0 0 24 24" fill="white"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/></svg>`
    };
    return icones[categoriaId] || icones.FABRICADOS;
}

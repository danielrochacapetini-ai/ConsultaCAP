var MODELOS = [
    { id: "VOLARE_MV9L", nome: "VOLARE MV9L" },
    { id: "VOLARE_V9L", nome: "VOLARE V9L" },
    { id: "VOLARE_W9C", nome: "VOLARE W9C" },
    { id: "VOLARE_MV8L", nome: "VOLARE MV8L" },
    { id: "VOLARE_V8L", nome: "VOLARE V8L" },
    { id: "VOLARE_WL", nome: "VOLARE WL" },
    { id: "VOLARE_V10L", nome: "VOLARE V10L" },
    { id: "VOLARE_W12", nome: "VOLARE W12" },
    { id: "MDS", nome: "MDS" },
    { id: "ORE_1", nome: "ORE 1" },
    { id: "ONUREA", nome: "ONUREA" }
];

var CATEGORIAS = [
    { id: "FABRICADOS", nome: "FABRICADOS" },
    { id: "PLASTICOS", nome: "PLÁSTICOS" },
    { id: "PERFIS", nome: "PERFIS" },
    { id: "ILUMINACAO", nome: "ILUMINAÇÃO" },
    { id: "ADESIVOS", nome: "ADESIVOS" }
];

var pecas = [];
var pecas1700 = [];

var estadoAtual = {
    tela: 'home',
    modelo: null,
    categoria: null
};

document.addEventListener('DOMContentLoaded', function() {
    carregarPecasFirebase();
    configurarBusca();
});

function carregarPecasFirebase() {
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div class="loading-inicial"><div class="loading-spinner"></div><p>Carregando peças...</p></div>';

    // Carregar peças normais
    db.collection('pecas').get().then(function(snapshot) {
        pecas = [];
        snapshot.forEach(function(doc) {
            var data = doc.data();
            // Só adiciona se não for do Depósito 1700 (opcional, mas evita duplicados se já estiverem marcados)
            if (!data.deposito || data.deposito !== '1700') {
                pecas.push({
                    id: doc.id,
                    modelo: data.modelo,
                    categoria: data.categoria,
                    nome: data.nome,
                    codigo: data.codigo,
                    imagem: data.imagem || data.imagem_url
                });
            } else {
                // Se já estiver marcado como 1700, vai para a lista específica
                pecas1700.push({
                    id: doc.id,
                    nome: data.nome || 'Peça Depósito 1700',
                    codigo: data.codigo,
                    imagem: data.imagem_url,
                    deposito: '1700'
                });
            }
        });
        
        // Se houver peças marcadas como 1700 que não foram carregadas acima, garantimos o carregamento
        // Aqui também poderíamos fazer uma query específica: db.collection('pecas').where('deposito', '==', '1700').get()...
        
        console.log('Peças carregadas: ' + pecas.length);
        console.log('Peças 1700 carregadas: ' + pecas1700.length);
        renderizarHome();
    }).catch(function(error) {
        console.log('Erro ao carregar Firebase: ' + error.message);
        main.innerHTML = '<div class="loading-inicial"><p>Erro ao carregar dados. Verifique a conexão.</p></div>';
    });
}

// ============================================
// NAVEGAÇÃO
// ============================================

function navegarPara(tela, param) {
    document.getElementById('searchInput').value = '';

    switch (tela) {
        case 'home':
            estadoAtual = { tela: 'home', modelo: null, categoria: null };
            renderizarHome();
            break;
        case 'categorias':
            estadoAtual = { tela: 'categorias', modelo: param, categoria: null };
            renderizarCategorias(param);
            break;
        case 'pecas':
            estadoAtual = { tela: 'pecas', modelo: estadoAtual.modelo, categoria: param };
            renderizarPecas(estadoAtual.modelo, param);
            break;
        case 'peca':
            abrirModal(param);
            break;
    }
    atualizarBreadcrumb();
}

function atualizarBreadcrumb() {
    var breadcrumb = document.getElementById('breadcrumb');
    var html = '<a href="#" onclick="navegarPara(\'home\')">INÍCIO</a>';

    if (estadoAtual.tela === 'busca') {
        html += '<span>›</span><span class="breadcrumb-atual">RESULTADO DA BUSCA</span>';
        breadcrumb.innerHTML = html;
        return;
    }

    if (estadoAtual.modelo) {
        var modelo = MODELOS.find(function(m) { return m.id === estadoAtual.modelo; });
        html += '<span>›</span><a href="#" onclick="navegarPara(\'categorias\', \'' + estadoAtual.modelo + '\')">' + modelo.nome + '</a>';
    }

    if (estadoAtual.categoria) {
        var categoria = CATEGORIAS.find(function(c) { return c.id === estadoAtual.categoria; });
        html += '<span>›</span><a href="#" onclick="navegarPara(\'pecas\', \'' + estadoAtual.categoria + '\')">' + categoria.nome + '</a>';
    }

    breadcrumb.innerHTML = html;
}

// ============================================
// RENDERIZAÇÃO
// ============================================

function renderizarHome() {
    var main = document.getElementById('mainContent');
    var html = '<div class="cards-grid">';

    MODELOS.forEach(function(modelo) {
        var qtdPecas = pecas.filter(function(p) { return p.modelo === modelo.id; }).length;
        html += '<div class="card" onclick="navegarPara(\'categorias\', \'' + modelo.id + '\')">';
        html += '<div class="card-icon">' + getIconeModelo() + '</div>';
        html += '<h3>' + modelo.nome + '</h3>';
        html += '<p>' + qtdPecas + ' peça' + (qtdPecas !== 1 ? 's' : '') + ' cadastrada' + (qtdPecas !== 1 ? 's' : '') + '</p>';
        html += '</div>';
    });

    html += '</div>';
    main.innerHTML = html;
}

function renderizarCategorias(modeloId) {
    var main = document.getElementById('mainContent');
    var html = '<div class="cards-grid">';

    CATEGORIAS.forEach(function(cat) {
        var qtdPecas = pecas.filter(function(p) { return p.modelo === modeloId && p.categoria === cat.id; }).length;
        html += '<div class="card" onclick="navegarPara(\'pecas\', \'' + cat.id + '\')">';
        html += '<div class="card-icon categoria-icon">' + getIconeCategoria(cat.id) + '</div>';
        html += '<h3>' + cat.nome + '</h3>';
        html += '<p>' + qtdPecas + ' peça' + (qtdPecas !== 1 ? 's' : '') + '</p>';
        html += '</div>';
    });

    html += '</div>';
    main.innerHTML = html;
}

function renderizarPecas(modeloId, categoriaId) {
    var main = document.getElementById('mainContent');
    var pecasFiltradas = pecas.filter(function(p) { return p.modelo === modeloId && p.categoria === categoriaId; });

    if (pecasFiltradas.length === 0) {
        main.innerHTML = '<div class="empty-state">' +
            '<svg viewBox="0 0 24 24" fill="#CCC"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>' +
            '<h3>NENHUMA PEÇA CADASTRADA</h3>' +
            '<p>Ainda não há peças nesta categoria para este modelo.</p>' +
            '</div>';
        return;
    }

    var html = '<div class="pecas-grid">';

    pecasFiltradas.forEach(function(peca) {
        var idx = pecas.indexOf(peca);
        html += '<div class="peca-card" onclick="abrirModal(' + idx + ', ' + (peca.deposito === '1700') + ')">';
        html += '<img class="peca-imagem" src="' + (peca.imagem || peca.imagem_url) + '" alt="' + peca.nome + '" onerror="this.src=\'placeholder.svg\'">';
        html += '<div class="peca-info">';
        html += '<div class="peca-nome">' + peca.nome + '</div>';
        html += '<div class="peca-codigo">' + peca.codigo + '</div>';
        html += '</div>';
        html += '</div>';
    });

    html += '</div>';
    main.innerHTML = html;
}

// ============================================
// BUSCA EM TEMPO REAL
// ============================================

function configurarBusca() {
    var input = document.getElementById('searchInput');

    input.addEventListener('input', function() {
        var termo = input.value.trim().toUpperCase();

        if (termo.length < 2) {
            if (estadoAtual.tela === 'busca') {
                estadoAtual.tela = 'home';
                renderizarHome();
                atualizarBreadcrumb();
            }
            return;
        }

        // Busca nas peças normais
        var resultadosNormais = pecas.filter(function(p) {
            return (p.nome && p.nome.toUpperCase().indexOf(termo) !== -1) ||
                   (p.codigo && p.codigo.toUpperCase().indexOf(termo) !== -1);
        });

        // Busca nas peças do Depósito 1700
        var resultados1700 = pecas1700.filter(function(p) {
            return (p.nome && p.nome.toUpperCase().indexOf(termo) !== -1) ||
                   (p.codigo && p.codigo.toUpperCase().indexOf(termo) !== -1);
        });

        var resultados = resultadosNormais.concat(resultados1700);

        estadoAtual.tela = 'busca';
        atualizarBreadcrumb();
        renderizarBusca(resultados, termo);
    });
}

function renderizarBusca(resultados, termo) {
    var main = document.getElementById('mainContent');

    if (resultados.length === 0) {
        main.innerHTML = '<div class="empty-state">' +
            '<svg viewBox="0 0 24 24" fill="#CCC"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' +
            '<h3>NENHUM RESULTADO PARA "' + termo + '"</h3>' +
            '<p>Tente buscar por outro código ou nome de peça.</p>' +
            '</div>';
        return;
    }

    var html = '<div class="busca-header">';
    html += '<h2 class="busca-titulo">RESULTADOS PARA "' + termo + '"</h2>';
    html += '<p class="busca-contagem">' + resultados.length + ' peça' + (resultados.length !== 1 ? 's' : '') + ' encontrada' + (resultados.length !== 1 ? 's' : '') + '</p>';
    html += '</div>';

    html += '<div class="busca-grid">';

    resultados.forEach(function(peca) {
        var is1700 = peca.deposito === '1700';
        var idx = is1700 ? pecas1700.indexOf(peca) : pecas.indexOf(peca);
        
        var modeloNome = "";
        var categoriaNome = "";
        
        if (!is1700) {
            var modelo = MODELOS.find(function(m) { return m.id === peca.modelo; });
            var categoria = CATEGORIAS.find(function(c) { return c.id === peca.categoria; });
            modeloNome = modelo ? modelo.nome : "";
            categoriaNome = categoria ? categoria.nome : "";
        } else {
            modeloNome = "DEPÓSITO 1700";
            categoriaNome = "GERAL";
        }

        html += '<div class="busca-item" onclick="abrirModal(' + idx + ', ' + is1700 + ')">';
        html += '<div class="busca-item-thumb">';
        html += '<img src="' + peca.imagem + '" alt="' + peca.nome + '" onerror="this.src=\'placeholder.svg\'">';
        html += '</div>';
        html += '<div class="busca-item-info">';
        html += '<div class="busca-item-nome">' + peca.nome + '</div>';
        html += '<div class="busca-item-codigo">' + peca.codigo + '</div>';
        html += '<div class="busca-item-caminho">' + modeloNome + (categoriaNome ? ' › ' + categoriaNome : '') + '</div>';
        html += '</div>';
        html += '</div>';
    });

    html += '</div>';
    main.innerHTML = html;
}

// ============================================
// MODAL
// ============================================

function abrirModal(pecaIndex, is1700 = false) {
    var peca = is1700 ? pecas1700[pecaIndex] : pecas[pecaIndex];
    if (!peca) return;

    var modal = document.getElementById('modal');
    var modalImage = document.getElementById('modalImage');
    var modalNome = document.getElementById('modalNome');
    var modalCodigo = document.getElementById('modalCodigo');

    modalImage.src = peca.imagem;
    modalImage.alt = peca.nome;
    modalNome.textContent = peca.nome;
    modalCodigo.textContent = 'Código: ' + peca.codigo;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    var modal = document.getElementById('modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') fecharModal();
});

// ============================================
// ÍCONES SVG
// ============================================

function getIconeModelo() {
    return '<svg viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>';
}

function getIconeCategoria(categoriaId) {
    var icones = {
        FABRICADOS: '<svg viewBox="0 0 24 24" fill="white"><path d="M22 7l-2-2h-4l-2-2H4L2 5v14l2 2h16l2-2V7zm-6 0H8V5h8v2z"/></svg>',
        PLASTICOS: '<svg viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>',
        PERFIS: '<svg viewBox="0 0 24 24" fill="white"><path d="M3 17h18v2H3v-2zm0-5h18v2H3v-2zm0-5h18v2H3V7z"/><path d="M3 3h18v2H3V3z"/></svg>',
        ILUMINACAO: '<svg viewBox="0 0 24 24" fill="white"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>',
        ADESIVOS: '<svg viewBox="0 0 24 24" fill="white"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/></svg>'
    };
    return icones[categoriaId] || icones.FABRICADOS;
}

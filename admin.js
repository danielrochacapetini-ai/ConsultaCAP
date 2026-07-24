var imagemSelecionada = null;

document.addEventListener('DOMContentLoaded', function() {
    configurarUpload();
    configurarFormulario();
    configurarFiltros();
    configurarDeposito();
    carregarPecas();
});

function configurarDeposito() {
    var select = document.getElementById('depositoPeca');
    var outroGroup = document.getElementById('depositoOutroGroup');
    var outroInput = document.getElementById('depositoOutro');

    select.addEventListener('change', function() {
        if (select.value === 'OUTRO') {
            outroGroup.style.display = 'block';
            outroInput.required = true;
        } else {
            outroGroup.style.display = 'none';
            outroInput.required = false;
            outroInput.value = '';
        }
    });
}

// ============================================
// UPLOAD DE IMAGEM
// ============================================

function configurarUpload() {
    var inputFile = document.getElementById('imagemPeca');
    var uploadArea = document.getElementById('uploadArea');
    var preview = document.getElementById('previewImagem');
    var placeholder = document.getElementById('uploadPlaceholder');

    inputFile.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) {
            validarEExibirImagem(file);
        }
    });

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        var file = e.dataTransfer.files[0];
        if (file) {
            validarEExibirImagem(file);
        }
    });
}

function validarEExibirImagem(file) {
    var preview = document.getElementById('previewImagem');
    var placeholder = document.getElementById('uploadPlaceholder');

    if (!file.type.startsWith('image/')) {
        mostrarMensagem('Selecione apenas arquivos de imagem (JPG, PNG)', 'erro');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        mostrarMensagem('A imagem deve ter no máximo 5MB', 'erro');
        return;
    }

    imagemSelecionada = file;

    var reader = new FileReader();
    reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// ============================================
// FORMULÁRIO DE CADASTRO
// ============================================

function configurarFormulario() {
    var form = document.getElementById('formPeca');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        cadastrarPeca();
    });
}

function cadastrarPeca() {
    var modelo = document.getElementById('modelo').value;
    var categoria = document.getElementById('categoria').value;
    var nome = document.getElementById('nomePeca').value.trim().toUpperCase();
    var codigo = document.getElementById('codigoPeca').value.trim().toUpperCase();
    var deposito = document.getElementById('depositoPeca').value;

    if (deposito === 'OUTRO') {
        deposito = document.getElementById('depositoOutro').value.trim().toUpperCase();
    }

    if (!codigo) {
        mostrarMensagem('O C\u00d3DIGO da pe\u00e7a \u00e9 obrigat\u00f3rio.', 'erro');
        return;
    }

    if (!deposito) {
        mostrarMensagem('O DEP\u00d3SITO \u00e9 obrigat\u00f3rio.', 'erro');
        return;
    }

    var btn = document.getElementById('btnCadastrar');
    var btnTexto = document.getElementById('btnTexto');
    var btnLoading = document.getElementById('btnLoading');

    btn.disabled = true;
    btnTexto.textContent = 'ENVIANDO...';
    btnLoading.style.display = 'block';

    var uploadPromise;
    if (imagemSelecionada) {
        var nomeArquivo = (modelo || 'GERAL') + '/' + (categoria || 'GERAL') + '/' + (nome || codigo) + '/' + codigo + '_' + Date.now();
        var ref = storage.ref('pecas/' + nomeArquivo);
        uploadPromise = ref.put(imagemSelecionada).then(function(snapshot) {
            return snapshot.ref.getDownloadURL();
        });
    } else {
        uploadPromise = Promise.resolve('');
    }

    uploadPromise.then(function(url) {
        var dados = {
            codigo: codigo,
            deposito: deposito,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (modelo) dados.modelo = modelo;
        if (categoria) dados.categoria = categoria;
        if (nome) dados.nome = nome;
        if (url) dados.imagem = url;
        return db.collection('pecas').add(dados);
    }).then(function() {
        mostrarMensagem('Peça "' + (nome || codigo) + '" cadastrada com sucesso!', 'sucesso');
        limparFormulario();
        carregarPecas();
    }).catch(function(error) {
        console.log('Erro ao cadastrar:', error);
        mostrarMensagem('Erro ao cadastrar: ' + error.message, 'erro');
    }).finally(function() {
        btn.disabled = false;
        btnTexto.textContent = 'CADASTRAR PEÇA';
        btnLoading.style.display = 'none';
    });
}

function limparFormulario() {
    document.getElementById('formPeca').reset();
    document.getElementById('previewImagem').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'flex';
    document.getElementById('depositoOutroGroup').style.display = 'none';
    document.getElementById('depositoOutro').required = false;
    imagemSelecionada = null;
}

function mostrarMensagem(texto, tipo) {
    var msg = document.getElementById('mensagem');
    msg.textContent = texto;
    msg.className = 'mensagem ' + tipo;
    msg.style.display = 'block';

    setTimeout(function() {
        msg.style.display = 'none';
    }, 5000);
}

// ============================================
// LISTAGEM DE PEÇAS
// ============================================

function configurarFiltros() {
    document.getElementById('filtroModelo').addEventListener('change', carregarPecas);
    document.getElementById('filtroCategoria').addEventListener('change', carregarPecas);
}

function carregarPecas() {
    var filtroModelo = document.getElementById('filtroModelo').value;
    var filtroCategoria = document.getElementById('filtroCategoria').value;
    var lista = document.getElementById('listaPecas');
    var contagem = document.getElementById('contagem');

    lista.innerHTML = '<div class="loading-lista">Carregando peças...</div>';

    var query = db.collection('pecas').orderBy('criadoEm', 'desc');

    if (filtroModelo) {
        query = query.where('modelo', '==', filtroModelo);
    }

    if (filtroCategoria) {
        query = query.where('categoria', '==', filtroCategoria);
    }

    query.get().then(function(snapshot) {
        if (snapshot.empty) {
            lista.innerHTML = '<div class="empty-lista"><svg viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg><p>Nenhuma peça cadastrada</p></div>';
            contagem.textContent = '';
            return;
        }

        var html = '';
        snapshot.forEach(function(doc) {
            var peca = doc.data();
            var id = doc.id;
            html += renderizarItemLista(peca, id);
        });

        lista.innerHTML = html;
        contagem.textContent = snapshot.size + ' peça' + (snapshot.size !== 1 ? 's' : '') + ' encontrada' + (snapshot.size !== 1 ? 's' : '');
    }).catch(function(error) {
        console.log('Erro ao carregar:', error);
        lista.innerHTML = '<div class="empty-lista"><p>Erro ao carregar peças: ' + error.message + '</p></div>';
    });
}

function renderizarItemLista(peca, id) {
    var modeloNome = (peca.modelo || '').replace(/_/g, ' ');
    var categoriaNome = peca.categoria || '';
    var caminho = [modeloNome, categoriaNome].filter(Boolean).join(' › ');
    if (peca.deposito) {
        caminho = 'DEP ' + peca.deposito + (caminho ? ' › ' + caminho : '');
    }
    var imgSrc = peca.imagem || peca.imagem_url || 'placeholder.svg';

    return '<div class="lista-item">' +
        '<div class="lista-item-thumb"><img src="' + imgSrc + '" alt="' + (peca.nome || peca.codigo) + '" onerror="this.src=\'placeholder.svg\'"></div>' +
        '<div class="lista-item-info">' +
        '<div class="lista-item-nome">' + (peca.nome || peca.codigo) + '</div>' +
        '<div class="lista-item-codigo">' + peca.codigo + '</div>' +
        '<div class="lista-item-caminho">' + caminho + '</div>' +
        '</div>' +
        '<button class="lista-item-delete" onclick="excluirPeca(\'' + id + '\')" title="Excluir peça">' +
        '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>' +
        '</button>' +
        '</div>';
}

function excluirPeca(id) {
    if (!confirm('Tem certeza que deseja excluir esta peça?')) return;

    db.collection('pecas').doc(id).delete().then(function() {
        mostrarMensagem('Peça excluída com sucesso!', 'sucesso');
        carregarPecas();
    }).catch(function(error) {
        mostrarMensagem('Erro ao excluir: ' + error.message, 'erro');
    });
}

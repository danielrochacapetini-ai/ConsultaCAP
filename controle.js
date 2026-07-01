var registros = [];
var registrosFiltrados = [];

// Inicialização do Firebase (garantir que firebase-config.js seja carregado antes)
// O firebase-config.js já faz firebase.initializeApp(firebaseConfig) e const db = firebase.firestore();
// Portanto, `db` já deve estar disponível globalmente.

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente carregado. Iniciando configurações...');
    carregarRegistros();
    configurarFormulario();
    configurarFiltros();
});

function toggleForm() {
    var form = document.getElementById('formControle');
    form.classList.toggle('hidden');
    console.log('Formulário de registro alternado.');
}

function mostrarMensagem(texto, tipo) {
    var mensagemDiv = document.getElementById('mensagem');
    mensagemDiv.textContent = texto;
    mensagemDiv.className = 'mensagem ' + tipo;
    mensagemDiv.style.display = 'block';
    console.log(`Mensagem (${tipo}): ${texto}`);

    setTimeout(function() {
        mensagemDiv.style.display = 'none';
    }, 4000);
}

function getStatusClasse(status) {
    var verdes = ['RESOLVIDO', 'ENTREGUE', 'EMBARCADO'];
    var amarelos = ['ANDAMENTO', 'PENDENTE', 'CARREGAMENTO', 'DESCARREGAMENTO'];
    var vermelhos = ['ESTOQUE ZERADO', 'SUCATEADO', 'ESTORNADO'];
    var azuis = ['FATURADO', 'COMPRADO'];

    if (verdes.includes(status)) return 'status-verde';
    if (amarelos.includes(status)) return 'status-amarelo';
    if (vermelhos.includes(status)) return 'status-vermelho';
    if (azuis.includes(status)) return 'status-azul';
    return 'status-roxo';
}

function configurarFormulario() {
    var form = document.getElementById('formControle');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Evento de submit do formulário acionado.');
            registrarItem();
        });
    } else {
        console.error('Elemento formControle não encontrado.');
    }
}

function registrarItem() {
    var btnRegistrar = document.getElementById('btnRegistrar');
    var btnTexto = document.getElementById('btnTexto');
    var btnLoading = document.getElementById('btnLoading');

    if (btnRegistrar) btnRegistrar.disabled = true;
    if (btnTexto) btnTexto.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'block';

    var codigo = document.getElementById('codigo')?.value.trim().toUpperCase();
    var descricao = document.getElementById('descricao')?.value.trim().toUpperCase();
    var prefixo = document.getElementById('prefixo')?.value;
    var numeroCarro = document.getElementById('numeroCarro')?.value.trim();
    var modelo = document.getElementById('modelo')?.value;
    var quantidade = document.getElementById('quantidade')?.value;
    var tipo = document.getElementById('tipo')?.value; // NOVO CAMPO TIPO
    var motivo = document.getElementById('motivo')?.value;
    var status = document.getElementById('status')?.value;

    console.log('Valores coletados para registro:', { codigo, descricao, prefixo, numeroCarro, modelo, quantidade, tipo, motivo, status });

    if (!codigo || !descricao || !numeroCarro || !modelo || !quantidade || !tipo || !motivo || !status) {
        mostrarMensagem('Preencha todos os campos obrigatórios.', 'erro');
        if (btnRegistrar) btnRegistrar.disabled = false;
        if (btnTexto) btnTexto.style.display = 'block';
        if (btnLoading) btnLoading.style.display = 'none';
        return;
    }

    var dados = {
        codigo: codigo,
        descricao: descricao,
        numeroCarro: prefixo + '-' + numeroCarro,
        modelo: modelo,
        quantidade: parseInt(quantidade),
        tipo: tipo, // NOVO CAMPO TIPO
        motivo: motivo,
        status: status,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    console.log('Dados a serem enviados ao Firebase:', dados);

    if (typeof db === 'undefined' || !db.collection) {
        console.error('Firebase Firestore (db) não está inicializado ou acessível.');
        mostrarMensagem('Erro: Firebase não configurado corretamente. Verifique firebase-config.js', 'erro');
        if (btnRegistrar) btnRegistrar.disabled = false;
        if (btnTexto) btnTexto.style.display = 'block';
        if (btnLoading) btnLoading.style.display = 'none';
        return;
    }

    db.collection('controle').add(dados).then(function() {
        console.log('Registro salvo com sucesso:', codigo);
        mostrarMensagem('Item "' + descricao + '" registrado com sucesso!', 'sucesso');
        document.getElementById('formControle')?.reset();
        carregarRegistros();
    }).catch(function(error) {
        console.error('Erro ao salvar registro no Firebase:', error);
        mostrarMensagem('Erro ao salvar registro: ' + error.message, 'erro');
    }).finally(function() {
        if (btnRegistrar) btnRegistrar.disabled = false;
        if (btnTexto) btnTexto.style.display = 'block';
        if (btnLoading) btnLoading.style.display = 'none';
    });
}

function carregarRegistros() {
    var listaRegistrosDiv = document.getElementById('listaRegistros');
    if (listaRegistrosDiv) {
        listaRegistrosDiv.innerHTML = '<div class="loading-lista">Carregando registros...</div>';
    } else {
        console.error('Elemento listaRegistros não encontrado.');
        return;
    }

    if (typeof db === 'undefined' || !db.collection) {
        console.error('Firebase Firestore (db) não está inicializado ou acessível ao carregar registros.');
        listaRegistrosDiv.innerHTML = '<div class="empty-state"><p>Erro: Firebase não configurado corretamente para carregar registros.</p></div>';
        return;
    }

    db.collection('controle').orderBy('criadoEm', 'desc').get().then(function(snapshot) {
        registros = [];
        snapshot.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            registros.push(data);
        });
        console.log('Registros carregados do Firebase:', registros.length);
        aplicarFiltros();
    }).catch(function(error) {
        console.error('Erro ao carregar registros do Firebase:', error);
        listaRegistrosDiv.innerHTML = '<div class="empty-state"><p>Erro ao carregar registros: ' + error.message + '</p></div>';
        mostrarMensagem('Erro ao carregar registros: ' + error.message, 'erro');
    });
}

function configurarFiltros() {
    document.getElementById('filtroBusca')?.addEventListener('input', aplicarFiltros);
    document.getElementById('filtroStatus')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filtroModelo')?.addEventListener('change', aplicarFiltros);
    console.log('Filtros configurados.');
}

function aplicarFiltros() {
    var busca = document.getElementById('filtroBusca')?.value.trim().toUpperCase();
    var status = document.getElementById('filtroStatus')?.value;
    var modelo = document.getElementById('filtroModelo')?.value;

    registrosFiltrados = registros.filter(function(r) {
        var matchBusca = !busca || r.codigo.toUpperCase().includes(busca) || r.descricao.toUpperCase().includes(busca);
        var matchStatus = !status || r.status === status;
        var matchModelo = !modelo || r.modelo === modelo;
        return matchBusca && matchStatus && matchModelo;
    });

    console.log('Filtros aplicados. Registros filtrados:', registrosFiltrados.length);
    renderizarLista();
}

function renderizarLista() {
    var lista = document.getElementById('listaRegistros');
    var contagem = document.getElementById('contagem');

    if (!lista || !contagem) {
        console.error('Elementos listaRegistros ou contagem não encontrados.');
        return;
    }

    if (registrosFiltrados.length === 0) {
        lista.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg><p>Nenhum registro encontrado</p></div>';
        contagem.textContent = 'Total de registros: 0';
        console.log('Nenhum registro filtrado para exibir.');
        return;
    }

    var html = '';
    registrosFiltrados.forEach(function(r) {
        var modeloNome = r.modelo.replace(/_/g, ' ');
        var statusClasse = getStatusClasse(r.status);
        var criadoEmFormatado = r.criadoEm ? new Date(r.criadoEm.toDate()).toLocaleString('pt-BR') : 'N/A';

        html += `<div class="registro-card">
            <div class="registro-info">
                <div class="registro-campo"><span class="label">Código</span><span class="valor codigo-valor">${r.codigo}</span></div>
                <div class="registro-campo"><span class="label">Descrição</span><span class="valor">${r.descricao}</span></div>
                <div class="registro-campo"><span class="label">Carro</span><span class="valor">${r.numeroCarro}</span></div>
                <div class="registro-campo"><span class="label">Modelo</span><span class="valor">${modeloNome}</span></div>
                <div class="registro-campo"><span class="label">Qtd</span><span class="valor">${r.quantidade}</span></div>
                <div class="registro-campo"><span class="label">Tipo</span><span class="valor">${r.tipo || 'N/A'}</span></div> <!-- NOVO CAMPO TIPO -->
                <div class="registro-campo"><span class="label">Motivo</span><span class="valor">${r.motivo}</span></div>
                <div class="registro-campo"><span class="label">Status</span><span class="status-tag ${statusClasse}">${r.status}</span></div>
                <div class="registro-campo"><span class="label">Criado em</span><span class="valor">${criadoEmFormatado}</span></div>
            </div>
            <div class="registro-acoes">
                <button class="btn-acao btn-editar" onclick="abrirEdicao('${r.id}')" title="Editar"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
                <button class="btn-acao btn-excluir" onclick="excluirRegistro('${r.id}')" title="Excluir"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
            </div>
        </div>`;
    });

    lista.innerHTML = html;
    contagem.textContent = `${registrosFiltrados.length} registro${registrosFiltrados.length !== 1 ? 's' : ''}`; // Corrigido para plural/singular
    console.log('Lista de registros renderizada. Total:', registrosFiltrados.length);
}

function excluirRegistro(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    db.collection('controle').doc(id).delete().then(function() {
        console.log('Registro excluído com sucesso:', id);
        mostrarMensagem('Registro excluído!', 'sucesso');
        carregarRegistros();
    }).catch(function(error) {
        console.error('Erro ao excluir registro:', error);
        mostrarMensagem('Erro ao excluir: ' + error.message, 'erro');
    });
}

function abrirEdicao(id) {
    var registro = registros.find(function(r) { return r.id === id; });
    if (!registro) {
        console.error('Registro não encontrado para edição:', id);
        return;
    }

    var partesCarro = registro.numeroCarro.split('-');
    var prefixoEdit = partesCarro[0] || 'VV0052';
    var numEdit = partesCarro.slice(1).join('-') || '';

    var modalHtml = `<div class="modal-edit active" id="modalEdit" onclick="if(event.target===this)fecharEdicao()">
        <div class="modal-edit-content">
            <h3>EDITAR REGISTRO</h3>
            <div class="form-group"><label>CÓDIGO</label><input type="text" id="editCodigo" value="${registro.codigo}"></div>
            <div class="form-group"><label>DESCRIÇÃO</label><input type="text" id="editDescricao" value="${registro.descricao}"></div>
            <div class="form-group"><label>NÚMERO DO CARRO</label><div class="prefixo-group"><select id="editPrefixo" class="prefixo-select">
                <option value="VV0052"${prefixoEdit === 'VV0052' ? ' selected' : ''}>VV0052</option>
                <option value="VV0053"${prefixoEdit === 'VV0053' ? ' selected' : ''}>VV0053</option>
            </select><input type="text" id="editNumeroCarro" value="${numEdit}"></div></div>
            <div class="form-group"><label>MODELO</label><select id="editModelo">
                <option value="AMEC"${registro.modelo === 'AMEC' ? ' selected' : ''}>AMEC</option>
                <option value="TORINO"${registro.modelo === 'TORINO' ? ' selected' : ''}>TORINO</option>
                <option value="VOLARE_MV9L"${registro.modelo === 'VOLARE_MV9L' ? ' selected' : ''}>VOLARE MV9L</option>
                <option value="VOLARE_V9L"${registro.modelo === 'VOLARE_V9L' ? ' selected' : ''}>VOLARE V9L</option>
                <option value="VOLARE_W9C"${registro.modelo === 'VOLARE_W9C' ? ' selected' : ''}>VOLARE W9C</option>
                <option value="VOLARE_MV8L"${registro.modelo === 'VOLARE_MV8L' ? ' selected' : ''}>VOLARE MV8L</option>
                <option value="VOLARE_V8L"${registro.modelo === 'VOLARE_V8L' ? ' selected' : ''}>VOLARE V8L</option>
                <option value="VOLARE_WL"${registro.modelo === 'VOLARE_WL' ? ' selected' : ''}>VOLARE WL</option>
                <option value="VOLARE_V10L"${registro.modelo === 'VOLARE_V10L' ? ' selected' : ''}>VOLARE V10L</option>
                <option value="VOLARE_W12"${registro.modelo === 'VOLARE_W12' ? ' selected' : ''}>VOLARE W12</option>
                <option value="THUNDER"${registro.modelo === 'THUNDER' ? ' selected' : ''}>THUNDER</option>
            </select></div>
            <div class="form-group"><label>QUANTIDADE</label><input type="number" id="editQuantidade" value="${registro.quantidade}" min="1"></div>
            <div class="form-group"><label>TIPO</label><select id="editTipo">
                <option value="FABRICADO"${registro.tipo === 'FABRICADO' ? ' selected' : ''}>FABRICADO</option>
                <option value="COMPRADO"${registro.tipo === 'COMPRADO' ? ' selected' : ''}>COMPRADO</option>
            </select></div> <!-- NOVO CAMPO TIPO NO MODAL DE EDIÇÃO -->
            <div class="form-group"><label>MOTIVO</label><select id="editMotivo">
                <option value="SUCATA"${registro.motivo === 'SUCATA' ? ' selected' : ''}>SUCATA</option>
                <option value="ERRO DE ESTOQUE"${registro.motivo === 'ERRO DE ESTOQUE' ? ' selected' : ''}>ERRO DE ESTOQUE</option>
                <option value="DIVERGÊNCIA DE ESTOQUE"${registro.motivo === 'DIVERGÊNCIA DE ESTOQUE' ? ' selected' : ''}>DIVERGÊNCIA DE ESTOQUE</option>
                <option value="PREVENTIVO"${registro.motivo === 'PREVENTIVO' ? ' selected' : ''}>PREVENTIVO</option>
            </select></div>
            <div class="form-group"><label>STATUS</label><select id="editStatus">
                ${['ESTOQUE ZERADO','FATURADO','COMPRADO','ESTORNADO','SUCATEADO','EMBARCADO','CARREGAMENTO','DESCARREGAMENTO','PENDENTE','ANDAMENTO','RESOLVIDO','ENTREGUE'].map(s => `<option value="${s}"${registro.status === s ? ' selected' : ''}>${s}</option>`).join('')}
            </select></div>
            <div class="modal-edit-btns">
                <button class="btn-salvar" onclick="salvarEdicao('${id}')">SALVAR</button>
                <button class="btn-cancelar" onclick="fecharEdicao()">CANCELAR</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log('Modal de edição aberto para o registro:', id);
}

function fecharEdicao() {
    var modal = document.getElementById('modalEdit');
    if (modal) modal.remove();
    console.log('Modal de edição fechado.');
}

function salvarEdicao(id) {
    var codigo = document.getElementById('editCodigo')?.value.trim().toUpperCase();
    var descricao = document.getElementById('editDescricao')?.value.trim().toUpperCase();
    var prefixo = document.getElementById('editPrefixo')?.value;
    var numeroCarro = document.getElementById('editNumeroCarro')?.value.trim();
    var modelo = document.getElementById('editModelo')?.value;
    var quantidade = document.getElementById('editQuantidade')?.value;
    var tipo = document.getElementById('editTipo')?.value; // NOVO CAMPO TIPO
    var motivo = document.getElementById('editMotivo')?.value;
    var status = document.getElementById('editStatus')?.value;

    console.log('Valores coletados para edição:', { id, codigo, descricao, prefixo, numeroCarro, modelo, quantidade, tipo, motivo, status });

    if (!codigo || !descricao || !numeroCarro || !modelo || !quantidade || !tipo || !motivo || !status) {
        alert('Preencha todos os campos obrigatórios para edição.');
        mostrarMensagem('Preencha todos os campos obrigatórios para edição.', 'erro');
        return;
    }

    db.collection('controle').doc(id).update({
        codigo: codigo,
        descricao: descricao,
        numeroCarro: prefixo + '-' + numeroCarro,
        modelo: modelo,
        quantidade: parseInt(quantidade),
        tipo: tipo, // NOVO CAMPO TIPO
        motivo: motivo,
        status: status
    }).then(function() {
        console.log('Registro atualizado com sucesso:', id);
        mostrarMensagem('Registro atualizado com sucesso!', 'sucesso');
        fecharEdicao();
        carregarRegistros();
    }).catch(function(error) {
        console.error('Erro ao atualizar registro:', error);
        alert('Erro ao atualizar: ' + error.message);
        mostrarMensagem('Erro ao atualizar: ' + error.message, 'erro');
    });
}

function exportarExcel() {
    console.log('Iniciando exportação para Excel...');
    if (registrosFiltrados.length === 0) {
        mostrarMensagem('Nenhum registro para exportar para Excel.', 'erro');
        console.warn('Tentativa de exportar Excel sem registros.');
        return;
    }

    // Verifica se XLSX está disponível
    if (typeof XLSX === 'undefined') {
        console.error('Biblioteca XLSX não carregada. Verifique o script no HTML.');
        mostrarMensagem('Erro: Biblioteca XLSX não encontrada. Não foi possível exportar para Excel.', 'erro');
        return;
    }

    var dados = registrosFiltrados.map(function(r) {
        return {
            'CÓDIGO': r.codigo,
            'DESCRIÇÃO': r.descricao,
            'Nº CARRO': r.numeroCarro,
            'MODELO': r.modelo.replace(/_/g, ' '),
            'QTD': r.quantidade,
            'TIPO': r.tipo || 'N/A', // NOVO CAMPO TIPO
            'MOTIVO': r.motivo,
            'STATUS': r.status,
            'CRIADO EM': r.criadoEm ? new Date(r.criadoEm.toDate()).toLocaleString('pt-BR') : 'N/A'
        };
    });

    var ws = XLSX.utils.json_to_sheet(dados);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Controle');

    ws['!cols'] = [
        { wch: 15 }, // CÓDIGO
        { wch: 25 }, // DESCRIÇÃO
        { wch: 15 }, // Nº CARRO
        { wch: 15 }, // MODELO
        { wch: 6 },  // QTD
        { wch: 12 }, // TIPO
        { wch: 25 }, // MOTIVO
        { wch: 18 }, // STATUS
        { wch: 20 }  // CRIADO EM
    ];

    var dataHoje = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, 'Controle_Marcopolo_' + dataHoje + '.xlsx');
    console.log('Excel exportado com sucesso:', registrosFiltrados.length, 'registros.');
    mostrarMensagem('Dados exportados para Excel com sucesso!', 'sucesso');
}

function exportarPDF() {
    console.log('Iniciando exportação para PDF...');
    if (registrosFiltrados.length === 0) {
        mostrarMensagem('Nenhum registro para exportar para PDF.', 'erro');
        console.warn('Tentativa de exportar PDF sem registros.');
        return;
    }

    // Verifica se jsPDF está disponível
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        console.error('Biblioteca jsPDF não carregada. Verifique o script no HTML.');
        mostrarMensagem('Erro: Biblioteca jsPDF não encontrada. Não foi possível exportar para PDF.', 'erro');
        return;
    }

    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF('l', 'mm', 'a4');

    doc.setFillColor(0, 60, 120);
    doc.rect(0, 0, 297, 25, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // Cor do texto para o cabeçalho
    doc.text('MARCOPOLO - CONTROLE DE ITENS', 14, 16);

    var dataHoje = new Date().toLocaleDateString('pt-BR');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255); // Cor do texto para a data
    doc.text('Gerado em: ' + dataHoje, 250, 16);

    var colunas = ['CÓDIGO', 'DESCRIÇÃO', 'Nº CARRO', 'MODELO', 'QTD', 'TIPO', 'MOTIVO', 'STATUS', 'CRIADO EM']; // NOVO CAMPO TIPO
    var linhas = registrosFiltrados.map(function(r) {
        var criadoEmFormatado = r.criadoEm ? new Date(r.criadoEm.toDate()).toLocaleString('pt-BR') : 'N/A';
        return [r.codigo, r.descricao, r.numeroCarro, r.modelo.replace(/_/g, ' '), r.quantidade.toString(), r.tipo || 'N/A', r.motivo, r.status, criadoEmFormatado];
    });

    doc.autoTable({
        head: [colunas],
        body: linhas,
        startY: 30,
        styles: {
            fontSize: 8,
            cellPadding: 3,
            textColor: [0, 0, 0] // Cor do texto para o corpo da tabela
        },
        headStyles: {
            fillColor: [244, 121, 32],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function (data) {
            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Marcopolo S.A. - Unidade Veículos São Mateus | Página ' + data.pageNumber + ' de ' + data.pageCount, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });

    doc.save('Controle_Marcopolo_' + new Date().toISOString().split('T')[0] + '.pdf');
    console.log('PDF exportado com sucesso:', registrosFiltrados.length, 'registros.');
    mostrarMensagem('Dados exportados para PDF com sucesso!', 'sucesso');
}

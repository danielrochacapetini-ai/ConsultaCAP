var registros = [];
var registrosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    carregarRegistros();
    configurarFormulario();
    configurarFiltros();
});

function toggleForm() {
    var form = document.getElementById('formControle');
    form.classList.toggle('hidden');
}

function getStatusClasse(status) {
    var verdes = ['RESOLVIDO', 'ENTREGUE', 'EMBARCADO'];
    var amarelos = ['ANDAMENTO', 'PENDENTE', 'CARREGAMENTO', 'DESCARREGAMENTO'];
    var vermelhos = ['ESTOQUE ZERADO', 'SUCATEADO', 'ESTORNADO'];
    var azuis = ['FATURADO', 'COMPRADO'];

    if (verdes.indexOf(status) !== -1) return 'status-verde';
    if (amarelos.indexOf(status) !== -1) return 'status-amarelo';
    if (vermelhos.indexOf(status) !== -1) return 'status-vermelho';
    if (azuis.indexOf(status) !== -1) return 'status-azul';
    return 'status-roxo';
}

function configurarFormulario() {
    var form = document.getElementById('formControle');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        registrarItem();
    });
}

function registrarItem() {
    var codigo = document.getElementById('codigo').value.trim().toUpperCase();
    var descricao = document.getElementById('descricao').value.trim().toUpperCase();
    var prefixo = document.getElementById('prefixo').value;
    var numeroCarro = document.getElementById('numeroCarro').value.trim();
    var modelo = document.getElementById('modelo').value;
    var quantidade = document.getElementById('quantidade').value;
    var motivo = document.getElementById('motivo').value;
    var status = document.getElementById('status').value;

    if (!codigo || !descricao || !numeroCarro || !modelo || !quantidade || !motivo || !status) {
        mostrarMensagem('Preencha todos os campos.', 'erro');
        return;
    }

    var btn = document.getElementById('btnRegistrar');
    var btnTexto = document.getElementById('btnTexto');
    var btnLoading = document.getElementById('btnLoading');

    btn.disabled = true;
    btnTexto.textContent = 'ENVIANDO...';
    btnLoading.style.display = 'block';

    var dados = {
        codigo: codigo,
        descricao: descricao,
        numeroCarro: prefixo + '-' + numeroCarro,
        modelo: modelo,
        quantidade: parseInt(quantidade),
        motivo: motivo,
        status: status,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('controle').add(dados).then(function() {
        console.log('Registro salvo: ' + codigo);
        mostrarMensagem('Item "' + descricao + '" registrado com sucesso!', 'sucesso');
        document.getElementById('formControle').reset();
        carregarRegistros();
    }).catch(function(error) {
        console.log('Erro ao registrar: ' + error.message);
        mostrarMensagem('Erro: ' + error.message, 'erro');
    }).finally(function() {
        btn.disabled = false;
        btnTexto.textContent = 'REGISTRAR';
        btnLoading.style.display = 'none';
    });
}

function mostrarMensagem(texto, tipo) {
    var msg = document.getElementById('mensagem');
    msg.textContent = texto;
    msg.className = 'mensagem ' + tipo;
    msg.style.display = 'block';
    setTimeout(function() { msg.style.display = 'none'; }, 4000);
}

function carregarRegistros() {
    var lista = document.getElementById('listaRegistros');
    lista.innerHTML = '<div class="loading-lista">Carregando registros...</div>';

    db.collection('controle').orderBy('criadoEm', 'desc').get().then(function(snapshot) {
        registros = [];
        snapshot.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            registros.push(data);
        });
        console.log('Registros carregados: ' + registros.length);
        aplicarFiltros();
    }).catch(function(error) {
        console.log('Erro ao carregar: ' + error.message);
        lista.innerHTML = '<div class="empty-state"><p>Erro ao carregar: ' + error.message + '</p></div>';
    });
}

function configurarFiltros() {
    document.getElementById('filtroBusca').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroStatus').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroModelo').addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
    var busca = document.getElementById('filtroBusca').value.trim().toUpperCase();
    var status = document.getElementById('filtroStatus').value;
    var modelo = document.getElementById('filtroModelo').value;

    registrosFiltrados = registros.filter(function(r) {
        var matchBusca = !busca || r.codigo.toUpperCase().indexOf(busca) !== -1 || r.descricao.toUpperCase().indexOf(busca) !== -1;
        var matchStatus = !status || r.status === status;
        var matchModelo = !modelo || r.modelo === modelo;
        return matchBusca && matchStatus && matchModelo;
    });

    renderizarLista();
}

function renderizarLista() {
    var lista = document.getElementById('listaRegistros');
    var contagem = document.getElementById('contagem');

    if (registrosFiltrados.length === 0) {
        lista.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg><p>Nenhum registro encontrado</p></div>';
        contagem.textContent = '';
        return;
    }

    var html = '';
    registrosFiltrados.forEach(function(r) {
        var modeloNome = r.modelo.replace(/_/g, ' ');
        var statusClasse = getStatusClasse(r.status);

        html += '<div class="registro-card">';
        html += '<div class="registro-info">';
        html += '<div class="registro-campo"><span class="label">Código</span><span class="valor codigo-valor">' + r.codigo + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Descrição</span><span class="valor">' + r.descricao + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Carro</span><span class="valor">' + r.numeroCarro + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Modelo</span><span class="valor">' + modeloNome + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Qtd</span><span class="valor">' + r.quantidade + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Motivo</span><span class="valor">' + r.motivo + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Status</span><span class="status-tag ' + statusClasse + '">' + r.status + '</span></div>';
        html += '</div>';
        html += '<div class="registro-acoes">';
        html += '<button class="btn-acao btn-editar" onclick="abrirEdicao(\'' + r.id + '\')" title="Editar"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>';
        html += '<button class="btn-acao btn-excluir" onclick="excluirRegistro(\'' + r.id + '\')" title="Excluir"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>';
        html += '</div>';
        html += '</div>';
    });

    lista.innerHTML = html;
    contagem.textContent = registrosFiltrados.length + ' registro' + (registrosFiltrados.length !== 1 ? 's' : '');
}

function excluirRegistro(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    db.collection('controle').doc(id).delete().then(function() {
        console.log('Registro excluído: ' + id);
        mostrarMensagem('Registro excluído!', 'sucesso');
        carregarRegistros();
    }).catch(function(error) {
        mostrarMensagem('Erro ao excluir: ' + error.message, 'erro');
    });
}

function abrirEdicao(id) {
    var registro = registros.find(function(r) { return r.id === id; });
    if (!registro) return;

    var partesCarro = registro.numeroCarro.split('-');
    var prefixoEdit = partesCarro[0] || 'VV0052';
    var numEdit = partesCarro.slice(1).join('-') || '';

    var modalHtml = '<div class="modal-edit active" id="modalEdit" onclick="if(event.target===this)fecharEdicao()">';
    modalHtml += '<div class="modal-edit-content">';
    modalHtml += '<h3>EDITAR REGISTRO</h3>';
    modalHtml += '<div class="form-group"><label>CÓDIGO</label><input type="text" id="editCodigo" value="' + registro.codigo + '"></div>';
    modalHtml += '<div class="form-group"><label>DESCRIÇÃO</label><input type="text" id="editDescricao" value="' + registro.descricao + '"></div>';
    modalHtml += '<div class="form-group"><label>NÚMERO DO CARRO</label><div class="prefixo-group"><select id="editPrefixo" class="prefixo-select"><option value="VV0052"' + (prefixoEdit === 'VV0052' ? ' selected' : '') + '>VV0052</option><option value="VV0053"' + (prefixoEdit === 'VV0053' ? ' selected' : '') + '>VV0053</option></select><input type="text" id="editNumeroCarro" value="' + numEdit + '"></div></div>';
    modalHtml += '<div class="form-group"><label>MODELO</label><select id="editModelo">';
    modalHtml += '<option value="AMEC"' + (registro.modelo === 'AMEC' ? ' selected' : '') + '>AMEC</option>';
    modalHtml += '<option value="TORINO"' + (registro.modelo === 'TORINO' ? ' selected' : '') + '>TORINO</option>';
    modalHtml += '<option value="VOLARE_MV9L"' + (registro.modelo === 'VOLARE_MV9L' ? ' selected' : '') + '>VOLARE MV9L</option>';
    modalHtml += '<option value="VOLARE_V9L"' + (registro.modelo === 'VOLARE_V9L' ? ' selected' : '') + '>VOLARE V9L</option>';
    modalHtml += '<option value="VOLARE_W9C"' + (registro.modelo === 'VOLARE_W9C' ? ' selected' : '') + '>VOLARE W9C</option>';
    modalHtml += '<option value="VOLARE_MV8L"' + (registro.modelo === 'VOLARE_MV8L' ? ' selected' : '') + '>VOLARE MV8L</option>';
    modalHtml += '<option value="VOLARE_V8L"' + (registro.modelo === 'VOLARE_V8L' ? ' selected' : '') + '>VOLARE V8L</option>';
    modalHtml += '<option value="VOLARE_WL"' + (registro.modelo === 'VOLARE_WL' ? ' selected' : '') + '>VOLARE WL</option>';
    modalHtml += '<option value="VOLARE_V10L"' + (registro.modelo === 'VOLARE_V10L' ? ' selected' : '') + '>VOLARE V10L</option>';
    modalHtml += '<option value="VOLARE_W12"' + (registro.modelo === 'VOLARE_W12' ? ' selected' : '') + '>VOLARE W12</option>';
    modalHtml += '<option value="THUNDER"' + (registro.modelo === 'THUNDER' ? ' selected' : '') + '>THUNDER</option>';
    modalHtml += '</select></div>';
    modalHtml += '<div class="form-group"><label>QUANTIDADE</label><input type="number" id="editQuantidade" value="' + registro.quantidade + '" min="1"></div>';
    modalHtml += '<div class="form-group"><label>MOTIVO</label><select id="editMotivo">';
    modalHtml += '<option value="SUCATA"' + (registro.motivo === 'SUCATA' ? ' selected' : '') + '>SUCATA</option>';
    modalHtml += '<option value="ERRO DE ESTOQUE"' + (registro.motivo === 'ERRO DE ESTOQUE' ? ' selected' : '') + '>ERRO DE ESTOQUE</option>';
    modalHtml += '<option value="DIVERGÊNCIA DE ESTOQUE"' + (registro.motivo === 'DIVERGÊNCIA DE ESTOQUE' ? ' selected' : '') + '>DIVERGÊNCIA DE ESTOQUE</option>';
    modalHtml += '<option value="PREVENTIVO"' + (registro.motivo === 'PREVENTIVO' ? ' selected' : '') + '>PREVENTIVO</option>';
    modalHtml += '</select></div>';
    modalHtml += '<div class="form-group"><label>STATUS</label><select id="editStatus">';
    var statusOpcoes = ['ESTOQUE ZERADO','FATURADO','COMPRADO','ESTORNADO','SUCATEADO','EMBARCADO','CARREGAMENTO','DESCARREGAMENTO','PENDENTE','ANDAMENTO','RESOLVIDO','ENTREGUE'];
    statusOpcoes.forEach(function(s) {
        modalHtml += '<option value="' + s + '"' + (registro.status === s ? ' selected' : '') + '>' + s + '</option>';
    });
    modalHtml += '</select></div>';
    modalHtml += '<div class="modal-edit-btns">';
    modalHtml += '<button class="btn-salvar" onclick="salvarEdicao(\'' + id + '\')">SALVAR</button>';
    modalHtml += '<button class="btn-cancelar" onclick="fecharEdicao()">CANCELAR</button>';
    modalHtml += '</div>';
    modalHtml += '</div></div>';

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function fecharEdicao() {
    var modal = document.getElementById('modalEdit');
    if (modal) modal.remove();
}

function salvarEdicao(id) {
    var codigo = document.getElementById('editCodigo').value.trim().toUpperCase();
    var descricao = document.getElementById('editDescricao').value.trim().toUpperCase();
    var prefixo = document.getElementById('editPrefixo').value;
    var numeroCarro = document.getElementById('editNumeroCarro').value.trim();
    var modelo = document.getElementById('editModelo').value;
    var quantidade = document.getElementById('editQuantidade').value;
    var motivo = document.getElementById('editMotivo').value;
    var status = document.getElementById('editStatus').value;

    if (!codigo || !descricao || !numeroCarro || !modelo || !quantidade || !motivo || !status) {
        alert('Preencha todos os campos.');
        return;
    }

    db.collection('controle').doc(id).update({
        codigo: codigo,
        descricao: descricao,
        numeroCarro: prefixo + '-' + numeroCarro,
        modelo: modelo,
        quantidade: parseInt(quantidade),
        motivo: motivo,
        status: status
    }).then(function() {
        console.log('Registro atualizado: ' + id);
        mostrarMensagem('Registro atualizado com sucesso!', 'sucesso');
        fecharEdicao();
        carregarRegistros();
    }).catch(function(error) {
        alert('Erro ao atualizar: ' + error.message);
    });
}

function exportarExcel() {
    if (registrosFiltrados.length === 0) {
        mostrarMensagem('Nenhum registro para exportar.', 'erro');
        return;
    }

    var dados = registrosFiltrados.map(function(r) {
        return {
            'CÓDIGO': r.codigo,
            'DESCRIÇÃO': r.descricao,
            'Nº CARRO': r.numeroCarro,
            'MODELO': r.modelo.replace(/_/g, ' '),
            'QTD': r.quantidade,
            'MOTIVO': r.motivo,
            'STATUS': r.status
        };
    });

    var ws = XLSX.utils.json_to_sheet(dados);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Controle');

    ws['!cols'] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 6 },
        { wch: 25 },
        { wch: 18 }
    ];

    var dataHoje = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, 'Controle_Marcopolo_' + dataHoje + '.xlsx');
    console.log('Excel exportado: ' + registrosFiltrados.length + ' registros');
}

function exportarPDF() {
    if (registrosFiltrados.length === 0) {
        mostrarMensagem('Nenhum registro para exportar.', 'erro');
        return;
    }

    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF('l', 'mm', 'a4');

    doc.setFillColor(0, 60, 120);
    doc.rect(0, 0, 297, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MARCOPOLO - CONTROLE DE ITENS', 14, 16);

    var dataHoje = new Date().toLocaleDateString('pt-BR');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Gerado em: ' + dataHoje, 250, 16);

    var colunas = ['CÓDIGO', 'DESCRIÇÃO', 'Nº CARRO', 'MODELO', 'QTD', 'MOTIVO', 'STATUS'];
    var linhas = registrosFiltrados.map(function(r) {
        return [r.codigo, r.descricao, r.numeroCarro, r.modelo.replace(/_/g, ' '), r.quantidade.toString(), r.motivo, r.status];
    });

    doc.autoTable({
        head: [colunas],
        body: linhas,
        startY: 30,
        styles: {
            fontSize: 8,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [244, 121, 32],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { left: 14, right: 14 }
    });

    var totalPages = doc.internal.getNumberOfPages();
    for (var i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Marcopolo S.A. - Unidade Veículos São Mateus | Página ' + i + ' de ' + totalPages, 14, 200);
    }

    doc.save('Controle_Marcopolo_' + new Date().toISOString().split('T')[0] + '.pdf');
    console.log('PDF exportado: ' + registrosFiltrados.length + ' registros');
}

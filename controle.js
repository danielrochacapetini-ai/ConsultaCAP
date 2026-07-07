var registros = [];
var registrosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log("Sistema Marcopolo iniciado...");
    carregarRegistros();
    configurarFormulario();
    configurarFiltros();
});

function toggleForm() {
    var form = document.getElementById('formControle');
    if (form) form.classList.toggle('hidden');
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
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            registrarItem();
        });
    }
}

function registrarItem() {
    console.log("Iniciando registro...");
    try {
        var getVal = (id) => {
            var el = document.getElementById(id);
            return el ? el.value.trim() : "";
        };

        var codigo = getVal('codigo').toUpperCase();
        var descricao = getVal('descricao').toUpperCase();
        var prefixo = getVal('prefixo');
        var numeroCarro = getVal('numeroCarro');
        var modelo = getVal('modelo');
        var quantidade = getVal('quantidade');
        var tipo = getVal('tipo');
        var motivo = getVal('motivo');
        var status = getVal('status');
        
        var atrasoInput = getVal('atraso');
        var transportadorInput = getVal('transportador').toUpperCase();
        var notaFiscalInput = getVal('notaFiscal').toUpperCase();

        if (!codigo || !descricao || !numeroCarro || !modelo || !quantidade || !tipo || !motivo || !status) {
            mostrarMensagem('Preencha todos os campos obrigatórios.', 'erro');
            return;
        }

        var btn = document.getElementById('btnRegistrar');
        var btnTexto = document.getElementById('btnTexto');
        var btnLoading = document.getElementById('btnLoading');

        if (btn) btn.disabled = true;
        if (btnTexto) btnTexto.textContent = 'ENVIANDO...';
        if (btnLoading) btnLoading.style.display = 'block';

        var dados = {
            codigo: codigo,
            descricao: descricao,
            numeroCarro: prefixo + '-' + numeroCarro,
            modelo: modelo,
            quantidade: parseInt(quantidade),
            tipo: tipo,
            motivo: motivo,
            status: status,
            atraso: atrasoInput === '' ? null : parseInt(atrasoInput),
            transportador: transportadorInput || 'N/A',
            notaFiscal: notaFiscalInput || 'N/A',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log("Dados para envio:", dados);

        db.collection('controle').add(dados).then(function(docRef) {
            console.log("Sucesso! ID:", docRef.id);
            mostrarMensagem('Registrado com sucesso!', 'sucesso');
            if (document.getElementById('formControle')) document.getElementById('formControle').reset();
            carregarRegistros();
        }).catch(function(error) {
            console.error("Erro Firebase:", error);
            alert("Erro ao salvar no Firebase: " + error.message);
        }).finally(function() {
            if (btn) btn.disabled = false;
            if (btnTexto) btnTexto.textContent = 'REGISTRAR';
            if (btnLoading) btnLoading.style.display = 'none';
        });

    } catch (err) {
        console.error("Erro no script:", err);
        alert("Erro no navegador: " + err.message);
    }
}

function mostrarMensagem(texto, tipo) {
    var msg = document.getElementById('mensagem');
    if (!msg) return;
    msg.textContent = texto;
    msg.className = 'mensagem ' + tipo;
    msg.style.display = 'block';
    setTimeout(function() { msg.style.display = 'none'; }, 4000);
}

function carregarRegistros() {
    var lista = document.getElementById('listaRegistros');
    if (!lista) return;
    lista.innerHTML = '<div class="loading-lista">Carregando registros...</div>';

    db.collection('controle').orderBy('criadoEm', 'desc').get().then(function(snapshot) {
        registros = [];
        snapshot.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            registros.push(data);
        });
        aplicarFiltros();
    }).catch(function(error) {
        console.error("Erro ao carregar:", error);
        lista.innerHTML = '<div class="empty-state"><p>Erro ao carregar dados.</p></div>';
    });
}

function configurarFiltros() {
    var ids = ['filtroBusca', 'filtroStatus', 'filtroModelo'];
    ids.forEach(id => {
        var el = document.getElementById(id);
        if (el) el.addEventListener(id === 'filtroBusca' ? 'input' : 'change', aplicarFiltros);
    });
}

function aplicarFiltros() {
    var busca = (document.getElementById('filtroBusca')?.value || "").trim().toUpperCase();
    var status = document.getElementById('filtroStatus')?.value || "";
    var modelo = document.getElementById('filtroModelo')?.value || "";

    registrosFiltrados = registros.filter(function(r) {
        try {
            var txtBusca = (r.codigo || "") + (r.descricao || "") + (r.transportador || "") + (r.notaFiscal || "");
            var matchBusca = !busca || txtBusca.toUpperCase().indexOf(busca) !== -1;
            var matchStatus = !status || r.status === status;
            var matchModelo = !modelo || r.modelo === modelo;
            return matchBusca && matchStatus && matchModelo;
        } catch (e) { return false; }
    });

    renderizarLista();
}

function renderizarLista() {
    var lista = document.getElementById('listaRegistros');
    var contagem = document.getElementById('contagem');
    if (!lista) return;

    if (registrosFiltrados.length === 0) {
        lista.innerHTML = '<div class="empty-state"><p>Nenhum registro encontrado</p></div>';
        if (contagem) contagem.textContent = '';
        return;
    }

    var html = '';
    registrosFiltrados.forEach(function(r) {
        var statusClasse = getStatusClasse(r.status || "");
        var atrasoValor = (r.atraso !== null && r.atraso !== undefined) ? r.atraso + ' dias' : 'N/A';
        
        html += '<div class="registro-card">';
        html += '<div class="registro-info">';
        html += '<div class="registro-campo"><span class="label">Código</span><span class="valor codigo-valor">' + (r.codigo || '---') + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Descrição</span><span class="valor">' + (r.descricao || '---') + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Carro</span><span class="valor">' + (r.numeroCarro || '---') + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Qtd</span><span class="valor">' + (r.quantidade || 0) + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Motivo</span><span class="valor">' + (r.motivo || '---') + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Atraso</span><span class="valor">' + atrasoValor + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Transp.</span><span class="valor">' + (r.transportador || 'N/A') + '</span></div>';
        html += '<div class="registro-campo"><span class="label">NF</span><span class="valor">' + (r.notaFiscal || 'N/A') + '</span></div>';
        html += '<div class="registro-campo"><span class="label">Status</span><span class="status-tag ' + statusClasse + '">' + (r.status || '---') + '</span></div>';
        html += '</div>';
        html += '<div class="registro-acoes">';
        html += '<button class="btn-acao btn-editar" onclick="abrirEdicao(\'' + r.id + '\')">EDITAR</button>';
        html += '<button class="btn-acao btn-excluir" onclick="excluirRegistro(\'' + r.id + '\')">EXCLUIR</button>';
        html += '</div>';
        html += '</div>';
    });

    lista.innerHTML = html;
    if (contagem) contagem.textContent = registrosFiltrados.length + ' registros';
}

function excluirRegistro(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    db.collection('controle').doc(id).delete().then(function() {
        mostrarMensagem('Registro excluído!', 'sucesso');
        carregarRegistros();
    }).catch(function(error) {
        alert('Erro ao excluir: ' + error.message);
    });
}

function abrirEdicao(id) {
    var r = registros.find(function(reg) { return reg.id === id; });
    if (!r) return;

    var partesCarro = (r.numeroCarro || "").split('-');
    var prefixoEdit = partesCarro[0] || 'VV0052';
    var numEdit = partesCarro.slice(1).join('-') || '';

    var modalHtml = '<div class="modal-edit active" id="modalEdit" onclick="if(event.target===this)fecharEdicao()">';
    modalHtml += '<div class="modal-edit-content">';
    modalHtml += '<h3>EDITAR REGISTRO</h3>';
    modalHtml += '<div class="form-group"><label>CÓDIGO</label><input type="text" id="editCodigo" value="' + (r.codigo || "") + '"></div>';
    modalHtml += '<div class="form-group"><label>DESCRIÇÃO</label><input type="text" id="editDescricao" value="' + (r.descricao || "") + '"></div>';
    modalHtml += '<div class="form-group"><label>Nº CARRO</label><div class="prefixo-group"><select id="editPrefixo"><option value="VV0052"' + (prefixoEdit === 'VV0052' ? ' selected' : '') + '>VV0052</option><option value="VV0053"' + (prefixoEdit === 'VV0053' ? ' selected' : '') + '>VV0053</option></select><input type="text" id="editNumeroCarro" value="' + numEdit + '"></div></div>';
    modalHtml += '<div class="form-group"><label>QUANTIDADE</label><input type="number" id="editQuantidade" value="' + (r.quantidade || 0) + '"></div>';
    modalHtml += '<div class="form-group"><label>MOTIVO</label><select id="editMotivo">';
    ['SUCATA', 'ERRO DE ESTOQUE', 'DIVERGÊNCIA DE ESTOQUE', 'PREVENTIVO', 'ATRASO'].forEach(m => {
        modalHtml += '<option value="' + m + '"' + (r.motivo === m ? ' selected' : '') + '>' + m + '</option>';
    });
    modalHtml += '</select></div>';
    modalHtml += '<div class="form-group"><label>STATUS</label><select id="editStatus">';
    ['ESTOQUE ZERADO','FATURADO','COMPRADO','ESTORNADO','SUCATEADO','EMBARCADO','CARREGAMENTO','DESCARREGAMENTO','PENDENTE','ANDAMENTO','RESOLVIDO','ENTREGUE'].forEach(s => {
        modalHtml += '<option value="' + s + '"' + (r.status === s ? ' selected' : '') + '>' + s + '</option>';
    });
    modalHtml += '</select></div>';
    modalHtml += '<div class="form-group"><label>ATRASO (DIAS)</label><input type="number" id="editAtraso" value="' + (r.atraso || "") + '"></div>';
    modalHtml += '<div class="form-group"><label>TRANSPORTADOR</label><input type="text" id="editTransportador" value="' + (r.transportador !== 'N/A' ? r.transportador : "") + '"></div>';
    modalHtml += '<div class="form-group"><label>NOTA FISCAL</label><input type="text" id="editNotaFiscal" value="' + (r.notaFiscal !== 'N/A' ? r.notaFiscal : "") + '"></div>';
    modalHtml += '<div class="modal-edit-btns"><button class="btn-salvar" onclick="salvarEdicao(\'' + id + '\')">SALVAR</button><button class="btn-cancelar" onclick="fecharEdicao()">CANCELAR</button></div>';
    modalHtml += '</div></div>';
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function fecharEdicao() {
    var modal = document.getElementById('modalEdit');
    if (modal) modal.remove();
}

function salvarEdicao(id) {
    var dados = {
        codigo: document.getElementById('editCodigo').value.trim().toUpperCase(),
        descricao: document.getElementById('editDescricao').value.trim().toUpperCase(),
        numeroCarro: document.getElementById('editPrefixo').value + '-' + document.getElementById('editNumeroCarro').value.trim(),
        quantidade: parseInt(document.getElementById('editQuantidade').value),
        motivo: document.getElementById('editMotivo').value,
        status: document.getElementById('editStatus').value,
        atraso: document.getElementById('editAtraso').value === '' ? null : parseInt(document.getElementById('editAtraso').value),
        transportador: document.getElementById('editTransportador').value.trim().toUpperCase() || 'N/A',
        notaFiscal: document.getElementById('editNotaFiscal').value.trim().toUpperCase() || 'N/A'
    };
    db.collection('controle').doc(id).update(dados).then(function() {
        mostrarMensagem('Atualizado!', 'sucesso');
        fecharEdicao();
        carregarRegistros();
    }).catch(function(error) { alert('Erro: ' + error.message); });
}

function exportarExcel() {
    if (registrosFiltrados.length === 0) return mostrarMensagem('Sem dados!', 'erro');
    var dados = registrosFiltrados.map(r => ({
        'CÓDIGO': r.codigo, 'DESCRIÇÃO': r.descricao, 'CARRO': r.numeroCarro, 'MODELO': r.modelo,
        'QTD': r.quantidade, 'TIPO': r.tipo, 'MOTIVO': r.motivo, 'ATRASO': r.atraso || 0,
        'TRANSPORTADOR': r.transportador || 'N/A', 'NF': r.notaFiscal || 'N/A', 'STATUS': r.status
    }));
    var ws = XLSX.utils.json_to_sheet(dados);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Controle');
    XLSX.writeFile(wb, 'Controle_Marcopolo.xlsx');
}

function exportarPDF() {
    if (registrosFiltrados.length === 0) return mostrarMensagem('Sem dados!', 'erro');
    var doc = new window.jspdf.jsPDF('l', 'mm', 'a4');
    var colunas = ['CÓDIGO', 'DESCRIÇÃO', 'CARRO', 'QTD', 'MOTIVO', 'ATRASO', 'TRANSP.', 'NF', 'STATUS'];
    var linhas = registrosFiltrados.map(r => [
        r.codigo, r.descricao, r.numeroCarro, r.quantidade, r.motivo, r.atraso || 0, r.transportador || 'N/A', r.notaFiscal || 'N/A', r.status
    ]);
    doc.autoTable({ head: [colunas], body: linhas, startY: 20 });
    doc.save('Controle_Marcopolo.pdf');
}

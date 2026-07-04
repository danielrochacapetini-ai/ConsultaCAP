var registros = [];
var registrosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log("Sistema iniciado...");
    if (typeof db === 'undefined') {
        console.error("Erro: Banco de dados (db) não definido. Verifique o firebase-config.js");
    }
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
    try {
        // Captura segura de elementos
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
        
        var atraso = getVal('atraso');
        var transportador = getVal('transportador').toUpperCase();
        var notaFiscal = getVal('notaFiscal').toUpperCase();

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
            atraso: atraso === '' ? null : parseInt(atraso),
            transportador: transportador || 'N/A',
            notaFiscal: notaFiscal || 'N/A',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('controle').add(dados).then(function() {
            mostrarMensagem('Registrado com sucesso!', 'sucesso');
            if (document.getElementById('formControle')) document.getElementById('formControle').reset();
            carregarRegistros();
        }).catch(function(error) {
            console.error("Erro Firebase:", error);
            alert("Erro ao salvar: " + error.message);
        }).finally(function() {
            if (btn) btn.disabled = false;
            if (btnTexto) btnTexto.textContent = 'REGISTRAR';
            if (btnLoading) btnLoading.style.display = 'none';
        });

    } catch (err) {
        console.error("Erro no script:", err);
        alert("Ocorreu um erro no navegador: " + err.message);
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
    var fBusca = document.getElementById('filtroBusca');
    var fStatus = document.getElementById('filtroStatus');
    var fModelo = document.getElementById('filtroModelo');
    if (fBusca) fBusca.addEventListener('input', aplicarFiltros);
    if (fStatus) fStatus.addEventListener('change', aplicarFiltros);
    if (fModelo) fModelo.addEventListener('change', aplicarFiltros);
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

// ... (Mantenha as funções de excluirRegistro, abrirEdicao, salvarEdicao e exportar como estavam, elas funcionarão normalmente)

var registros = [];
var registrosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    carregarRegistros();
    configurarFormulario();
    configurarFiltros();
});

function toggleForm() {
    document.getElementById('formControle').classList.toggle('hidden');
}

function mostrarMensagem(texto, tipo) {
    var mensagemDiv = document.getElementById('mensagem');
    mensagemDiv.textContent = texto;
    mensagemDiv.className = 'mensagem ' + tipo;
    mensagemDiv.style.display = 'block';

    setTimeout(function() {
        mensagemDiv.style.display = 'none';
    }, 3000);
}

function configurarFormulario() {
    document.getElementById('formControle').addEventListener('submit', function(e) {
        e.preventDefault();
        registrarItem();
    });
}

function registrarItem() {
    var btnRegistrar = document.getElementById('btnRegistrar');
    var btnTexto = document.getElementById('btnTexto');
    var btnLoading = document.getElementById('btnLoading');

    btnRegistrar.disabled = true;
    btnTexto.style.display = 'none';
    btnLoading.style.display = 'block';

    var codigo = document.getElementById('codigo').value.trim().toUpperCase();
    var descricao = document.getElementById('descricao').value.trim().toUpperCase();
    var prefixo = document.getElementById('prefixo').value;
    var numeroCarro = document.getElementById('numeroCarro').value.trim();
    var modelo = document.getElementById('modelo').value;
    var quantidade = document.getElementById('quantidade').value;
    var tipo = document.getElementById('tipo').value;
    var motivo = document.getElementById('motivo').value;
    var status = document.getElementById('status').value;

    if (!codigo || !descricao || !numeroCarro || !modelo || !quantidade || !tipo || !motivo || !status) {
        mostrarMensagem('Preencha todos os campos.', 'erro');
        btnRegistrar.disabled = false;
        btnTexto.style.display = 'block';
        btnLoading.style.display = 'none';
        return;
    }

    var dados = {
        codigo: codigo,
        descricao: descricao,
        numeroCarro: prefixo + '-' + numeroCarro,
        modelo: modelo,
        quantidade: parseInt(quantidade),
        tipo: tipo,
        motivo: motivo,
        status: status,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('controle').add(dados).then(function() {
        mostrarMensagem('Registro salvo com sucesso!', 'sucesso');
        document.getElementById('formControle').reset();
        carregarRegistros();
    }).catch(function(error) {
        console.error('Erro ao salvar registro no Firebase:', error);
        mostrarMensagem('Erro ao salvar registro: ' + error.message, 'erro');
    }).finally(function() {
        btnRegistrar.disabled = false;
        btnTexto.style.display = 'block';
        btnLoading.style.display = 'none';
    });
}

function carregarRegistros() {
    var listaRegistrosDiv = document.getElementById('listaRegistros');
    listaRegistrosDiv.innerHTML = '<div class="loading-lista">Carregando registros...</div>';

    db.collection('controle').orderBy('criadoEm', 'desc').get().then(function(snapshot) {
        registros = [];
        snapshot.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            registros.push(data);
        });
        aplicarFiltros();
    }).catch(function(error) {
        console.error('Erro ao carregar registros:', error);
        listaRegistrosDiv.innerHTML = '<div class="mensagem erro">Erro ao carregar registros.</div>';
    });
}

function configurarFiltros() {
    document.getElementById('filtroBusca').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroStatus').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroModelo').addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
    var busca = document.getElementById('filtroBusca').value.toUpperCase();
    var status = document.getElementById('filtroStatus').value;
    var modelo = document.getElementById('filtroModelo').value;

    registrosFiltrados = registros.filter(function(r) {
        return (!busca || r.codigo.includes(busca) || r.descricao.includes(busca))
            && (!status || r.status === status)
            && (!modelo || r.modelo === modelo);
    });

    renderizarLista();
}

function renderizarLista() {
    var html = '';
    var listaRegistrosDiv = document.getElementById('listaRegistros');
    var contagemDiv = document.getElementById('contagem');

    if (registrosFiltrados.length === 0) {
        listaRegistrosDiv.innerHTML = '<div class="mensagem info">Nenhum registro encontrado.</div>';
        contagemDiv.textContent = 'Total de registros: 0';
        return;
    }

    registrosFiltrados.forEach(function(r) {
        html += `
        <div class="registro-card">
            <div><b>Código:</b> ${r.codigo}</div>
            <div><b>Descrição:</b> ${r.descricao}</div>
            <div><b>Carro:</b> ${r.numeroCarro}</div>
            <div><b>Modelo:</b> ${r.modelo}</div>
            <div><b>Qtd:</b> ${r.quantidade}</div>
            <div><b>Tipo:</b> ${r.tipo || ''}</div>
            <div><b>Motivo:</b> ${r.motivo}</div>
            <div><b>Status:</b> ${r.status}</div>
            <div><b>Criado em:</b> ${r.criadoEm ? new Date(r.criadoEm.toDate()).toLocaleString() : 'N/A'}</div>
        </div>`;
    });

    listaRegistrosDiv.innerHTML = html;
    contagemDiv.textContent = `Total de registros: ${registrosFiltrados.length}`;
}

function exportarExcel() {
    var dados = registrosFiltrados.map(r => ({
        CODIGO: r.codigo,
        DESCRICAO: r.descricao,
        CARRO: r.numeroCarro,
        MODELO: r.modelo,
        QUANTIDADE: r.quantidade,
        TIPO: r.tipo || '',
        MOTIVO: r.motivo,
        STATUS: r.status,
        CRIADO_EM: r.criadoEm ? new Date(r.criadoEm.toDate()).toLocaleString() : 'N/A'
    }));

    var ws = XLSX.utils.json_to_sheet(dados);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Controle');
    XLSX.writeFile(wb, 'controle.xlsx');
}

function exportarPDF() {
    var doc = new jsPDF('l');
    var linhas = registrosFiltrados.map(r => [
        r.codigo,
        r.descricao,
        r.numeroCarro,
        r.modelo,
        r.quantidade,
        r.tipo || '',
        r.motivo,
        r.status,
        r.criadoEm ? new Date(r.criadoEm.toDate()).toLocaleString() : 'N/A'
    ]);

    doc.autoTable({
        head: [['COD', 'DESC', 'CARRO', 'MODELO', 'QTD', 'TIPO', 'MOTIVO', 'STATUS', 'CRIADO EM']],
        body: linhas
    });

    doc.save('controle.pdf');
}

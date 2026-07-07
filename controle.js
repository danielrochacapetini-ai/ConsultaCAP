var registros = [];
var registrosFiltrados = [];

// Função para mostrar erro direto na tela para quem está no celular
function mostrarErroNaTela(mensagem) {
    var lista = document.getElementById('listaRegistros');
    if (lista) {
        lista.innerHTML = '<div style="color: red; padding: 20px; background: #fff; border: 1px solid red;">' +
                          '<strong>Erro detectado:</strong><br>' + mensagem + '</div>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof firebase === 'undefined') {
            mostrarErroNaTela("Firebase não carregado. Verifique sua internet ou os links no HTML.");
            return;
        }
        carregarRegistros();
        configurarFormulario();
        configurarFiltros();
    } catch (e) {
        mostrarErroNaTela("Erro na inicialização: " + e.message);
    }
});

function carregarRegistros() {
    var lista = document.getElementById('listaRegistros');
    if (!lista) return;
    lista.innerHTML = '<div class="loading-lista">Carregando registros...</div>';

    // TENTATIVA 1: Carregar sem ordenação (mais seguro para evitar erro de índice)
    db.collection('controle').get().then(function(snapshot) {
        registros = [];
        snapshot.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            registros.push(data);
        });
        
        // Ordenar manualmente no código para não depender do banco
        registros.sort((a, b) => {
            var da = a.criadoEm ? a.criadoEm.toDate() : new Date(0);
            var db = b.criadoEm ? b.criadoEm.toDate() : new Date(0);
            return db - da;
        });

        aplicarFiltros();
    }).catch(function(error) {
        console.error("Erro Firebase:", error);
        mostrarErroNaTela("Falha ao conectar com o banco: " + error.message);
    });
}

function registrarItem() {
    try {
        var btn = document.getElementById('btnRegistrar');
        var btnTexto = document.getElementById('btnTexto');
        
        var dados = {
            codigo: document.getElementById('codigo').value.trim().toUpperCase(),
            descricao: document.getElementById('descricao').value.trim().toUpperCase(),
            numeroCarro: document.getElementById('prefixo').value + '-' + document.getElementById('numeroCarro').value.trim(),
            modelo: document.getElementById('modelo').value,
            quantidade: parseInt(document.getElementById('quantidade').value),
            tipo: document.getElementById('tipo').value,
            motivo: document.getElementById('motivo').value,
            status: document.getElementById('status').value,
            atraso: document.getElementById('atraso').value === '' ? null : parseInt(document.getElementById('atraso').value),
            transportador: document.getElementById('transportador').value.trim().toUpperCase() || 'N/A',
            notaFiscal: document.getElementById('notaFiscal').value.trim().toUpperCase() || 'N/A',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (btn) btn.disabled = true;
        if (btnTexto) btnTexto.textContent = 'ENVIANDO...';

        db.collection('controle').add(dados).then(function() {
            alert("Registrado com sucesso!");
            location.reload(); // Recarrega a página para garantir a atualização
        }).catch(function(error) {
            alert("Erro ao salvar: " + error.message);
        }).finally(function() {
            if (btn) btn.disabled = false;
            if (btnTexto) btnTexto.textContent = 'REGISTRAR';
        });
    } catch (err) {
        alert("Erro no formulário: " + err.message);
    }
}

// Funções auxiliares simplificadas
function toggleForm() { document.getElementById('formControle').classList.toggle('hidden'); }
function mostrarMensagem(t, tipo) { alert(t); }
function configurarFiltros() { 
    ['filtroBusca', 'filtroStatus', 'filtroModelo'].forEach(id => {
        var el = document.getElementById(id);
        if (el) el.oninput = aplicarFiltros;
    });
}
function aplicarFiltros() {
    var busca = (document.getElementById('filtroBusca')?.value || "").toUpperCase();
    registrosFiltrados = registros.filter(r => {
        var txt = (r.codigo || "") + (r.descricao || "") + (r.transportador || "") + (r.notaFiscal || "");
        return !busca || txt.toUpperCase().indexOf(busca) !== -1;
    });
    renderizarLista();
}
function renderizarLista() {
    var lista = document.getElementById('listaRegistros');
    if (!lista) return;
    var html = '';
    registrosFiltrados.forEach(r => {
        html += '<div style="border: 1px solid #ccc; margin: 10px; padding: 10px; border-radius: 8px; background: #f9f9f9;">' +
                '<strong>' + (r.codigo || '---') + '</strong> - ' + (r.descricao || '---') + '<br>' +
                'Carro: ' + (r.numeroCarro || '---') + ' | Qtd: ' + (r.quantidade || 0) + '<br>' +
                'Motivo: ' + (r.motivo || '---') + ' | Atraso: ' + (r.atraso || 0) + ' dias<br>' +
                'Status: ' + (r.status || '---') +
                '</div>';
    });
    lista.innerHTML = html || '<p>Nenhum registro.</p>';
}
function getStatusClasse(s) { return ""; } 

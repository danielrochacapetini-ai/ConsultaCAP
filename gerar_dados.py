#!/usr/bin/env python3
"""
GERADOR AUTOMÁTICO DE DADOS - MARCOPOLO SÃO MATEUS
===================================================

Este script lê a estrutura de pastas dentro de 'dados/' e gera
automaticamente o arquivo 'dados.js' com todas as peças cadastradas.

ESTRUTURA ESPERADA:
    dados/
    ├── MODELO/
    │   ├── CATEGORIA/
    │   │   ├── NOME_DA_PECA/
    │   │   │   ├── CODIGO.txt  (contém o código da peça)
    │   │   │   └── imagem.png  (ou .jpg)

COMO USAR:
    1. Adicione suas pastas e arquivos na estrutura acima
    2. Execute: python3 gerar_dados.py
    3. O arquivo dados.js será atualizado automaticamente
    4. Faça commit e push para o GitHub

REGRAS:
    - O nome da pasta da peça será usado como NOME DA PEÇA
    - O arquivo .txt deve conter apenas o código (ex: MP-ADV-001)
    - A imagem pode ser .png, .jpg ou .jpeg
    - Se não houver arquivo .txt, o nome da pasta será usado como código
"""

import os
import json

# Configuração
PASTA_DADOS = "dados"
ARQUIVO_SAIDA = "dados.js"

MODELOS = [
    "VOLARE_MV9L", "VOLARE_V9L", "VOLARE_W9C", "VOLARE_MV8L",
    "VOLARE_V8L", "VOLARE_WL", "VOLARE_V10L", "VOLARE_W12",
    "MDS", "ORE_1", "ONUREA"
]

CATEGORIAS = ["FABRICADOS", "PLASTICOS", "PERFIS", "ILUMINACAO", "ADESIVOS"]

NOMES_MODELOS = {
    "VOLARE_MV9L": "VOLARE MV9L",
    "VOLARE_V9L": "VOLARE V9L",
    "VOLARE_W9C": "VOLARE W9C",
    "VOLARE_MV8L": "VOLARE MV8L",
    "VOLARE_V8L": "VOLARE V8L",
    "VOLARE_WL": "VOLARE WL",
    "VOLARE_V10L": "VOLARE V10L",
    "VOLARE_W12": "VOLARE W12",
    "MDS": "MDS",
    "ORE_1": "ORE 1",
    "ONUREA": "ONUREA"
}

NOMES_CATEGORIAS = {
    "FABRICADOS": "FABRICADOS",
    "PLASTICOS": "PLÁSTICOS",
    "PERFIS": "PERFIS",
    "ILUMINACAO": "ILUMINAÇÃO",
    "ADESIVOS": "ADESIVOS"
}


def encontrar_imagem(pasta):
    """Encontra arquivo de imagem na pasta"""
    extensoes = ['.png', '.jpg', '.jpeg', '.webp']
    for arquivo in os.listdir(pasta):
        if os.path.splitext(arquivo)[1].lower() in extensoes:
            return arquivo
    return None


def encontrar_codigo(pasta, nome_peca):
    """Encontra o código da peça no arquivo .txt"""
    for arquivo in os.listdir(pasta):
        if arquivo.endswith('.txt'):
            caminho = os.path.join(pasta, arquivo)
            with open(caminho, 'r', encoding='utf-8') as f:
                codigo = f.read().strip()
            if codigo:
                return codigo
            # Se o arquivo está vazio, usa o nome do arquivo sem extensão
            return os.path.splitext(arquivo)[0]
    # Se não há arquivo .txt, usa o nome da pasta
    return nome_peca


def escanear_pecas():
    """Escaneia a estrutura de pastas e retorna lista de peças"""
    pecas = []

    for modelo in MODELOS:
        pasta_modelo = os.path.join(PASTA_DADOS, modelo)
        if not os.path.isdir(pasta_modelo):
            continue

        for categoria in CATEGORIAS:
            pasta_categoria = os.path.join(pasta_modelo, categoria)
            if not os.path.isdir(pasta_categoria):
                continue

            for nome_peca in sorted(os.listdir(pasta_categoria)):
                pasta_peca = os.path.join(pasta_categoria, nome_peca)
                if not os.path.isdir(pasta_peca):
                    continue

                imagem = encontrar_imagem(pasta_peca)
                if imagem is None:
                    print(f"  AVISO: Sem imagem em {pasta_peca}")
                    continue

                codigo = encontrar_codigo(pasta_peca, nome_peca)
                caminho_imagem = f"{PASTA_DADOS}/{modelo}/{categoria}/{nome_peca}/{imagem}"

                pecas.append({
                    "modelo": modelo,
                    "categoria": categoria,
                    "nome": nome_peca.replace("_", " ").upper(),
                    "codigo": codigo,
                    "imagem": caminho_imagem
                })

                print(f"  OK: {modelo}/{categoria}/{nome_peca} -> {codigo}")

    return pecas


def gerar_js(pecas):
    """Gera o arquivo dados.js"""

    modelos_js = json.dumps(
        [{"id": m, "nome": NOMES_MODELOS[m]} for m in MODELOS],
        ensure_ascii=False, indent=4
    )

    categorias_js = json.dumps(
        [{"id": c, "nome": NOMES_CATEGORIAS[c], "icone": c.lower()} for c in CATEGORIAS],
        ensure_ascii=False, indent=4
    )

    pecas_js = json.dumps(pecas, ensure_ascii=False, indent=4)

    conteudo = f"""/**
 * BANCO DE DADOS DE PEÇAS - MARCOPOLO SÃO MATEUS
 * Gerado automaticamente por gerar_dados.py
 * Total de peças: {len(pecas)}
 */

const MODELOS = {modelos_js};

const CATEGORIAS = {categorias_js};

const pecas = {pecas_js};
"""

    with open(ARQUIVO_SAIDA, 'w', encoding='utf-8') as f:
        f.write(conteudo)

    print(f"\\n{'='*50}")
    print(f"Arquivo '{ARQUIVO_SAIDA}' gerado com sucesso!")
    print(f"Total de peças cadastradas: {len(pecas)}")
    print(f"{'='*50}")


if __name__ == "__main__":
    print("GERADOR DE DADOS - MARCOPOLO SÃO MATEUS")
    print("=" * 50)
    print(f"Escaneando pasta '{PASTA_DADOS}'...\\n")

    pecas = escanear_pecas()
    gerar_js(pecas)

#!/usr/bin/env python3
"""Gera imagens placeholder para todas as peças de exemplo"""

from PIL import Image, ImageDraw, ImageFont
import os

PASTA_DADOS = "dados"

cores_categoria = {
    "FABRICADOS": (0, 60, 120),
    "PLASTICOS": (40, 120, 60),
    "PERFIS": (120, 60, 0),
    "ILUMINACAO": (180, 140, 0),
    "ADESIVOS": (150, 30, 30)
}

def criar_imagem(pasta, nome_peca, codigo, categoria):
    """Cria uma imagem placeholder para a peça"""
    cor = cores_categoria.get(categoria, (100, 100, 100))
    
    img = Image.new('RGB', (400, 300), color=(250, 250, 250))
    draw = ImageDraw.Draw(img)
    
    # Borda
    draw.rectangle([5, 5, 395, 295], outline=cor, width=3)
    
    # Faixa superior
    draw.rectangle([5, 5, 395, 50], fill=cor)
    draw.text((15, 15), categoria, fill=(255, 255, 255))
    
    # Nome da peça
    draw.text((100, 120), nome_peca, fill=cor)
    
    # Código
    draw.text((140, 160), codigo, fill=(100, 100, 100))
    
    # Texto informativo
    draw.text((100, 220), "[IMAGEM DE EXEMPLO]", fill=(180, 180, 180))
    
    # Salvar
    arquivo_img = os.path.join(pasta, f"{codigo}.png")
    img.save(arquivo_img)
    print(f"  Imagem criada: {arquivo_img}")


# Percorrer estrutura
for modelo in os.listdir(PASTA_DADOS):
    pasta_modelo = os.path.join(PASTA_DADOS, modelo)
    if not os.path.isdir(pasta_modelo):
        continue
    
    for categoria in os.listdir(pasta_modelo):
        pasta_cat = os.path.join(pasta_modelo, categoria)
        if not os.path.isdir(pasta_cat):
            continue
        
        for peca in os.listdir(pasta_cat):
            pasta_peca = os.path.join(pasta_cat, peca)
            if not os.path.isdir(pasta_peca):
                continue
            
            # Verificar se já tem imagem
            tem_imagem = any(
                f.lower().endswith(('.png', '.jpg', '.jpeg'))
                for f in os.listdir(pasta_peca)
            )
            
            if not tem_imagem:
                # Buscar código
                codigo = peca
                for f in os.listdir(pasta_peca):
                    if f.endswith('.txt'):
                        with open(os.path.join(pasta_peca, f), 'r') as txt:
                            codigo = txt.read().strip() or peca
                        break
                
                criar_imagem(pasta_peca, peca.replace("_", " "), codigo, categoria)

print("\nImagens de exemplo geradas com sucesso!")

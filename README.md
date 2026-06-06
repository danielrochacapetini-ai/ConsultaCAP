# Marcopolo São Mateus - Sistema de Consulta de Peças

Este é um site estático desenvolvido para hospedar no GitHub Pages, projetado para consultar peças de veículos da Marcopolo - Unidade São Mateus.

## 🚀 Como Hospedar no GitHub Pages

1. Crie um repositório no seu GitHub chamado `marcopolo-pecas`
2. Faça o upload de todos os arquivos desta pasta para o repositório
3. No GitHub, vá em **Settings** > **Pages**
4. Em "Source", selecione a branch `main` e clique em **Save**
5. Em alguns minutos, seu site estará disponível no link fornecido pelo GitHub!

## 📁 Como Adicionar Novas Peças

O site foi projetado para ser atualizado apenas criando pastas e arquivos, sem precisar programar!

A estrutura de pastas dentro de `dados/` funciona assim:
`dados/MODELO/CATEGORIA/NOME_DA_PECA/`

Para adicionar uma nova peça, por exemplo, um "Para-choque" no modelo "VOLARE_WL" na categoria "PLASTICOS":

1. Crie a pasta: `dados/VOLARE_WL/PLASTICOS/PARA_CHOQUE/`
2. Coloque a imagem da peça lá dentro (ex: `foto.jpg` ou `foto.png`)
3. Crie um arquivo de texto chamado `codigo.txt` lá dentro e escreva o código da peça nele (ex: `MP-PLA-005`)
4. Rode o script gerador para atualizar o site!

## 🔄 Como Atualizar o Banco de Dados (dados.js)

Toda vez que você adicionar ou remover peças das pastas, você precisa atualizar o arquivo `dados.js` para que o site saiba das mudanças.

Criamos um script automático para fazer isso por você:

1. Se você tem Python instalado, abra o terminal na pasta do projeto
2. Digite: `python gerar_dados.py` (ou `python3 gerar_dados.py`)
3. O script vai ler todas as suas pastas e criar o `dados.js` atualizado automaticamente!

## 🎨 Personalização

- **Cores**: As cores padrão (Azul #003C78, Laranja #F47920) podem ser alteradas no topo do arquivo `style.css`.
- **Modelos e Categorias**: Se precisar adicionar novos modelos de veículos no futuro, basta editar o topo do arquivo `gerar_dados.py` e rodar o script.

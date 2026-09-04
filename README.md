# Criador de Perguntas para Stories

Ferramenta web para criar cards que simulam uma pergunta **já recebida** na caixinha
de perguntas do Instagram — para usar em criativos, anúncios e Stories.

Não é uma caixinha para o público responder: você digita a pergunta fictícia e a
ferramenta gera o card no estado "alguém já perguntou isso".

```
╭──────────────────────────────╮
│       Faça uma pergunta      │
├──────────────────────────────┤
│                              │
│      Quanto custa isso?      │
│                              │
╰──────────────────────────────╯
```

## Como usar

Abra o `index.html` no navegador. Sem instalação, sem build, sem backend, sem login.

1. Digite a pergunta recebida — o preview atualiza na hora.
2. Opcionalmente escreva a resposta (texto do criativo, fora da caixinha).
3. Ajuste posição/tamanho se quiser (arraste a caixinha no preview).
4. Clique em **Baixar PNG**.

## O que dá para fazer

**Conteúdo** — só pergunta, pergunta + resposta, só resposta ou vazio (botão *Limpar*).
A caixinha só aparece quando existe uma pergunta.

**Formatos** — Story (1080×1920), Post vertical (1080×1350), Quadrado (1080×1080)
e *Só a caixinha* (tamanho automático, fundo transparente).

**Fundo** — transparente, cor sólida, gradiente (vertical/diagonal/horizontal) ou
imagem enviada pelo usuário. Com fundo transparente o PNG sai com canal alfa, pronto
para ser colado sobre outro criativo.

**Posição e tamanho** — arraste a caixinha e a resposta direto no preview (mouse ou
toque), com controles de largura, tamanho geral, arredondamento e tamanho de fonte,
além do botão *Centralizar caixinha*.

**Personalização** — cor do cabeçalho, do corpo, do texto do topo e da pergunta;
alinhamento e quebra automática de linha; tamanho, cor, alinhamento e posição da
resposta; texto do topo editável (padrão "Faça uma pergunta").

**Exportação** — *Baixar PNG* exporta o criativo no formato escolhido; *Baixar somente
a caixinha* exporta só o card, com fundo transparente e no mínimo 1400px de largura.
Nenhum elemento da interface entra na imagem: o PNG é renderizado em um canvas
separado, sem o xadrez de transparência do preview.

## Comportamento do texto

A pergunta se adapta ao tamanho: quebra automática de linha, quebra por caractere
para palavras maiores que a linha, altura do card crescendo conforme necessário e
redução automática da fonte quando o card não cabe na altura do criativo. O texto
nunca escapa da caixinha.

## Estrutura

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Editor, preview e barra de exportação |
| `style.css` | Interface minimalista e responsiva (desktop: editor + preview lado a lado; mobile: preview, editor e barra fixa de download) |
| `script.js` | Estado, layout, renderização em canvas, arraste e exportação PNG |

Tudo em JavaScript puro, sem dependências externas.

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

O editor tem três campos, na ordem em que a caixinha é lida:

1. **Texto do topo** — o que você escreveu no sticker (padrão "Faça uma pergunta");
   aceita emoji e várias linhas.
2. **Pergunta recebida** — a pergunta que o seguidor teria enviado.
3. **Resposta** — opcional, é o texto do criativo, fora da caixinha.

O preview atualiza a cada tecla. Ajuste posição/tamanho se quiser (arraste a
caixinha no preview) e clique em **Baixar PNG**.

O botão **Limpar** começa uma criação nova do zero: apaga os textos e devolve
cores, tamanhos, alinhamentos, fundo, formato e posição aos valores padrão.

## O que dá para fazer

**Conteúdo** — só pergunta, pergunta + resposta, só resposta ou vazio (botão *Limpar*).
A caixinha só aparece quando existe uma pergunta.

**Visual padrão** — cores e proporções do sticker do Instagram: cabeçalho `#262626`
com texto `#C7C7C7`, corpo branco e pergunta `#262626`, cantos bem arredondados e
cabeçalho ocupando cerca de um terço da altura. Tudo editável.

**Formatos** — Story (1080×1920), Post vertical (1080×1350), Quadrado (1080×1080)
e *Só a caixinha* (tamanho automático, fundo transparente).

**Fundo** — transparente, cor sólida, gradiente (vertical/diagonal/horizontal) ou
imagem enviada pelo usuário. Com fundo transparente o PNG sai com canal alfa, pronto
para ser colado sobre outro criativo.

**Posição e tamanho** — arraste a caixinha e a resposta direto no preview (mouse ou
toque), com controles de largura, tamanho geral, arredondamento e tamanho de fonte,
além do botão *Centralizar caixinha*.

**Personalização** — cor do cabeçalho, do corpo, do texto do topo e da pergunta;
tamanho, alinhamento e quebra automática de linha independentes para o texto do topo
e para a pergunta; tamanho, cor, alinhamento e posição da resposta.

**Exportação** — *Baixar PNG* exporta o criativo no formato escolhido; *Baixar somente
a caixinha* exporta só o card, com fundo transparente e no mínimo 1400px de largura.
Nenhum elemento da interface entra na imagem: o PNG é renderizado em um canvas
separado, sem o xadrez de transparência do preview.

## Comportamento do texto

Os dois textos da caixinha se adaptam do mesmo jeito: quebra automática de linha,
quebra manual com Enter, quebra por caractere para palavras maiores que a linha e
crescimento em altura conforme necessário — o cabeçalho ganha linhas e o corpo
acompanha. Com a quebra automática desligada, a fonte encolhe até o texto caber em
uma linha só, e a fonte da pergunta também reduz quando o card não cabe na altura do
criativo. O texto nunca escapa da caixinha.

## Estrutura

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Editor, preview e barra de exportação |
| `style.css` | Interface minimalista e responsiva (desktop: editor + preview lado a lado; mobile: preview, editor e barra fixa de download) |
| `script.js` | Estado, layout, renderização em canvas, arraste e exportação PNG |

Tudo em JavaScript puro, sem dependências externas.

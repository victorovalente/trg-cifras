# 🎸 TRG Cifras — versão revisada

Um aplicativo local de cifras para navegador, sem conta e sem backend. Suas cifras ficam no armazenamento **local do navegador** (`localStorage`, chave `trg_cifras_v1`).

## Abrir no VS Code

1. Abra a pasta `trg-cifras` no VS Code.
2. Instale a extensão **Live Server** (Ritwick Dey), se desejar.
3. Clique com o botão direito no `index.html` → **Open with Live Server**.
4. Também é possível abrir `index.html` diretamente no navegador.

## O que esta versão melhorou

- Reconhece seções como `[Coro]`, `[Final]` e `[Bridge]` mesmo quando começam com a letra de uma nota.
- Transpõe **somente a tônica e o baixo**: `Cmaj7`, `G7M`, `D/F#`, `F#m7(b5)` preservam suas extensões.
- A escolha automática de ♯/♭ acompanha o **tom de destino** (G → +1 = Ab). No tom original, mantém a grafia digitada; ao forçar ♯/♭, atualiza os acordes mesmo em zero semitons.
- Evita acordes sobrepostos: quando um acorde longo invadiria o seguinte, insere espaços nas duas linhas para preservar a posição em relação à letra.
- Importação com uma janela de escolha segura: **Cancelar não substitui nada**; substituir exige digitar `SUBSTITUIR`.
- Mesclagem mantém todas as cifras existentes, ignora repetidas por **título + artista** (desconsidera acentos, letras maiúsculas e espaços repetidos), remove repetidas no arquivo e reatribui IDs conflitantes.
- Se o armazenamento falhar, mostra erro em vez de afirmar que salvou.
- Não recria a cifra de exemplo após você excluir todas as cifras.
- Lista criada com `textContent`, sem executar HTML vindo do título ou artista.

## Formato das cifras

```text
[Intro]
[G] [D/F#] [Em] [C]

[Verso]
[G]Eu canto ao Senhor [D/F#]nesta manhã
[Em]Minha voz se eleva [C]em louvor

[Coro]
[G]Uma nova seção

[Final]
[G]
```

Coloque o acorde entre colchetes antes da sílaba; coloque o título da seção **sozinho em uma linha**. Exemplos de acordes reconhecidos: `[G]`, `[Bm7]`, `[F#m7(b5)]`, `[Cadd9]`, `[D/F#]`, `[G7M]`.

## Controles

- `−`/`+`: meio tom abaixo/acima; `Resetar`: volta ao tom original.
- `♯`/`♭`: alterna entre grafia automática e alternativa manual.
- `▶ Auto-scroll`: iniciar/parar; ajuste a velocidade de 1 a 10.
- **Espaço**: iniciar/parar, desde que nenhum botão ou campo esteja com foco.
- `↑ Topo`: para a rolagem e volta ao início.
- `Exportar`: baixa um arquivo JSON com todas as cifras.
- `Importar`: oferece **Mesclar**, **Substituir tudo…** ou **Cancelar**; a substituição requer confirmação por texto.

## Arquivos

```text
trg-cifras/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── notas.js
│   ├── storage.js
│   ├── cifra.js
│   ├── autoscroll.js
│   ├── backup.js
│   └── app.js
├── tests/
│   ├── testes.js
│   └── testes-app.js
└── README.md
```

## Importante sobre seus dados

A atualização **mantém a mesma chave do armazenamento** do projeto anterior, mas os dados não são compartilhados automaticamente entre `file://`, `http://localhost` e outras origens. Abra na mesma origem usada antes e faça **Exportar** antes de mudar o modo de abrir, limpar o navegador ou substituir arquivos. A importação preserva o formato JSON exportado pela primeira versão. O backup JSON é a forma de transferir as cifras entre navegadores ou dispositivos.

## Limitações conhecidas

- A transposição cobre notas e baixos com #/b e a maioria dos símbolos comuns de acordes, mas ainda não implementa toda a ortografia harmônica (como dobrados sustenidos, ou notas enarmônicas por função).
- O alinhamento é otimizado para letras usuais em fonte monoespaçada; emojis, certos caracteres de largura dupla e combinações Unicode podem ocupar larguras visuais diferentes.
- Armazenamento local pode ser perdido ao limpar os dados do site ou usar janela anônima; exporte backups periodicamente.

## Testes de regressão

Na raiz, se tiver Node.js instalado, rode `node tests/testes.js` e `node tests/testes-app.js`. Os testes cobrem reconhecimento de seções, transposição, alinhamento, proteção contra HTML, duplicatas, cadastro, visualização e cancelamento/substituição segura no fluxo de importação.

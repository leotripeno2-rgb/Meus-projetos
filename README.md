# Helena Aragão · site de imobiliária

Abra a pasta no VS Code e use a extensão **Live Server** (botão direito em `index.html` → Open with Live Server).
Não precisa instalar nada. Só HTML, CSS e JavaScript.

## O que tem
- `index.html`: home. Tela de entrada, abertura em tela cheia (o título entra palavra por palavra), método, faixa de bairros em movimento, coleção editorial (cada imóvel com um enquadramento; passe o mouse para entrar na casa), **maquete 3D**, percurso, comprar e vender, bairros, sobre e o convite final com o botão do WhatsApp.
- `imovel.html?p=<slug>`: página de cada imóvel, montada como uma matéria de revista: abertura em tela cheia, o imóvel em números, foto de ponta a ponta, "Sobre o imóvel" (título, texto e quatro parágrafos curtos), galeria assimétrica com uma citação, detalhes dos materiais com recortes, ficha técnica, localização, convite "Conheça o espaço pessoalmente" (escolha do horário + WhatsApp) e o próximo imóvel.
- **Novidades (v3):** **Chegada** (logo depois da abertura): tela cheia em que a rolagem "caminha" até a casa, com as palavras Chegue / Entre / Fique; **Álbum**: galeria horizontal que anda com a rolagem (a lista fica em `window.ALBUM`, no fim de `js/data.js`); holofote que segue o mouse nas seções escuras, cartões que se inclinam e título da abertura que acompanha o mouse; desenho técnico da fachada que se traça antes da foto; linhas que reagem ao mouse no convite final; transição de página com o nome do imóvel. Fotos novas: `det-1` a `det-6` (recortes de detalhe). Quadros da Chegada: `assets/chegada/f001.webp` a `f048.webp` (para trocar, extraia 48 quadros de outro vídeo).
- **Novidades (v2):** vídeo na abertura da home e das páginas de imóvel; números grandes (12 anos, 140 famílias…) depois do "Método"; seção **Filmes** (painéis que se abrem e tocam, um por casa, trocando sozinhos); nos cartões da coleção a casa ganha movimento ao passar o mouse; na página do imóvel: **Filme** (a foto se abre até tela cheia e o vídeo toca), **Planta** interativa (gerada de área, suítes e vagas) e **A luz ao longo do dia** (controle de 06h a 21h). Seções escuras dão contraste com o fundo pedra.
- `js/data.js`: **os imóveis**. Edite nomes, preços, textos, fotos e distâncias aqui; a home e a página de cada imóvel se atualizam sozinhas. `video` (nome do arquivo em `assets/video/`, sem .mp4; opcional) e `hora` (Manhã, Tarde, Fim de tarde ou Noite) alimentam os filmes. `titulo` e `historia` são a narrativa da página do imóvel (o trecho entre *asteriscos* sai em itálico).
- `js/maquete.js`: a maquete 3D (three.js). A rolagem gira a câmera, faz o sol atravessar o dia (06:00 às 21:00), levanta o andar de cima e acende a casa à noite. No computador dá para arrastar e girar.
- `css/style.css`, `js/main.js`: visual e animações.
- `vendor/`: three.js r149 e Lenis (rolagem suave), salvos no projeto (licença MIT). Não dependem de internet.

## Linguagem visual
Galeria de arquitetura + revista de design. Grade de 12 colunas, Inter Tight com palavras em Instrument Serif itálica, números grandes em serifa, rótulos pequenos em maiúsculas, cantos retos e bastante espaço entre as seções. Fundo pedra (#E5E1D8) e textura de papel bem sutil.
Microinterações:
- títulos revelados por máscara;
- fotos que entram como cortina, com parallax leve;
- números que contam;
- cursor que diz o que acontece ao clicar;
- botão magnético no convite final;
- capítulo atual ao lado do logo;
- cortina de papel entre as páginas.

Tudo isso é desligado no modo leve.

## Fotos
- `assets/foto/<nome>.webp` (até 2400 px) e `<nome>-s.webp` (1200 px, usada no celular). Os nomes são citados em `js/data.js`.
- As fotos atuais são quadros dos vídeos originais do Pexels (4K e Full HD), com a saturação reduzida.
- Para tirar um quadro de um vídeo novo (precisa do ffmpeg):
  `ffmpeg -ss 3 -i video.mp4 -frames:v 1 -vf "scale=2400:-2,eq=saturation=0.7" -quality 80 assets/foto/nome.webp`
  e a versão pequena com `scale=1200:-2` e o nome terminando em `-s.webp`.
- Interiores (`*-sala`, `*-cozinha`, `*-quarto`): fotos reais do Pixabay (licença Pixabay, uso livre), 1280 px. Para buscar mais, use a API do Pixabay com a sua chave (não guarde a chave no projeto).
- Percurso: `assets/percurso/f001.webp` a `f048.webp` (1600 px), quadros em sequência da Residência Terraços.

## Vídeos
`assets/video/<nome>.mp4` (cerca de 1 MB) e `<nome>-s.mp4` (versão leve, usada no celular). Só carregam quando aparecem na tela e nunca no modo leve. Para trocar, mantenha os dois nomes.

## Arquivos que não são mais usados
`assets/still/`, `assets/poster/`, `assets/seq/`, `assets/foto/vento-3-blur.webp` e `tools/video_para_frames.py` são de versões anteriores. Podem ser apagados.

## Celular fraco
O site liga o **modo leve** sozinho (economia de dados, rede 2G, pouca memória/processador, "reduzir movimento"): sem tela de entrada, sem maquete 3D (entra uma foto), sem percurso animado, sem revelações: só imagens e texto.

Nomes, contatos e CRECI são de exemplo. Imagens: quadros de vídeos do Pexels (licença Pexels) e interiores do Pixabay (licença Pixabay).

## Catálogo (v4)
- `catalogo.html` + `js/catalogo.js`: página com todos os imóveis e filtros (tipo, valor, suítes, ordem). Lê `js/data.js`.
- Faixas de imóveis espalhadas: qualquer `<section data-rail="todos|cat:Casa|cat:Apartamento|outros:<slug>" data-lbl="..." data-title="...">` vira uma faixa. Já há faixas na home (antes de Comprar e vender, antes de Sobre, antes do Contato) e no fim de cada imóvel.
- `assets/catalogo-helena-aragao.pdf`: PDF pronto (botão "Baixar catálogo em PDF"). Para refazer após mudar `data.js`: abra `catalogo-pdf.html` no navegador, Ctrl+P, "Salvar como PDF", A4 paisagem, margens "Nenhuma", marque "Gráficos de segundo plano", e salve por cima do arquivo acima.

## Amanhecer e Do alto (v5)
- `#amanhecer` (home, antes da Coleção): a rolagem leva a Casa Vento Sul da noite ao dia. São três fotos da mesma casa (`assets/foto/amanhecer-noite`, `-aurora`, `-dia`, cada uma com versão `-s`) que se cruzam; sol, estrelas, feixe de luz, relógio (05:10 → 07:40) e as palavras "Chegue. Entre. Fique." são só código. Para trocar a casa, gere três versões de outra foto e mantenha os nomes.
- `#do-alto` (home, antes de Filmes): o filme `drone.mp4` começa numa janela pequena e se abre até a tela inteira enquanto "Vista / do alto." se separa. Adaptado do componente React "scroll-expansion-hero" para JS puro, sem travar a rolagem.
- Ordem na home: abertura → Amanhecer → Método → Diferenciais → Do alto → Coleção … Vozes → Chegada → Contato.
- Só celular fraco ou economia de dados deixam essas duas seções paradas. Com "reduzir movimento" ligado no sistema elas continuam funcionando, porque só andam quando você rola.

## Detalhes de acabamento (v6) — `js/extras.js`
- Botão flutuante no canto: "Fale com a Helena" (WhatsApp) + círculo que enche conforme a leitura e volta ao topo. Troque o número em `extras.js` (wa.me/55...).
- Contorno de latão que acompanha o mouse nos depoimentos, perguntas, caixa de diferenciais e cartões do catálogo (só no computador).
- Brilho de latão que passa de tempos em tempos nos botões principais.
- Cartões do catálogo e das faixas: ao passar o mouse, a foto de um ambiente interno sobe por cima da fachada.
- Botões no estilo Uiverse (adaptados): o círculo com a seta cresce e pinta o botão, o texto rola para cima e a seta sai e volta. Filtros do catálogo ganham fundo que entra pela esquerda.

## Por dentro (v7) — `js/blinds.js`
- Seção em tela cheia em que a rolagem troca as fotos abrindo "persianas" (faixas horizontais, grade aleatória, faixas verticais, colunas). Adaptado de "SVG Mask Transitions on Scroll" (Hiroki Watanabe / Codrops, licença MIT), reescrito sem GSAP.
- Na home: antes de Bairros, com salas, cozinha e quarto de quatro imóveis (troque as fotos em `data-imgs` no index.html).
- Em cada imóvel: depois da galeria, com fachada, ambientes e detalhe daquele imóvel (automático, a partir do data.js).

## Página inicial mais curta (v8)
- Ordem: Abertura → Amanhecer → Método → Diferenciais → Coleção → Por dentro → Vista do alto → Filmes → Álbum → Comprar e vender → Bairros → Sobre → Vozes → Contato.
- Saíram da home: Maquete 3D, Percurso, Chegada e as três faixas de imóveis (o catálogo e as faixas continuam na página Catálogo e no fim de cada imóvel). Os arquivos (maquete.js, assets/percurso, assets/chegada) ficaram na pasta; uma cópia da home anterior pode ser pedida de volta.
- Animações mais curtas e marcadas: amanhecer, vista do alto e persianas pedem menos rolagem; as persianas chegam com zoom.

## Finalização (v9)
- Troca de página em pixels (`js/extras.js`): ao clicar num imóvel ou no catálogo, uma grade de quadrados cor de papel (com alguns dourados) cobre a tela e se desfaz na página nova. Adaptado de "Pixel Transition" (Codrops, MIT).
- Ensaio (`js/pblur.js`, home, antes de Sobre): cinco fotos que ficam nítidas no meio da tela e se desfazem nas bordas, com grão de filme. Adaptado de "WebGL Progressive Blur" (Jorge Toloza / Codrops, MIT), em WebGL puro. Em celular fraco aparecem as fotos normais.
- "Por dentro" (`js/blinds.js`) é o terceiro link enviado (Scroll-Transition, Hiroki Watanabe / Codrops, MIT).

## Correção e maquete 3D do imóvel (v10)
- Corrigido o relógio que mostrava "aN:aN" (uma variável do amanhecer tinha o mesmo nome do controle de luz).
- A seção "A luz ao longo do dia" da página do imóvel virou "Maquete 3D" (`js/maquete-imovel.js`): arrastar gira, o controle de hora move o sol e a sombra, à noite as janelas acendem, "Abrir o andar de cima" levanta o pavimento. Casas viram casa de dois pavimentos (telhado em duas águas quando o texto fala nisso, muro de pedra quando há pedra/arenito); apartamentos viram uma torre com "Seu andar" marcado em dourado.

/* Coleção de imóveis (dados de exemplo). Edite aqui: a home e a página de cada imóvel leem este arquivo.
   fotos: nomes em assets/foto/ (cada uma tem a versão grande e a "-s", menor, para celular).
     capa = imagem da coleção, abertura = imagem grande da página, galeria = as demais, detalhe = recorte vertical, interiores = [nome do ambiente, foto], amplo = (opcional) foto para a faixa de largura total da galeria, quando a galeria[0] for pequena.
   titulo = frase da seção "Sobre o imóvel" (o trecho entre *asteriscos* sai em itálico), historia = parágrafos curtos da narrativa.
      video = (opcional) nome do arquivo em assets/video/ (<nome>.mp4 e <nome>-s.mp4 para celular); hora = período do dia mostrado na seção Filmes.
   Interiores: fotos do Pixabay (licença Pixabay). */
window.IMOVEIS = [
  {
    slug: 'casa-vento-sul', video: 'casa', hora: 'Manhã', n: 'Casa Vento Sul', loc: 'Alto da Figueira', cidade: 'São Paulo', cat: 'Casa', preco: 'R$ 2,4 mi',
    area: '380 m²', suites: 4, vagas: 3, terreno: '760 m²', ano: 2021, arq: 'Estúdio Lima',
    fotos: { capa: 'vento-3', abertura: 'vento-1', galeria: ['vento-2', 'vento-3'], detalhe: 'vento-4',
      interiores: [['Cozinha', 'vento-cozinha'], ['Quarto', 'vento-quarto']] },
    resumo: 'Duas águas, madeira escura e um jardim que desce até a rua.',
    texto: 'A casa foi desenhada para ser vista de longe e descoberta de perto. A fachada branca recebe a luz da manhã, o beiral de madeira projeta sombra sobre as janelas e o caminho de pedra leva o olhar até a entrada.',
    ambientes: ['Fachada', 'Jardim', 'Varanda', 'Garagem'],
    materiais: ['Madeira escura no beiral e nas venezianas', 'Reboco branco texturizado', 'Painel de pedra natural', 'Caminho em placas de concreto'],
    titulo: 'Uma casa que *recebe a manhã.*',
    historia: [
      ['A arquitetura', 'Dois volumes de telhado em duas águas, unidos por um beiral contínuo de madeira escura. A planta se organiza em torno do jardim, não da rua.'],
      ['A luz', 'A fachada branca recebe o sol da manhã. À tarde o beiral sombreia as janelas e a casa se mantém fresca.'],
      ['O bairro', 'Ruas arborizadas e pouco movimento. O parque fica a quatro minutos a pé; a escola bilíngue, a seis de carro.'],
      ['O dia a dia', 'Cozinha aberta para o jardim, quatro suítes no andar de cima e uma varanda onde o café da manhã acontece ao ar livre.']
    ],
    perto: [['Escola bilíngue', '6 min'], ['Parque da Figueira', '4 min'], ['Centro comercial', '12 min']]
  },
  {
    slug: 'torre-ipe', video: 'drone', hora: 'Fim de tarde', n: 'Torre Ipê', loc: 'Centro Velho', cidade: 'São Paulo', cat: 'Apartamento', preco: 'R$ 1,9 mi',
    area: '140 m²', suites: 3, vagas: 2, terreno: 'Andar alto', ano: 2019, arq: 'Ateliê Moreira',
    fotos: { capa: 'ipe-2', abertura: 'ipe-1', galeria: ['ipe-3', 'ipe-2'], detalhe: 'ipe-4',
      interiores: [['Sala', 'ipe-sala'], ['Cozinha', 'ipe-cozinha']] },
    resumo: 'Varandas de vidro, pedra clara e brises escuros marcando o ritmo da fachada.',
    texto: 'No alto, as varandas se abrem para o horizonte e a luz entra por dois lados. A pedra clara na base e os brises verticais dão ritmo à fachada e silêncio ao interior.',
    ambientes: ['Fachada', 'Varanda', 'Sala', 'Cobertura'],
    materiais: ['Pedra clara na base', 'Guarda-corpo de vidro', 'Brises metálicos escuros', 'Painel em madeira na lateral'],
    titulo: 'No alto, a cidade vira *horizonte.*',
    historia: [
      ['A arquitetura', 'Base em pedra clara, varandas de vidro e brises verticais escuros que dão ritmo à fachada e filtram o sol da tarde.'],
      ['A luz', 'Andar alto com luz por dois lados: nascente na sala, poente na varanda. Nenhum prédio à frente.'],
      ['O bairro', 'Metrô a 400 metros, mercado municipal a cinco minutos e teatro a oito. Quase tudo se resolve a pé.'],
      ['O dia a dia', 'Três suítes, sala integrada à varanda e uma cozinha voltada para a cidade. Silencioso, apesar do centro.']
    ],
    perto: [['Metrô', '400 m'], ['Mercado municipal', '5 min'], ['Teatro', '8 min']]
  },
  {
    slug: 'casa-arenito', hora: 'Tarde', n: 'Casa Arenito', loc: 'Vila das Pedras', cidade: 'São Paulo', cat: 'Casa', preco: 'R$ 2,7 mi',
    area: '310 m²', suites: 3, vagas: 2, terreno: '540 m²', ano: 2023, arq: 'Oficina Prado',
    fotos: { capa: 'pedra-3', abertura: 'pedra-1', galeria: ['pedra-2', 'pedra-4'], detalhe: 'pedra-3', amplo: 'pedra-sala',
      interiores: [['Sala', 'pedra-sala'], ['Quarto', 'pedra-quarto']] },
    resumo: 'Volumes brancos e grafite apoiados num muro de arenito.',
    texto: 'Três volumes simples se encaixam ao redor de um pátio de entrada. O muro de arenito protege a casa da rua e, do lado de dentro, as janelas altas trazem luz sem abrir mão da privacidade.',
    ambientes: ['Fachada', 'Pátio', 'Entrada', 'Jardim'],
    materiais: ['Muro em blocos de arenito', 'Volumes em reboco branco e grafite', 'Pérgola metálica', 'Piso externo em concreto'],
    titulo: 'Três volumes em volta *de um pátio.*',
    historia: [
      ['A arquitetura', 'Volumes brancos e grafite se encaixam ao redor de um pátio de entrada, protegidos da rua por um muro de arenito.'],
      ['A luz', 'Janelas altas trazem luz do céu sem expor o interior. O pátio ilumina a casa por dentro.'],
      ['O bairro', 'Rua sem saída, praça a dois minutos e escola a sete. Crianças andam de bicicleta na calçada.'],
      ['O dia a dia', 'Três suítes, sala aberta para o pátio e uma pérgola que faz sombra nas tardes de verão.']
    ],
    perto: [['Escola', '7 min'], ['Praça das Pedras', '2 min'], ['Supermercado', '5 min']]
  },
  {
    slug: 'residencia-terracos', video: 'terraco', hora: 'Tarde', n: 'Residência Terraços', loc: 'Jardim das Acácias', cidade: 'São Paulo', cat: 'Casa', preco: 'R$ 3,2 mi',
    area: '520 m²', suites: 5, vagas: 4, terreno: '900 m²', ano: 2022, arq: 'Estúdio Lima',
    fotos: { capa: 'terracos-2', abertura: 'terracos-3', galeria: ['terracos-1', 'terracos-4'], detalhe: 'terracos-5',
      interiores: [['Sala aberta', 'terracos-sala'], ['Quarto', 'terracos-quarto']] },
    resumo: 'Vidro de piso a teto abrindo a sala para o terraço.',
    texto: 'Grandes portas de correr eliminam a divisa entre sala e terraço. O forro de madeira avança para fora e a luz do fim da tarde atravessa o espaço de ponta a ponta.',
    ambientes: ['Jardim', 'Terraço', 'Sala aberta', 'Varanda'],
    materiais: ['Forro de madeira avermelhada', 'Vidro de piso a teto', 'Pedra clara em placas', 'Mobiliário externo em aço'],
    titulo: 'A sala termina *no jardim.*',
    historia: [
      ['A arquitetura', 'Portas de correr de piso a teto eliminam a divisa entre sala e terraço. O forro de madeira avança para fora e protege a fachada.'],
      ['A luz', 'A luz do fim da tarde atravessa a casa de ponta a ponta. Pela manhã, o terraço fica na sombra.'],
      ['O bairro', 'Lotes amplos, escolas e praças. A praça das Acácias fica a três minutos; a escola, a cinco.'],
      ['O dia a dia', 'Cinco suítes, sala aberta de ponta a ponta e um terraço que recebe uma mesa para doze pessoas.']
    ],
    perto: [['Escola', '5 min'], ['Praça das Acácias', '3 min'], ['Hospital', '14 min']]
  },
  {
    slug: 'apartamento-cais', video: 'noite', hora: 'Noite', n: 'Apartamento Cais', loc: 'Beira-Rio', cidade: 'São Paulo', cat: 'Apartamento', preco: 'R$ 1,35 mi',
    area: '96 m²', suites: 2, vagas: 2, terreno: 'Varanda gourmet', ano: 2020, arq: 'Ateliê Moreira',
    fotos: { capa: 'cais-3', abertura: 'cais-2', galeria: ['cais-1', 'cais-3'], detalhe: 'cais-4',
      interiores: [['Sala', 'cais-sala'], ['Cozinha', 'cais-cozinha'], ['Quarto', 'cais-quarto']] },
    resumo: 'À noite a varanda vira lanterna: madeira, luz quente e o silêncio do rio.',
    texto: 'O prédio acende devagar. A varanda de forro iluminado recebe a noite como extensão da sala, e a entrada em madeira dá a sensação de estar sendo esperado.',
    ambientes: ['Entrada', 'Varanda', 'Fachada', 'Hall'],
    materiais: ['Porta pivotante em madeira', 'Forro iluminado em luz quente', 'Painel de pedra escura', 'Detalhes em metal vazado'],
    titulo: 'O silêncio do rio, *a dois passos da sala.*',
    historia: [
      ['A arquitetura', 'Porta pivotante em madeira, painel de pedra escura e detalhes em metal vazado. A entrada dá a sensação de estar sendo esperado.'],
      ['A luz', 'O forro iluminado aquece a varanda à noite. De dia, a luz vem do rio, refletida e suave.'],
      ['O bairro', 'À beira do rio, com ciclovia de seis quilômetros na porta, restaurantes a quatro minutos e metrô a nove.'],
      ['O dia a dia', 'Duas suítes, varanda gourmet como extensão da sala e o silêncio do rio no fim do dia.']
    ],
    perto: [['Ciclovia do rio', '1 min'], ['Restaurantes', '4 min'], ['Metrô', '9 min']]
  }
];

/* Álbum horizontal da home: foto (nome em assets/foto/), legenda, imóvel (slug) e proporção (largura/altura). */
window.ALBUM = [
  { foto: 'det-1', leg: 'Beiral e varanda', slug: 'casa-vento-sul', r: .8 },
  { foto: 'det-5', leg: 'O pátio ao fim da tarde', slug: 'residencia-terracos', r: 1.78 },
  { foto: 'det-2', leg: 'Vidro, pedra e brises', slug: 'torre-ipe', r: .8 },
  { foto: 'det-3', leg: 'A entrada acesa', slug: 'apartamento-cais', r: .8 },
  { foto: 'det-6', leg: 'Varanda de luz quente', slug: 'apartamento-cais', r: 2.1 },
  { foto: 'det-4', leg: 'Pedra e vidro', slug: 'residencia-terracos', r: .8 }
];

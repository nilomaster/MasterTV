// Dynamic EPG Engine for MasterTV Real-Time Schedules
// All comments in this file strictly follow ASCII rules

import type { Channel, EPGProgram } from '../types/iptv';

interface ScheduleSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
  title: string;
  synopsis: string;
  category: string;
  rating?: string;
}

// 24-Hour Programming Grids for Brazilian Open TV Channels
export const CHANNEL_24H_SCHEDULES: Record<string, ScheduleSlot[]> = {
  'ch-globo': [
    {
      start: '00:15',
      end: '01:00',
      title: 'Jornal da Globo',
      synopsis: 'As principais noticias do Brasil e do mundo com analise dos fatos do dia.',
      category: 'noticias',
      rating: '10+',
    },
    {
      start: '01:00',
      end: '01:45',
      title: 'Conversa com Bial',
      synopsis: 'Entrevistas aprofundadas com grandes personalidades do cenario cultural e politico.',
      category: 'aberta',
      rating: '12+',
    },
    {
      start: '01:45',
      end: '02:40',
      title: 'Serie Especial da Madrugada',
      synopsis: 'Exibicao de episodios de grandes producoes da teledramaturgia nacional.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '02:40',
      end: '03:25',
      title: 'Comedia na Madruga',
      synopsis: 'Os melhores momentos do humor e quadros comediantes da televisao.',
      category: 'aberta',
      rating: '12+',
    },
    {
      start: '03:25',
      end: '04:00',
      title: 'Corujao - Previa',
      synopsis: 'Selecao especial de filmes de acao, drama e suspense na madrugada.',
      category: 'filmes',
      rating: '14+',
    },
    {
      start: '04:00',
      end: '06:00',
      title: 'Hora Um da Noticia',
      synopsis: 'As primeiras informacoes da manha com giro pelos estados e servico de transito.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '06:00',
      end: '08:30',
      title: 'Bom Dia Sao Paulo (BDSP)',
      synopsis: 'Noticias locais, tempo, transporte publico e prestacao de servicos na capital.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '08:30',
      end: '09:30',
      title: 'Bom Dia Brasil',
      synopsis: 'Telejornal com os acontecimentos mais relevantes do pais nas ultimas horas.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '09:30',
      end: '10:35',
      title: 'Encontro com Patricia Poeta',
      synopsis: 'Debates sobre comportamento, prestacao de servico, musica e celebridades.',
      category: 'aberta',
      rating: 'Livre',
    },
    {
      start: '10:35',
      end: '11:45',
      title: 'Mais Voce com Ana Maria Braga',
      synopsis: 'Receitas culinarias deliciosas, materias especiais e conversas inspiradoras.',
      category: 'aberta',
      rating: 'Livre',
    },
    {
      start: '11:45',
      end: '13:00',
      title: 'SP1 - Primeira Edicao',
      synopsis: 'Jornalismo comunitario e as noticias do meio-dia na Grande Sao Paulo.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '13:00',
      end: '13:25',
      title: 'Globo Esporte SP',
      synopsis: 'Gols da rodada, bastidores dos clubes paulistas e preparacao dos atletas.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '13:25',
      end: '14:45',
      title: 'Jornal Hoje',
      synopsis: 'Cobertura em tempo real dos principais fatos da tarde no Brasil e no exterior.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '14:45',
      end: '15:30',
      title: 'Edicao Especial: Cheias de Charme',
      synopsis: 'A trajetoria de sucesso das Empreguetes na musica e suas reviravoltas.',
      category: 'series',
      rating: '10+',
    },
    {
      start: '15:30',
      end: '17:05',
      title: 'Sessao da Tarde',
      synopsis: 'Grandes sucessos do cinema para toda a familia na tela da Globo.',
      category: 'filmes',
      rating: 'Livre',
    },
    {
      start: '17:05',
      end: '18:25',
      title: 'Vale a Pena Ver de Novo: Alma Gemea',
      synopsis: 'O emocionante romance de Serena e Rafael ultrapassando o tempo e as vidas.',
      category: 'series',
      rating: '10+',
    },
    {
      start: '18:25',
      end: '19:15',
      title: 'Garota do Momento',
      synopsis: 'Trama de epoca ambientada no Rio de Janeiro nos anos 50 e o sonho da moda.',
      category: 'series',
      rating: '10+',
    },
    {
      start: '19:15',
      end: '19:45',
      title: 'SP2 - Segunda Edicao',
      synopsis: 'O resumo dos principais acontecimentos do final de tarde em Sao Paulo.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '19:45',
      end: '20:30',
      title: 'Volta por Cima',
      synopsis: 'Historias de superacao, familia e coragem no cotidiano dos personagens.',
      category: 'series',
      rating: '12+',
    },
    {
      start: '20:30',
      end: '21:20',
      title: 'Jornal Nacional',
      synopsis: 'O principal telejornal brasileiro com a cobertura aprofundada dos fatos.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '21:20',
      end: '22:25',
      title: 'Mania de Voce',
      synopsis: 'Paixoes intensas, segredos culinarios e disputas de poder no litoral.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '22:25',
      end: '23:45',
      title: 'Tela Quente: Cinema Especial',
      synopsis: 'Os maiores blockbusters mundiais dublados em alta definicao.',
      category: 'filmes',
      rating: '14+',
    },
    {
      start: '23:45',
      end: '00:15',
      title: 'Profissao Reporter',
      synopsis: 'Jovens jornalistas vao a campo para desvendar historias impressionantes.',
      category: 'noticias',
      rating: '12+',
    },
  ],

  'ch-sbt': [
    {
      start: '00:15',
      end: '01:15',
      title: 'The Noite com Danilo Gentili',
      synopsis: 'Entrevistas irreverentes, humor afiado e participacao do Ultraje a Rigor.',
      category: 'aberta',
      rating: '14+',
    },
    {
      start: '01:15',
      end: '01:45',
      title: 'Operacao Mesquita',
      synopsis: 'Otavio Mesquita mostra as noites mais agitadas, eventos e curiosidades.',
      category: 'aberta',
      rating: '12+',
    },
    {
      start: '01:45',
      end: '06:00',
      title: 'SBT Noticias na TV',
      synopsis: 'As principais noticias da madrugada com agilidade e giro ao vivo.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '06:00',
      end: '08:30',
      title: 'Se Liga Brasil',
      synopsis: 'Um telejornal dinamico com informacao agil e precisa na medida certa.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '08:30',
      end: '12:40',
      title: 'Primeiro Impacto',
      synopsis: 'Transito, policia, saude, esporte e os assuntos que sao destaque no Brasil.',
      category: 'noticias',
      rating: '12+',
    },
    {
      start: '12:40',
      end: '13:45',
      title: 'Chaves',
      synopsis: 'Na vila mais famosa, Chaves e seus amigos aprontam diversas travessuras.',
      category: 'aberta',
      rating: 'Livre',
    },
    {
      start: '13:45',
      end: '14:15',
      title: 'Marisol',
      synopsis: 'Marisol e uma moca simples de carater forte que luta para sobreviver.',
      category: 'series',
      rating: '12+',
    },
    {
      start: '14:15',
      end: '14:45',
      title: 'Marimar',
      synopsis: 'A saga de Marimar em uma pequena vila de pescadores que ganha reviravolta.',
      category: 'series',
      rating: '12+',
    },
    {
      start: '14:45',
      end: '15:30',
      title: 'Novelas da Tarde: A Desalmada',
      synopsis: 'Emocionantes capitulos das novelas de sucesso da tarde no SBT.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '15:30',
      end: '16:45',
      title: 'Fofocalizando',
      synopsis: 'Noticias dos famosos, muita fofoca e os assuntos mais comentados do mundo.',
      category: 'aberta',
      rating: '10+',
    },
    {
      start: '16:45',
      end: '19:00',
      title: 'Ta na Hora / Transmissoes Especiais',
      synopsis: 'Jornalismo popular e transmissoes especiais de futebol e esportes.',
      category: 'noticias',
      rating: '12+',
    },
    {
      start: '19:00',
      end: '19:45',
      title: 'SBT Cidades',
      synopsis: 'Prestacao de servico e cobertura dos fatos da populacao.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '19:45',
      end: '20:45',
      title: 'SBT Brasil',
      synopsis: 'Cesar Filho leva as noticias mais importantes do dia ao vivo.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '20:45',
      end: '22:00',
      title: 'Amor Valente / A Caverna Encantada',
      synopsis: 'Dramas familiares, romances e superacoes nas noites do SBT.',
      category: 'series',
      rating: '12+',
    },
    {
      start: '22:00',
      end: '23:15',
      title: 'Programa do Ratinho',
      synopsis: 'Atracoes ao vivo, DNA, shows de calouros e o humor inconfundivel do Ratinho.',
      category: 'aberta',
      rating: '12+',
    },
    {
      start: '23:15',
      end: '00:15',
      title: 'SBT Reporter / Linha de Shows',
      synopsis: 'Investigacoes jornalisticas, reportagens especiais e grandes temas.',
      category: 'noticias',
      rating: '12+',
    },
  ],

  'ch-record': [
    {
      start: '00:00',
      end: '01:00',
      title: 'Chicago P.D. - Distrito 21',
      synopsis: 'Investigacoes intensas da unidade de inteligencia contra o crime.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '01:00',
      end: '05:00',
      title: 'Inteligencia e Fe',
      synopsis: 'Palavras de reflexao espiritual, mensagens e testemunhos de fe.',
      category: 'aberta',
      rating: 'Livre',
    },
    {
      start: '05:00',
      end: '07:00',
      title: 'Balanco Geral Manha',
      synopsis: 'Primeiras noticias do dia com cobertura policial e clima.',
      category: 'noticias',
      rating: '10+',
    },
    {
      start: '07:00',
      end: '08:40',
      title: 'Balanco Geral Manha SP',
      synopsis: 'O despertar de Sao Paulo com reportagens ao vivo direto dos bairros.',
      category: 'noticias',
      rating: '10+',
    },
    {
      start: '08:40',
      end: '10:00',
      title: 'Fala Brasil',
      synopsis: 'Telejornal matutino dinamico com informacoes nacionais e internacionais.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '10:00',
      end: '11:50',
      title: 'Hoje em Dia',
      synopsis: 'Culinaria, moda, prestacao de servicos e noticias dos famosos.',
      category: 'aberta',
      rating: '10+',
    },
    {
      start: '11:50',
      end: '15:30',
      title: 'Balanco Geral SP - A Hora da Venenosa',
      synopsis: 'Flagrantes policiais, reportagens exclusivas e o venenoso quadro de fofocas.',
      category: 'noticias',
      rating: '12+',
    },
    {
      start: '15:30',
      end: '16:45',
      title: 'A Terra Prometida',
      synopsis: 'Epica historia biblica com lideranca de Josue rumo a Canaa.',
      category: 'series',
      rating: '12+',
    },
    {
      start: '16:45',
      end: '19:55',
      title: 'Cidade Alerta com Luiz Bacci',
      synopsis: 'Acompanhamento minuto a minuto de operacoes policiais e desaparecimentos.',
      category: 'noticias',
      rating: '14+',
    },
    {
      start: '19:55',
      end: '21:00',
      title: 'Jornal da Record',
      synopsis: 'Grandes reportagens investigativas e os temas mais relevantes do dia.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '21:00',
      end: '22:00',
      title: 'Forca de Mulher',
      synopsis: 'Sucesso internacional que conta a saga de Bahar criando seus dois filhos.',
      category: 'series',
      rating: '12+',
    },
    {
      start: '22:00',
      end: '22:45',
      title: 'Genesis',
      synopsis: 'As grandes narrativas das origens da humanidade contadas em superproducao.',
      category: 'series',
      rating: '12+',
    },
    {
      start: '22:45',
      end: '00:00',
      title: 'A Fazenda / Linha de Shows',
      synopsis: 'Convivencia, conflitos e provas disputadas pelos peoes em busca do premio.',
      category: 'aberta',
      rating: '14+',
    },
  ],

  'ch-band': [
    {
      start: '00:00',
      end: '01:00',
      title: 'Jornal da Noite',
      synopsis: 'Sintese analitica dos principais fatos da politica e economia do dia.',
      category: 'noticias',
      rating: '10+',
    },
    {
      start: '01:00',
      end: '02:00',
      title: 'Esporte Total',
      synopsis: 'Gols da noite, debates e repercussao esportiva com a equipe da Band.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '02:00',
      end: '03:00',
      title: 'Show da Fe',
      synopsis: 'Programa religioso com mensagens, louvores e reflexoes.',
      category: 'aberta',
      rating: 'Livre',
    },
    {
      start: '03:00',
      end: '04:00',
      title: 'Videos Incriveis da Band',
      synopsis: 'Cenas impressionantes, flagrantes e momentos bizarros pelo planeta.',
      category: 'aberta',
      rating: '12+',
    },
    {
      start: '04:00',
      end: '06:00',
      title: 'BandNews TV na Band',
      synopsis: 'Transmissao simultanea com o canal de noticias do Grupo Bandeirantes.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '06:00',
      end: '07:30',
      title: 'Bora Brasil',
      synopsis: 'As noticias do amanhecer com dinamismo e reportagens ao vivo.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '07:30',
      end: '09:00',
      title: 'Bora SP',
      synopsis: 'Foco total no transito, trens, metro e no dia a dia do paulistano.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '09:00',
      end: '11:00',
      title: 'The Chef com Edu Guedes',
      synopsis: 'Receitas faceis, dicas praticas de cozinha e convidados especiais.',
      category: 'aberta',
      rating: 'Livre',
    },
    {
      start: '11:00',
      end: '13:00',
      title: 'Jogo Aberto com Renata Fan',
      synopsis: 'Debate esportivo descontraido, provocacoes e resenha sobre o futebol.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '13:00',
      end: '14:30',
      title: 'Os Donos da Bola com Neto',
      synopsis: 'Craque Neto traz opinioes sinceras e sem rodeios sobre o futebol.',
      category: 'esportes',
      rating: '10+',
    },
    {
      start: '14:30',
      end: '16:00',
      title: 'Melhor da Tarde com Catia Fonseca',
      synopsis: 'Culinaria, astrologia, celebridades e prestacao de servicos.',
      category: 'aberta',
      rating: 'Livre',
    },
    {
      start: '16:00',
      end: '19:20',
      title: 'Brasil Urgente com Datena',
      synopsis: 'Cobertura policial incisiva, helicoptero ao vivo e apelos da populacao.',
      category: 'noticias',
      rating: '14+',
    },
    {
      start: '19:20',
      end: '20:30',
      title: 'Jornal da Band',
      synopsis: 'Telejornal de credibilidade com analise aprofundada dos fatos.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '20:30',
      end: '21:30',
      title: 'Melhor da Noite',
      synopsis: 'Entretenimento, viagens, historias inspiradoras e musica ao vivo.',
      category: 'aberta',
      rating: '10+',
    },
    {
      start: '21:30',
      end: '22:30',
      title: 'Perrengue do Dia',
      synopsis: 'Videos engracados da internet e perrengues cotidianos com muito humor.',
      category: 'aberta',
      rating: '10+',
    },
    {
      start: '22:30',
      end: '00:00',
      title: 'MasterChef Brasil',
      synopsis: 'A maior competicao gastronomica da televisao brasileira.',
      category: 'aberta',
      rating: '10+',
    },
  ],

  'ch-redetv': [
    {
      start: '00:00',
      end: '01:00',
      title: 'Leitura Dinamica',
      synopsis: 'Cultura pop, tecnologia, cinema e o resumo inteligente do dia.',
      category: 'noticias',
      rating: '10+',
    },
    {
      start: '01:00',
      end: '03:00',
      title: 'Operacao de Risco',
      synopsis: 'Acoes policiais reais nas ruas das grandes cidades brasileiras.',
      category: 'noticias',
      rating: '14+',
    },
    {
      start: '03:00',
      end: '05:00',
      title: 'Sessao da Madrugada',
      synopsis: 'Series e materias especiais na madrugada da RedeTV!.',
      category: 'series',
      rating: '12+',
    },
    {
      start: '05:00',
      end: '08:30',
      title: 'Hora de Acao',
      synopsis: 'Flagrantes policiais e a luta contra a criminalidade.',
      category: 'noticias',
      rating: '12+',
    },
    {
      start: '08:30',
      end: '09:30',
      title: 'Manha com Voce',
      synopsis: 'Dicas de beleza, saude e bem-estar para comecar o dia bem.',
      category: 'aberta',
      rating: 'Livre',
    },
    {
      start: '09:30',
      end: '11:50',
      title: 'Voce na TV com Joao Kleber',
      synopsis: 'Segredos revelados e dilemas familiares com Joao Kleber.',
      category: 'aberta',
      rating: '12+',
    },
    {
      start: '11:50',
      end: '13:00',
      title: 'Quale, Moro?',
      synopsis: 'Revista jovem com musica, internet e novidades do mundo pop.',
      category: 'aberta',
      rating: 'Livre',
    },
    {
      start: '13:00',
      end: '15:00',
      title: 'A Tarde E Sua com Sonia Abrao',
      synopsis: 'Debates sobre celebridades, realities e opiniao sem meias palavras.',
      category: 'aberta',
      rating: '10+',
    },
    {
      start: '15:00',
      end: '17:00',
      title: 'Te Peguei',
      synopsis: 'Pegadinhas engracadas e cameras escondidas classicas da televisao.',
      category: 'aberta',
      rating: 'Livre',
    },
    {
      start: '17:00',
      end: '18:00',
      title: 'Hora de Acao - Edicao Tarde',
      synopsis: 'Cobertura policial do final de tarde nas capitais.',
      category: 'noticias',
      rating: '12+',
    },
    {
      start: '18:00',
      end: '19:30',
      title: 'Sessao Dorama',
      synopsis: 'As series coreanas mais aclamadas dubladas em portugues.',
      category: 'series',
      rating: '12+',
    },
    {
      start: '19:30',
      end: '20:30',
      title: 'RedeTV News',
      synopsis: 'O telejornal de horario nobre da RedeTV! com as noticias do Brasil.',
      category: 'noticias',
      rating: 'Livre',
    },
    {
      start: '20:30',
      end: '21:30',
      title: 'TV Fama com Nelson Rubens',
      synopsis: 'Ok, ok! A vida intima dos artistas e flagrantes de celebridades.',
      category: 'aberta',
      rating: '10+',
    },
    {
      start: '21:30',
      end: '22:30',
      title: 'Superpop com Luciana Gimenez',
      synopsis: 'Polemidas, debates sobre relacionamento e convidados especiais.',
      category: 'aberta',
      rating: '14+',
    },
    {
      start: '22:30',
      end: '00:00',
      title: 'Companhia de Policia',
      synopsis: 'O trabalho das forcas de seguranca publica em acao nas cidades.',
      category: 'noticias',
      rating: '14+',
    },
  ],
  'ch-amc': [
    {
      start: '00:00',
      end: '02:00',
      title: 'O Exterminador do Futuro 2',
      synopsis: 'Cyborg do futuro e reprogramado para proteger o jovem John Connor.',
      category: 'filmes',
      rating: '14+',
    },
    {
      start: '02:00',
      end: '04:00',
      title: 'Mad Max: Estrada da Furia',
      synopsis: 'Perseguicao implacavel no deserto pos-apocaliptico contra tiranos.',
      category: 'filmes',
      rating: '16+',
    },
    {
      start: '04:00',
      end: '06:00',
      title: 'Blade Runner 2049',
      synopsis: 'Um policial de Los Angeles descobre segredo antigo que pode mudar a sociedade.',
      category: 'filmes',
      rating: '14+',
    },
    {
      start: '06:00',
      end: '08:00',
      title: 'O Livro de Eli',
      synopsis: 'Guerreiro solitario protege um livro sagrado com os segredos para a humanidade.',
      category: 'filmes',
      rating: '14+',
    },
    {
      start: '08:00',
      end: '10:00',
      title: 'Eu Sou a Lenda',
      synopsis: 'Cientista luta pela sobrevivencia e pela cura em Nova York desolada.',
      category: 'filmes',
      rating: '12+',
    },
    {
      start: '10:00',
      end: '12:00',
      title: 'Templo das Sombras',
      synopsis: 'Aventura repleta de acao e enigmas em expedicao arqueologica perigosa.',
      category: 'filmes',
      rating: '12+',
    },
    {
      start: '12:00',
      end: '14:00',
      title: 'Fear the Walking Dead',
      synopsis: 'Familias enfrentam os primeiros dias do apocalipse zumbi na Costa Oeste.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '14:00',
      end: '16:00',
      title: 'Jurassic World: O Mundo dos Dinossauros',
      synopsis: 'Parque tematico com dinossauros geneticamente modificados sai do controle.',
      category: 'filmes',
      rating: '12+',
    },
    {
      start: '16:00',
      end: '18:00',
      title: 'Kong: A Ilha da Caveira',
      synopsis: 'Exploradores adentram uma ilha desconhecida e encontram o lendario Kong.',
      category: 'filmes',
      rating: '14+',
    },
    {
      start: '18:00',
      end: '20:00',
      title: 'Godzilla vs Kong',
      synopsis: 'Dois titas colossais entram em rota de colisao para decidir o destino do planeta.',
      category: 'filmes',
      rating: '12+',
    },
    {
      start: '20:00',
      end: '22:30',
      title: 'Matrix Resurrections',
      synopsis: 'Neo retorna ao mundo das duas realidades para libertar sua mente mais uma vez.',
      category: 'filmes',
      rating: '14+',
    },
    {
      start: '22:30',
      end: '00:00',
      title: 'The Walking Dead: Os Mortos Vivos',
      synopsis: 'Rick e o grupo enfrentam ameacas humanas e hordas de zumbis em busca de abrigo.',
      category: 'series',
      rating: '16+',
    },
  ],
  'ch-amc-series': [
    {
      start: '00:00',
      end: '01:15',
      title: 'The Walking Dead: Dead City',
      synopsis: 'Maggie e Negan viajam para uma Manhattan pos-apocaliptica isolada do continente.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '01:15',
      end: '02:30',
      title: 'The Walking Dead: Daryl Dixon',
      synopsis: 'Daryl acorda na costa da Franca e tenta entender como chegou ate la.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '02:30',
      end: '03:45',
      title: 'Entrevista com o Vampiro',
      synopsis: 'Uma historia sombria e fascinante de imortalidade, amor e sangue.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '03:45',
      end: '05:00',
      title: 'As Bruxas de Mayfair',
      synopsis: 'Neurocirurgia descobre ser herdeira improvavel de uma linhagem de bruxas.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '05:00',
      end: '06:15',
      title: 'Dark Winds',
      synopsis: 'Dois policiais navajos investigam uma serie de crimes misteriosos nos anos 70.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '06:15',
      end: '07:30',
      title: 'Halt and Catch Fire',
      synopsis: 'O boom dos computadores pessoais no inicio dos anos 1980.',
      category: 'series',
      rating: '12+',
    },
    {
      start: '07:30',
      end: '09:00',
      title: 'Turn: Espioes de Washington',
      synopsis: 'A historia da primeira rede de espionagem organizada nos Estados Unidos.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '09:00',
      end: '10:30',
      title: 'Hell on Wheels',
      synopsis: 'A construcao da primeira ferrovia transcontinental em meio a conflitos.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '10:30',
      end: '12:00',
      title: 'Mad Men: Conflitos e Criatividade',
      synopsis: 'O competitivo mundo das agencias de publicidade na Madison Avenue dos anos 60.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '12:00',
      end: '13:30',
      title: 'Breaking Bad',
      synopsis: 'Um professor de quimica com cancer terminal entra no mundo do crime.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '13:30',
      end: '15:00',
      title: 'Better Call Saul',
      synopsis: 'A transformacao de Jimmy McGill no inescrupuloso advogado Saul Goodman.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '15:00',
      end: '16:30',
      title: 'Fear the Walking Dead: Tempestade',
      synopsis: 'Sobreviventes enfrentam perigos naturais e ameacas humanas.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '16:30',
      end: '18:00',
      title: 'The Night Manager',
      synopsis: 'Ex-soldado britanico e recrutado para infiltrar o circulo interno de um traficante.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '18:00',
      end: '19:30',
      title: 'Preacher',
      synopsis: 'Um pastor com poderes extraordinarios parte em busca de respostas celestiais.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '19:30',
      end: '21:00',
      title: 'Breaking Bad: Temporada Especial',
      synopsis: 'Walter e Jesse expandem suas operacoes e enfrentam rivais implacaveis.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '21:00',
      end: '22:30',
      title: 'Better Call Saul: O Grande Golpe',
      synopsis: 'Estrategias brilhantes e dilemas morais nos tribunais de Albuquerque.',
      category: 'series',
      rating: '14+',
    },
    {
      start: '22:30',
      end: '00:00',
      title: 'The Walking Dead: The Ones Who Live',
      synopsis: 'Uma historia de amor epica entre dois personagens transformados por um mundo em guerra.',
      category: 'series',
      rating: '16+',
    },
  ],
  'ch-hbo': [
    {
      start: '00:00',
      end: '02:00',
      title: 'House of the Dragon',
      synopsis: 'A historia da guerra civil que quase destruiu a Casa Targaryen.',
      category: 'series',
      rating: '18+',
    },
    {
      start: '02:00',
      end: '04:00',
      title: 'The Last of Us',
      synopsis: 'Joel e Ellie cruzam os Estados Unidos devastados por fungos zumbis.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '04:00',
      end: '06:00',
      title: 'Succession: Noite de Decisoes',
      synopsis: 'Lutas pelo poder e controle do maior conglomerado de midia.',
      category: 'series',
      rating: '16+',
    },
    {
      start: '06:00',
      end: '08:30',
      title: 'Harry Potter e o Prisioneiro de Azkaban',
      synopsis: 'Harry enfrenta o perigoso Sirius Black que fugiu da prisao dos bruxos.',
      category: 'filmes',
      rating: '10+',
    },
    {
      start: '08:30',
      end: '11:00',
      title: 'Batman: O Cavaleiro das Trevas',
      synopsis: 'Batman enfrenta o Coringa em uma batalha epica pelo destino de Gotham.',
      category: 'filmes',
      rating: '14+',
    },
    {
      start: '11:00',
      end: '13:30',
      title: 'Duna: Parte 1',
      synopsis: 'Paul Atreides viaja ao planeta mais perigoso do universo para garantir o futuro.',
      category: 'filmes',
      rating: '14+',
    },
    {
      start: '13:30',
      end: '16:00',
      title: 'Interestelar',
      synopsis: 'Grupo de astronautas viaja atraves de um buraco de minhoca em busca de sobrevivencia.',
      category: 'filmes',
      rating: '10+',
    },
    {
      start: '16:00',
      end: '18:30',
      title: 'Elvis',
      synopsis: 'A vida e a musica de Elvis Presley sob a otica de seu empresario enigmático.',
      category: 'filmes',
      rating: '12+',
    },
    {
      start: '18:30',
      end: '21:00',
      title: 'Barbie',
      synopsis: 'Barbie e Ken vivem no colorido mundo da Barbieland e partem para o mundo real.',
      category: 'filmes',
      rating: '12+',
    },
    {
      start: '21:00',
      end: '23:30',
      title: 'Oppenheimer',
      synopsis: 'A historia do fisico J. Robert Oppenheimer e o Projeto Manhattan.',
      category: 'filmes',
      rating: '16+',
    },
    {
      start: '23:30',
      end: '00:00',
      title: 'Especial HBO: Bastidores do Cinema',
      synopsis: 'Entrevistas exclusivas e making-of dos maiores lancamentos cinematograficos.',
      category: 'aberta',
      rating: '12+',
    },
  ],
  'ch-espn': [
    {
      start: '00:00',
      end: '02:00',
      title: 'SportsCenter Noite',
      synopsis: 'As ultimas noticias e os melhores momentos das rodadas esportivas.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '02:00',
      end: '06:00',
      title: 'ESPN Melhores Momentos',
      synopsis: 'Reapresentacao das grandes partidas de futebol e esportes americanos.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '06:00',
      end: '09:00',
      title: 'SportsCenter Manha',
      synopsis: 'Giro completo matutino do mundo esportivo com informacoes quentes.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '09:00',
      end: '11:00',
      title: 'ESPN F90',
      synopsis: 'Debate descontraido sobre o futebol brasileiro e internacional.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '11:00',
      end: '13:00',
      title: 'SportsCenter 1a Edicao',
      synopsis: 'Entrevistas ao vivo, preparativos e escalacoes dos clubes.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '13:00',
      end: '15:30',
      title: 'Futebol no Mundo',
      synopsis: 'As ligas europeias e competicoes internacionais em foco.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '15:30',
      end: '18:00',
      title: 'Transmissao Ao Vivo ESPN',
      synopsis: 'Cobertura em tempo real dos maiores classicos internacionais.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '18:00',
      end: '20:00',
      title: 'ESPN FC',
      synopsis: 'Analises taticas e opinioes contundentes sobre o esporte bretao.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '20:00',
      end: '22:30',
      title: 'Linha de Passe',
      synopsis: 'A mais tradicional mesa redonda esportiva da televisao brasileira.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '22:30',
      end: '00:00',
      title: 'SportsCenter Edicao Final',
      synopsis: 'Fechamento do dia esportivo com gols e declaracoes polêmicas.',
      category: 'esportes',
      rating: 'Livre',
    },
  ],
  'ch-premiere-clubes': [
    {
      start: '00:00',
      end: '02:30',
      title: 'Melhores Momentos do Brasileirao',
      synopsis: 'Todos os gols e lances capitais da rodada dos campeonatos.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '02:30',
      end: '06:00',
      title: 'Grandes Jogos Historicos',
      synopsis: 'Partidas inesqueciveis que marcaram a historia do futebol nacional.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '06:00',
      end: '09:00',
      title: 'Giro dos Campeonatos',
      synopsis: 'Cobertura completa dos clubes pelo pais afora.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '09:00',
      end: '12:00',
      title: 'Aquecimento Premiere',
      synopsis: 'Escalacoes, clima nos estadios e analises pre-jogo.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '12:00',
      end: '15:00',
      title: 'Pre-Jogo da Rodada',
      synopsis: 'Entrevistas exclusivas e bastidores nos vestiarios.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '15:00',
      end: '18:30',
      title: 'Futebol Ao Vivo - Serie A',
      synopsis: 'Transmissao exclusiva ao vivo da rodada do Campeonato Brasileiro.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '18:30',
      end: '21:00',
      title: 'Pos-Jogo e Entrevistas Coletivas',
      synopsis: 'Analise detalhada das partidas e declaracoes dos tecnicos.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '21:00',
      end: '23:30',
      title: 'Classico Noturno Ao Vivo',
      synopsis: 'Emocao pura no jogo decisivo da noite com imagens em alta definicao.',
      category: 'esportes',
      rating: 'Livre',
    },
    {
      start: '23:30',
      end: '00:00',
      title: 'Balanco Final dos Estadios',
      synopsis: 'Resumo completo das classificacoes e tabela atualizada.',
      category: 'esportes',
      rating: 'Livre',
    },
  ],
  'ch-premiere-clubes-fhd': [],
};

// Mirror Premiere Clubes schedule to Premiere Clubes FHD
CHANNEL_24H_SCHEDULES['ch-premiere-clubes-fhd'] = CHANNEL_24H_SCHEDULES['ch-premiere-clubes'];

export interface ParsedOnlineProgram {
  startMs: number;
  stopMs: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  title: string;
  synopsis: string;
  category: string;
  rating: string;
}

const XMLTV_PRIMARY_URL = 'https://raw.githubusercontent.com/limaalef/BrazilTVEPG/main/epg.xml';
const XMLTV_PROXY_URL = `https://saimo-tv.pages.dev/api/proxy?url=${encodeURIComponent(XMLTV_PRIMARY_URL)}`;

const XMLTV_CLARO_PRIMARY_URL = 'https://raw.githubusercontent.com/limaalef/BrazilTVEPG/main/claro.xml';
const XMLTV_CLARO_PROXY_URL = `https://saimo-tv.pages.dev/api/proxy?url=${encodeURIComponent(XMLTV_CLARO_PRIMARY_URL)}`;

const XMLTV_CACHE_KEY = 'mastertv_online_epg_cache_v5';
const XMLTV_CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

const XMLTV_CHANNEL_ALIAS: Record<string, string> = {
  // Brazilian Open TV
  'Globo SP_local': 'ch-globo',
  'Globo SP': 'ch-globo',
  'GLOBO SP': 'ch-globo',
  'GLOBO HD': 'ch-globo',
  'SBT': 'ch-sbt',
  'SBT HD': 'ch-sbt',
  'SBT São Paulo': 'ch-sbt',
  'SBT SP': 'ch-sbt',
  'Band SP_local': 'ch-band',
  'BAND HD': 'ch-band',
  'Band SP': 'ch-band',
  'Record SP_local': 'ch-record',
  'RECORD - Sao Paulo': 'ch-record',
  'Record SP': 'ch-record',
  'Rede TV! SP_local': 'ch-redetv',
  'REDE TV! São Paulo': 'ch-redetv',
  'Rede TV! SP': 'ch-redetv',
  'Rede TV!': 'ch-redetv',

  // AMC Networks
  'AMC': 'ch-amc',
  'AMC HD': 'ch-amc',
  'AMC Series': 'ch-amc-series',
  'AMC SERIES HD': 'ch-amc-series',

  // HBO Suite
  'HBO': 'ch-hbo',
  'HBO HD': 'ch-hbo',
  'HBO2': 'ch-hbo-2',
  'HBO 2': 'ch-hbo-2',
  'HBO 2 HD': 'ch-hbo-2',
  'HBO Family': 'ch-hbo-family',
  'HBO Family HD': 'ch-hbo-family',
  'HBO Mundi': 'ch-hbo-mundi',
  'HBO Mundi HD': 'ch-hbo-mundi',
  'HBO+': 'ch-hbo-plus',
  'HBO Plus': 'ch-hbo-plus',
  'HBO Plus HD': 'ch-hbo-plus',
  'HBO Pop': 'ch-hbo-pop',
  'HBO Pop HD': 'ch-hbo-pop',
  'HBO Signature': 'ch-hbo-signature',
  'HBO Signature HD': 'ch-hbo-signature',
  'HBO Xtreme': 'ch-hbo-xtreme',
  'HBO Xtreme HD': 'ch-hbo-xtreme',

  // Sports
  'PREMIERE CLUBES HD': 'ch-premiere-clubes',
  'Premiere Clubes HD': 'ch-premiere-clubes',
  'PREMIERE CLUBES': 'ch-premiere-clubes',
  'Premiere Clubes': 'ch-premiere-clubes',
  'ESPN': 'ch-espn',
  'ESPN HD': 'ch-espn',
  'ESPN Brasil': 'ch-espn',
  'ESPN Brasil HD': 'ch-espn',
};

// Channel metadata cache to resolve channel names and attributes
const channelMetadataMap = new Map<string, Channel>();

// Register channel objects in cache for lookup by ID
export function registerChannelsMetadata(channels: Channel[]): void {
  if (!Array.isArray(channels)) return;
  channels.forEach((ch) => {
    if (ch && ch.id) {
      channelMetadataMap.set(String(ch.id), ch);
      if (ch.epgId) {
        channelMetadataMap.set(String(ch.epgId), ch);
      }
    }
  });
}

// Resolve any channel identifier or display name to its canonical EPG key
export function resolveCanonicalChannelId(identifier?: string, channelName?: string): string {
  // 1. Direct match in CHANNEL_24H_SCHEDULES
  if (identifier && CHANNEL_24H_SCHEDULES[identifier]) return identifier;
  if (channelName && CHANNEL_24H_SCHEDULES[channelName]) return channelName;

  // 2. Direct match in XMLTV_CHANNEL_ALIAS
  if (identifier && XMLTV_CHANNEL_ALIAS[identifier]) return XMLTV_CHANNEL_ALIAS[identifier];
  if (channelName && XMLTV_CHANNEL_ALIAS[channelName]) return XMLTV_CHANNEL_ALIAS[channelName];

  // 3. Normalize string (lowercase, remove accents and noise)
  const combined = `${identifier || ''} ${channelName || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ')
    .replace(/[^\w\s]/g, ' ');

  // 4. Exact and fuzzy matching for major Brazilian networks
  // Record (Record TV, Record SP, Record Brasilia, Record Rio, Record Interior, etc.)
  if (combined.includes('record')) return 'ch-record';

  // SBT (SBT HD, SBT SP, SBT Brasilia, etc.)
  if (combined.includes('sbt') || combined.includes('sistema brasileiro')) return 'ch-sbt';

  // Band (Band HD, Band SP, Bandeirantes, etc. - exclude BandNews)
  if ((combined.includes('bandeirantes') || combined.includes('band')) && !combined.includes('news')) {
    return 'ch-band';
  }

  // RedeTV (RedeTV, Rede TV)
  if (combined.includes('redetv') || combined.includes('rede tv')) return 'ch-redetv';

  // Globo (Globo SP, Globo Brasilia, Globo Rio, etc. - exclude GloboNews)
  if (combined.includes('globo') && !combined.includes('news')) return 'ch-globo';

  // AMC
  if (combined.includes('amc series') || combined.includes('amc-series')) return 'ch-amc-series';
  if (combined.includes('amc')) return 'ch-amc';

  // HBO suite
  if (combined.includes('hbo 2') || combined.includes('hbo2')) return 'ch-hbo-2';
  if (combined.includes('hbo family')) return 'ch-hbo-family';
  if (combined.includes('hbo mundi')) return 'ch-hbo-mundi';
  if (combined.includes('hbo plus') || combined.includes('hbo+')) return 'ch-hbo-plus';
  if (combined.includes('hbo pop')) return 'ch-hbo-pop';
  if (combined.includes('hbo signature')) return 'ch-hbo-signature';
  if (combined.includes('hbo xtreme') || combined.includes('hbo extreme')) return 'ch-hbo-xtreme';
  if (combined.includes('hbo')) return 'ch-hbo';

  // Sports
  if (combined.includes('premiere') || combined.includes('pfc')) {
    return combined.includes('fhd') ? 'ch-premiere-clubes-fhd' : 'ch-premiere-clubes';
  }
  if (combined.includes('espn')) return 'ch-espn';

  return '';
}

// Generate realistic 24-hour schedule for generic or unmapped channels
export function getDynamicFallbackSchedule(channelName?: string, category?: string): ScheduleSlot[] {
  const cleanName = (channelName || 'Canal').trim();
  const cat = (category || '').toLowerCase();

  if (cat.includes('esporte') || cat.includes('sport')) {
    return [
      { start: '00:00', end: '06:00', title: 'Madrugada Esportiva - Melhores Momentos', synopsis: 'Reapresentacao dos principais lances e partidas.', category: 'esportes', rating: 'Livre' },
      { start: '06:00', end: '09:00', title: 'Giro Matinal do Esporte', synopsis: 'Noticiario das modalidades com analises e preparativos do dia.', category: 'esportes', rating: 'Livre' },
      { start: '09:00', end: '12:00', title: 'Aquecimento e Pre-Jogo', synopsis: 'Bastidores dos times, entrevistas e estatisticas.', category: 'esportes', rating: 'Livre' },
      { start: '12:00', end: '15:00', title: 'Transmissao Esportiva ao Vivo', synopsis: 'Cobertura completa de campeonatos e eventos ao vivo.', category: 'esportes', rating: 'Livre' },
      { start: '15:00', end: '18:00', title: 'Destaques da Rodada', synopsis: 'Resultados, classificacoes e gols dos jogos.', category: 'esportes', rating: 'Livre' },
      { start: '18:00', end: '21:00', title: 'Mesa Redonda e Debates', synopsis: 'Especialistas analisam os confrontos e taticas.', category: 'esportes', rating: 'Livre' },
      { start: '21:00', end: '00:00', title: 'Noite de Campeoes', synopsis: 'Grandes partidas e disputas decisivas.', category: 'esportes', rating: 'Livre' },
    ];
  }

  if (cat.includes('noticia') || cat.includes('news')) {
    return [
      { start: '00:00', end: '06:00', title: 'Edicao da Madrugada', synopsis: 'Giro de noticias do Brasil e do mundo com plantao 24 horas.', category: 'noticias', rating: 'Livre' },
      { start: '06:00', end: '09:00', title: 'Noticiario Matutino', synopsis: 'As primeiras informacoes, previsao do tempo e servicos.', category: 'noticias', rating: 'Livre' },
      { start: '09:00', end: '12:00', title: 'Conexao Noticia ao Vivo', synopsis: 'Cobertura em tempo real dos acontecimentos politicos e economicos.', category: 'noticias', rating: 'Livre' },
      { start: '12:00', end: '14:00', title: 'Jornal do Meio-Dia', synopsis: 'Resumo das noticias da manha com analise de especialistas.', category: 'noticias', rating: 'Livre' },
      { start: '14:00', end: '18:00', title: 'Tarde em Noticia', synopsis: 'Debates, entrevistas e transmissao de eventos ao vivo.', category: 'noticias', rating: 'Livre' },
      { start: '18:00', end: '20:00', title: 'Edicao Principal', synopsis: 'As reportagens mais aprofundadas sobre os fatos do dia.', category: 'noticias', rating: 'Livre' },
      { start: '20:00', end: '22:00', title: 'Analise Politica e Economica', synopsis: 'Painel com analistas discutindo os rumos do pais.', category: 'noticias', rating: 'Livre' },
      { start: '22:00', end: '00:00', title: 'Jornal da Noite', synopsis: 'Balanco final das informacoes mais importantes.', category: 'noticias', rating: 'Livre' },
    ];
  }

  if (cat.includes('filme') || cat.includes('cinema') || cat.includes('movie')) {
    return [
      { start: '00:00', end: '02:30', title: 'Sessao da Madrugada', synopsis: 'Filmes aclamados para os insones.', category: 'filmes', rating: '16+' },
      { start: '02:30', end: '06:00', title: 'Cinema Noturno', synopsis: 'Classicos do suspense, terror e acao.', category: 'filmes', rating: '14+' },
      { start: '06:00', end: '09:00', title: 'Cinema Matinal', synopsis: 'Longas leves e emocionantes para comecar o dia.', category: 'filmes', rating: 'Livre' },
      { start: '09:00', end: '12:00', title: 'Grandes Aventuras', synopsis: 'Acao e ficcao cientifica para toda a familia.', category: 'filmes', rating: '10+' },
      { start: '12:00', end: '15:00', title: 'Matine de Sucessos', synopsis: 'Os maiores sucessos de bilheteria do cinema mundial.', category: 'filmes', rating: '12+' },
      { start: '15:00', end: '18:00', title: 'Sessao Cineclube', synopsis: 'Destaques e producoes premiadas de grandes diretores.', category: 'filmes', rating: '12+' },
      { start: '18:00', end: '21:00', title: 'Sessao Premium', synopsis: 'Super producoes de Hollywood e cinema internacional.', category: 'filmes', rating: '14+' },
      { start: '21:00', end: '23:30', title: 'Superestreia de Cinema', synopsis: 'O principal filme do dia em alta definicao.', category: 'filmes', rating: '14+' },
      { start: '23:30', end: '00:00', title: 'Making Of e Bastidores', synopsis: 'Curiosidades e producoes por tras das cameras.', category: 'filmes', rating: 'Livre' },
    ];
  }

  if (cat.includes('infantil') || cat.includes('desenho') || cat.includes('kids')) {
    return [
      { start: '00:00', end: '06:00', title: 'Classicos Animados', synopsis: 'Historias magicas e desenhos para a madrugada.', category: 'infantil', rating: 'Livre' },
      { start: '06:00', end: '09:00', title: 'Bom Dia com Desenhos', synopsis: 'Aventuras coloridas e animadas para a garotada.', category: 'infantil', rating: 'Livre' },
      { start: '09:00', end: '12:00', title: 'Clube da Animacao', synopsis: 'Series infantis de grande sucesso.', category: 'infantil', rating: 'Livre' },
      { start: '12:00', end: '15:00', title: 'Aventuras sem Fim', synopsis: 'Missoes empolgantes e muita diversao.', category: 'infantil', rating: 'Livre' },
      { start: '15:00', end: '18:00', title: 'Tarde Divertida', synopsis: 'Episodios especiais e novas temporadas.', category: 'infantil', rating: 'Livre' },
      { start: '18:00', end: '21:00', title: 'Animacoes Especiais', synopsis: 'Os personagens favoritos reunidos na telinha.', category: 'infantil', rating: 'Livre' },
      { start: '21:00', end: '00:00', title: 'Hora de Dormir Animada', synopsis: 'Historias tranquilas para encerrar o dia das criancas.', category: 'infantil', rating: 'Livre' },
    ];
  }

  // Generic dynamic schedule tailored to the channel name
  return [
    { start: '00:00', end: '06:00', title: `${cleanName} - Madrugada Especial`, synopsis: `Transmissao continuada da programacao de ${cleanName}.`, category: 'aberta', rating: 'Livre' },
    { start: '06:00', end: '09:00', title: `${cleanName} - Edicao Matutina`, synopsis: `Abertura da grade com destaques e conteudos de ${cleanName}.`, category: 'aberta', rating: 'Livre' },
    { start: '09:00', end: '12:00', title: `${cleanName} - Programa Especial`, synopsis: 'Producao exclusiva e materias selecionadas.', category: 'aberta', rating: 'Livre' },
    { start: '12:00', end: '15:00', title: `${cleanName} - Destaques da Grade`, synopsis: 'O melhor da programacao em transmissao ao vivo.', category: 'aberta', rating: 'Livre' },
    { start: '15:00', end: '18:00', title: `${cleanName} - Tarde ao Vivo`, synopsis: 'Cobertura completa e exibicao de conteudos em tempo real.', category: 'aberta', rating: 'Livre' },
    { start: '18:00', end: '21:00', title: `${cleanName} - Horario Nobre`, synopsis: `O programa principal do dia no canal ${cleanName}.`, category: 'aberta', rating: 'Livre' },
    { start: '21:00', end: '23:30', title: `${cleanName} - Especial da Noite`, synopsis: 'Transmissao nobre com os melhores momentos e exibicoes.', category: 'aberta', rating: 'Livre' },
    { start: '23:30', end: '00:00', title: `${cleanName} - Fechamento da Noite`, synopsis: 'Resumo do dia e preparativos para a madrugada.', category: 'aberta', rating: 'Livre' },
  ];
}

// In-memory store for parsed online EPG
let onlineEPGStore: Record<string, ParsedOnlineProgram[]> = {};

// Parse XMLTV formatted date: YYYYMMDDHHmmss [+/-]HHMM
export function parseXMLTVDate(dateStr: string): Date {
  const clean = dateStr.trim();
  const year = parseInt(clean.substring(0, 4), 10);
  const month = parseInt(clean.substring(4, 6), 10) - 1;
  const day = parseInt(clean.substring(6, 8), 10);
  const hours = parseInt(clean.substring(8, 10), 10);
  const minutes = parseInt(clean.substring(10, 12), 10);
  const seconds = parseInt(clean.substring(12, 14), 10) || 0;

  const tzMatch = clean.match(/([+-]\d{4})$/);
  if (tzMatch) {
    const sign = tzMatch[1][0] === '+' ? 1 : -1;
    const tzHours = parseInt(tzMatch[1].substring(1, 3), 10);
    const tzMinutes = parseInt(tzMatch[1].substring(3, 5), 10);
    const offsetMinutes = sign * (tzHours * 60 + tzMinutes);
    const utcMs = Date.UTC(year, month, day, hours, minutes, seconds) - (offsetMinutes * 60 * 1000);
    return new Date(utcMs);
  }
  return new Date(year, month, day, hours, minutes, seconds);
}

// Restore cached EPG on module evaluation if valid
function loadCachedEPG(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const raw = localStorage.getItem(XMLTV_CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed.timestamp && Date.now() - parsed.timestamp < XMLTV_CACHE_TTL_MS && parsed.store) {
      onlineEPGStore = parsed.store;
      return true;
    }
  } catch {
    // Ignore cache load errors
  }
  return false;
}

// Initial cache hydration
loadCachedEPG();

// Parse raw XMLTV text into onlineEPGStore
export function parseXMLTVContent(xmlText: string): Record<string, ParsedOnlineProgram[]> {
  const result: Record<string, ParsedOnlineProgram[]> = {
    'ch-globo': [],
    'ch-sbt': [],
    'ch-band': [],
    'ch-record': [],
    'ch-redetv': [],
    'ch-amc': [],
    'ch-amc-series': [],
    'ch-hbo': [],
    'ch-hbo-2': [],
    'ch-hbo-family': [],
    'ch-hbo-mundi': [],
    'ch-hbo-plus': [],
    'ch-hbo-pop': [],
    'ch-hbo-signature': [],
    'ch-hbo-xtreme': [],
    'ch-premiere-clubes': [],
    'ch-premiere-clubes-fhd': [],
    'ch-espn': [],
  };

  const progRegex = /<programme\s+start="([^"]+)"\s+stop="([^"]+)"\s+channel="([^"]+)"[^>]*>([\s\S]*?)<\/programme>/g;
  let match: RegExpExecArray | null;

  while ((match = progRegex.exec(xmlText)) !== null) {
    const rawChannel = match[3];
    const internalId = XMLTV_CHANNEL_ALIAS[rawChannel] || resolveCanonicalChannelId(rawChannel);
    if (!internalId || !result[internalId]) continue;

    const start = parseXMLTVDate(match[1]);
    const stop = parseXMLTVDate(match[2]);
    const content = match[4];

    const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const descMatch = content.match(/<desc[^>]*>([\s\S]*?)<\/desc>/);
    const categoryMatch = content.match(/<category[^>]*>([\s\S]*?)<\/category>/);
    const ratingMatch = content.match(/<value>([\s\S]*?)<\/value>/);

    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Programacao';
    const synopsis = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
    const category = categoryMatch ? categoryMatch[1].trim().toLowerCase() : 'aberta';
    const rating = ratingMatch ? ratingMatch[1].replace(/[[\]]/g, '').trim() : 'Livre';

    const startH = String(start.getHours()).padStart(2, '0');
    const startM = String(start.getMinutes()).padStart(2, '0');
    const stopH = String(stop.getHours()).padStart(2, '0');
    const stopM = String(stop.getMinutes()).padStart(2, '0');

    result[internalId].push({
      startMs: start.getTime(),
      stopMs: stop.getTime(),
      startTime: `${startH}:${startM}`,
      endTime: `${stopH}:${stopM}`,
      title,
      synopsis,
      category,
      rating,
    });
  }

  // Duplicate Premiere Clubes schedule to Premiere Clubes FHD
  if (result['ch-premiere-clubes'] && result['ch-premiere-clubes'].length > 0 && result['ch-premiere-clubes-fhd'].length === 0) {
    result['ch-premiere-clubes-fhd'] = [...result['ch-premiere-clubes']];
  }

  // Sort each channel chronologically
  Object.keys(result).forEach((key) => {
    result[key].sort((a, b) => a.startMs - b.startMs);
  });

  return result;
}

// Parse programs from guiadetv.com HTML
export function parseGuiadetvContent(html: string): ParsedOnlineProgram[] {
  const items: ParsedOnlineProgram[] = [];
  const regex = /<time\s+datetime="([^"]+)"[^>]*>([0-9:]+)<\/time>(?:[\s\S]*?<span[^>]*>([^<]+)<\/span>)?[\s\S]*?<a\s+href="\/programa\/[^"]*"[^>]*>([^<]+)<\/a>(?:[\s\S]*?<p[^>]*>([^<]+)<\/p>)?/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const isoDate = match[1];
    const timeStr = match[2];
    const durStr = match[3] || '60min';
    const title = match[4].replace(/&amp;/g, '&').trim();
    const synopsis = match[5] ? match[5].replace(/&amp;/g, '&').trim() : '';

    const start = new Date(isoDate);
    let durMin = 60;
    if (durStr.includes('h')) {
      const parts = durStr.split('h');
      durMin = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    } else if (durStr.includes('min')) {
      durMin = parseInt(durStr.replace('min', '').trim(), 10) || 60;
    }
    const stop = new Date(start.getTime() + durMin * 60000);
    const stopH = String(stop.getHours()).padStart(2, '0');
    const stopM = String(stop.getMinutes()).padStart(2, '0');

    items.push({
      startMs: start.getTime(),
      stopMs: stop.getTime(),
      startTime: timeStr,
      endTime: `${stopH}:${stopM}`,
      title,
      synopsis,
      category: 'filmes',
      rating: '14+',
    });
  }

  items.sort((a, b) => a.startMs - b.stopMs);
  return items;
}

// Fetch and synchronize real-time XMLTV EPG and cable guide feeds
let isFetchingEPG = false;
export async function fetchAndSyncXMLTV(): Promise<boolean> {
  if (isFetchingEPG) return false;
  isFetchingEPG = true;

  try {
    // 1. Fetch Claro TV+ XMLTV (contains HBO, Premiere, ESPN, AMC, Open TV)
    let claroXml = '';
    try {
      const resp = await fetch(XMLTV_CLARO_PRIMARY_URL, { cache: 'no-cache' });
      if (resp.ok) {
        claroXml = await resp.text();
      }
    } catch {
      try {
        const proxyResp = await fetch(XMLTV_CLARO_PROXY_URL);
        if (proxyResp.ok) {
          claroXml = await proxyResp.text();
        }
      } catch {
        // Fallback
      }
    }

    if (claroXml && claroXml.includes('<programme')) {
      const parsedClaro = parseXMLTVContent(claroXml);
      Object.keys(parsedClaro).forEach((chId) => {
        if (parsedClaro[chId].length > 0) {
          onlineEPGStore[chId] = parsedClaro[chId];
        }
      });
    }

    // 2. Fetch Open TV XMLTV as supplement
    try {
      let openXml = '';
      try {
        const response = await fetch(XMLTV_PRIMARY_URL, { cache: 'no-cache' });
        if (response.ok) {
          openXml = await response.text();
        }
      } catch {
        const proxyResp = await fetch(XMLTV_PROXY_URL);
        if (proxyResp.ok) {
          openXml = await proxyResp.text();
        }
      }

      if (openXml && openXml.includes('<programme')) {
        const parsedOpen = parseXMLTVContent(openXml);
        Object.keys(parsedOpen).forEach((chId) => {
          if (parsedOpen[chId].length > 0 && (!onlineEPGStore[chId] || onlineEPGStore[chId].length === 0)) {
            onlineEPGStore[chId] = parsedOpen[chId];
          }
        });
      }
    } catch {
      // Ignore open TV supplement errors
    }

    // Ensure Premiere Clubes FHD mirrors Premiere Clubes HD
    if (onlineEPGStore['ch-premiere-clubes'] && onlineEPGStore['ch-premiere-clubes'].length > 0) {
      if (!onlineEPGStore['ch-premiere-clubes-fhd'] || onlineEPGStore['ch-premiere-clubes-fhd'].length === 0) {
        onlineEPGStore['ch-premiere-clubes-fhd'] = [...onlineEPGStore['ch-premiere-clubes']];
      }
    }

    // Fetch official live cable EPG for AMC from guiadetv if needed
    if (!onlineEPGStore['ch-amc'] || onlineEPGStore['ch-amc'].length === 0) {
      try {
        const amcProxyUrl = `https://saimo-tv.pages.dev/api/proxy?url=${encodeURIComponent('https://www.guiadetv.com/canal/amc')}`;
        const amcResp = await fetch(amcProxyUrl);
        if (amcResp.ok) {
          const amcHtml = await amcResp.text();
          const amcPrograms = parseGuiadetvContent(amcHtml);
          if (amcPrograms.length > 0) {
            onlineEPGStore['ch-amc'] = amcPrograms;
          }
        }
      } catch {
        // Ignore cable fetch errors
      }
    }

    try {
      localStorage.setItem(
        XMLTV_CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          store: onlineEPGStore,
        })
      );
    } catch {
      // LocalStorage quota fallback
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mastertv_epg_updated'));
    }
    isFetchingEPG = false;
    return true;
  } catch (err) {
    console.warn('EPG fetch error, using fallback EPG:', err);
  }

  isFetchingEPG = false;
  return false;
}

// Initialize online EPG service on application boot
export function initOnlineEPG(): void {
  loadCachedEPG();
  // Fetch fresh EPG in background
  fetchAndSyncXMLTV();
}

// Convert HH:mm to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Format duration into readable PT-BR string
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// Find current, next program and progress based on real system time
export function getLiveEPGForChannel(
  channelOrId: Channel | string,
  now: Date = new Date(),
  channelName?: string
): {
  currentProgram: string;
  currentProgramTime: string;
  nextProgram: string;
  nextProgramTime: string;
  synopsis: string;
  progressPercent: number;
  durationText: string;
} {
  const isObj = typeof channelOrId === 'object' && channelOrId !== null;
  const cachedCh = !isObj && typeof channelOrId === 'string' ? channelMetadataMap.get(channelOrId) : null;

  const rawId = isObj ? channelOrId.id : (cachedCh ? cachedCh.id : (channelOrId as string));
  const rawName = isObj ? channelOrId.name : (cachedCh ? cachedCh.name : (channelName || ''));
  const rawEpgId = isObj ? channelOrId.epgId : (cachedCh ? cachedCh.epgId : undefined);
  const rawCategory = isObj ? channelOrId.category : (cachedCh ? cachedCh.category : undefined);

  const canonicalId = resolveCanonicalChannelId(rawEpgId || rawId, rawName);
  const nowMs = now.getTime();

  // 1. Check online XMLTV EPG
  const onlineList = (canonicalId && onlineEPGStore[canonicalId]) || (rawId ? onlineEPGStore[rawId] : undefined);

  if (onlineList && onlineList.length > 0) {
    const currentIndex = onlineList.findIndex((p) => p.startMs <= nowMs && nowMs < p.stopMs);
    if (currentIndex !== -1) {
      const cur = onlineList[currentIndex];
      const nxt = onlineList[currentIndex + 1] || onlineList[0];
      const durationMs = cur.stopMs - cur.startMs;
      const elapsedMs = Math.max(0, nowMs - cur.startMs);
      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / (durationMs || 1)) * 100)));
      return {
        currentProgram: cur.title,
        currentProgramTime: `${cur.startTime} - ${cur.endTime}`,
        nextProgram: nxt.title,
        nextProgramTime: nxt.startTime,
        synopsis: cur.synopsis,
        progressPercent,
        durationText: formatDuration(Math.round(durationMs / 60000)),
      };
    }
  }

  // 2. Resolve schedule from static grids or dynamic fallback
  const schedule = (canonicalId && CHANNEL_24H_SCHEDULES[canonicalId]) || getDynamicFallbackSchedule(rawName, rawCategory);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let currentIndex = -1;

  for (let i = 0; i < schedule.length; i++) {
    const slot = schedule[i];
    const startMin = timeToMinutes(slot.start);
    let endMin = timeToMinutes(slot.end);

    // Crosses midnight (e.g. 23:45 to 01:00)
    if (endMin < startMin) {
      if (currentMinutes >= startMin || currentMinutes < endMin) {
        currentIndex = i;
        break;
      }
    } else {
      if (currentMinutes >= startMin && currentMinutes < endMin) {
        currentIndex = i;
        break;
      }
    }
  }

  // Fallback if not found
  if (currentIndex === -1) {
    currentIndex = 0;
  }

  const currentSlot = schedule[currentIndex];
  const nextSlot = schedule[(currentIndex + 1) % schedule.length];

  // Calculate duration and progress
  const startMin = timeToMinutes(currentSlot.start);
  let endMin = timeToMinutes(currentSlot.end);
  let duration = endMin - startMin;
  if (duration <= 0) duration += 24 * 60;

  let elapsed = currentMinutes - startMin;
  if (elapsed < 0) elapsed += 24 * 60;

  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));

  return {
    currentProgram: currentSlot.title,
    currentProgramTime: `${currentSlot.start} - ${currentSlot.end}`,
    nextProgram: nextSlot.title,
    nextProgramTime: nextSlot.start,
    synopsis: currentSlot.synopsis,
    progressPercent,
    durationText: formatDuration(duration),
  };
}

// Enrich channel objects with live real-time EPG data
export function enrichChannelsWithLiveEPG(channels: Channel[], now: Date = new Date()): Channel[] {
  registerChannelsMetadata(channels);
  return channels.map((ch) => {
    const live = getLiveEPGForChannel(ch, now);
    return {
      ...ch,
      currentProgram: live.currentProgram,
      currentProgramTime: live.currentProgramTime,
      nextProgram: live.nextProgram,
      nextProgramTime: live.nextProgramTime,
      synopsis: live.synopsis,
    };
  });
}

// Generate full dynamic EPG programs for the timeline guide
export function generateRealTimeEPGSchedule(
  channels: Channel[],
  now: Date = new Date()
): {
  programs: EPGProgram[];
  timeHeaders: string[];
} {
  registerChannelsMetadata(channels);
  const programs: EPGProgram[] = [];
  const nowMs = now.getTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Generate 10 hours of timeline centered on current time (from 2 hours ago to 7 hours ahead)
  const currentHour = now.getHours();
  const timeHeaders: string[] = [];
  for (let offset = -2; offset <= 7; offset++) {
    const h = (currentHour + offset + 24) % 24;
    timeHeaders.push(`${String(h).padStart(2, '0')}:00`);
  }

  channels.forEach((ch) => {
    const canonicalId = resolveCanonicalChannelId(ch.epgId || ch.id, ch.name);
    const onlineList = (canonicalId && onlineEPGStore[canonicalId]) || onlineEPGStore[ch.id];

    // Use online XMLTV programs for timeline if available
    if (onlineList && onlineList.length > 0) {
      const windowStartMs = nowMs - 6 * 60 * 60 * 1000;
      const windowEndMs = nowMs + 18 * 60 * 60 * 1000;
      const relevant = onlineList.filter((p) => p.stopMs >= windowStartMs && p.startMs <= windowEndMs);

      relevant.forEach((slot, index) => {
        const isLive = slot.startMs <= nowMs && nowMs < slot.stopMs;
        const durationMin = Math.round((slot.stopMs - slot.startMs) / 60000);

        programs.push({
          id: `epg-online-${ch.id}-${index}`,
          channelId: ch.id,
          title: slot.title,
          category: slot.category,
          startTime: slot.startTime,
          endTime: slot.endTime,
          durationMinutes: durationMin,
          description: slot.synopsis,
          rating: slot.rating,
          isLive,
        });
      });
      return;
    }

    // Static schedule or dynamic fallback
    const schedule = (canonicalId && CHANNEL_24H_SCHEDULES[canonicalId]) || getDynamicFallbackSchedule(ch.name, ch.category);

    schedule.forEach((slot, index) => {
      const startMin = timeToMinutes(slot.start);
      let endMin = timeToMinutes(slot.end);
      let duration = endMin - startMin;
      if (duration <= 0) duration += 24 * 60;

      let isLive = false;
      if (endMin < startMin) {
        isLive = currentMinutes >= startMin || currentMinutes < endMin;
      } else {
        isLive = currentMinutes >= startMin && currentMinutes < endMin;
      }

      programs.push({
        id: `epg-${ch.id}-${index}`,
        channelId: ch.id,
        title: slot.title,
        category: slot.category,
        startTime: slot.start,
        endTime: slot.end,
        durationMinutes: duration,
        description: slot.synopsis,
        rating: slot.rating || 'Livre',
        isLive,
      });
    });
  });

  return { programs, timeHeaders };
}

export interface EPGTimelineProgram {
  id: string;
  channelId: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  startMs: number;
  stopMs: number;
  isLive: boolean;
  synopsis?: string;
  category?: string;
  rating?: string;
}

// Generate continuous timeline programs for a specific channel
export function getChannelTimelinePrograms(
  channelOrId: Channel | string,
  windowStartMs: number,
  windowEndMs: number,
  nowMs: number = Date.now(),
  channelName?: string
): EPGTimelineProgram[] {
  const isObj = typeof channelOrId === 'object' && channelOrId !== null;
  const cachedCh = !isObj && typeof channelOrId === 'string' ? channelMetadataMap.get(channelOrId) : null;

  const rawId = isObj ? channelOrId.id : (cachedCh ? cachedCh.id : (channelOrId as string));
  const rawName = isObj ? channelOrId.name : (cachedCh ? cachedCh.name : (channelName || ''));
  const rawEpgId = isObj ? channelOrId.epgId : (cachedCh ? cachedCh.epgId : undefined);
  const rawCategory = isObj ? channelOrId.category : (cachedCh ? cachedCh.category : undefined);

  const canonicalId = resolveCanonicalChannelId(rawEpgId || rawId, rawName);

  const onlineList = (canonicalId && onlineEPGStore[canonicalId]) || (rawId ? onlineEPGStore[rawId] : undefined);
  if (onlineList && onlineList.length > 0) {
    const overlapping = onlineList.filter((p) => p.stopMs > windowStartMs && p.startMs < windowEndMs);
    if (overlapping.length > 0) {
      return overlapping.map((p, idx) => ({
        id: `epg-tl-${rawId}-${p.startMs}-${idx}`,
        channelId: rawId,
        title: p.title,
        startTime: p.startTime,
        endTime: p.endTime,
        startMs: p.startMs,
        stopMs: p.stopMs,
        isLive: p.startMs <= nowMs && nowMs < p.stopMs,
        synopsis: p.synopsis,
        category: p.category,
        rating: p.rating,
      }));
    }
  }

  // Fallback using CHANNEL_24H_SCHEDULES or dynamic fallback
  const schedule = (canonicalId && CHANNEL_24H_SCHEDULES[canonicalId]) || getDynamicFallbackSchedule(rawName, rawCategory);
  const items: EPGTimelineProgram[] = [];
  const baseDate = new Date(nowMs);

  for (let dayOffset = -1; dayOffset <= 1; dayOffset++) {
    const curDate = new Date(baseDate);
    curDate.setDate(curDate.getDate() + dayOffset);
    const y = curDate.getFullYear();
    const m = curDate.getMonth();
    const d = curDate.getDate();

    schedule.forEach((slot, idx) => {
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);

      const slotStart = new Date(y, m, d, sh, sm, 0, 0);
      let slotStop = new Date(y, m, d, eh, em, 0, 0);
      if (slotStop.getTime() <= slotStart.getTime()) {
        // Spans past midnight
        slotStop = new Date(y, m, d + 1, eh, em, 0, 0);
      }

      const startMs = slotStart.getTime();
      const stopMs = slotStop.getTime();

      if (stopMs > windowStartMs && startMs < windowEndMs) {
        items.push({
          id: `epg-tl-fb-${rawId}-${startMs}-${idx}`,
          channelId: rawId,
          title: slot.title,
          startTime: slot.start,
          endTime: slot.end,
          startMs,
          stopMs,
          isLive: startMs <= nowMs && nowMs < stopMs,
          synopsis: slot.synopsis,
          category: slot.category,
          rating: slot.rating,
        });
      }
    });
  }

  items.sort((a, b) => a.startMs - b.startMs);
  return items;
}


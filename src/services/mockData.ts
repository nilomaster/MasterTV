// Mock data for MasterTV channels, EPG programs, and VOD categories
// All comments in this file strictly follow ASCII rules

import type { Channel, EPGProgram, MediaItem, Category } from '../types/iptv';

// Reliable stream URLs for IPTV live channels
// Provided by user via Saimo TV proxy for tested 200 OK playback
const STREAM_BAND_SP =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd1-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Fbandsp%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_GLOBO_SP =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd1-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Fglobosp%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_SBT =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2F92ef03b0a53c20499bcde22fe03440c5.s25-cloudfront-net.lat%2Fstream%2F31f7488a7407fcd7de95fb172c73cfca%2Ferror.txt&referer=https%3A%2F%2Fw7.embedtv.cc%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_RECORD_SP =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd1-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Frecordsp%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_AMC_HD =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd2-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Famc%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_AMC_SERIES_HD =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd2-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Famcseries%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_REDE_TV = 'http://45.162.64.114/REDE_TV/index.m3u8';

const STREAM_HBO_HD =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd2-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Fhbo%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_HBO_FAMILY_HD =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd2-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Fhbofamily%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_HBO_MUNDI_HD =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd2-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Fhbomundi%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_HBO_PLUS_HD =
  'http://74.63.229.127/auth/514119.m3u8?token=g4KzrlJajLK5VbhCyuy96zX9xkgIotCOIOttJ0dfpSDj8vu_OAKBey725q8fyzSJ7FFYuVFcNbe5KY9ROXQzxsGEOlUHpdvkf6qnuHwsGfzEaRY1RC8kePS23BouAuswsPUYbgMrBa0crfSZF9cwNJV9m6BewPwAfDscNNtRMQ8D-FsxiIgIcX5srEyMVGI-hY8LVDUkqvlUclWKu2nVKjnT4pbZgvveNMOvu8s5wQ3NAB4wrm3fGCPnMMTACKr3k8mq_HHMQGTh83NWWtS-KcDNvdcGsqIJxno_z4t-s-3BsBQ-sEcLeNfINWF0GkaFdFLqK9pRcqcO00FCs5k1ADFylcTC_Wc4qjVV0llhZ5xHLefdvkMEu8Db6TY70zOImnflB5NTEncpSHvlKhN56r555ZweZqLzh32hNAduyZlo87KD6T41hvN-rmXPrnzLU5EO2r9kuywJ2Mck7AjzS4Ia-7qwgHl76FLbKCnLH1xcr5eVLUHzfiAJBWP6fstpZvbFWt9tr9NtN1ApUpKb8oTzx0Uq7TyLpLRGTQOpv0W5DocFYZtUS19NuT-cbA9Yp4mvjtdPS8C2Z5MLeXEj92Uas6XdjfhJOiEmC-SvBzOPqT6_HDn-mw4rfW4e5odT';

const STREAM_HBO_POP_HD =
  'http://74.63.229.127/auth/514123.m3u8?token=g4KzrlJajLK5VbhCyuy968micZn0nRjM-K-gXodHn6jF7E0sZlwMx5NQJq3v973jgcpu9Kj4MoSVjIu54Abaai-3PLB6CQUjKATcdK6oCk_gZ0BszcHlzkeuSpbc9XxehBktLdOItm8MHNYmUpBey2Ni6vnDLCPQ2_2SlellY8rblfGqABYMB2j1tkm6h1n2xleQzmJ1xvWM4iGbbm9WLpywcirEwW8sKXBx9dOfmd3obwSQY0KkNmb8ylVY9LNyrzXxhWetoBZvRwbBBpYFvxzzZM3jcU5XNn4QCN3Nd74TjKwCiDedLvUDWKFIX8oH2hrxcHPAwCvOHSwKg_rBG43zttkLBHme_JTQnEHE_DUbfRwO_nTwvTkF2Cz8AQglDbcwNhgSlJ4A1ehWGGIK6gUXHwW4Bgkitvl0DEoKxZI0tJMUcUZJfb8XN_e29DT9obDtXMEBaWkVSmDSlpv8V2qtqgMDHB7KP_nFtGjvZTgRzXMNb_CmS-oJPJ_Uw_MceAQCweyxSeYcTXJPBVcUBYBJvWiCaCOMST0R2gT1MlO64R89lYrq8pbLT5vo3efJCTVlK8Q08_X1uIUf9IpwwYcify71vtG_RSxEHRe2LsMiYesvkAzpR2IGXqiVMvj7';

const STREAM_HBO_SIGNATURE_HD =
  'http://74.63.229.127/auth/514126.m3u8?token=g4KzrlJajLK5VbhCyuy96zXUHrCd_I_aHlU6PCMfUr99oVXZsjknxEX3uEgqq-GXPL2fdJic4Q9-4hTrNKnP-Hdem2hDgQARWTRlJ2Xpp-2NFXxXh07qrIs6RZTF9EGcep5ELwZvlx6LFqXljb-ImW72IosyIj5tMsUeiGuEUbw8sZo69GLgmgGpAgYhxB2t2WaTTVUJLOHnsKlxkN64fKKp-9YzbdGzJq8sQd79-C-IwCHEN-AMMh-qy5W4NbBhPRwR3uug3ZK74lrV_S496YPLd_d6Efgh-h9m4tZcnv67WoRqavFqZW0AOocChzcsRUAqg0EvoPuW4TTo-YOkjG8xEuZOMSvCd9uNoLAVkYceH-_y4weu66IifoAuTdMA_liE4psSIkqV-hfUxhu3ZJsksigESpnmkbkVbZXUlQ1zc7z69R8BAHkgRUkAz45yaZciYU9vebN7YjcFBPEi1V2eAGQhpnc6hL16N9uy73mQwPGaeExwGN5vT_M_ysrcIm-KbS3krneneeSCKtoArxFxefcfS7D8SCvln8xI68QjEXSGhf8ul9ldN2jdAPUgLy7WE2yKI426aF8axuUI5Ll7mtbDx9OW7OmZNXnM_ronxRiRYuvCFpIYPoBtvp3s';

const STREAM_HBO_XTREME_HD =
  'http://74.63.229.127/auth/514129.m3u8?token=g4KzrlJajLK5VbhCyuy967bXUBofrlvMkJ_aubOmpFo_OLUMF-omYkqO6rul7QQsUQKZ0YcojWxnYNcjxBgM0HY1JccgLUd3bKOcQ4r7w4YvRn2S2q_ziG6OAj4d4WrYS0YW1lOh8bxtbO2v_aBl9xeUK33A9KQ1YavyZ8ERUMu_GGU15CezkOxLF9gzSV0fO75jvGS3NbBZJy0Sc25HRZvDhGQJMZgORRZsTV5i-S4QVXN47zj7Q7te0lO-3a5copagjbg-KGJGkkHjnahLbYYI-itMyJbiKn6CuwYXaPJTLhRD5aePslPfPhRZSsF6KTXN-OqV1Aqgpeh2wNN7j3AKTPTLbs9bNvlClOdzHNdvF5G7aSwdHFR43jGB4HJmuRvItAqtgnXOF0a5rVq6afwrYy_vVzvPs0ZjG3MKpoML5fphBRyzIzA3_6GnNrLZqfHLIX50GkQl5qVPewBWbYBrOa0RqkNDpDWBWv6yfvxWQjMSPuDBw_LM58KNhscTdAzQOo_NphiDbBOCkwiMDwylpVmf4QDxjUHDkv2h79qOJsxtX7OW98_yeEeJCsRfrc5IrRrTY6w1hTTv-2VUg0Cbo8aJfT_ijKUSG8w3vGWfSPt_VyKpyEBcu9xTvUE2';

const STREAM_HBO_2_HD =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd2-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Fhbo2%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_PREMIERE_CLUBES_HD =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd1-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Fpremiereclubes%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_PREMIERE_CLUBES_HD_BACKUP =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd1-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Fpremiere2%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_PREMIERE_CLUBES_FHD = STREAM_PREMIERE_CLUBES_HD;

const STREAM_ESPN_HD =
  'https://saimo-tv.pages.dev/api/proxy?url=https%3A%2F%2Fd1-ywppjexvlyulasvmgzjdftfjikth2210oq80soveui6lkbi2iza2zf.cdn13embed.xyz%2Fespn%2Findex.m3u8&referer=https%3A%2F%2Fembedcanaisdetv.xyz%2F&ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F126.0%20Safari%2F537.36';

const STREAM_ESPN_HD_BACKUP = 'http://45.162.64.114/ESPN_BRASIL/index.m3u8';

const HLS_SAMPLE_BACKUP = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const HLS_SAMPLE_1 = STREAM_BAND_SP;
const HLS_SAMPLE_2 = STREAM_GLOBO_SP;
const HLS_SAMPLE_3 = STREAM_RECORD_SP;

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'todos', name: 'Todos' },
  { id: 'favoritos', name: 'Favoritos' },
  { id: 'aberta', name: 'TV Aberta' },
  { id: 'filmes', name: 'Filmes' },
  { id: 'series', name: 'Séries' },
  { id: 'esportes', name: 'Esportes' },
  { id: 'noticias', name: 'Notícias' },
  { id: 'infantil', name: 'Infantil' },
  { id: 'documentarios', name: 'Documentários' },
  { id: 'musica', name: 'Música' },
  { id: 'radios', name: 'Rádios' },
];

export const INITIAL_CHANNELS: Channel[] = [
  // 1. GLOBO
  {
    id: 'ch-globo',
    number: 1,
    name: 'Globo SP',
    logo: './logos/globosp.png',
    category: 'aberta',
    streamUrl: STREAM_GLOBO_SP,
    backupStreamUrl: HLS_SAMPLE_BACKUP,
    currentProgram: 'Vale a Pena Ver de Novo: Avenida Brasil',
    currentProgramTime: '17:05 - 18:25',
    nextProgram: 'A Nobreza do Amor',
    nextProgramTime: '18:25',
    synopsis: 'Mona Lisa e Tufao relembram os tempos passados. Carminha planeja um novo golpe em Cabo Frio.',
    isFavorite: true,
    quality: 'HD'
  },

  // 2. SBT
  {
    id: 'ch-sbt',
    number: 2,
    name: 'SBT',
    logo: './logos/sbt.png',
    category: 'aberta',
    streamUrl: STREAM_SBT,
    backupStreamUrl: HLS_SAMPLE_BACKUP,
    currentProgram: 'Programa Silvio Santos',
    currentProgramTime: '16:30 - 19:00',
    nextProgram: 'SBT Brasil',
    nextProgramTime: '19:00',
    synopsis: 'Quadros classicos, camera escondida e as melhores atracoes com a familia Abravanel.',
    isFavorite: true,
    quality: 'HD'
  },

  // 3. RECORD
  {
    id: 'ch-record',
    number: 3,
    name: 'Record TV',
    logo: './logos/record-tv.png',
    category: 'aberta',
    streamUrl: STREAM_RECORD_SP,
    backupStreamUrl: HLS_SAMPLE_BACKUP,
    currentProgram: 'Cidade Alerta',
    currentProgramTime: '16:45 - 18:45',
    nextProgram: 'Jornal da Record',
    nextProgramTime: '18:45',
    synopsis: 'Acompanhamento ao vivo de operacoes policiais e noticias urgentes das capitais.',
    isFavorite: true,
    quality: 'HD'
  },

  // 4. BAND
  {
    id: 'ch-band',
    number: 4,
    name: 'Band',
    logo: './logos/band.png',
    category: 'aberta',
    streamUrl: STREAM_BAND_SP,
    backupStreamUrl: HLS_SAMPLE_BACKUP,
    currentProgram: 'Apito Final',
    currentProgramTime: '16:00 - 18:30',
    nextProgram: 'Jornal da Band',
    nextProgramTime: '18:30',
    synopsis: 'Debate esportivo acalorado com Neto e convidados especiais da rodada.',
    isFavorite: true,
    quality: 'HD'
  },

  // 5. REDE TV
  {
    id: 'ch-redetv',
    number: 5,
    name: 'Rede TV!',
    logo: './logos/Rede-tv.png',
    category: 'aberta',
    streamUrl: STREAM_REDE_TV,
    backupStreamUrl: STREAM_BAND_SP,
    currentProgram: 'Operação de Risco',
    currentProgramTime: '17:00 - 18:30',
    nextProgram: 'RedeTV News',
    nextProgramTime: '18:30',
    synopsis: 'A realidade das acoes policiais nas ruas do Brasil sem cortes.',
    isFavorite: true,
    quality: 'HD'
  },

  // 6. AMC HD
  {
    id: 'ch-amc',
    number: 6,
    name: 'AMC HD',
    logo: './logos/amc.png',
    category: 'filmes',
    streamUrl: STREAM_AMC_HD,
    backupStreamUrl: HLS_SAMPLE_BACKUP,
    currentProgram: 'Velozes & Furiosos 9 - A Saga Velozes & Furiosos',
    currentProgramTime: '13:15 - 15:50',
    nextProgram: 'Tomb Raider - A Origem',
    nextProgramTime: '15:50',
    synopsis: 'Dominic Toretto e Letty vivem uma vida pacata ao lado do filho. Mas sao ameacados pelo passado de Dom.',
    isFavorite: false,
    quality: 'HD'
  },

  // 7. AMC Series HD
  {
    id: 'ch-amc-series',
    number: 7,
    name: 'AMC Series HD',
    logo: './logos/amcseries.png',
    category: 'series',
    streamUrl: STREAM_AMC_SERIES_HD,
    backupStreamUrl: HLS_SAMPLE_BACKUP,
    currentProgram: 'Mad Men: Conflitos e Criatividade',
    currentProgramTime: '12:15 - 13:45',
    nextProgram: 'Better Call Saul',
    nextProgramTime: '13:45',
    synopsis: 'Os bastidores da publicidade e a complexa vida de Don Draper na decada de 60.',
    isFavorite: false,
    quality: 'HD'
  },

  // 8. HBO HD
  {
    id: 'ch-hbo',
    number: 8,
    name: 'HBO HD',
    logo: './logos/hbo.png',
    category: 'filmes',
    streamUrl: STREAM_HBO_HD,
    backupStreamUrl: HLS_SAMPLE_BACKUP,
    currentProgram: 'Duna: Parte 2',
    currentProgramTime: '14:00 - 16:45',
    nextProgram: 'Casa do Dragao',
    nextProgramTime: '16:45',
    synopsis: 'Paul Atreides se une a Chani e aos Fremen em busca de vinganca contra os conspiradores que destruiram sua familia.',
    isFavorite: true,
    quality: 'HD'
  },

  // 9. HBO 2 HD
  {
    id: 'ch-hbo-2',
    number: 9,
    name: 'HBO 2 HD',
    logo: './logos/hbo2.png',
    category: 'filmes',
    streamUrl: STREAM_HBO_2_HD,
    backupStreamUrl: HLS_SAMPLE_BACKUP,
    currentProgram: 'Succession: Maratona',
    currentProgramTime: '13:30 - 15:30',
    nextProgram: 'Batman (2022)',
    nextProgramTime: '15:30',
    synopsis: 'A familia Roy luta pelo controle supremo do conglomerado global de midia Waystar RoyCo.',
    isFavorite: false,
    quality: 'HD'
  },

  // 10. HBO Family HD
  {
    id: 'ch-hbo-family',
    number: 10,
    name: 'HBO Family HD',
    logo: './logos/hbofamily.png',
    category: 'filmes',
    streamUrl: STREAM_HBO_FAMILY_HD,
    backupStreamUrl: HLS_SAMPLE_BACKUP,
    currentProgram: 'Harry Potter e o Prisioneiro de Azkaban',
    currentProgramTime: '14:15 - 16:40',
    nextProgram: 'Wonka',
    nextProgramTime: '16:40',
    synopsis: 'Harry e seus amigos retornam para o terceiro ano em Hogwarts enquanto Sirius Black escapa de Azkaban.',
    isFavorite: false,
    quality: 'HD'
  },

  // 11. HBO Mundi HD
  {
    id: 'ch-hbo-mundi',
    number: 11,
    name: 'HBO Mundi HD',
    logo: './logos/hbomundi.png',
    category: 'filmes',
    streamUrl: STREAM_HBO_MUNDI_HD,
    backupStreamUrl: HLS_SAMPLE_BACKUP,
    currentProgram: 'Cinema Mundial: Parasita',
    currentProgramTime: '13:00 - 15:15',
    nextProgram: 'O Fabuloso Destino de Amelie Poulain',
    nextProgramTime: '15:15',
    synopsis: 'Toda a familia de Ki-taek esta desempregada, vivendo num porao sujo e apertado ate conseguirem uma oportunidade unica.',
    isFavorite: false,
    quality: 'HD'
  },

  // 12. HBO Plus HD
  {
    id: 'ch-hbo-plus',
    number: 12,
    name: 'HBO Plus HD',
    logo: './logos/hboplus.png',
    category: 'filmes',
    streamUrl: STREAM_HBO_PLUS_HD,
    backupStreamUrl: STREAM_HBO_HD,
    currentProgram: 'Pacificador (Peacemaker)',
    currentProgramTime: '14:30 - 15:30',
    nextProgram: 'Esquadrao Suicida',
    nextProgramTime: '15:30',
    synopsis: 'O Pacificador e um heroi arrogante que acredita na paz a qualquer custo, nao importa quantas pessoas precise matar.',
    isFavorite: false,
    quality: 'HD'
  },

  // 13. HBO Pop HD
  {
    id: 'ch-hbo-pop',
    number: 13,
    name: 'HBO Pop HD',
    logo: './logos/hbopop.png',
    category: 'filmes',
    streamUrl: STREAM_HBO_POP_HD,
    backupStreamUrl: STREAM_HBO_HD,
    currentProgram: 'Barbie: O Filme',
    currentProgramTime: '14:00 - 16:00',
    nextProgram: 'Amor a Toda Prova',
    nextProgramTime: '16:00',
    synopsis: 'Viver na Barbielandia e ser perfeito e estar no lugar perfeito. A nao ser que voce entre em uma crise existencial total.',
    isFavorite: false,
    quality: 'HD'
  },

  // 14. HBO Signature HD
  {
    id: 'ch-hbo-signature',
    number: 14,
    name: 'HBO Signature HD',
    logo: './logos/hbo-signature.png',
    category: 'filmes',
    streamUrl: STREAM_HBO_SIGNATURE_HD,
    backupStreamUrl: STREAM_HBO_HD,
    currentProgram: 'Chernobyl: Minisserie',
    currentProgramTime: '13:45 - 15:00',
    nextProgram: 'Band of Brothers',
    nextProgramTime: '15:00',
    synopsis: 'Homens e mulheres corajosos agem para salvar a Europa de um desastre inimaginavel apos a explosao nuclear.',
    isFavorite: false,
    quality: 'HD'
  },

  // 15. HBO Xtreme HD
  {
    id: 'ch-hbo-xtreme',
    number: 15,
    name: 'HBO Xtreme HD',
    logo: './logos/hbo-xtreme.png',
    category: 'filmes',
    streamUrl: STREAM_HBO_XTREME_HD,
    backupStreamUrl: STREAM_HBO_HD,
    currentProgram: 'Mad Max: Estrada da Furia',
    currentProgramTime: '14:00 - 16:00',
    nextProgram: 'John Wick 4: Baba Yaga',
    nextProgramTime: '16:00',
    synopsis: 'Em um mundo pos-apocaliptico, Max se une a Furiosa em uma fuga frenetica atraves do deserto contra Immortan Joe.',
    isFavorite: false,
    quality: 'HD'
  },

  // 16. Premiere Clubes HD
  {
    id: 'ch-premiere-clubes',
    number: 16,
    name: 'Premiere Clubes HD',
    logo: './logos/premiere.png',
    category: 'esportes',
    streamUrl: STREAM_PREMIERE_CLUBES_HD,
    backupStreamUrl: STREAM_PREMIERE_CLUBES_HD_BACKUP,
    currentProgram: 'Futebol Ao Vivo - Serie A',
    currentProgramTime: '16:00 - 18:00',
    nextProgram: 'Linha de Passe',
    nextProgramTime: '18:00',
    synopsis: 'A melhor cobertura do futebol brasileiro ao vivo com transmissao exclusiva Premiere.',
    isFavorite: true,
    quality: 'HD'
  },

  // 17. Premiere Clubes FHD
  {
    id: 'ch-premiere-clubes-fhd',
    number: 17,
    name: 'Premiere Clubes FHD',
    logo: './logos/premierefutbolclube.png',
    category: 'esportes',
    streamUrl: STREAM_PREMIERE_CLUBES_FHD,
    backupStreamUrl: STREAM_PREMIERE_CLUBES_HD,
    currentProgram: 'Futebol Ao Vivo - Full HD 60FPS',
    currentProgramTime: '16:00 - 18:00',
    nextProgram: 'Redacao SporTV',
    nextProgramTime: '18:00',
    synopsis: 'Transmissao esportiva em alta definicao e maximo detalhamento dos gramados.',
    isFavorite: false,
    quality: '1080p'
  },

  // 18. ESPN HD
  {
    id: 'ch-espn',
    number: 18,
    name: 'ESPN HD',
    logo: './logos/espn.png',
    category: 'esportes',
    streamUrl: STREAM_ESPN_HD,
    backupStreamUrl: STREAM_ESPN_HD_BACKUP,
    currentProgram: 'SportsCenter - Ao Vivo',
    currentProgramTime: '15:00 - 16:30',
    nextProgram: 'Futebol 360',
    nextProgramTime: '16:30',
    synopsis: 'O giro completo das principais noticias, debates e os lances dos maiores campeonatos do planeta.',
    isFavorite: true,
    quality: 'HD'
  }
];

export const generateEPGSchedule = (channels: Channel[]): EPGProgram[] => {
  const programs: EPGProgram[] = [];
  const timeslots = [
    { start: '14:00', end: '15:30', dur: 90 },
    { start: '15:30', end: '17:00', dur: 90 },
    { start: '17:00', end: '18:25', dur: 85, live: true },
    { start: '18:25', end: '19:40', dur: 75 },
    { start: '19:40', end: '20:45', dur: 65 },
    { start: '20:45', end: '22:30', dur: 105 },
    { start: '22:30', end: '00:00', dur: 90 },
  ];

  channels.forEach((ch) => {
    timeslots.forEach((slot, idx) => {
      let title = '';
      let desc = '';
      const cat = ch.category;

      if (slot.live && ch.currentProgram) {
        title = ch.currentProgram;
        desc = ch.synopsis || 'Programacao ao vivo com transmissao em alta definicao.';
      } else if (idx === 3 && ch.nextProgram) {
        title = ch.nextProgram;
        desc = 'Proximo capitulo ou bloco imperdivel da grade de programacao.';
      } else {
        const fallbackTitles: Record<string, string[]> = {
          aberta: ['Manha Informativa', 'Sessao da Tarde', 'Novela das Oito', 'Jornal da Noite', 'Tela Quente'],
        };
        const list = fallbackTitles[ch.category] || fallbackTitles['aberta'];
        title = list[idx % list.length];
        desc = `Exibicao especial no canal ${ch.name}. Aproveite a melhor qualidade de audio e video.`;
      }

      programs.push({
        id: `epg-${ch.id}-${idx}`,
        channelId: ch.id,
        title,
        category: cat,
        startTime: slot.start,
        endTime: slot.end,
        durationMinutes: slot.dur,
        description: desc,
        rating: '12+',
        isLive: !!slot.live,
      });
    });
  });

  return programs;
};

export const HERO_FEATURED: MediaItem = {
  id: 'hero-resident-evil',
  title: 'Resident Evil (2026)',
  type: 'movie',
  year: 2026,
  rating: 7.3,
  genres: ['Terror', 'Ficção científica', 'Aventura'],
  posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
  backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
  description: 'Bryan, um tranquilo entregador de orgaos, e enviado para uma entrega noturna no Hospital Geral de Raccoon City. No caminho por uma estrada montanhosa coberta de neve, ele acidentalmente atropela uma mulher desconhecida. Ela sobrevive, mas algo esta muito...',
  streamUrl: HLS_SAMPLE_1,
};

export const TRENDING_MOVIES: MediaItem[] = [
  {
    id: 'mov-1',
    title: 'Resident Evil (2026)',
    type: 'movie',
    year: 2026,
    rating: 7.3,
    genres: ['Terror', 'Ação'],
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    description: 'Suspense sombrio em Raccoon City quando experimentos saem do controle.',
    streamUrl: HLS_SAMPLE_1,
  },
  {
    id: 'mov-2',
    title: 'A Ilha Esquecida',
    type: 'movie',
    year: 2026,
    rating: 8.1,
    genres: ['Aventura', 'Fantasia'],
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    description: 'Exploradores descobrem uma terra congelada no tempo repleta de perigos ancestrais.',
    streamUrl: HLS_SAMPLE_2,
  },
  {
    id: 'mov-3',
    title: 'Ali G: Quem é Eu? (2026)',
    type: 'movie',
    year: 2026,
    rating: 7.0,
    genres: ['Comédia'],
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    description: 'O retorno mais irreverente da comedia em uma satira mundial de tirar o folego.',
    streamUrl: HLS_SAMPLE_3,
  },
  {
    id: 'mov-4',
    title: 'Velocidade e Paixão',
    type: 'movie',
    year: 2026,
    rating: 7.9,
    genres: ['Romance', 'Drama'],
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
    description: 'Dois pilotos rivais encontram um amor proibido nas pistas mais perigosas do circuito.',
    streamUrl: HLS_SAMPLE_1,
  },
  {
    id: 'mov-5',
    title: 'Obsessão (2026)',
    type: 'movie',
    year: 2026,
    rating: 6.8,
    genres: ['Suspense'],
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80',
    description: 'Um jogo psicologico sinistro comeca apos um encontro casual num cafe de Paris.',
    streamUrl: HLS_SAMPLE_2,
  },
  {
    id: 'mov-6',
    title: 'Homem-Aranha: Um Novo Dia',
    type: 'movie',
    year: 2026,
    rating: 8.7,
    genres: ['Ação', 'Ficção'],
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1200&auto=format&fit=crop&q=80',
    description: 'Peter Parker enfrenta novos desafios protegendo as ruas de Nova York sem recursos.',
    streamUrl: HLS_SAMPLE_3,
  },
  {
    id: 'mov-7',
    title: 'Três Horas Para Viver',
    type: 'movie',
    year: 2026,
    rating: 7.5,
    genres: ['Ação', 'Policial'],
    posterUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80',
    description: 'Uma contagem regressiva letal obriga um detetive aposentado a arriscar tudo.',
    streamUrl: HLS_SAMPLE_1,
  },
  {
    id: 'mov-8',
    title: 'Moana (2026)',
    type: 'movie',
    year: 2026,
    rating: 8.4,
    genres: ['Animação', 'Aventura'],
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    description: 'Novas aventuras maritimas alem do horizonte com ancestrais e forcas da natureza.',
    streamUrl: HLS_SAMPLE_2,
  }
];

export const TRENDING_SERIES: MediaItem[] = [
  {
    id: 'ser-1',
    title: 'Um Trabalho do Inferno',
    type: 'series',
    year: 2025,
    rating: 8.2,
    genres: ['Comédia', 'Sobrenatural'],
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    description: 'Um funcionario de escritorio descobre que seu novo chefe e literalmente o Diabo.',
    streamUrl: HLS_SAMPLE_1,
    seasons: 2,
    episodes: 16
  },
  {
    id: 'ser-2',
    title: 'Lupin',
    type: 'series',
    year: 2024,
    rating: 8.5,
    genres: ['Mistério', 'Crime'],
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    description: 'Inspirado pelas aventuras de Arsene Lupin, Assane Diop busca vinganca para o pai.',
    streamUrl: HLS_SAMPLE_2,
    seasons: 3,
    episodes: 21
  },
  {
    id: 'ser-3',
    title: 'Dexter Ressurreição',
    type: 'series',
    year: 2025,
    rating: 8.9,
    genres: ['Drama', 'Crime'],
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    description: 'O assassino de assassinos retorna em uma nova jornada na gelada costa leste.',
    streamUrl: HLS_SAMPLE_3,
    seasons: 1,
    episodes: 10
  },
  {
    id: 'ser-4',
    title: 'Cyberpunk: Mercenários',
    type: 'series',
    year: 2024,
    rating: 9.0,
    genres: ['Anime', 'Ficção'],
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
    description: 'Um jovem garoto de rua tentando sobreviver em Night City, uma cidade obcecada por tecnologia.',
    streamUrl: HLS_SAMPLE_1,
    seasons: 1,
    episodes: 10
  },
  {
    id: 'ser-5',
    title: 'Matéria Escura',
    type: 'series',
    year: 2024,
    rating: 8.4,
    genres: ['Ficção Científica', 'Suspense'],
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    description: 'Um fisico e sequestrado para uma versao alternativa de sua vida entre infinitas realidades.',
    streamUrl: HLS_SAMPLE_2,
    seasons: 1,
    episodes: 9
  }
];

export const ANIMES_LIST: MediaItem[] = [
  {
    id: 'ani-1',
    title: 'Star Wars: Visions - A Nona Jedi',
    type: 'anime',
    year: 2026,
    rating: 8.8,
    genres: ['Anime', 'Ficção'],
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    description: 'A filha de um mestre armeiro viaja para entregar sabres de luz a guerreiros Jedi.',
    streamUrl: HLS_SAMPLE_1,
  },
  {
    id: 'ani-2',
    title: 'Baki-Dou: O Samurai Invencível',
    type: 'anime',
    year: 2026,
    rating: 8.6,
    genres: ['Anime', 'Luta'],
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    description: 'Baki e os lutadores mais fortes da Terra encaram o lendario Miyamoto Musashi.',
    streamUrl: HLS_SAMPLE_2,
  },
  {
    id: 'ani-3',
    title: 'Rooster Fighter',
    type: 'anime',
    year: 2026,
    rating: 8.2,
    genres: ['Anime', 'Comédia', 'Ação'],
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
    description: 'Um galo solitario viaja pelo Japao destruindo monstros mutantes com seu grito de guerra.',
    streamUrl: HLS_SAMPLE_3,
  },
  {
    id: 'ani-4',
    title: 'Bleach: Guerra Sangrenta',
    type: 'anime',
    year: 2025,
    rating: 9.1,
    genres: ['Anime', 'Ação'],
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
    description: 'O confronto milenar final entre os Shinigamis da Soul Society e o exercito de Quincies.',
    streamUrl: HLS_SAMPLE_1,
  }
];

export const DORAMAS_LIST: MediaItem[] = [
  {
    id: 'dor-1',
    title: 'The Early Spring',
    type: 'dorama',
    year: 2026,
    rating: 8.5,
    genres: ['Dorama', 'Romance'],
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
    description: 'Um encontro em Seul traz a tona memórias de infância e promessas esquecidas.',
    streamUrl: HLS_SAMPLE_1,
  },
  {
    id: 'dor-2',
    title: 'Namorado por Assinatura',
    type: 'dorama',
    year: 2026,
    rating: 8.3,
    genres: ['Dorama', 'Comédia'],
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    description: 'Uma desenvolvedora testa seu app de relacionamentos e contrata um falso noivo.',
    streamUrl: HLS_SAMPLE_2,
  },
  {
    id: 'dor-3',
    title: 'O Amor Pode Ser Traduzido?',
    type: 'dorama',
    year: 2025,
    rating: 8.7,
    genres: ['Dorama', 'Drama'],
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80',
    description: 'Um interprete multilíngue comeca a trabalhar para uma estrela global e ambos superam traumas.',
    streamUrl: HLS_SAMPLE_3,
  }
];

# MasterTV - Reprodutor de IPTV & Guia de Programação (EPG)

Moderno reprodutor de IPTV desenvolvido com React, TypeScript, Tailwind CSS e HLS.js, com interface dark neon inspirada nas melhores plataformas de streaming.

## Principais Funcionalidades

- **Player Moderno de IPTV**:
  - Reprodução contínua de transmissões ao vivo (.m3u8 via Hls.js e HTML5).
  - Barra superior de informações: atração atual (**AGORA**), horários e próxima atração (**A SEGUIR**).
  - Gaveta lateral retrátil de Canais com pesquisa rápida e filtro por categorias simplificadas.
  - Navegação intuitiva no teclado: setas `↑` e `↓` para troca instantânea de canais, `Espaço` para pausar, `M` para mudo e `F` para tela cheia.
  - Controles inferiores flutuantes em vidro (*glassmorphism*): seleção de resolução (1080p, 720p), fonte alternativa (Fonte 1/2), modo Zero Delay (baixa latência), Picture-in-Picture (PiP) e controle de volume.
- **Categorias Simplificadas**:
  - Todos, Favoritos, TV Aberta, Filmes, Séries, Esportes, Notícias, Infantil, Documentários, Música e Rádios.
- **Guia de Programação (EPG) Interativo**:
  - Grade horária completa no estilo cabo/satélite (14h às 23h).
  - Marcador de horário ao vivo.
  - Detalhes de cada programa com sinopse, duração e botão direto para assistir.
- **Catálogo On Demand (VOD)**:
  - Destaque em banner cinematográfico (*Hero*) com metadados e sinopse.
  - Trilhas horizontais (*carousels*): Ao Vivo Agora (com barra de progresso do programa), Em Alta, Séries em Alta, Lançamentos, Animes e Doramas.
- **Importador de Listas M3U / M3U8**:
  - Suporte para colar URL de listas M3U ou colar o conteúdo de texto da lista.
  - Detecção automática de nomes, logotipos (`tvg-logo`), categorias (`group-title`) e IDs de EPG (`tvg-id`).
  - Persistência no armazenamento local (`localStorage`).

## Como Executar o Projeto

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Compilar para produção (Release)
npm run build
```

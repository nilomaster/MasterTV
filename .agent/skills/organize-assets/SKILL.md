---
name: organize-assets
description: Padrao obrigatorio para organizacao de imagens (.png, .ico, .jpg, .jpeg, .webp, .svg) e assets estritamente dentro da pasta assets/img/ no projeto MasterTV.
---

# Skill: Organizacao Rigorosa de Assets e Imagens

Esta skill define as diretrizes obrigatorias para que **nenhuma imagem ou arquivo de midia fique solto na raiz** de `public/` ou no resultado de distribuicao `dist/`. Toda midia deve ser armazenada e servida estritamente dentro da estrutura centralizada de `assets/`.

---

## 📁 1. Estrutura Padrao Obrigatoria

Todas as imagens e icones devem respeitar a seguinte hierarquia:

```text
public/
└── assets/
    └── img/
        ├── covers/   # Capas de filmes, series e animes (.webp, .jpg, .png)
        ├── icons/    # Favicons (.ico, .svg, .png) e icones do sistema
        └── logos/    # Logos oficiais de canais de TV (.png, .webp)
```

No build final (`dist/`), a raiz do projeto devera conter **apenas**:
- `index.html`
- `.htaccess`
- `assets/` (com as subpastas `css/`, `js/` e `img/`)

---

## 🚫 2. Regras Estritas de Proibicao

1. **PROIBIDO** colocar arquivos com as extensoes `.png`, `.jpg`, `.jpeg`, `.ico`, `.webp`, `.svg`, `.gif` diretamente na raiz de `public/`.
2. **PROIBIDO** referenciar caminhos absolutos como `/favicon.ico` ou `/logo.png` na raiz do HTML ou componentes.
3. Se um novo icone for adicionado, deve ser colocado em `public/assets/img/icons/`.
4. Se uma nova capa for adicionada, deve ser colocada em `public/assets/img/covers/`.
5. Se um novo logo de canal for adicionado, deve ser colocado em `public/assets/img/logos/`.

---

## ⚙️ 3. Configuracao do Vite (`vite.config.ts`)

O empacotador Vite deve manter a regra de roteamento de assets para as pastas correspondentes:

```typescript
// Strictly ASCII comments only
rollupOptions: {
  output: {
    chunkFileNames: 'assets/js/[name]-[hash].js',
    entryFileNames: 'assets/js/[name]-[hash].js',
    assetFileNames: (assetInfo) => {
      const name = assetInfo.name || '';
      if (/\.css$/.test(name)) {
        return 'assets/css/[name]-[hash][extname]';
      }
      if (/\.(png|jpe?g|svg|gif|webp|ico|avif)$/.test(name)) {
        return 'assets/img/[name]-[hash][extname]';
      }
      return 'assets/[ext]/[name]-[hash][extname]';
    },
  },
}
```

---

## 🔍 4. Procedimento de Verificacao Pos-Build

Sempre que executar `npm run build`:
1. Verificar a pasta `dist/` com `Get-ChildItem -Path "dist"`.
2. Garantir que existam apenas `assets`, `.htaccess` e `index.html`.
3. Caso algum arquivo `.ico` ou `.png` apareca na raiz de `dist/`, mover para `assets/img/icons/` e corrigir a origem em `public/`.


# Hard Flow — Landing Page

Site estático (sem backend, sem build). Formulário de diagnóstico envia direto pro WhatsApp.

## Estrutura

```
hardflow-site/
├── index.html          página única
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── assets/
│   ├── logo.svg
│   ├── hero.webm / hero.mp4         vídeo de fundo da Hero (não carrega no mobile)
│   ├── reel-1..5.webm / .mp4        vídeos dos reels (portfólio)
│   └── case-odonto/lumie/spectus.webp
├── _headers             headers de segurança (Netlify / Cloudflare Pages)
└── .htaccess            headers de segurança (Apache)
```

## Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (público, se for usar o GitHub Pages gratuito).
2. Suba o **conteúdo desta pasta** (não a pasta em si) pra raiz do repositório:
   ```
   git init
   git add .
   git commit -m "Site Hard Flow"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Source** → selecione a branch `main` e a pasta `/ (root)`.
4. Em alguns minutos o site fica no ar em:
   `https://SEU_USUARIO.github.io/SEU_REPO/`
5. (Opcional) Domínio próprio: em **Settings → Pages → Custom domain**, digite seu domínio e siga a instrução de DNS que o GitHub mostra (um registro CNAME apontando pro `SEU_USUARIO.github.io`).

## Sobre os headers de segurança

O `_headers` e o `.htaccess` **não funcionam no GitHub Pages** — ele não lê nenhum dos dois (GitHub Pages não permite headers HTTP customizados). Eles estão aqui prontos caso você troque de hospedagem no futuro para Netlify, Cloudflare Pages ou um servidor Apache. No GitHub Pages, a única camada de proteção possível é a política de segurança (CSP) que já está dentro da tag `<meta>` no `<head>` do `index.html` — essa sempre funciona, independente de onde o site for hospedado.

## Editar o conteúdo

- Textos, seções e estrutura: `index.html`
- Cores, espaçamento, responsividade: `css/styles.css`
- Formulário, carrosséis, animações: `js/main.js`
- Número de WhatsApp: procure `WHATSAPP_NUMBER` no início de `js/main.js`

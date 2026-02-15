# PWA Icons Setup Guide

Este projeto usa PWA leve com foco em manifesto e icones.

## Tamanhos recomendados

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## Estrutura esperada

```text
public/
+-- icons/
�   +-- icon-72x72.png
�   +-- icon-96x96.png
�   +-- icon-128x128.png
�   +-- icon-144x144.png
�   +-- icon-152x152.png
�   +-- icon-192x192.png
�   +-- icon-384x384.png
�   +-- icon-512x512.png
+-- manifest.json
```

## Validacao

1. Abra DevTools > Application > Manifest.
2. Confirme que todos os icones foram carregados.
3. Rode `npm run lighthouse` e valide installability/performance.

## Observacao

- Atualmente nao mantemos `public/sw.js` customizado no repositorio.
- Se houver necessidade de offline robusto, abrir tarefa especifica para service worker.

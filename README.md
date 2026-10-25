# Artefactos

Sitio personal de Álvaro Riascos Villegas, publicado con GitHub Pages en https://ariascos.github.io/artefactos/.

## Estructura

```
index.html              Portada: mapa de artefactos e índice con filtros y búsqueda
acerca.html             Página "Acerca"
404.html                Página para enlaces rotos
artefactos/<slug>/      Un artefacto por carpeta, con su index.html
assets/css/site.css     Estilos compartidos (colores, tipografía, modo oscuro)
assets/js/artefactos.js Catálogo: la lista de artefactos que muestra la portada
assets/js/site.js       Dibuja el mapa y el índice a partir del catálogo
.nojekyll               Le dice a GitHub Pages que publique los archivos tal cual
```

## Publicar un artefacto nuevo

1. Crea la carpeta `artefactos/<slug>/` (minúsculas, sin espacios ni tildes) y guarda ahí la página como `index.html`.
2. Agrega una entrada en `assets/js/artefactos.js`:

   ```js
   {
     slug: "mi-artefacto",
     titulo: "Título que aparece en el índice",
     descripcion: "Una o dos frases sobre qué es.",
     categoria: "Académico",           // Quantil, Académico, Personal o Herramientas
     temas: ["teoría de juegos", "economía"],
     fecha: "2026-10-24"
   },
   ```

3. Haz commit y push a `main`. GitHub Pages publica en uno o dos minutos.

El mapa de la portada aparece cuando hay tres artefactos o más. Une los que comparten al menos un tema, así que conviene reutilizar los mismos nombres de temas.

Si un artefacto vive en otro sitio, omite la carpeta y agrega `enlace: "https://..."` a su entrada.

Cada artefacto debería tener un enlace de regreso al índice. `artefactos/gruta-martica/` lo tiene integrado en su diseño; para otros, puedes pegar esto justo antes de `</body>`:

```html
<a href="../../" style="all:initial;position:fixed;left:16px;bottom:16px;z-index:2147483647;font:500 14px/1 system-ui,sans-serif;color:#17222c;background:#eef1f3;border:1px solid #c9d1d8;border-radius:999px;padding:10px 14px;cursor:pointer;box-shadow:0 2px 8px rgba(23,34,44,.12)">← Artefactos</a>
```

## Ver el sitio en tu computador

```
python3 -m http.server 8000
```

y abre http://localhost:8000. (La página 404 usa rutas que empiezan por /artefactos/, así que solo funciona bien ya publicada.)

## Activar GitHub Pages (una sola vez)

En el repositorio: Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, carpeta `/ (root)` → Save.

/*
  Catálogo de artefactos.

  Para publicar uno nuevo:
  1. Crea la carpeta artefactos/<slug>/ y guarda ahí la página como index.html.
  2. Agrega una entrada a esta lista.

  Campos:
    slug         nombre de la carpeta (minúsculas, sin espacios ni tildes)
    titulo       como aparece en el índice
    descripcion  una o dos frases
    categoria    Quantil, Académico, Personal o Herramientas (otra categoría sale en gris)
    temas        lista de temas; el mapa une los artefactos que comparten alguno
    fecha        AAAA-MM-DD
    enlace       opcional: URL externa si el artefacto vive en otro sitio
*/

window.ARTEFACTOS = [
  {
    slug: "gruta-martica",
    titulo: "Gruta Martica",
    descripcion: "Plano acotado y modelo 3D de una gruta ojival de concreto sobre una base de 50\u00a0×\u00a040\u00a0cm, con una columna al frente.",
    categoria: "Personal",
    temas: ["diseño", "modelado 3D", "concreto"],
    fecha: "2026-10-24"
  }
];

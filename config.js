// ===== CONFIGURACIÓN DE QUARTA MARCHIA =====
// En Supabase: Project Settings > API. Copia aquí los dos datos y guarda el archivo.
// Clave PUBLICABLE (segura en el navegador gracias a los permisos de la base). NUNCA pongas aquí la clave secreta.
window.QM_CONFIG = {
  url: "https://tbykhuahibuijfvcuvkm.supabase.co",
  key: "sb_publishable_yltBVEBTvlcrP77_3te3tw_PVfjv70-",

  // Botones de "¿Quién eres?" en la pantalla de entrada.
  // Los dos correos llegan a la misma bandeja de quartamarchia@gmail.com (truco del "+" de Gmail),
  // pero son usuarios distintos, cada uno con su PIN. Solo Gerencia cambia márgenes.
  // Son por área, no por persona: si cambia quien ocupa el puesto, solo se le asigna un PIN nuevo.
  usuarios: [
    { nombre: "Gerencia",       puesto: "Márgenes y autorizaciones", email: "quartamarchia+gerencia@gmail.com" },
    { nombre: "Administrativo", puesto: "Cotizaciones y seguimiento", email: "quartamarchia+administrativo@gmail.com" }
  ]
};

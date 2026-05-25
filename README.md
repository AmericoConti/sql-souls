# ⚔️ SQL Souls: El Abismo de los Datos

Un juego interactivo estilo *Soulslike* diseñado para enseñar y dominar el lenguaje SQL a través del combate contra Jefes de Bases de Datos. Escribe consultas precisas para infligir daño, esquiva los contraataques lógicos y conviértete en el *Elden Lord de los Datos*.

## 🌟 Características Principales
* **Combate por Consultas:** Tu daño depende de la exactitud de tu código SQL.
* **Motor Alasql Integrado:** Las consultas se ejecutan de forma real y segura en el navegador.
* **Progresión RPG:** Clases con diferentes estadísticas (Guerrero, Mago, Hacker), recarga de Stamina y curación parcial en hogueras.
* **Oráculo de Gemini (IA):** Un sistema de pistas crípticas impulsado por la API de Google Gemini.
* **Sistema de Logros:** Desbloquea proezas mediante Notificaciones Cinematográficas (Toasts).
* **Persistencia Local:** Tu progreso (HP del Jefe, XP, Nivel) se guarda en tu navegador.

## 📂 Arquitectura del Proyecto

/sql-souls/
│
├── index.html         # Interfaz principal e importación de dependencias
├── app.js             # Motor central (Combate, UI, IA, Estado)
├── database.js        # Creación e inserción de tablas (alasql)
├── quests.js          # Definición de niveles, jefes y resultados esperados
├── achievements.js    # Sistema de logros y lore
├── styles.css         # Estilos globales, animaciones y Toasts cinematográficos
│
├── /assets/           # Recursos multimedia
│   ├── bg.jpg         # Fondo inmersivo oscuro
│   ├── boss.mp3       # (Opcional) Música de tensión para batallas
│   └── icons/         # Iconografía local (si no se usa FontAwesome)
│
└── README.md          # Documentación


## 🚀 Instalación y Uso
1. Clona este repositorio.
2. No necesitas un servidor backend (Node/Python). Simplemente abre `index.html` en tu navegador web o usa una extensión como *Live Server* en VSCode.
3. Ingresa tu API Key de Gemini en la interfaz (opcional) para habilitar al Oráculo.

## 🛡️ Seguridad
El frontend incluye un validador léxico por Expresiones Regulares que bloquea instrucciones destructivas (`DROP`, `DELETE`, `UPDATE`, `INSERT`) protegiendo el entorno de ejecución.
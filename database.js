// =========================
// 🗄️ DATABASE INIT (COMPLETA PARA 60 QUESTS)
// =========================

function initDatabase() {
    // 1. CREACIÓN DE TABLAS
    // Añadimos todas las columnas que requieren las zonas medias y avanzadas
    alasql("CREATE TABLE guerreros (id INT, nombre STRING, nivel INT, clase STRING, hp INT, almas INT)");
    alasql("CREATE TABLE armas (id INT, nombre STRING, guerrero_id INT, danio INT, tipo STRING)");
    alasql("CREATE TABLE hechizos (id INT, nombre STRING, costo_sp INT, guerrero_id INT)");

    // ==========================================
    // 2. POBLAR TABLA: guerreros
    // ==========================================
    // NOTA: Contiene casos específicos para LIKE, IS NULL, y agregaciones
    alasql("INSERT INTO guerreros VALUES (1, 'Tarnished', 5, 'Guerrero', 400, 100)");
    alasql("INSERT INTO guerreros VALUES (2, 'Radahn', 50, 'Guerrero', 850, 8000)");
    alasql("INSERT INTO guerreros VALUES (3, 'Malenia', 99, 'Guerrero', 900, 15000)"); // Nombre con 7 letras
    alasql("INSERT INTO guerreros VALUES (4, 'Godrick', 15, 'Mago', 600, 2000)"); // Nombre con 7 letras
    alasql("INSERT INTO guerreros VALUES (5, 'Mendigo', 1, NULL, 100, 0)"); // Para el test de IS NULL y 0 almas
    alasql("INSERT INTO guerreros VALUES (6, 'Corhyn', 20, 'Clérigo', 450, 500)");
    alasql("INSERT INTO guerreros VALUES (7, 'Ranni', 80, 'Mago', 750, 12000)");
    alasql("INSERT INTO guerreros VALUES (8, 'Rey Loco', 30, 'Guerrero', 700, 4000)"); // Para el test de LIKE '%Rey%'
    alasql("INSERT INTO guerreros VALUES (9, 'Gideon', 40, 'Mago', 550, 6000)");
    alasql("INSERT INTO guerreros VALUES (10, 'Miriel', 25, 'Clérigo', 800, 1500)");

    // ==========================================
    // 3. POBLAR TABLA: armas
    // ==========================================
    // NOTA: guerrero_id=5 (Mendigo) no tiene armas intencionalmente para los LEFT JOIN
    alasql("INSERT INTO armas VALUES (1, 'Espada Larga', 1, 80, 'Espada')"); // Daño exacto 80
    alasql("INSERT INTO armas VALUES (2, 'Espadón de la Ruina', 2, 200, 'Espadón')"); // Daño exacto 200
    alasql("INSERT INTO armas VALUES (3, 'Mano de Malenia', 3, 250, 'Katana')"); // Arma nombrada explícitamente en quest
    alasql("INSERT INTO armas VALUES (4, 'Hacha de Injertado', 4, 150, 'Hacha')"); // Guerrero con nombre 'G'
    alasql("INSERT INTO armas VALUES (5, 'Cetro Real', 7, 120, 'Bastón')");
    alasql("INSERT INTO armas VALUES (6, 'Hoja Blasfema', 8, 600, 'Espadón')"); // Arma con daño > 500 para la subconsulta EXISTS
    alasql("INSERT INTO armas VALUES (7, 'Espada de Cristal', 9, 110, 'Espada')"); // Para agrupar por tipo 'Espada'

    // ==========================================
    // 4. POBLAR TABLA: hechizos
    // ==========================================
    alasql("INSERT INTO hechizos VALUES (1, 'Cometa', 60, 4)");
    alasql("INSERT INTO hechizos VALUES (2, 'Curación Urgente', 30, 6)"); // Costo < 50
    alasql("INSERT INTO hechizos VALUES (3, 'Luna Oscura', 80, 7)");
    alasql("INSERT INTO hechizos VALUES (4, 'Llama Frenética', 40, 8)"); // Costo < 50
    alasql("INSERT INTO hechizos VALUES (5, 'Cometa Azur', 90, 9)");

    console.log("🔥 Hoguera encendida: Tablas forjadas e insertadas en el Abismo.");
}
// ==========================================
// 🎵 1. MÓDULO: AUDIO 
// ==========================================
const AudioSys = (() => {
    let isMuted = false;
    let bossMusic = new Audio('./assets/boss.mp3');
    bossMusic.loop = true; 
    bossMusic.volume = 0.3;

    const sfx = {
        hit: new Audio('./assets/audio/hit.wav'),
        success: new Audio('./assets/audio/success.wav'),
        achievement: new Audio('./assets/audio/achievement.wav')
    };

    return {
        play: (type, isBoss = false) => {
            if (isMuted || !sfx[type]) return;
            
            const sound = sfx[type];
            sound.currentTime = 0;
            sound.play().catch(() => {});

            // Lógica de duración máxima
            if (type === 'success' || type === 'achievement') {
                const duration = isBoss ? 10000 : 3000; // 10s para boss, 3s para normal
                
                // Limpiamos cualquier timeout previo para evitar conflictos
                if (sound.timeout) clearTimeout(sound.timeout);
                
                sound.timeout = setTimeout(() => {
                    // Desvanecimiento suave (fade out) en 500ms antes de cortar
                    const fadeOut = setInterval(() => {
                        if (sound.volume > 0.1) {
                            sound.volume -= 0.1;
                        } else {
                            sound.pause();
                            sound.volume = 1.0; // Reset para la próxima vez
                            clearInterval(fadeOut);
                        }
                    }, 50);
                }, duration);
            }
        },
        updateMusic: (isBoss) => {
            if (isMuted) { bossMusic.pause(); return; }
            isBoss ? bossMusic.play().catch(() => {}) : (bossMusic.pause(), bossMusic.currentTime = 0);
        },
        toggleMute: () => {
            isMuted = !isMuted;
            AudioSys.updateMusic(GameEngine.getQuest()?.boss);
            document.getElementById("muteBtn").innerHTML = isMuted ? 
                '<i class="fa-solid fa-volume-xmark text-red-400"></i>' : 
                '<i class="fa-solid fa-volume-high"></i>';
        }
    };
})();

// ==========================================
// 💾 2. MÓDULO: PERSISTENCIA (Profile Manager)
// ==========================================
const StorageSys = (() => {
    const DEFAULT_PROFILE = {
        version: 1,
        questIndex: 0,
        playerClass: "warrior",
        stats: { hp: 150, sp: 100 },
        achievements: [],
        sessionAttempts: 0 // Intentos en la misión actual
    };

    return {
        load: () => {
            try {
                const data = localStorage.getItem("sql_profile");
                if (data) {
                    const profile = JSON.parse(data);
                    if (profile.version === DEFAULT_PROFILE.version) return profile;
                }
            } catch(e) { console.error("Error cargando perfil", e); }
            return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
        },
        save: (profile) => {
            localStorage.setItem("sql_profile", JSON.stringify(profile));
        }
    };
})();

// ==========================================
// 🧠 3. MÓDULO: EVALUADOR SQL (Normalización Crítica)
// ==========================================
const SqlEvaluator = (() => {
    // Normaliza el resultado: ordena columnas alfabéticamente y luego ordena las filas.
    function normalize(result) {
        if (!Array.isArray(result)) return result;
        return result
            .map(row => Object.keys(row).sort().reduce((acc, k) => {
                acc[k] = row[k];
                return acc;
            }, {}))
            .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    }

    return {
        evaluate: (playerQuery, expectedQuery) => {
            if(playerQuery.toLowerCase().match(/(drop|delete|insert|update|alter|create)/)) {
                return { status: 'forbidden', msg: "Magia oscura prohibida. Solo SELECT está permitido." };
            }

            let playerResult, expectedResult;

            // Capa 1: Sintaxis (¿La query es válida?)
            try {
                playerResult = alasql(playerQuery);
                expectedResult = alasql(expectedQuery);
            } catch (e) {
                return { status: 'syntax_error', msg: `Error de sintaxis: ${e.message}`, data: null };
            }

            // Capa 2: Lógica (¿Resolvió el problema?)
            const isCorrect = JSON.stringify(normalize(playerResult)) === JSON.stringify(normalize(expectedResult));
            
            if (isCorrect) {
                return { status: 'success', msg: '¡Golpe crítico! Enemigo destruido.', data: playerResult };
            } else {
                return { 
                    status: 'logic_error', 
                    msg: 'El hechizo es válido, pero el resultado no es el esperado.', 
                    data: playerResult 
                };
            }
        }
    };
})();

// ==========================================
// 🖥️ 4. MÓDULO: UI (Interfaz y Renderizado)
// ==========================================
const UI = (() => {
    return {
        log: (msg, type = "normal") => {
            const box = document.getElementById("logBox");
            const div = document.createElement("div");
            let style = "border-l-2 pl-2 py-1 ";
            if (type === "error") style += "border-red-600 text-red-400";
            else if (type === "success") style += "border-green-600 text-green-400";
            else if (type === "warning") style += "border-yellow-600 text-yellow-400";
            else style += "border-gray-500 text-gray-300";
            
            div.className = style;
            div.innerHTML = `> ${msg}`;
            box.prepend(div);
        },
        render: (profile, maxHp, maxSp) => {
            const q = QUESTS[profile.questIndex] || QUESTS[QUESTS.length - 1];
            
            document.getElementById("hpBar").style.width = `${(profile.stats.hp / maxHp) * 100}%`;
            document.getElementById("hpText").innerText = `${Math.floor(profile.stats.hp)}/${maxHp}`;
            document.getElementById("spBar").style.width = `${(profile.stats.sp / maxSp) * 100}%`;
            document.getElementById("spText").innerText = `${Math.floor(profile.stats.sp)}/${maxSp}`;
            
            document.getElementById("questName").innerText = `${q.boss ? '💀 ' : ''}${q.n}`;
            document.getElementById("questName").className = q.boss ? "text-2xl font-bold text-red-500" : "text-xl font-bold text-yellow-500";
            document.getElementById("questLevel").innerText = `Nivel ${profile.questIndex + 1}`;
            document.getElementById("questDesc").innerText = q.t;
            document.getElementById("questSchema").innerText = q.s;

            AudioSys.updateMusic(q.boss);
        },
        shake: (id) => {
            const el = document.getElementById(id);
            el.classList.remove("shake");
            void el.offsetWidth; 
            el.classList.add("shake");
        }
    };
})();

// ==========================================
// ⚔️ 5. MÓDULO: MOTOR DE JUEGO (Lógica Principal)
// ==========================================
const GameEngine = (() => {
    const CLASSES = {
        warrior: { name: "Guerrero", hpBonus: 50, spRegen: 5, cost: 20 },
        mage: { name: "Mago", hpBonus: 10, spRegen: 15, cost: 35 }
    };
    
    let profile = StorageSys.load();

    function getClassData() { return CLASSES[profile.playerClass]; }
    function getQuest() { return QUESTS[profile.questIndex]; }
    function getMaxHp() { return 100 + getClassData().hpBonus; }

    function handleDeath() {
        UI.log("💀 HAS MUERTO. Renaciendo en la hoguera...", "error");
        profile.stats.hp = getMaxHp();
        profile.sessionAttempts = 0;
        StorageSys.save(profile);
        setTimeout(() => location.reload(), 2000);
    }

    return {
        getQuest,
        profile,
        setClass: (cName) => {
            profile.playerClass = cName;
            profile.stats.hp = getMaxHp();
            StorageSys.save(profile);
            UI.log(`✨ Clase seleccionada: ${getClassData().name}`);
            UI.render(profile, getMaxHp(), 100);
        },
        attack: () => {
            const input = document.getElementById("sqlInput").value.trim();
            const q = getQuest();
            const cData = getClassData();

            if (!input) return UI.log("Tu mente está en blanco. Escribe un hechizo SQL.", "error");
            if (profile.stats.sp < cData.cost) {
                UI.shake("spBar");
                return UI.log("No tienes suficiente SP.", "warning");
            }

            // Consumir Maná/Stamina
            profile.stats.sp -= cData.cost;
            UI.log(`Ejecutando: <span class='text-blue-300'>${input}</span>`);

            // Evaluar
            const evalResult = SqlEvaluator.evaluate(input, q.expected);

            if (evalResult.status === 'success') {
                // Pasamos el estado de 'boss' al reproductor de audio
                AudioSys.play('success', q.boss); 
                UI.log(evalResult.msg, "success");
                
                profile.questIndex++;
                profile.sessionAttempts = 0; // Resetear intentos
                StorageSys.save(profile);
                
                if (profile.questIndex >= QUESTS.length) {
                    UI.log("🎉 HAS CONQUISTADO EL ABISMO DE DATOS.", "success");
                } else {
                    setTimeout(() => { document.getElementById("sqlInput").value = ""; UI.render(profile, getMaxHp(), 100); }, 1500);
                }

            } else {
                profile.sessionAttempts++;
                AudioSys.play('hit');
                UI.shake("hpBar");

                // Sistema de Castigo Progresivo (Educativo)
                let damage = 0;
                if (evalResult.status === 'syntax_error') {
                    damage = q.boss ? 15 : 5; // Daño leve por sintaxis
                    UI.log(evalResult.msg, "error");
                } else if (evalResult.status === 'logic_error') {
                    damage = q.boss ? 30 : 15; // Daño moderado por lógica
                    UI.log(evalResult.msg, "warning");
                    UI.log(`Resultado parcial: ${JSON.stringify(evalResult.data).substring(0, 60)}...`);
                } else if (evalResult.status === 'forbidden') {
                    damage = getMaxHp(); // Muerte instantánea por trampa
                    UI.log(evalResult.msg, "error");
                }

                // Sugerencia automática en el segundo intento
                if (profile.sessionAttempts === 2) {
                    UI.log("💡 El Abismo nota tu lucha. Considera usar el Oráculo.", "warning");
                }

                profile.stats.hp -= damage;
                UI.log(`Has recibido ${damage} de daño.`, "error");

                if (profile.stats.hp <= 0) handleDeath();
                else StorageSys.save(profile);
            }
            
            UI.render(profile, getMaxHp(), 100);
        },
        regenTick: () => {
            if (profile.stats.sp < 100) {
                profile.stats.sp = Math.min(100, profile.stats.sp + getClassData().spRegen);
                UI.render(profile, getMaxHp(), 100);
            }
        }
    };
})();

// ==========================================
// 🔮 6. MÓDULO: ORÁCULO (IA)
// ==========================================
const OracleSys = (() => {
    // Lista blanca de modelos permitidos (Rápidos y eficientes)
    const ALLOWED_MODELS = [
        "gemini-3.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash"
    ];

    // Modelo por defecto si el elegido no es seguro
    const SAFE_DEFAULT = "gemini-3.5-flash";

    return {
        ask: async () => {
            const rawKey = localStorage.getItem("sql_key");
            if (!rawKey) return UI.log("Introduce tu API Key en la parte inferior.", "warning");
            
            const apiKey = rawKey.trim();
            if (GameEngine.profile.stats.sp < 20) return UI.log("No tienes suficiente SP.", "error");

            // VALIDACIÓN DE SEGURIDAD:
            // Forzamos el uso de un modelo rápido, ignorando deep-research o antigravity
            const MODELO = SAFE_DEFAULT; 

            UI.log("<span class='text-purple-400 font-bold'>Invocando al Oráculo...</span>");
            GameEngine.profile.stats.sp -= 20;

            const q = GameEngine.getQuest();
            const playerCode = document.getElementById("sqlInput").value.trim();
            
            const promptText = `
                Eres el Oráculo de SQL Souls. 
                Misión: "${q.n}". Objetivo: "${q.t}". Tablas: "${q.s}". 
                Código actual del jugador: "${playerCode || 'Ninguno'}".
                Da una pista críptica y útil sobre SQL. NO des el código completo.
            `;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${apiKey}`;

            try {
                // Añadimos un timeout de 8 segundos para evitar esperas infinitas
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }]
                    })
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json();
                    // Si el error es que el modelo no existe, notificamos
                    if(response.status === 404) throw new Error("Modelo no disponible en tu región.");
                    throw new Error(errorData.error?.message || "Fallo en la conexión astral.");
                }

                const data = await response.json();
                const text = data.candidates[0].content.parts[0].text;
                UI.log(`<span class='text-purple-300 italic'>👁️ " ${text} "</span>`);

            } catch (error) {
                if (error.name === 'AbortError') {
                    UI.log("El Oráculo está tardando demasiado en responder...", "error");
                } else {
                    UI.log(`El Oráculo tosió sangre: ${error.message}`, "error");
                }
                // Devolvemos el SP en caso de error técnico
                GameEngine.profile.stats.sp += 20;
            }
            
            // Actualizar la barra de SP
            const maxHp = 100 + (GameEngine.profile.playerClass === 'warrior' ? 50 : 10);
            UI.render(GameEngine.profile, maxHp, 100);
        }
    };
})();

// ==========================================
// 🚀 7. BOOTSTRAP (Arranque)
// ==========================================
window.onload = () => {
    if(typeof initDatabase === "function") initDatabase();
    
    // API Key Event Listener
    const apiKeyInput = document.getElementById("apiKey");
    if(localStorage.getItem("sql_key")) apiKeyInput.value = localStorage.getItem("sql_key");
    apiKeyInput.addEventListener("change", e => {
        localStorage.setItem("sql_key", e.target.value);
        UI.log("<span class='text-purple-400 font-bold'>[🔑 LLAVE GUARDADA]</span>");
    });

    // Iniciar UI y Bucle
    GameEngine.profile.stats.hp = 100 + (GameEngine.profile.playerClass === 'warrior' ? 50 : 10);
    UI.render(GameEngine.profile, GameEngine.profile.stats.hp, 100);
    setInterval(GameEngine.regenTick, 1000);
};
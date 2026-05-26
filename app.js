// ==========================================
// 🎵 1. MÓDULO: AUDIO
// ==========================================
const AudioSys = (() => {

    let isMuted = false;

    const bossMusic = new Audio('./assets/boss.mp3');

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

            if (type === 'success' || type === 'achievement') {

                const duration = isBoss ? 10000 : 3000;

                if (sound.timeout) clearTimeout(sound.timeout);

                sound.timeout = setTimeout(() => {

                    const fadeOut = setInterval(() => {

                        if (sound.volume > 0.1) {
                            sound.volume -= 0.1;
                        } else {
                            sound.pause();
                            sound.volume = 1.0;
                            clearInterval(fadeOut);
                        }

                    }, 50);

                }, duration);
            }
        },

        updateMusic: (isBoss) => {

            if (isMuted) {
                bossMusic.pause();
                return;
            }

            if (isBoss) {
                bossMusic.play().catch(() => {});
            } else {
                bossMusic.pause();
                bossMusic.currentTime = 0;
            }
        },

        toggleMute: () => {

            isMuted = !isMuted;

            AudioSys.updateMusic(GameEngine.getQuest()?.boss);

            document.getElementById("muteBtn").innerHTML = isMuted
                ? '<i class="fa-solid fa-volume-xmark text-red-400"></i>'
                : '<i class="fa-solid fa-volume-high"></i>';
        }
    };

})();

// ==========================================
// 💾 2. MÓDULO: PERSISTENCIA
// ==========================================
const StorageSys = (() => {

    const DEFAULT_PROFILE = {

        version: 2,

        questIndex: 0,

        playerClass: "warrior",

        stats: {
            hp: 150,
            sp: 100
        },

        achievements: [],

        sessionAttempts: 0,

        totalAttempts: 0,

        victories: 0
    };

    return {

        load: () => {

            try {

                const data = localStorage.getItem("sql_profile");

                if (data) {

                    const parsed = JSON.parse(data);

                    return {
                        ...DEFAULT_PROFILE,
                        ...parsed
                    };
                }

            } catch (e) {
                console.error("Error cargando perfil:", e);
            }

            return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
        },

        save: (profile) => {
            localStorage.setItem("sql_profile", JSON.stringify(profile));
        }
    };

})();

// ==========================================
// 🔐 3. SQL SECURITY SYSTEM
// ==========================================
const SqlSecurity = (() => {

    const FORBIDDEN_KEYWORDS = [
        "DROP",
        "DELETE",
        "INSERT",
        "UPDATE",
        "ALTER",
        "CREATE",
        "TRUNCATE",
        "REPLACE",
        "MERGE",
        "EXEC",
        "EXECUTE",
        "CALL",
        "ATTACH",
        "DETACH",
        "PRAGMA"
    ];

    const ALLOWED_START = [
        "SELECT",
        "WITH"
    ];

    function cleanQuery(query) {

        return query
            .replace(/--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .trim();
    }

    function containsForbidden(query) {

        const upper = query.toUpperCase();

        return FORBIDDEN_KEYWORDS.some(keyword => {
            return new RegExp(`\\b${keyword}\\b`, 'i').test(upper);
        });
    }

    function startsCorrectly(query) {

        const upper = query.trim().toUpperCase();

        return ALLOWED_START.some(word => upper.startsWith(word));
    }

    function containsMultipleStatements(query) {

        const cleaned = query
            .replace(/;+\s*$/, '')
            .trim();

        return cleaned.includes(';');
    }

    return {

        validate(query) {

            if (!query || query.trim().length === 0) {
                return {
                    valid: false,
                    msg: "Consulta vacía."
                };
            }

            const cleaned = cleanQuery(query);

            if (!startsCorrectly(cleaned)) {
                return {
                    valid: false,
                    msg: "Solo se permiten consultas SELECT o WITH."
                };
            }

            if (containsForbidden(cleaned)) {
                return {
                    valid: false,
                    msg: "Magia oscura detectada. Consulta prohibida."
                };
            }

            if (containsMultipleStatements(cleaned)) {
                return {
                    valid: false,
                    msg: "No se permiten múltiples sentencias SQL."
                };
            }

            return {
                valid: true,
                query: cleaned
            };
        }
    };

})();

// ==========================================
// 🧠 4. SQL EVALUATOR
// ==========================================
const SqlEvaluator = (() => {

    function normalize(result) {

        if (!Array.isArray(result)) return result;

        return result
            .map(row => {

                const ordered = {};

                Object.keys(row)
                    .sort()
                    .forEach(key => {
                        ordered[key] = row[key];
                    });

                return ordered;
            })
            .sort((a, b) => {
                return JSON.stringify(a).localeCompare(JSON.stringify(b));
            });
    }

    function safeExecute(query) {

        return alasql(query);
    }

    return {

        evaluate(playerQuery, expectedQuery) {

            const validation = SqlSecurity.validate(playerQuery);

            if (!validation.valid) {

                return {
                    status: 'forbidden',
                    msg: validation.msg
                };
            }

            let playerResult;
            let expectedResult;

            try {

                playerResult = safeExecute(validation.query);

                expectedResult = safeExecute(expectedQuery);

            } catch (e) {

                return {
                    status: 'syntax_error',
                    msg: `Error de sintaxis: ${e.message}`,
                    data: null
                };
            }

            const isCorrect =
                JSON.stringify(normalize(playerResult)) ===
                JSON.stringify(normalize(expectedResult));

            if (isCorrect) {

                return {
                    status: 'success',
                    msg: '¡Golpe crítico! Enemigo destruido.',
                    data: playerResult
                };
            }

            return {
                status: 'logic_error',
                msg: 'La consulta funciona, pero el resultado no coincide.',
                data: playerResult
            };
        }
    };

})();

// ==========================================
// 🖥️ 5. UI SYSTEM
// ==========================================
const UI = (() => {

    function createSafeMessage(container, text, extraClass = "") {

        const span = document.createElement("span");

        span.className = extraClass;

        span.textContent = text;

        container.appendChild(span);
    }

    return {

        log: (msg, type = "normal") => {

            const box = document.getElementById("logBox");

            if (!box) return;

            const div = document.createElement("div");

            let style =
                "border-l-2 pl-3 py-1 ";

            if (type === "error") {
                style += "border-red-800 text-red-500 bg-red-900/5";
            }
            else if (type === "success") {
                style += "border-yellow-600 text-yellow-500 bg-yellow-900/5";
            }
            else if (type === "warning") {
                style += "border-purple-600 text-purple-400";
            }
            else {
                style += "border-gray-700 text-gray-400";
            }

            div.className = style;

            const time = document.createElement("span");

            time.className = "opacity-30 mr-2";

            time.textContent = `[${new Date().toLocaleTimeString()}]`;

            div.appendChild(time);

            createSafeMessage(div, ` ${msg}`);

            box.prepend(div);
        },

        render: (profile, maxHp, maxSp) => {

            const q = QUESTS[profile.questIndex] || QUESTS[QUESTS.length - 1];

            // HP
            document.getElementById("hpBar").style.width =
                `${(profile.stats.hp / maxHp) * 100}%`;

            document.getElementById("hpText").innerText =
                `${Math.floor(profile.stats.hp)}/${maxHp}`;

            // SP
            document.getElementById("spBar").style.width =
                `${(profile.stats.sp / maxSp) * 100}%`;

            document.getElementById("spText").innerText =
                `${Math.floor(profile.stats.sp)}/${maxSp}`;

            // QUEST
            document.getElementById("questName").innerText =
                `${q.boss ? '💀 ' : ''}${q.n}`;

            document.getElementById("questDesc").innerText = q.t;

            document.getElementById("questSchema").innerText = q.s;

            document.getElementById("questLevel").innerText =
                `LVL ${profile.questIndex + 1}`;

            // MAP
            const mapContainer = document.getElementById("soulMap");

            mapContainer.innerHTML = "";

            const freq = 0.7;
            const amp = 30;
            const height = 40;

            QUESTS.forEach((quest, index) => {

                const wrapper = document.createElement("div");

                wrapper.className = "node-wrapper";

                const offset = Math.sin(index * freq) * amp;

                const node = document.createElement("div");

                const statusClass =
                    index < profile.questIndex
                        ? "node-passed"
                        : (
                            index === profile.questIndex
                                ? "node-current"
                                : "node-locked"
                        );

                node.className = `soul-node ${statusClass}`;

                node.title = quest.n;

                if (quest.boss) {

                    node.classList.add("boss-node");

                    node.style.transform =
                        `translateX(${offset}px) rotate(45deg) scale(1.2)`;

                } else {

                    node.style.transform =
                        `translateX(${offset}px)`;
                }

                wrapper.appendChild(node);

                if (index < QUESTS.length - 1) {

                    const nextOffset =
                        Math.sin((index + 1) * freq) * amp;

                    const diff = nextOffset - offset;

                    const angle =
                        Math.atan2(diff, height) * (180 / Math.PI);

                    const line = document.createElement("div");

                    line.className =
                        `map-connector ${
                            index < profile.questIndex
                                ? 'bg-yellow-700'
                                : 'bg-gray-800'
                        }`;

                    line.style.height = `${height + 2}px`;

                    line.style.left =
                        `calc(50% + ${offset}px)`;

                    line.style.top = "50%";

                    line.style.transform =
                        `rotate(${-angle}deg)`;

                    wrapper.appendChild(line);
                }

                mapContainer.appendChild(wrapper);
            });

            // %
            const percent =
                Math.floor((profile.questIndex / QUESTS.length) * 100);

            document.getElementById("progressPercent").innerText =
                `${percent}%`;

            // STATS
            document.getElementById("attemptCounter").innerText =
                profile.totalAttempts;

            document.getElementById("victoryCounter").innerText =
                profile.victories;

            const accuracy =
                profile.totalAttempts === 0
                    ? 0
                    : Math.floor(
                        (profile.victories / profile.totalAttempts) * 100
                    );

            document.getElementById("accuracyCounter").innerText =
                `${accuracy}%`;

            AudioSys.updateMusic(q.boss);
        },

        shake: (id) => {

            const el = document.getElementById(id);

            if (!el) return;

            el.classList.add("shake");

            setTimeout(() => {
                el.classList.remove("shake");
            }, 500);
        }
    };

})();

// ==========================================
// ⚔️ 6. GAME ENGINE
// ==========================================
const GameEngine = (() => {

    const CLASSES = {

        warrior: {
            name: "Guerrero",
            hpBonus: 50,
            spRegen: 5,
            cost: 20
        },

        mage: {
            name: "Mago",
            hpBonus: 10,
            spRegen: 15,
            cost: 35
        }
    };

    let profile = StorageSys.load();

    function getClassData() {
        return CLASSES[profile.playerClass];
    }

    function getQuest() {
        return QUESTS[profile.questIndex];
    }

    function getMaxHp() {
        return 100 + getClassData().hpBonus;
    }

    function handleDeath() {

        UI.log("💀 HAS MUERTO. Renaciendo...", "error");

        profile.stats.hp = getMaxHp();

        profile.sessionAttempts = 0;

        StorageSys.save(profile);

        setTimeout(() => {
            location.reload();
        }, 2000);
    }

    return {

        profile,

        getQuest,

        getMaxHp,

        setClass: (cName) => {

            profile.playerClass = cName;

            profile.stats.hp = getMaxHp();

            StorageSys.save(profile);

            UI.log(`Clase seleccionada: ${getClassData().name}`);

            UI.render(profile, getMaxHp(), 100);
        },

        attack: () => {

            const input =
                document.getElementById("sqlInput").value.trim();

            const q = getQuest();

            const cData = getClassData();

            if (!input) {

                return UI.log(
                    "Tu mente está vacía. Escribe una consulta.",
                    "error"
                );
            }

            if (profile.stats.sp < cData.cost) {

                UI.shake("spBar");

                return UI.log(
                    "No tienes suficiente SP.",
                    "warning"
                );
            }

            profile.totalAttempts++;

            profile.stats.sp -= cData.cost;

            UI.log(`Ejecutando consulta SQL...`);

            const evalResult =
                SqlEvaluator.evaluate(input, q.expected);

            if (evalResult.status === 'success') {

                AudioSys.play('success', q.boss);

                UI.log(evalResult.msg, "success");

                profile.victories++;

                profile.questIndex++;

                profile.sessionAttempts = 0;

                StorageSys.save(profile);

                if (profile.questIndex >= QUESTS.length) {

                    UI.log(
                        "🎉 HAS CONQUISTADO EL ABISMO DE DATOS.",
                        "success"
                    );

                } else {

                    setTimeout(() => {

                        document.getElementById("sqlInput").value = "";

                        UI.render(profile, getMaxHp(), 100);

                    }, 1200);
                }

            } else {

                profile.sessionAttempts++;

                AudioSys.play('hit');

                UI.shake("hpBar");

                let damage = 0;

                if (evalResult.status === 'syntax_error') {

                    damage = q.boss ? 15 : 5;

                    UI.log(evalResult.msg, "error");
                }

                else if (evalResult.status === 'logic_error') {

                    damage = q.boss ? 30 : 15;

                    UI.log(evalResult.msg, "warning");

                    UI.log(
                        `Resultado parcial: ${
                            JSON.stringify(evalResult.data).substring(0, 80)
                        }`
                    );
                }

                else if (evalResult.status === 'forbidden') {

                    damage = getMaxHp();

                    UI.log(evalResult.msg, "error");
                }

                if (profile.sessionAttempts === 2) {

                    UI.log(
                        "💡 Considera usar el Oráculo.",
                        "warning"
                    );
                }

                profile.stats.hp -= damage;

                UI.log(`Has recibido ${damage} de daño.`, "error");

                if (profile.stats.hp <= 0) {
                    handleDeath();
                } else {
                    StorageSys.save(profile);
                }
            }

            UI.render(profile, getMaxHp(), 100);
        },

        regenTick: () => {

            if (profile.stats.sp < 100) {

                profile.stats.sp = Math.min(
                    100,
                    profile.stats.sp + getClassData().spRegen
                );

                UI.render(profile, getMaxHp(), 100);
            }
        }
    };

})();

// ==========================================
// 🔮 7. ORÁCULO
// ==========================================
const OracleSys = (() => {

    const MODEL = 'gemini-3.5-flash';

    return {

        ask: async () => {

            const rawKey =
                localStorage.getItem("sql_key");

            if (!rawKey) {

                return UI.log(
                    "Introduce tu API Key.",
                    "warning"
                );
            }

            const apiKey = rawKey.trim();

            if (GameEngine.profile.stats.sp < 20) {

                UI.shake("spBar");

                return UI.log(
                    "No tienes suficiente SP.",
                    "error"
                );
            }

            UI.log("Invocando al Oráculo...");

            GameEngine.profile.stats.sp -= 20;

            const q = GameEngine.getQuest();

            const playerCode =
                document.getElementById("sqlInput").value.trim();

            const promptText = `
Eres el Oráculo de SQL Souls.

Misión:
${q.n}

Objetivo:
${q.t}

Tablas:
${q.s}

Código actual del jugador:
${playerCode || 'Ninguno'}

Da una pista útil y críptica.
NO des la solución completa.
`;

            const url =
                `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

            try {

                const controller = new AbortController();

                const timeoutId =
                    setTimeout(() => controller.abort(), 8000);

                const response = await fetch(url, {

                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    signal: controller.signal,

                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: promptText
                                    }
                                ]
                            }
                        ]
                    })
                });

                clearTimeout(timeoutId);

                if (!response.ok) {

                    const errorData =
                        await response.json();

                    throw new Error(
                        errorData.error?.message ||
                        "Fallo en la conexión astral."
                    );
                }

                const data = await response.json();

                const text =
                    data.candidates?.[0]?.content?.parts?.[0]?.text
                    || "El Oráculo guarda silencio.";

                UI.log(`👁️ ${text}`, "warning");

            } catch (error) {

                if (error.name === 'AbortError') {

                    UI.log(
                        "El Oráculo tardó demasiado.",
                        "error"
                    );

                } else {

                    UI.log(
                        `El Oráculo falló: ${error.message}`,
                        "error"
                    );
                }

                GameEngine.profile.stats.sp += 20;
            }

            UI.render(
                GameEngine.profile,
                GameEngine.getMaxHp(),
                100
            );
        }
    };

})();

// ==========================================
// 🚀 8. BOOTSTRAP
// ==========================================
window.onload = () => {

    if (typeof initDatabase === "function") {
        initDatabase();
    }

    const apiKeyInput =
        document.getElementById("apiKey");

    if (localStorage.getItem("sql_key")) {

        apiKeyInput.value =
            localStorage.getItem("sql_key");
    }

    apiKeyInput.addEventListener("change", e => {

        localStorage.setItem(
            "sql_key",
            e.target.value
        );

        UI.log("🔑 Llave guardada.");
    });

    GameEngine.profile.stats.hp =
        GameEngine.getMaxHp();

    UI.render(
        GameEngine.profile,
        GameEngine.getMaxHp(),
        100
    );

    setInterval(GameEngine.regenTick, 1000);
};
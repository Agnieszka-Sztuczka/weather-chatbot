/* ============================================================
   WEATHERSTYLE AI — script.js
============================================================ */

// ============================================================
// KONFIGURACJA GLOBALNA
// ============================================================
var API_KEY     = "0e7f3a1deee1352c39fc38be74f815f1"; // ← mój klucz API z openweathermap.org
var API_URL     = "https://api.openweathermap.org/data/2.5/weather";
var BOT_DELAY   = 1200;
var chatHistory = [];
var isTyping    = false;

// ============================================================
// START — po załadowaniu strony
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    // Enter w polu tekstowym
    var input = document.getElementById("user-input");
    if (input) {
        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter") sendMessage();
        });
    }

    // Enter w polu miasta
    var cityInput = document.getElementById("city-input");
    if (cityInput) {
        cityInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") fetchWeatherByCity();
            if (e.key === "Escape") closeModal();
        });
    }

    // Przywróć dark mode
    if (localStorage.getItem("wb_dark") === "light") {
        document.body.classList.add("light-mode");
        var btn = document.getElementById("dark-mode-btn");
        if (btn) btn.textContent = "☀️ Light";
    }

    // Załaduj historię czatu
    loadHistory();

    // Powitanie (tylko jeśli brak historii)
    if (chatHistory.length === 0) {
        setTimeout(function() {
            addBotMessage("👋 Cześć! Jestem WeatherStyle AI.\n\nOpisz mi pogodę, a dobiorę dla Ciebie idealny strój!\n\nPrzykład: \"Jest 7 stopni i pada deszcz\" 🌧️");
        }, 500);
    }
});

// ============================================================
// FUNKCJA WYSYŁANIA — GLOBALNA
// ============================================================
function sendMessage() {
    var input    = document.getElementById("user-input");
    var userText = input.value.trim();

    if (!userText || isTyping) return;

    input.value = "";
    addUserMessage(userText);
    showTyping();

    setTimeout(function() {
        hideTyping();
        var response = getBotResponse(userText.toLowerCase());
        addBotMessage(response);
    }, BOT_DELAY);
}

// ============================================================
// SZYBKIE SUGESTIE — GLOBALNA
// ============================================================
function quickMessage(text) {
    var input = document.getElementById("user-input");
    input.value = text;
    sendMessage();
}

// ============================================================
// MODAL MIASTA — GLOBALNE
// ============================================================
function openCityModal() {
    var modal = document.getElementById("city-modal");
    if (modal) {
        modal.style.display = "flex";
        setTimeout(function() {
            var ci = document.getElementById("city-input");
            if (ci) ci.focus();
        }, 100);
    }
}

function closeModal() {
    var modal = document.getElementById("city-modal");
    if (modal) modal.style.display = "none";
    var ci = document.getElementById("city-input");
    if (ci) ci.value = "";
}

// ============================================================
// POBIERANIE POGODY Z API — GLOBALNA
// ============================================================
function fetchWeatherByCity() {
    var cityInput = document.getElementById("city-input");
    var city      = cityInput ? cityInput.value.trim() : "";

    if (!city) {
        alert("Wpisz nazwę miasta!");
        return;
    }

    closeModal();
    addUserMessage("Sprawdź pogodę dla: " + city);
    showTyping();

    // Brak klucza API
    if (!API_KEY || API_KEY === "TWOJ_KLUCZ_API") {
        setTimeout(function() {
            hideTyping();
            addBotMessage(
                "⚠️ Brak klucza API!\n\n" +
                "Aby pobrać pogodę dla " + city + ":\n" +
                "1. Zarejestruj się na openweathermap.org\n" +
                "2. Skopiuj klucz API\n" +
                "3. Wklej go w script.js: API_KEY = \"twoj_klucz\"\n\n" +
                "Na razie opisz pogodę słowami, np:\n\"Jest 15 stopni i świeci słońce\" ☀️"
            );
        }, 1000);
        return;
    }

    // Faktyczne zapytanie do API
    var url = API_URL + "?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=pl";

    fetch(url)
        .then(function(res) { return res.json(); })
        .then(function(data) {
            hideTyping();

            if (data.cod !== 200) {
                if (data.cod === 401) {
                    addBotMessage("❌ Błędny klucz API. Sprawdź klucz w pliku script.js.");
                } else if (data.cod === "404") {
                    addBotMessage("❌ Nie znaleziono miasta: " + city + ". Sprawdź pisownię!");
                } else {
                    addBotMessage("❌ Błąd API: " + (data.message || "nieznany błąd"));
                }
                return;
            }

            var temp      = Math.round(data.main.temp);
            var feels     = Math.round(data.main.feels_like);
            var humidity  = data.main.humidity;
            var desc      = data.weather[0].description;
            var wind      = Math.round(data.wind.speed * 3.6);
            var cityName  = data.name;
            var country   = data.sys.country;
            var weatherId = data.weather[0].id;
            var conditions = getConditionsFromId(weatherId, temp);

            // Aktualizuj widget
            updateWidget(temp, getTempEmoji(temp));

            var header =
                "🌍 " + cityName + ", " + country + "\n\n" +
                "🌡️ Temperatura: " + temp + "°C (odczuwalna: " + feels + "°C)\n" +
                "💧 Wilgotność: " + humidity + "%\n" +
                "💨 Wiatr: " + wind + " km/h\n" +
                "☁️ Opis: " + capitalizeFirst(desc) + "\n\n";

            addBotMessage(header + buildRecommendation(temp, conditions));
        })
        .catch(function(err) {
            hideTyping();
            console.error(err);
            addBotMessage("❌ Błąd połączenia z API. Sprawdź połączenie internetowe.");
        });
}

// ============================================================
// DARK MODE — GLOBALNA
// ============================================================
function toggleDarkMode() {
    document.body.classList.toggle("light-mode");
    var isLight = document.body.classList.contains("light-mode");
    var btn = document.getElementById("dark-mode-btn");
    if (btn) btn.textContent = isLight ? "☀️ Light" : "🌙 Dark";
    localStorage.setItem("wb_dark", isLight ? "light" : "dark");
}

// ============================================================
// WYCZYŚĆ CZAT — GLOBALNA
// ============================================================
function clearChat() {
    var chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";
    chatHistory = [];
    localStorage.removeItem("wb_history");

    var sep = document.createElement("div");
    sep.className   = "session-separator";
    sep.textContent = "— Czat wyczyszczony —";
    chatBox.appendChild(sep);

    setTimeout(function() {
        addBotMessage("Gotowe! 🗑️ Zaczynamy od nowa. Opisz mi pogodę! ☀️");
    }, 300);
}

// ============================================================
// LOGIKA BOTA
// ============================================================
function getBotResponse(input) {
    // Pozdrowienia
    var greetings = ["cześć", "hej", "helo", "hi", "hello", "siema", "dzień dobry", "dobry", "yo"];
    for (var i = 0; i < greetings.length; i++) {
        if (input.includes(greetings[i])) {
            return "Cześć! 👋 Opisz mi pogodę i dobiorę strój!\n\nNp: \"Jest 15 stopni i pada deszcz\" 🌧️";
        }
    }

    // Pomoc
    var helpWords = ["pomoc", "help", "co umiesz", "jak działasz", "instrukcja"];
    for (var j = 0; j < helpWords.length; j++) {
        if (input.includes(helpWords[j])) {
            return "🤖 Co potrafię:\n\n• Analizuję temperaturę i warunki\n• Rekomenduje strój, dodatki i ochronę\n• Pobieram pogodę dla miast (wymaga API)\n\nPrzykłady:\n• \"Jest minus 10 i śnieg\"\n• \"Słonecznie, 28 stopni\"\n• \"Wietrzno, 12 stopni i deszcz\"";
        }
    }

    // Wyodrębnij temperaturę i warunki
    var temp       = extractTemperature(input);
    var conditions = detectConditions(input);

    if (temp === null && conditions.length === 0) {
        return "Hmm, nie zrozumiałem. 🤔\n\nOpisz pogodę, np:\n\"Jest 10 stopni i pada deszcz\"\n\"Słonecznie 25 stopni\"\n\"Minus 5 i śnieg\" ❄️";
    }

    return buildRecommendation(temp, conditions);
}

// ============================================================
// PARSOWANIE TEMPERATURY
// ============================================================
function extractTemperature(input) {
    var patterns = [
        { regex: /minus\s+(\d+)/i,          negate: true  },
        { regex: /(-\d+)\s*stopni/i,         negate: false },
        { regex: /(-\d+)\s*°/i,              negate: false },
        { regex: /plus\s+(\d+)/i,            negate: false },
        { regex: /(\d+)\s*stopni/i,          negate: false },
        { regex: /(\d+)\s*°/i,               negate: false },
        { regex: /temperatura\s*:?\s*(-?\d+)/i, negate: false },
        { regex: /(\d+)\s*degrees?/i,        negate: false },
        { regex: /^(-?\d+)\b/,              negate: false }
    ];

    for (var i = 0; i < patterns.length; i++) {
        var match = input.match(patterns[i].regex);
        if (match) {
            var t = parseInt(match[1]);
            if (patterns[i].negate && t > 0) t = -t;
            return t;
        }
    }
    return null;
}

// ============================================================
// WYKRYWANIE WARUNKÓW POGODOWYCH
// ============================================================
function detectConditions(input) {
    var condMap = {
        rain:  ["deszcz", "pada", "rain", "mokro", "mżawka", "ulewa", "kapie"],
        snow:  ["śnieg", "śnieży", "snow", "zadymka", "zawieja"],
        sun:   ["słońce", "słonecznie", "sunny", "bezchmurnie", "pogodnie"],
        wind:  ["wiatr", "wietrzno", "windy", "wieje", "podmuchy"],
        fog:   ["mgła", "mglisty", "fog", "foggy"],
        cloud: ["chmury", "pochmurno", "cloudy", "szaro", "zachmurzenie"],
        storm: ["burza", "storm", "grzmot", "piorun", "błyskawica"],
        heat:  ["upał", "gorąco", "hot", "skwar"],
        frost: ["mróz", "szron", "lód", "ślisko", "gołoledź"]
    };

    var found = [];
    for (var condition in condMap) {
        var keywords = condMap[condition];
        for (var i = 0; i < keywords.length; i++) {
            if (input.includes(keywords[i])) {
                found.push(condition);
                break;
            }
        }
    }
    return found;
}

// ============================================================
// BUDOWANIE REKOMENDACJI
// ============================================================
function buildRecommendation(temp, conditions) {
    var out = "";

    if (temp !== null) {
        out += getTempEmoji(temp) + " Temperatura: " + temp + "°C\n\n";
    }

    if (conditions.length > 0) {
        var condNames = conditions.map(function(c) {
            return getConditionEmoji(c) + " " + getConditionName(c);
        });
        out += "Warunki: " + condNames.join("  ") + "\n\n";
    }

    out += "🧥 Rekomendacja ubioru:\n\n";
    out += getBaseClothing(temp, conditions);

    var extra = getConditionClothing(conditions);
    if (extra) out += "\n\n" + extra;

    out += "\n\n💡 Porada: " + getStyleTip(temp, conditions);

    var warn = getWarning(temp, conditions);
    if (warn) out += "\n\n⚠️ " + warn;

    return out;
}

// ============================================================
// UBIÓR BAZOWY (wg temperatury)
// ============================================================
function getBaseClothing(temp, conditions) {
    if (temp === null) {
        return "Opisz temperaturę, np. \"Jest 15 stopni\", a dopasuję ubiór!";
    }

    if (temp <= -15) return (
        "• 🧥 Gruba kurtka puchowa — koniecznie!\n" +
        "• 👕 Bielizna termoaktywna (warstwa bazowa)\n" +
        "• 🧣 Gruby szalik\n" +
        "• 🧤 Rękawiczki ocieplane\n" +
        "• 🎿 Czapka narciarska\n" +
        "• 👖 Spodnie ocieplane\n" +
        "• 👢 Buty zimowe z futrem\n" +
        "• 🧦 Skarpety termoaktywne (2 pary!)"
    );
    if (temp <= -5) return (
        "• 🧥 Kurtka zimowa z ociepleniem\n" +
        "• 🧣 Szalik\n" +
        "• 🧤 Ciepłe rękawiczki\n" +
        "• 🎿 Czapka zimowa\n" +
        "• 👖 Ocieplane spodnie\n" +
        "• 👢 Buty zimowe\n" +
        "• 🧦 Grube skarpety\n" +
        "• 👕 Sweter lub bluza pod spodem"
    );
    if (temp <= 5) return (
        "• 🧥 Kurtka zimowa\n" +
        "• 🧣 Szalik\n" +
        "• 🧤 Rękawiczki\n" +
        "• 🎿 Czapka\n" +
        "• 👖 Grubsze jeansy\n" +
        "• 👟 Zamknięte, solidne buty\n" +
        "• 👕 Sweter pod spodem"
    );
    if (temp <= 10) return (
        "• 🧥 Ciepła kurtka lub płaszcz\n" +
        "• 🧣 Lżejszy szalik\n" +
        "• 👖 Jeansy lub spodnie\n" +
        "• 👟 Zamknięte buty\n" +
        "• 👕 Sweter lub gruba bluza"
    );
    if (temp <= 15) return (
        "• 🧥 Lekka kurtka lub gruby kardigan\n" +
        "• 👖 Jeansy\n" +
        "• 👟 Buty sportowe\n" +
        "• 👕 Bluza lub koszula z długim rękawem"
    );
    if (temp <= 20) return (
        "• 🧥 Cienka kurtka lub sweter\n" +
        "• 👖 Jeansy lub chinos\n" +
        "• 👟 Sneakersy\n" +
        "• 👕 Koszulka z długim rękawem"
    );
    if (temp <= 25) return (
        "• 👕 T-shirt lub lekka koszula\n" +
        "• 👖 Lekkie spodnie lub spodenki\n" +
        "• 👟 Sneakersy lub sandały\n" +
        "• Lekka narzutka wieczorami"
    );
    if (temp <= 30) return (
        "• 👕 T-shirt — lekkie materiały\n" +
        "• 🩳 Krótkie spodenki lub letnia spódnica\n" +
        "• 👡 Sandały\n" +
        "• Jasne, przewiewne kolory"
    );
    return (
        "• 👕 Lekka bawełniana koszulka\n" +
        "• 🩳 Krótkie spodenki\n" +
        "• 👡 Sandały lub klapki\n" +
        "• 🧴 Krem z filtrem SPF 50+\n" +
        "• Pij dużo wody! 💧"
    );
}

// ============================================================
// DODATKOWY UBIÓR (wg warunków)
// ============================================================
function getConditionClothing(conditions) {
    var parts = [];

    if (conditions.includes("rain"))
        parts.push("🌧️ Na deszcz:\n• ☂️ Parasol lub peleryna\n• 🥾 Wodoodporne buty\n• Kurtka przeciwdeszczowa");

    if (conditions.includes("snow"))
        parts.push("❄️ Na śnieg:\n• 🥾 Śniegowce z antypoślizgową podeszwą\n• Wodoodporna kurtka\n• Grube rękawiczki");

    if (conditions.includes("sun"))
        parts.push("☀️ Na słońce:\n• 🕶️ Okulary przeciwsłoneczne\n• 🧢 Czapka z daszkiem lub kapelusz\n• 🧴 Krem SPF 30-50");

    if (conditions.includes("wind"))
        parts.push("💨 Na wiatr:\n• Kurtka wiatroszczelna\n• Szalik lub chusta\n• Dobrze dopasowana czapka");

    if (conditions.includes("storm"))
        parts.push("⛈️ Burza:\n• Unikaj otwartych przestrzeni!\n• Mocny parasol lub peleryna\n• Buty wodoodporne");

    if (conditions.includes("frost"))
        parts.push("🧊 Mróz/Gołoledź:\n• Buty z antypoślizgową podeszwą\n• Ostrożny chód!\n• Grube rękawiczki");

    return parts.join("\n\n");
}

// ============================================================
// PORADY I OSTRZEŻENIA
// ============================================================
function getStyleTip(temp, conditions) {
    if (conditions.includes("rain")) return "Impregnacja butów i kurtki to must-have na deszczowy sezon!";
    if (temp !== null && temp < 0)   return "Warstwowość to klucz! Kilka cienkich warstw zatrzyma ciepło lepiej niż jedna gruba.";
    if (temp !== null && temp < 10)  return "Pamiętaj — przez głowę tracimy dużo ciepła. Czapka to podstawa!";
    if (temp !== null && temp > 25)  return "Len i bawełna to Twoi sprzymierzeńcy — oddychają i odprowadzają wilgoć.";
    if (temp !== null && temp > 20)  return "Jasne kolory odbijają słońce. Wybierz przewiewny krój!";
    return "Klasyczne połączenie: jeansy + bluza to zawsze dobry wybór na umiarkowaną pogodę.";
}

function getWarning(temp, conditions) {
    if (temp !== null && temp <= -20) return "EKSTREMALNY MRÓZ! Ogranicz czas na zewnątrz do minimum!";
    if (temp !== null && temp >= 36)  return "FALA UPAŁÓW! Unikaj słońca 11-15, pij min. 2L wody!";
    if (conditions.includes("storm")) return "Burza! Unikaj otwartych przestrzeni, drzew i metalowych obiektów!";
    return null;
}

// ============================================================
// EMOJI I NAZWY
// ============================================================
function getTempEmoji(t) {
    if (t <= -10) return "🥶";
    if (t <= 0)   return "❄️";
    if (t <= 10)  return "🌨️";
    if (t <= 15)  return "🌤️";
    if (t <= 22)  return "⛅";
    if (t <= 28)  return "🌞";
    if (t <= 33)  return "☀️";
    return "🔥";
}

function getConditionEmoji(c) {
    var map = {
        rain: "🌧️", snow: "❄️", sun: "☀️", wind: "💨",
        fog: "🌫️", cloud: "☁️", storm: "⛈️", heat: "🔥", frost: "🧊"
    };
    return map[c] || "🌡️";
}

function getConditionName(c) {
    var map = {
        rain: "deszcz", snow: "śnieg", sun: "słońce",
        wind: "wiatr", fog: "mgła", cloud: "pochmurno",
        storm: "burza", heat: "upał", frost: "mróz"
    };
    return map[c] || c;
}

function getConditionsFromId(id, temp) {
    var c = [];
    if (id >= 200 && id < 300) c.push("storm");
    if (id >= 300 && id < 600) c.push("rain");
    if (id >= 600 && id < 700) c.push("snow");
    if (id >= 700 && id < 800) c.push("fog");
    if (id === 800)             c.push("sun");
    if (id > 800)               c.push("cloud");
    if (temp > 30)              c.push("heat");
    if (temp < -5)              c.push("frost");
    return c;
}

// ============================================================
// WYŚWIETLANIE WIADOMOŚCI
// ============================================================
function addUserMessage(text) {
    var chatBox = document.getElementById("chat-box");
    var wrapper = document.createElement("div");
    wrapper.className = "message-wrapper user-wrapper user-message";

    var avatar = document.createElement("div");
    avatar.className = "message-avatar user";
    avatar.textContent = "👤";

    var inner = document.createElement("div");

    var bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;

    var timeEl = document.createElement("div");
    timeEl.className = "message-time";
    timeEl.textContent = getTime();

    inner.appendChild(bubble);
    inner.appendChild(timeEl);
    wrapper.appendChild(avatar);
    wrapper.appendChild(inner);
    chatBox.appendChild(wrapper);

    chatHistory.push({ text: text, sender: "user", time: getTime() });
    saveHistory();
    scrollDown();
}

function addBotMessage(text) {
    var chatBox = document.getElementById("chat-box");
    var wrapper = document.createElement("div");
    wrapper.className = "message-wrapper bot-wrapper bot-message";

    var avatar = document.createElement("div");
    avatar.className = "message-avatar bot";
    avatar.textContent = "🤖";

    var inner = document.createElement("div");

    var bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.innerHTML = formatText(text);

    var timeEl = document.createElement("div");
    timeEl.className = "message-time";
    timeEl.textContent = getTime();

    inner.appendChild(bubble);
    inner.appendChild(timeEl);
    wrapper.appendChild(avatar);
    wrapper.appendChild(inner);
    chatBox.appendChild(wrapper);

    chatHistory.push({ text: text, sender: "bot", time: getTime() });
    saveHistory();
    scrollDown();
}

function formatText(text) {
    // Zamieniamy \n na <br> — bezpiecznie
    return text.replace(/&/g,"&amp;")
               .replace(/</g,"&lt;")
               .replace(/>/g,"&gt;")
               .replace(/\n/g,"<br>");
}

// ============================================================
// TYPING INDICATOR
// ============================================================
function showTyping() {
    isTyping = true;
    var ti = document.getElementById("typing-indicator");
    if (ti) ti.style.display = "flex";
    var st = document.getElementById("bot-status-text");
    if (st) st.textContent = "Pisze...";
    scrollDown();
}

function hideTyping() {
    isTyping = false;
    var ti = document.getElementById("typing-indicator");
    if (ti) ti.style.display = "none";
    var st = document.getElementById("bot-status-text");
    if (st) st.textContent = "Online — gotowy do pomocy";
}

// ============================================================
// WIDGET POGODOWY
// ============================================================
function updateWidget(temp, emoji) {
    var w = document.getElementById("weather-widget");
    var wt = document.getElementById("widget-temp");
    var wi = document.getElementById("widget-icon");
    if (w && wt && wi) {
        wt.textContent = temp + "°C";
        wi.textContent = emoji;
        w.style.display = "flex";
    }
}

// ============================================================
// LOCAL STORAGE
// ============================================================
function saveHistory() {
    try {
        var toSave = chatHistory.slice(-50);
        localStorage.setItem("wb_history", JSON.stringify(toSave));
    } catch(e) {
        console.warn("Błąd zapisu historii:", e);
    }
}

function loadHistory() {
    try {
        var raw = localStorage.getItem("wb_history");
        if (!raw) return;
        var history = JSON.parse(raw);
        if (!Array.isArray(history) || history.length === 0) return;

        chatHistory = history;

        history.forEach(function(item) {
            if (item.sender === "user") {
                addUserMessageFromHistory(item.text, item.time);
            } else {
                addBotMessageFromHistory(item.text, item.time);
            }
        });

        var sep = document.createElement("div");
        sep.className = "session-separator";
        sep.textContent = "📚 Poprzednia sesja (" + history.length + " wiadomości)";
        document.getElementById("chat-box").appendChild(sep);
        scrollDown();

        // Zresetuj tablicę — addUserMessageFromHistory duplikuje
        chatHistory = history;
        saveHistory();

    } catch(e) {
        console.warn("Błąd ładowania historii:", e);
    }
}

function addUserMessageFromHistory(text, time) {
    var chatBox = document.getElementById("chat-box");
    var wrapper = document.createElement("div");
    wrapper.className = "message-wrapper user-wrapper user-message";
    wrapper.innerHTML =
        '<div class="message-avatar user">👤</div>' +
        '<div><div class="message-bubble">' + escapeHTML(text) + '</div>' +
        '<div class="message-time">' + time + '</div></div>';
    chatBox.appendChild(wrapper);
}

function addBotMessageFromHistory(text, time) {
    var chatBox = document.getElementById("chat-box");
    var wrapper = document.createElement("div");
    wrapper.className = "message-wrapper bot-wrapper bot-message";
    wrapper.innerHTML =
        '<div class="message-avatar bot">🤖</div>' +
        '<div><div class="message-bubble">' + formatText(text) + '</div>' +
        '<div class="message-time">' + time + '</div></div>';
    chatBox.appendChild(wrapper);
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// ============================================================
// NARZĘDZIA
// ============================================================
function scrollDown() {
    setTimeout(function() {
        var cb = document.getElementById("chat-box");
        if (cb) cb.scrollTop = cb.scrollHeight;
    }, 80);
}

function getTime() {
    return new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function capitalizeFirst(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

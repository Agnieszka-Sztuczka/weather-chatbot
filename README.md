# WeatherStyle AI — Bot Doradcy Ubioru

Inteligentny chatbot webowy, który analizuje pogodę i rekomenduje odpowiedni strój.

## Demo
[Link do projektu na GitHub Pages](https://agnieszka-sztuczka.github.io/weather-chatbot/)

## Screenshoty
> *Zrzuty ekranu dostępne po uruchomieniu aplikacji*

## Technologie
- HTML5 (semantyczny, dostępny)
- CSS3 (glassmorphism, animacje, responsywność)
- JavaScript — Vanilla JS (bez frameworków)
- OpenWeatherMap API
- LocalStorage (historia czatu)
- Fetch API
- PWA (Progressive Web App — manifest.json)

## Struktura projektu

```
weather-chatbot/
│
├── index.html            # struktura strony
├── style.css             # wygląd i animacje
├── script.js             # logika i API
├── manifest.json         # konfiguracja PWA
│
├── assets/
│   ├── bot.png           # ikona chatbota
│   └── background.jpg    # tło aplikacji
│
└── README.md             # dokumentacja
```

## Uruchomienie lokalne
1. Pobierz repozytorium: `git clone https://github.com/agnieszka-sztuczka/weather-chatbot`
2. Otwórz folder: `cd weather-chatbot`
3. Otwórz plik `index.html` w przeglądarce

## Konfiguracja API
1. Zarejestruj się na [openweathermap.org](https://openweathermap.org)
2. Skopiuj swój klucz API
3. W pliku `script.js` znajdź: `API_KEY: "TWOJ_KLUCZ_API"`
4. Zastąp `TWOJ_KLUCZ_API` swoim kluczem

## Funkcje
-  Pobieranie pogody w czasie rzeczywistym
-  Rekomendacje stroju na podstawie temperatury
-  Historia rozmów (LocalStorage)
-  Responsywny design (mobile-friendly)
-  Instalacja jako PWA

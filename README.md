Voglio costruire un sistema completo di previsione meteo orientato alla logistica (previsione ritardi consegne) utilizzando dati reali provenienti da una stazione meteo Davis tramite WeatherLink API v2.

## ⚙️ CONTESTO TECNICO

* I dati arrivano dalla WeatherLink API v2 (endpoint REST JSON)
* L'API fornisce dati meteo grezzi (temperatura, umidità, vento, pioggia, timestamp) WeatherLink API v2
* L’API è progettata per fornire dati raw, NON analisi, quindi devo costruire io tutto il sistema ([Manula][1])
* Le richieste sono HTTP GET con autenticazione tramite API key e secret ([dltHub][2])

---

## 🎯 OBIETTIVO

Costruire una piattaforma SaaS per:

* prevedere ritardi nelle consegne
* analizzare impatto meteo su logistica
* fornire dashboard e API per aziende

---

## 🧱 ARCHITETTURA RICHIESTA

Progetta un sistema completo diviso in:

### 1. DATA INGESTION

* Linguaggio: Python
* Librerie: requests / axios
* Funzione:

  * chiamare API ogni X minuti
  * parsare JSON (sensori)
  * normalizzare dati
  * salvare su database

Richiedo:

* esempio codice fetch API
* gestione autenticazione
* gestione errori API

---

### 2. DATABASE

* Database: MongoDB

Richiedo:

* schema completo per:

  * weather_raw
  * weather_features
  * predictions
* esempio query MongoDB
* strategia indexing (performance)

---

### 3. BACKEND API

* Framework: FastAPI

Deve:

* esporre endpoint:

  * /weather/current
  * /weather/history
  * /prediction
* collegarsi a MongoDB
* restituire dati per frontend

Richiedo:

* struttura cartelle backend
* esempio endpoint completo
* gestione async

---

### 4. MACHINE LEARNING (CORE)

* Libreria: scikit-learn

Obiettivo:

* prevedere rischio ritardo (0–1)

Richiedo:

* feature engineering:

  * meteo attuale
  * trend ultime ore
  * orario
* modello:

  * RandomForest
* esempio training
* esempio predizione

---

### 5. FRONTEND DASHBOARD

* Framework: React

Deve includere:

* dashboard meteo
* rischio ritardo (UI semplice)
* grafici storici

Richiedo:

* struttura progetto frontend
* componenti principali
* chiamata API backend

---

### 6. INTEGRAZIONE COMPLETA

Spiega come collegare tutto:

* ingestion → MongoDB
* backend → MongoDB
* AI → backend
* frontend → backend

Richiedo:

* schema flusso dati
* esempio reale end-to-end

---

### 7. DEPLOYMENT

* Docker
* possibile cloud (AWS / VPS)

Richiedo:

* docker-compose base
* come deployare tutto

---

## ⚠️ VINCOLI IMPORTANTI

* codice reale (non teoria)
* struttura modulare
* pensato per scalare (SaaS)
* spiegazioni semplici ma tecniche

---

## 🎯 OUTPUT ATTESO

* architettura completa
* codice base funzionante
* flusso dati chiaro
* pronto per essere sviluppato step-by-step

[1]: https://www.manula.com/manuals/pws/davis-kb/1/en/topic/v2-api-data-access-by-programs?utm_source=chatgpt.com "8.11. v2 API data access by programs"
[2]: https://dlthub.com/context/source/weatherlink?utm_source=chatgpt.com "WeatherLink Python API Docs"

# ITSphere · Spazio Origine

Demo interattiva con **Three.js + Vite**: una reception 3D navigabile ispirata all'immagine di riferimento fornita per il progetto, con insegna **Spazio Origine**, scenario VIP e feedback formativo.

> **Stato:** prototipo dimostrativo, non digital twin fotogrammetrico della reception. Le geometrie sono costruite con primitive 3D e materiali procedurali. Le decisioni sono valutate da regole predefinite: **non è integrata un'intelligenza artificiale adattiva** e non sono caricati dati PwC/Open Data.

## Funzioni

- Lobby 3D navigabile: piano in pietra, reception con retrobanco e insegna **Spazio Origine**, illuminazione calda, finestre, divanetti e figure stilizzate.
- Camera libera tramite mouse, rotella e tasti **WASD** / frecce.
- Scenario **Ospite VIP: camera non pronta** con tre scelte.
- Effetti illustrativi delle decisioni su soddisfazione, costi ed efficienza.
- Debriefing formativo e possibilità di riprovare.
- Contatore tentativi salvato solo nel browser (`localStorage`).
- Interfaccia responsive (desktop e mobile).

## Installazione locale

Prerequisiti: Node.js 20.19+ o 22.12+; npm.

```bash
npm install
npm run dev
```

Apri l'indirizzo indicato dal terminale (di solito http://localhost:5173).

Per verificare la build:

```bash
npm run build
npm run preview
```

## Pubblicazione su GitHub Pages

1. Crea un repository GitHub (es. `itsphere-spazio-origine`).
2. Carica **tutti i file sorgente del progetto**, inclusa la cartella `.github`, escludendo `node_modules` e `dist`.
3. Imposta il branch principale su `main`.
4. In GitHub, apri **Settings → Pages → Build and deployment → Source** e scegli **GitHub Actions**.
5. Esegui un commit sul branch `main`. Il workflow pubblicherà il sito.
6. Apri `https://TUO-USERNAME.github.io/itsphere-spazio-origine/` (con il nome effettivo del repository).

Il file `vite.config.js` usa `base: './'` per supportare i percorsi relativi di GitHub Pages.

Da terminale (se Git è configurato):

```bash
git init
git add .
git commit -m "Initial ITSphere Spazio Origine demo"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/itsphere-spazio-origine.git
git push -u origin main
```

## Come personalizzare

| File | Contenuto |
| --- | --- |
| `src/scene.js` | Modello 3D, camera, arredi, luci e insegna Spazio Origine |
| `src/scenario.js` | Opzioni, conseguenze, punteggi illustrativi, debriefing |
| `src/main.js` | Logica interattiva e persistenza dei tentativi |
| `src/style.css` | Palette, layout responsive e UI |
| `index.html` | Struttura HTML e testi di presentazione |
| `.github/workflows/deploy.yml` | Deployment automatico |

Per una replica architettonica fedele alla foto serviranno misure, fotografie aggiuntive o un modello 3D GLB/GLTF. Un'immagine singola non consente di ricavare geometrie e materiali esatti.

## Estensioni previste (non incluse)

- Import di modello architettonico GLB/GLTF di Spazio Origine.
- Avatar 3D animati e dialoghi vocali.
- Più scenari e ruoli (Concierge, Booking, Revenue Manager).
- Motore AI adattivo con backend e privacy-by-design.
- Dataset reali Open Data e flussi professionali PwC (solo con dati e permessi effettivi).
- Dashboard docente, tracciamento competenze e valutazione degli utenti.

## Privacy e licenze

La demo non invia dati a server applicativi e non richiede credenziali. Carica la libreria Three.js tramite le dipendenze del progetto. Aggiungi al repository solo fotografie, marchi e risorse per cui disponi dei diritti necessari.

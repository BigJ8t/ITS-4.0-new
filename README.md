# ITSphere — Spazio Origine · Hospitality Decision Simulator

**Allenarsi a decidere. Imparare dalle proprie scelte.**

Applicazione dimostrativa Three.js/Vite sviluppata nell'ambito di ITS 4.0 per simulare decisioni nel settore turistico-alberghiero.

## Funzionalità implementate

- Reception tridimensionale **Spazio Origine**, ricostruzione illustrativa ispirata a una fotografia reale, non un rilievo architettonico.
- **Due avatar distinti** in formato GLB con corpi riggati, capelli e abiti (receptionist e ospite). Sono modelli 3D sintetici: non sono scansioni fotorealistiche né riproduzioni di persone reali.
- Scena esplorabile con mouse, zoom, touch e tastiera WASD.
- Scenario *Ospite VIP: camera non pronta*, tre decisioni alternative, conseguenze illustrative e debriefing.
- **UDL (Universal Design for Learning):** opzione per testo grande, alto contrasto, riduzione del movimento, versione semplificata dei testi, interazione solo testuale, trascrizione sempre disponibile e lettura vocale su richiesta.
- **ADL / apprendimento adattivo basato su regole:** livelli guidato, autonomo, esperto; suggerimenti e supporti che variano per livello e numero di tentativi. Non si tratta di AI adattiva addestrata.
- **Multilingua:** italiano, inglese e spagnolo per le istruzioni, le scelte e i feedback.
- **Narratore vocale:** sintesi vocale Web Speech API del browser, su attivazione dell'utente, con lingua selezionata. La qualità dipende dalle voci installate; **non è una voce AI generativa con backend**.
- Tentativi salvati localmente nel browser (nessun account o valutazione individuale persistente su server).

## Avvio in locale

Richiede Node.js 22 e npm.

```bash
npm install
npm run assets
npm run dev
```

Aprire l'URL indicato da Vite. Il download degli asset 3D avviene una volta sola e richiede Internet.

### Compilazione

```bash
npm run build
npm run preview
```

Il comando `build` esegue automaticamente il download degli asset, se non già presenti.

### GitHub Pages

Il workflow `.github/workflows/deploy.yml` si avvia ai push sul branch `main`, scarica gli asset compatibili, costruisce `dist/` e pubblica tramite GitHub Actions.

Sito: https://bigj8t.github.io/ITS-4.0-new/

## Licenze e provenienza asset

I modelli umani e l'abbigliamento provengono dai file compilati del progetto open-source **CharacterCreator**, basati su asset MakeHuman e contenuti CC0, secondo il [registro delle licenze del progetto originale](https://github.com/kblood/CharacterCreator). I file sono scaricati da un commit fissato, durante la build, per migliorare riproducibilità e trasparenza.

La procedura di download è in `scripts/fetch-assets.mjs`. Il codice di integrazione di ITSphere è indipendente dal codice GPL dell'editor CharacterCreator.

In versioni precedenti era utilizzato un modello dimostrativo CesiumMan di Khronos/Cesium (CC BY 4.0), ora sostituito nella scena.

## Stato e limiti

Questa è una **demo tecnica e formativa**, non un prodotto validato scientificamente. I punteggi di soddisfazione/costi/efficienza sono indicatori didattici illustrativi e non misure reali di performance.

Integrazioni future: un servizio backend con gestione sicura delle credenziali per la generazione narrativa AI, tutoraggio più avanzato, analytics per docenti, verifica UDL con utenti e analisi Open Data/PwC quando effettivamente disponibili.

## Attenzione privacy

La sintesi vocale dipende dalle API del browser e dalle voci del sistema operativo; la gestione dei dati vocali può variare a seconda di browser e dispositivo. Nessuna registrazione del microfono è implementata in questa demo.

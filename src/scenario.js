// Educational rule-based scenario; scores are illustrative, not empirical.
export const scenario = {
  hotel: 'Spazio Origine',
  choices: [
    {id:'upgrade', label:'Offri un upgrade immediato',tag:'Soluzione rapida · costo elevato',title:"L'ospite apprezza la soluzione, ma il margine diminuisce",body:"Proponi una camera superiore. La soddisfazione può migliorare, ma l'upgrade ha un costo e richiede controllo di inventario e policy.",metrics:[{label:'Soddisfazione ospite',value:20},{label:'Impatto sui costi',value:-25},{label:'Efficienza operativa',value:5}],coach:"Prima di offrire una soluzione onerosa verifica disponibilità e autorizzazioni. Quali informazioni ti mancavano?"},
    {id:'alternative', label:'Proponi un servizio alternativo',tag:"Gestione dell'attesa · equilibrio",title:"L'attesa diventa un'occasione di servizio",body:"Riconosci il disagio, proponi un servizio durante l'attesa, contatti housekeeping e comunichi tempi realistici.",metrics:[{label:'Soddisfazione ospite',value:15},{label:'Impatto sui costi',value:-5},{label:'Efficienza operativa',value:15}],coach:"Buon equilibrio fra ascolto e coordinamento. Definisci il prossimo aggiornamento e verifica lo stato della camera."},
    {id:'negotiate', label:"Concorda un'attesa con beneficio",tag:'Comunicazione assertiva · negoziazione',title:"Un impegno chiaro riduce l'incertezza",body:"Spieghi la situazione senza scaricare responsabilità e concordi un aggiornamento con un gesto di attenzione proporzionato.",metrics:[{label:'Soddisfazione ospite',value:10},{label:'Impatto sui costi',value:-3},{label:'Efficienza operativa',value:10}],coach:"La trasparenza è utile solo se la promessa è realistica. Cosa faresti se la camera fosse ancora indisponibile?"}
  ]
};

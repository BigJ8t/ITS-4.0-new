// Accessible browser narration. Uses installed browser/system voices (not a
// generative audio service). Choose better-quality Italian voices when available,
// avoid clipped phrases and pace dialogue speaker-by-speaker.
const voiceNames={
  it:['natural','neural','premium','enhanced','siri','elsa','alice','isabella','cosimo'],
  en:['natural','neural','premium','enhanced'],
  es:['natural','neural','premium','enhanced'],
  fr:['natural','neural','premium','enhanced']
};
const voiceLabels={
  it:{auto:'Automatica (migliore disponibile)',voice:'Voce',speed:'Ritmo',slow:'Calmo',normal:'Naturale',fast:'Vivace'},
  en:{auto:'Automatic (best available)',voice:'Voice',speed:'Pace',slow:'Gentle',normal:'Natural',fast:'Lively'},
  es:{auto:'Automática (mejor disponible)',voice:'Voz',speed:'Ritmo',slow:'Pausado',normal:'Natural',fast:'Ágil'},
  fr:{auto:'Automatique (meilleure disponible)',voice:'Voix',speed:'Rythme',slow:'Posé',normal:'Naturel',fast:'Dynamique'}
};
function qualityScore(voice,lang){
  const id=(voice.name+' '+voice.voiceURI).toLowerCase();
  const exact=voice.lang.toLowerCase()===(lang==='it'?'it-it':lang==='en'?'en-us':lang==='fr'?'fr-fr':'es-es');
  const names=voiceNames[lang]||[];
  return (exact?20:0)+(voice.localService?9:0)+
    names.reduce((sum,name,i)=>sum+(id.includes(name)?(30-i):0),0)-
    (/compact|legacy|espeak|robot|standard/.test(id)?12:0);
}
function normalized(text,lang){
  let value=String(text||'').replace(/\s+/g,' ').trim();
  if(lang==='it'){
    value=value.replace(/\bUDL\b/g,'U D L')
      .replace(/\bVIP\b/g,'vì i pì')
      .replace(/\bAI\b/g,'intelligenza artificiale')
      .replace(/\b3D\b/g,'tre D')
      .replace(/\bITSphere\b/g,'I T Sphere');
  }
  return value;
}
export function createNarrator({getLanguage,onUnavailable}){
  const synth=window.speechSynthesis;
  let requestId=0;
  let selected='auto';
  let pace='normal';
  const codes={it:'it-IT',en:'en-US',es:'es-ES',fr:'fr-FR'};
  const rates={slow:.86,normal:.98,fast:1.09};
  const isAvailable=!!synth && typeof window.SpeechSynthesisUtterance!=='undefined';
  function voices(lang=getLanguage()){
    if(!isAvailable)return [];
    return synth.getVoices().filter(v=>v.lang?.toLowerCase().startsWith(lang.toLowerCase()))
      .sort((a,b)=>qualityScore(b,lang)-qualityScore(a,lang));
  }
  function bestVoice(lang){
    const available=voices(lang);
    return available.find(v=>selected!=='auto'&&v.voiceURI===selected) || available[0] || null;
  }
  function setVoice(uri){selected=uri||'auto'}
  function setPace(next){if(Object.hasOwn(rates,next))pace=next}
  function stop(){requestId++;if(isAvailable)synth.cancel()}
  function speak(parts){
    if(!isAvailable){onUnavailable?.();return false}
    stop();
    const serial=requestId;
    const lang=getLanguage();
    const chunks=(Array.isArray(parts)?parts:[parts]).map(x=>normalized(x,lang)).filter(Boolean);
    if(!chunks.length)return false;
    let cursor=0;
    // Each paragraph is one utterance: punctuation controls the prosody
    // without hard-coded long pauses or choppy word-by-word playback.
    function next(){
      if(serial!==requestId||cursor>=chunks.length)return;
      const utterance=new SpeechSynthesisUtterance(chunks[cursor++]);
      utterance.lang=codes[lang]||lang;
      utterance.rate=rates[pace];
      utterance.pitch=1;
      utterance.volume=1;
      const voice=bestVoice(lang);
      if(voice)utterance.voice=voice;
      utterance.onend=()=>{if(serial===requestId)next()};
      utterance.onerror=ev=>{if(serial===requestId&&ev.error!=='canceled'&&ev.error!=='interrupted')next()};
      synth.speak(utterance);
    }
    next();
    return true;
  }
  return {speak,stop,voices,setVoice,setPace,isAvailable,labels:voiceLabels};
}

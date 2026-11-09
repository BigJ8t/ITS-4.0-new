import './style.css';
import { createHotelScene } from './scene.js';
import { scenarioCatalog, getScenario } from './scenario-library.js';
import { messages, languageCodes } from './i18n.js';
import { getDialogue } from './dialogues.js';
import { createNarrator } from './narration.js';

const $ = id => document.getElementById(id);
const safeStore = {
  get(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key,String(value)); } catch {} }
};
let language = ['it','en','es','fr'].includes(safeStore.get('itsphere-language','it')) ? safeStore.get('itsphere-language','it') : 'it';
let attempts = Math.max(0,Number(safeStore.get('itsphere-attempts','0')) || 0);
let chosen = null;
let activeScenario=getScenario(safeStore.get('itsphere-scenario','vip'));
const scenarioAttempts=()=>Math.max(0,Number(safeStore.get('itsphere-count-'+activeScenario.id,'0'))||0);
let caseAttempts=scenarioAttempts();
let lastResult = null;
let settings = { large:false, contrast:false, motion:false, simple:false, guided:true };
let spoken = false;
const t = () => messages[language];
const hotel = createHotelScene($('scene'));
// Directed views let students inspect the two characters without requiring
// joystick movement, while preserving free exploration and keyboard access.
const wardrobeBar=document.createElement('div');
wardrobeBar.className='wardrobe-bar';
wardrobeBar.innerHTML='<label for="wardrobeSelect" id="wardrobeLabel"></label><select id="wardrobeSelect" aria-label="Character wardrobe style"><option value="signature"></option><option value="heritage"></option></select>';
document.querySelector('.scenario-panel').insertBefore(wardrobeBar,document.querySelector('.scenario-panel .panel-top'));
wardrobeBar.querySelector('select').addEventListener('change',e=>hotel.setCharacterStyle(e.target.value));
const cameraBar=document.createElement('nav');
cameraBar.className='camera-toolbar';
cameraBar.setAttribute('aria-label','Viste della simulazione');
cameraBar.innerHTML='<button type="button" class="tool-btn" data-view="overview">◈ Panoramica</button><button type="button" class="tool-btn" data-view="guest">◉ Ospite</button><button type="button" class="tool-btn" data-view="reception">⌂ Reception</button>';
document.querySelector('.workspace').append(cameraBar);
cameraBar.querySelectorAll('button').forEach(button=>{
  button.addEventListener('click',()=>hotel.setView(button.dataset.view));
});


// UDL controls: multiple languages, visible transcript, adjustable typography, contrast,
// reduced motion, reading support, and non-3D equivalent text interaction.
const tools = document.createElement('section');
tools.className = 'learning-tools';
tools.setAttribute('aria-label','Learning accessibility controls');
tools.innerHTML = `
  <div class="learning-row">
    <label for="languageSelect" id="languageLabel"></label>
    <select id="languageSelect" aria-label="Choose language">
      <option value="it">Italiano</option><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option>
    </select>
    <button type="button" id="narrateBtn" class="tool-btn"></button>
    <button type="button" id="stopNarrateBtn" class="tool-btn"></button>
  </div>
  <details id="accessOptions" class="udl-details"><summary id="accessLabel"></summary>
    <div class="udl-options">
      <label><input type="checkbox" id="largeText"> <span id="largeLabel"></span></label>
      <label><input type="checkbox" id="highContrast"> <span id="contrastLabel"></span></label>
      <label><input type="checkbox" id="reduceMotion"> <span id="motionLabel"></span></label>
      <label><input type="checkbox" id="plainLanguage"> <span id="simpleLabel"></span></label>
    </div>
  </details>
  <p id="transcriptNotice" class="sr-caption"></p>
`;
document.querySelector('.scenario-panel').prepend(tools);
// Scenario browser: each case has its own context, choices and feedback.
const casePanel=document.createElement('div');
casePanel.className='scenario-switch';
casePanel.innerHTML='<label for="scenarioSelect" id="scenarioLabel"></label><select id="scenarioSelect"></select><p id="caseSource"></p>';
document.querySelector('.scenario-panel').insertBefore(casePanel,document.querySelector('.scenario-panel .panel-top'));
const caseNames={it:'Scegli uno scenario',en:'Choose a scenario',es:'Elige un escenario',fr:'Choisissez un scénario'};
const caseOrigins={
  it:['Dalle slide ITSphere','Ampliamento progettuale'],
  en:['From ITSphere slides','New design extension'],
  es:['De las diapositivas ITSphere','Ampliación del proyecto'],
  fr:['Issu des diapositives ITSphere','Extension du projet']
};
const caseLabel=(c)=>{
  if(c.id==='vip') return messages[language].title;
  return c.locales[language].title;
};
const caseText=()=>activeScenario.id==='vip'?null:activeScenario.locales[language];
const currentChoices=()=>activeScenario.choices;
function resetCase(){
  stopSpeech();chosen=null;lastResult=null;caseAttempts=scenarioAttempts();
  $('confirmBtn').disabled=true;
  $('decisionArea').classList.remove('hidden');
  $('resultArea').classList.add('hidden');
  hotel.applyScenarioVisual?.(activeScenario.id);
  translate();
}
function drawCaseSelector(){
  $('scenarioLabel').textContent=caseNames[language];
  const selected=activeScenario.id;
  $('scenarioSelect').replaceChildren();
  for(const c of scenarioCatalog){
    const o=document.createElement('option');o.value=c.id;
    o.textContent=String(c.index).padStart(2,'0')+' · '+caseLabel(c);
    $('scenarioSelect').append(o);
  }
  $('scenarioSelect').value=selected;
  const source=activeScenario.origin==='slides'?0:1;
  $('caseSource').textContent=caseOrigins[language][source]+' · '+activeScenario.role;
}
$('scenarioSelect').addEventListener('change',e=>{
  activeScenario=getScenario(e.target.value);
  safeStore.set('itsphere-scenario',activeScenario.id);
  resetCase();
});
const modeBox=document.createElement('div');modeBox.className='learning-level';
modeBox.innerHTML='<label for="levelSelect" id="levelLabel"></label> <select id="levelSelect"><option value="guided"></option><option value="independent"></option><option value="advanced"></option></select>';
$('decisionArea').prepend(modeBox);
const hints=document.createElement('div');hints.className='hint-card';hints.id='hintCard';hints.setAttribute('role','status');
const hintButton=document.createElement('button');hintButton.type='button';hintButton.id='hintBtn';hintButton.className='tool-btn hint-button';
$('decisionArea').insertBefore(hintButton,$('choices'));
$('decisionArea').insertBefore(hints,$('choices'));
const dialogueSection=document.createElement('section');
dialogueSection.className='dialogue-transcript';
dialogueSection.setAttribute('aria-label','Dialogue after decision');
dialogueSection.innerHTML='<h3 id="dialogueHeading"></h3><div id="dialogueLines" class="dialogue-lines" aria-live="polite"></div><button type="button" id="dialogueVoiceBtn" class="tool-btn"></button>';
$('resultArea').prepend(dialogueSection);
const feedbackNarrate=document.createElement('button');feedbackNarrate.type='button';feedbackNarrate.className='tool-btn';feedbackNarrate.id='feedbackVoiceBtn';
$('resultArea').append(feedbackNarrate);
const notice=document.createElement('p');notice.className='udl-note';notice.id='udlNote';
document.querySelector('.scenario-panel').append(notice);
let focusedButtonId=null;

const voiceControls=document.createElement('div');
voiceControls.className='voice-controls';
voiceControls.innerHTML='<label for="narratorVoice" id="voiceLabel"></label><select id="narratorVoice"></select><label for="narratorTone" id="toneLabel"></label><select id="narratorTone"><option value="welcoming"></option><option value="professional"></option><option value="reassuring"></option><option value="neutral"></option></select><label for="narratorPace" id="paceLabel"></label><select id="narratorPace"><option value="slow"></option><option value="normal"></option><option value="fast"></option></select>';
$('accessOptions').append(voiceControls);
const narrator=createNarrator({getLanguage:()=>language,onUnavailable:()=>{$('udlNote').textContent=t().voiceUnsupported}});
$('narratorPace').value=['slow','normal','fast'].includes(safeStore.get('itsphere-voice-pace','normal'))?safeStore.get('itsphere-voice-pace','normal'):'normal';
narrator.setPace($('narratorPace').value);
$('narratorTone').value=['welcoming','professional','reassuring','neutral'].includes(safeStore.get('itsphere-voice-tone','welcoming'))?safeStore.get('itsphere-voice-tone','welcoming'):'welcoming';
narrator.setTone($('narratorTone').value);
function populateVoices(){
  const labels=narrator.labels[language];
  $('voiceLabel').textContent=labels.voice;
  const toneNames={
    it:['Tono','Accogliente','Professionale','Rassicurante','Neutro'],
    en:['Tone','Welcoming','Professional','Reassuring','Neutral'],
    es:['Tono','Acogedor','Profesional','Tranquilizador','Neutro'],
    fr:['Ton','Accueillant','Professionnel','Rassurant','Neutre']
  }[language];
  $('toneLabel').textContent=toneNames[0];
  [...$('narratorTone').options].forEach((option,i)=>option.textContent=toneNames[i+1]);
  $('paceLabel').textContent=labels.speed;
  const paceLabels=[labels.slow,labels.normal,labels.fast];
  [...$('narratorPace').options].forEach((option,index)=>option.textContent=paceLabels[index]);
  const voiceSelect=$('narratorVoice');
  const stored=safeStore.get('itsphere-voice-'+language,'auto');
  voiceSelect.replaceChildren();
  const auto=document.createElement('option');auto.value='auto';auto.textContent=labels.auto;voiceSelect.append(auto);
  for(const voice of narrator.voices(language)){
    const option=document.createElement('option');option.value=voice.voiceURI;
    option.textContent=voice.name+(voice.localService?' · offline':'');
    voiceSelect.append(option);
  }
  voiceSelect.value=[...voiceSelect.options].some(x=>x.value===stored)?stored:'auto';
  narrator.setVoice(voiceSelect.value);
}
$('narratorVoice').addEventListener('change',e=>{
  narrator.setVoice(e.target.value);
  safeStore.set('itsphere-voice-'+language,e.target.value);
});
$('narratorTone').addEventListener('change',e=>{
  narrator.setTone(e.target.value);
  safeStore.set('itsphere-voice-tone',e.target.value);
});
$('narratorPace').addEventListener('change',e=>{
  narrator.setPace(e.target.value);
  safeStore.set('itsphere-voice-pace',e.target.value);
});
if('speechSynthesis' in window){
  window.speechSynthesis.addEventListener?.('voiceschanged',populateVoices);
}
function speak(text){narrator.speak(text)}
function stopSpeech(){narrator.stop()}
function optionText(id) {
  if(activeScenario.id!=='vip'){
    const item=caseText()?.choices.find(x=>x.id===id);
    return item?[item.label,item.tag,item.title,item.body,item.coach]:['','','','',''];
  }
  const m=t();
  return m[id==='upgrade'?'upgrade':id==='alternative'?'alternativeChoice':'negotiate'];
}
function renderChoices(){
  const current=document.activeElement?.dataset?.choiceId || null;
  $('choices').replaceChildren();
  currentChoices().forEach((option,index)=>{
    const btn=document.createElement('button');btn.type='button';
    btn.className='choice'+(chosen===option.id?' selected':'');
    btn.dataset.choiceId=option.id;btn.setAttribute('aria-pressed',String(chosen===option.id));
    const badge=document.createElement('span');badge.className='choice-letter';badge.textContent=String.fromCharCode(65+index);
    const label=document.createElement('span');label.textContent=optionText(option.id)[0];
    btn.append(badge,label);btn.addEventListener('click',()=>{
      chosen=option.id;$('confirmBtn').disabled=false;renderChoices();
      $('choices').querySelector(`[data-choice-id="${option.id}"]`)?.focus();
    });
    $('choices').append(btn);
  });
  if(current && chosen!==null) $('choices').querySelector(`[data-choice-id="${current}"]`)?.focus();
}
function hintText() {
  const m=t();const level=$('levelSelect').value;
  const base=caseText()?.hint||m.helper;
  if (level==='advanced') return caseAttempts>0?base:'';
  if(level==='guided')return base;
  return caseAttempts>=1?base:'';
}
function showHint(force=false){
  const text=hintText() || (force ? t().helper : '');
  $('hintCard').textContent=text;$('hintCard').hidden=!text;
}
function translate(){
  document.documentElement.lang=language;const m=t();
  hotel.setVisualLanguage?.(language);
  const labels=({
    it:['Abiti dei personaggi','Professionale blu','Heritage sabbia'],
    en:['Character outfits','Navy professional','Heritage sand'],
    es:['Vestuario de personajes','Profesional azul','Heritage arena'],
    fr:['Tenues des personnages','Professionnel bleu','Héritage sable']
  })[language];
  $('wardrobeLabel').textContent=labels[0];
  [...$('wardrobeSelect').options].forEach((option,i)=>option.textContent=labels[i+1]);
  $('languageSelect').value=language;
  populateVoices();
  cameraBar.setAttribute('aria-label',({it:'Inquadrature',en:'Camera views',es:'Vistas de cámara',fr:'Vues de caméra'})[language]);
  const cameras=({it:['Panoramica','Ospite','Reception'],en:['Overview','Guest','Front desk'],es:['Vista general','Huésped','Recepción'],fr:['Vue générale','Client','Réception']})[language];
  cameraBar.querySelectorAll('button').forEach((btn,i)=>btn.textContent=['◈ ','◉ ','⌂ '][i]+cameras[i]);
  $('helpTitle').textContent=m.helpTitle;
  document.querySelector('#helpModal .modal-card > p:not(.muted)').textContent=m.helpBody;
  document.querySelector('#helpModal .modal-card > p.muted').textContent=m.helpFoot;
  $('startBtn').textContent=m.start;
  document.querySelector('.subtag').textContent=m.header3d;
  $('languageLabel').textContent=m.language;
  $('narrateBtn').textContent='▶ '+m.voice;
  $('stopNarrateBtn').textContent='■ '+m.stop;
  $('accessLabel').textContent='⚙ '+m.accessibility+' · UDL';
  $('largeLabel').textContent=m.large;$('contrastLabel').textContent=m.contrast;
  $('motionLabel').textContent=m.motion;$('simpleLabel').textContent=m.simple;
  $('transcriptNotice').textContent=m.captions+' · '+m.alternative;
  drawCaseSelector();
  const caseContent=caseText();
  document.querySelector('.eyebrow').textContent=(m.scenario.replace(/[0-9]+/g,'').trim()+' '+String(activeScenario.index).padStart(2,'0'));
  document.querySelector('.mini-pill').textContent=activeScenario.role;
  document.querySelector('.scenario-panel h1').textContent=caseContent?.title||m.title;
  document.querySelector('.intro').textContent=caseContent?.intro||(settings.simple?m.introSimple:m.intro);
  document.querySelector('.problem-box span:last-child').textContent=caseContent?.problem||(settings.simple?m.problemSimple:m.problem);
  document.querySelector('.question').textContent=m.question;
  $('confirmBtn').textContent=m.confirm;
  $('retryBtn').textContent=m.retry;
  document.querySelector('.metrics-title').textContent=m.score;
  document.querySelector('.coach-note strong').textContent=m.coach;
  document.querySelector('.footer-panel span:first-child').textContent=m.mode;
  $('levelLabel').textContent=m.level;
  const opts=$('levelSelect').options;
  [m.beginner,m.standard,m.advanced].forEach((x,i)=>opts[i].textContent=x);
  $('hintBtn').textContent='? '+m.help;
  $('feedbackVoiceBtn').textContent='▶ '+m.readFeedback;
  const dialogueText=({
    it:['Dialogo simulato','▶ Ascolta il dialogo'],
    en:['Simulated conversation','▶ Play dialogue'],
    es:['Diálogo simulado','▶ Escuchar diálogo'],
    fr:['Dialogue simulé','▶ Écouter le dialogue']
  })[language];
  $('dialogueHeading').textContent=dialogueText[0];
  $('dialogueVoiceBtn').textContent=dialogueText[1];
  $('udlNote').textContent=m.effects+' '+m.notice;
  $('trialCounter').textContent=m.attempts+': '+caseAttempts;
  renderChoices();showHint();if(lastResult)renderResult(lastResult);
}
function renderDialogue(result){
  const lines=getDialogue(activeScenario.id,result.id,language);
  const target=$('dialogueLines');
  target.replaceChildren();
  lines.forEach(line=>{
    const paragraph=document.createElement('p');
    paragraph.className='dialogue-bubble dialogue-'+line.speaker;
    const role=document.createElement('strong');
    role.textContent=line.role;
    const value=document.createElement('span');
    value.textContent=line.text;
    paragraph.append(role,value);
    target.append(paragraph);
  });
}
function renderResult(result){
  lastResult=result;const d=optionText(result.id),m=t();
  renderDialogue(result);
  $('resultTag').textContent=d[1];$('resultTitle').textContent=d[2];
  $('resultBody').textContent=d[3];$('coachText').textContent=d[4];
  $('metrics').replaceChildren();
  result.metrics.forEach((metric,i)=>{
    const row=document.createElement('div');row.className='metric';
    const name=document.createElement('span');name.textContent=m.metricNames[i];
    const value=document.createElement('strong');value.textContent=(metric.value>0?'+':'')+metric.value+' '+m.points;
    value.className=metric.value>=0?'positive':'negative';
    row.append(name,value);$('metrics').append(row);
  });
}
function applyAccessibility(){
  document.body.classList.toggle('large-text',settings.large);
  document.body.classList.toggle('high-contrast',settings.contrast);
  document.body.classList.toggle('reduced-motion',settings.motion);
  hotel.setReducedMotion?.(settings.motion);
  translate();
}
for(const [id,key] of [['largeText','large'],['highContrast','contrast'],['reduceMotion','motion'],['plainLanguage','simple']]){
  $(id).addEventListener('change',e=>{settings[key]=e.target.checked;applyAccessibility()});
}
$('languageSelect').addEventListener('change',e=>{stopSpeech();language=e.target.value;safeStore.set('itsphere-language',language);translate()});
$('levelSelect').addEventListener('change',()=>showHint());
$('hintBtn').addEventListener('click',()=>showHint(true));
$('narrateBtn').addEventListener('click',()=>speak([caseText()?.title||t().title,caseText()?.intro||(settings.simple?t().introSimple:t().intro),caseText()?.problem||(settings.simple?t().problemSimple:t().problem),t().question,...currentChoices().map(c=>optionText(c.id)[0])]));
$('feedbackVoiceBtn').addEventListener('click',()=>{if(lastResult){const d=optionText(lastResult.id);speak([d[2],d[3],d[4]])}});
$('dialogueVoiceBtn').addEventListener('click',()=>{
  if(!lastResult)return;
  const lines=getDialogue(activeScenario.id,lastResult.id,language);
  speak(lines.map(x=>({text:x.role+'. '+x.text,speaker:x.speaker})));
});
$('stopNarrateBtn').addEventListener('click',stopSpeech);
$('confirmBtn').addEventListener('click',()=>{
  const result=currentChoices().find(c=>c.id===chosen);if(!result)return;
  attempts++;caseAttempts++;
  safeStore.set('itsphere-attempts',attempts);
  safeStore.set('itsphere-count-'+activeScenario.id,caseAttempts);
  stopSpeech();
  hotel.reactToChoice?.(result.id);
  renderResult(result);$('decisionArea').classList.add('hidden');$('resultArea').classList.remove('hidden');
  $('trialCounter').textContent=t().attempts+': '+caseAttempts;
  $('resultTitle').setAttribute('tabindex','-1');$('resultTitle').focus();
});
$('retryBtn').addEventListener('click',()=>{
  stopSpeech();hotel.applyScenarioVisual?.(activeScenario.id);lastResult=null;chosen=null;$('confirmBtn').disabled=true;
  $('resultArea').classList.add('hidden');$('decisionArea').classList.remove('hidden');
  renderChoices();showHint();$('choices').querySelector('button')?.focus();
});
const modal=$('helpModal');$('helpBtn').addEventListener('click',()=>modal.classList.remove('hidden'));
const close=()=>modal.classList.add('hidden');
$('closeHelp').addEventListener('click',close);$('startBtn').addEventListener('click',close);
modal.addEventListener('click',e=>{if(e.target===modal)close()});
window.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
window.addEventListener('beforeunload',()=>{stopSpeech();hotel.dispose()});
hotel.applyScenarioVisual?.(activeScenario.id,{instant:true});
translate();

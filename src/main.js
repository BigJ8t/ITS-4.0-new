import './style.css';
import { createHotelScene } from './scene.js';
import { scenario } from './scenario.js';
import { messages, languageCodes } from './i18n.js';

const $ = id => document.getElementById(id);
const safeStore = {
  get(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key,String(value)); } catch {} }
};
let language = ['it','en','es','fr'].includes(safeStore.get('itsphere-language','it')) ? safeStore.get('itsphere-language','it') : 'it';
let attempts = Math.max(0,Number(safeStore.get('itsphere-attempts','0')) || 0);
let chosen = null;
let lastResult = null;
let settings = { large:false, contrast:false, motion:false, simple:false, guided:true };
let spoken = false;
const t = () => messages[language];
const hotel = createHotelScene($('scene'));
// Directed views let students inspect the two characters without requiring
// joystick movement, while preserving free exploration and keyboard access.
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
const modeBox=document.createElement('div');modeBox.className='learning-level';
modeBox.innerHTML='<label for="levelSelect" id="levelLabel"></label> <select id="levelSelect"><option value="guided"></option><option value="independent"></option><option value="advanced"></option></select>';
$('decisionArea').prepend(modeBox);
const hints=document.createElement('div');hints.className='hint-card';hints.id='hintCard';hints.setAttribute('role','status');
const hintButton=document.createElement('button');hintButton.type='button';hintButton.id='hintBtn';hintButton.className='tool-btn hint-button';
$('decisionArea').insertBefore(hintButton,$('choices'));
$('decisionArea').insertBefore(hints,$('choices'));
const feedbackNarrate=document.createElement('button');feedbackNarrate.type='button';feedbackNarrate.className='tool-btn';feedbackNarrate.id='feedbackVoiceBtn';
$('resultArea').append(feedbackNarrate);
const notice=document.createElement('p');notice.className='udl-note';notice.id='udlNote';
document.querySelector('.scenario-panel').append(notice);
let focusedButtonId=null;

function speak(text) {
  if (!('speechSynthesis' in window)) { $('udlNote').textContent=t().voiceUnsupported; return; }
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang=languageCodes[language];utterance.rate=.93;utterance.pitch=1.02;
  const voices=window.speechSynthesis.getVoices();
  const voice=voices.find(v=>v.lang.toLowerCase()===utterance.lang.toLowerCase()) ||
    voices.find(v=>v.lang.toLowerCase().startsWith(language));
  if(voice)utterance.voice=voice;
  window.speechSynthesis.speak(utterance);
}
function stopSpeech(){if('speechSynthesis' in window)window.speechSynthesis.cancel()}
function optionText(id) { const m=t();return m[id==='upgrade'?'upgrade':id==='alternative'?'alternativeChoice':'negotiate']; }
function renderChoices(){
  const current=document.activeElement?.dataset?.choiceId || null;
  $('choices').replaceChildren();
  scenario.choices.forEach((option,index)=>{
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
  if (level==='advanced') return attempts>0?m.nextHint:'';
  if(level==='guided')return attempts>=1?m.stepHint:m.helper;
  return attempts>=1?m.nextHint:'';
}
function showHint(force=false){
  const text=hintText() || (force ? t().helper : '');
  $('hintCard').textContent=text;$('hintCard').hidden=!text;
}
function translate(){
  document.documentElement.lang=language;const m=t();
  $('languageSelect').value=language;
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
  document.querySelector('.eyebrow').textContent=m.scenario;
  document.querySelector('.mini-pill').textContent=m.role;
  document.querySelector('.scenario-panel h1').textContent=m.title;
  document.querySelector('.intro').textContent=settings.simple?m.introSimple:m.intro;
  document.querySelector('.problem-box span:last-child').textContent=settings.simple?m.problemSimple:m.problem;
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
  $('udlNote').textContent=m.effects+' '+m.notice;
  $('trialCounter').textContent=m.attempts+': '+attempts;
  renderChoices();showHint();if(lastResult)renderResult(lastResult);
}
function renderResult(result){
  lastResult=result;const d=optionText(result.id),m=t();
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
$('narrateBtn').addEventListener('click',()=>speak([t().title,settings.simple?t().introSimple:t().intro,settings.simple?t().problemSimple:t().problem,t().question,...scenario.choices.map(c=>optionText(c.id)[0])].join('. ')));
$('feedbackVoiceBtn').addEventListener('click',()=>{if(lastResult){const d=optionText(lastResult.id);speak([d[2],d[3],d[4]].join('. '))}});
$('stopNarrateBtn').addEventListener('click',stopSpeech);
$('confirmBtn').addEventListener('click',()=>{
  const result=scenario.choices.find(c=>c.id===chosen);if(!result)return;
  attempts++;safeStore.set('itsphere-attempts',attempts);
  hotel.reactToChoice?.(result.id);
  renderResult(result);$('decisionArea').classList.add('hidden');$('resultArea').classList.remove('hidden');
  $('trialCounter').textContent=t().attempts+': '+attempts;
  $('resultTitle').setAttribute('tabindex','-1');$('resultTitle').focus();
});
$('retryBtn').addEventListener('click',()=>{
  stopSpeech();hotel.setView?.('overview');lastResult=null;chosen=null;$('confirmBtn').disabled=true;
  $('resultArea').classList.add('hidden');$('decisionArea').classList.remove('hidden');
  renderChoices();showHint();$('choices').querySelector('button')?.focus();
});
const modal=$('helpModal');$('helpBtn').addEventListener('click',()=>modal.classList.remove('hidden'));
const close=()=>modal.classList.add('hidden');
$('closeHelp').addEventListener('click',close);$('startBtn').addEventListener('click',close);
modal.addEventListener('click',e=>{if(e.target===modal)close()});
window.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
window.addEventListener('beforeunload',()=>{stopSpeech();hotel.dispose()});
translate();

import './style.css';
import { createHotelScene } from './scene.js';
import { scenario } from './scenario.js';
const $ = id => document.getElementById(id);
const hotel = createHotelScene($('scene'));
let chosen = null;
let attempts = 0;
try { attempts = Number(localStorage.getItem('itsphere-attempts') || 0) || 0; } catch {}
function updateCounter(){ $('trialCounter').textContent = 'Tentativi: ' + attempts; }
updateCounter();
function renderChoices(){
  $('choices').replaceChildren();
  scenario.choices.forEach((option,index)=>{
    const btn=document.createElement('button');btn.type='button';btn.className='choice'+(chosen===option.id?' selected':'');
    btn.setAttribute('aria-pressed',String(chosen===option.id));
    const badge=document.createElement('span');badge.className='choice-letter';badge.textContent=String.fromCharCode(65+index);
    const label=document.createElement('span');label.textContent=option.label;
    btn.append(badge,label);
    btn.addEventListener('click',()=>{chosen=option.id;$('confirmBtn').disabled=false;renderChoices();});
    $('choices').append(btn);
  });
}
renderChoices();
$('confirmBtn').addEventListener('click',()=>{
  const result=scenario.choices.find(x=>x.id===chosen);if(!result)return;
  attempts++;updateCounter();try{localStorage.setItem('itsphere-attempts',String(attempts))}catch{}
  $('resultTag').textContent=result.tag;
  $('resultTitle').textContent=result.title;
  $('resultBody').textContent=result.body;
  $('coachText').textContent=result.coach;
  $('metrics').replaceChildren();
  for(const metric of result.metrics){
    const row=document.createElement('div');row.className='metric';
    const name=document.createElement('span');name.textContent=metric.label;
    const value=document.createElement('strong');value.textContent=(metric.value>0?'+':'')+metric.value+' punti';
    value.className=metric.value>=0?'positive':'negative';row.append(name,value);$('metrics').append(row);
  }
  $('decisionArea').classList.add('hidden');$('resultArea').classList.remove('hidden');
});
$('retryBtn').addEventListener('click',()=>{
  chosen=null;renderChoices();$('confirmBtn').disabled=true;$('resultArea').classList.add('hidden');$('decisionArea').classList.remove('hidden');
});
const modal=$('helpModal');
$('helpBtn').addEventListener('click',()=>modal.classList.remove('hidden'));
const close=()=>modal.classList.add('hidden');
$('closeHelp').addEventListener('click',close);$('startBtn').addEventListener('click',close);
modal.addEventListener('click',e=>{if(e.target===modal)close()});
window.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
window.addEventListener('beforeunload',()=>hotel.dispose());

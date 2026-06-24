/* ===== Navigation: sidebar + tabs both control the same page state ===== */
const pages = ['dashboard','symptom','hub','hospitals','reports','support'];
function goTo(page){
  pages.forEach(p=>{
    document.getElementById('page-'+p).classList.toggle('active', p===page);
  });
  document.querySelectorAll('.navlink[data-page]').forEach(b=>b.classList.toggle('active', b.dataset.page===page));
  document.querySelectorAll('.tab[data-page]').forEach(b=>b.classList.toggle('active', b.dataset.page===page));
}
document.querySelectorAll('.navlink[data-page], .tab[data-page]').forEach(btn=>{
  btn.addEventListener('click', ()=> goTo(btn.dataset.page));
});

/* ===== Top bar: bell + profile/lang popover ===== */
document.getElementById('profileBtn').addEventListener('click', ()=>{
  document.getElementById('langPop').classList.toggle('show');
});
document.addEventListener('click', (e)=>{
  if(!e.target.closest('#profileBtn') && !e.target.closest('#langPop')){
    document.getElementById('langPop').classList.remove('show');
  }
});
document.getElementById('bellBtn').addEventListener('click', ()=>{
  alert('Notifications:\n• High BP risk flagged — review Reports\n• Reminder: log today\'s wellness numbers\n• New article: Managing Malaria Risk');
});
document.getElementById('liveChatBtn').addEventListener('click', ()=>{
  goTo('support');
  alert('Connecting you to a live support agent...');
});

/* ===== Generic chip selection (toggle) ===== */
document.querySelectorAll('.chip-row').forEach(row=>{
  row.addEventListener('click', (e)=>{
    const chip = e.target.closest('.chip');
    if(!chip || chip.dataset.filter) return; // filter chips handled separately
    chip.classList.toggle('selected');
  });
});

/* ===== Symptom Checker: chat ===== */
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const botReplies = {
  fever:"I see — fever can point to malaria or typhoid here in Lagos. Have you had chills or body aches too?",
  headache:"Noted. How long has the headache lasted, and is it paired with light sensitivity?",
  cough:"Thanks. Is the cough dry or are you bringing up phlegm?",
  default:"Got it, I've noted that. Tell me a bit more, or fill in the Early Disease Assessment below for a risk score."
};
function addMsg(text, who){
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
function botReplyFor(text){
  const t = text.toLowerCase();
  if(t.includes('fever')) return botReplies.fever;
  if(t.includes('headache')) return botReplies.headache;
  if(t.includes('cough')) return botReplies.cough;
  return botReplies.default;
}
function sendChat(text){
  if(!text.trim()) return;
  addMsg(text,'user');
  document.getElementById('symInput').value = text;
  setTimeout(()=> addMsg(botReplyFor(text),'bot'), 350);
}
document.getElementById('sendBtn').addEventListener('click', ()=>{
  sendChat(chatInput.value);
  chatInput.value='';
});
chatInput.addEventListener('keydown', (e)=>{
  if(e.key==='Enter'){ sendChat(chatInput.value); chatInput.value=''; }
});
document.querySelectorAll('#symptomChips .chip').forEach(chip=>{
  chip.addEventListener('click', ()=> sendChat(chip.dataset.sym));
});
document.querySelectorAll('.lang-toggle').forEach(group=>{
  group.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});

/* ===== Symptom Checker: assessment -> gauge ===== */
document.getElementById('runAssessment').addEventListener('click', ()=>{
  const sym = document.getElementById('symInput').value || 'your symptoms';
  const age = +document.getElementById('ageInput').value || 0;
  let pct = 40 + Math.min(age,80)*0.4;
  pct = Math.min(95, Math.round(pct));
  const gauge = document.querySelectorAll('.gauge')[0];
  const arc = gauge.querySelectorAll('path')[1];
  const total = 188;
  arc.setAttribute('stroke-dashoffset', Math.round(total - (pct/100)*total));
  const angle = -90 + (pct/100)*180;
  const line = gauge.querySelector('line');
  const rad = angle * Math.PI/180;
  const x2 = 70 + 35*Math.cos(rad), y2 = 75 + 35*Math.sin(rad);
  line.setAttribute('x2', x2.toFixed(1));
  line.setAttribute('y2', y2.toFixed(1));
  let risk = pct>70 ? 'High risk' : pct>40 ? 'Moderate risk' : 'Low risk';
  document.getElementById('predOut').textContent = `${risk}: related to ${sym} (${pct}%)`;
});

/* ===== Health Hub: drug interaction checker ===== */
document.getElementById('checkSafety').addEventListener('click', ()=>{
  const m1 = document.getElementById('med1').value.trim();
  const m2 = document.getElementById('med2').value.trim();
  const out = document.getElementById('interactionOut');
  if(!m1 || !m2){
    out.textContent = 'Enter both medication names to check for interactions.';
    out.className = 'interaction-result show warn';
    return;
  }
  const risky = ['warfarin','aspirin','ibuprofen'];
  const flagged = risky.includes(m1.toLowerCase()) && risky.includes(m2.toLowerCase());
  if(flagged){
    out.textContent = `${m1} and ${m2} can increase bleeding risk together. Speak with a pharmacist before combining them.`;
    out.className = 'interaction-result show warn';
  } else {
    out.textContent = `No major interaction found between ${m1} and ${m2}. Always confirm with a pharmacist for your specific dose.`;
    out.className = 'interaction-result show safe';
  }
});

/* ===== Hospitals: search + filter ===== */
const hospitals = [
  {name:'LUTH Lagos', type:'public', area:'Idi-Araba', dist:'4.5 km'},
  {name:'Evercare Hospital', type:'private', area:'Lekki', dist:'3.1 km'},
  {name:'Lagos Island Maternity', type:'public', area:'Lagos Island', dist:'5.2 km'},
  {name:'Reddington Hospital', type:'private', area:'Victoria Island', dist:'6.0 km'},
  {name:'HealthPlus Pharmacy', type:'pharmacy', area:'Ikeja', dist:'2.0 km'},
  {name:'MedPlus Pharmacy', type:'pharmacy', area:'Surulere', dist:'2.8 km'},
];
function renderHospitals(){
  const q = document.getElementById('hospSearch').value.toLowerCase();
  const filterChip = document.querySelector('#page-hospitals .chip.selected');
  const filter = filterChip ? filterChip.dataset.filter : 'all';
  const list = hospitals.filter(h=>{
    const matchesQ = h.name.toLowerCase().includes(q) || h.area.toLowerCase().includes(q);
    const matchesF = filter==='all' || h.type===filter;
    return matchesQ && matchesF;
  });
  const box = document.getElementById('hospResults');
  box.innerHTML = list.length ? '' : '<p style="color:#8aa09c; font-size:12.5px;">No matches — try a different search.</p>';
  list.forEach(h=>{
    const row = document.createElement('div');
    row.className = 'hosp-row';
    row.style.cursor = 'pointer';
    row.innerHTML = `<div><div class="hosp-name">${h.name}</div><div class="hosp-sub">${h.area} · ${h.type}</div></div><div class="dist">${h.dist}</div>`;
    row.addEventListener('click', ()=> alert(`${h.name} — ${h.area}\nDistance: ${h.dist}\n\nDirections would open here.`));
    box.appendChild(row);
  });
}
document.getElementById('hospSearch').addEventListener('input', renderHospitals);
document.querySelectorAll('#page-hospitals .chip[data-filter]').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('#page-hospitals .chip[data-filter]').forEach(c=>c.classList.remove('selected'));
    chip.classList.add('selected');
    renderHospitals();
  });
});
renderHospitals();

/* ===== Support: FAQ accordion ===== */
document.querySelectorAll('.faq-q').forEach(q=>{
  q.addEventListener('click', ()=>{
    q.parentElement.classList.toggle('open');
  });
});

/* ===== Decorative map pins (simple SVG, no external API) ===== */
function drawMap(id, pins){
  const el = document.getElementById(id);
  if(!el) return;
  let svg = `<svg viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="190" fill="#dcefe5"/>
    <path d="M0 120 Q70 90 150 130 T300 110 V190 H0 Z" fill="#bfe0d4"/>
    <path d="M0 60 Q100 40 180 70 T300 50" fill="none" stroke="#a9d6c5" stroke-width="2"/>`;
  pins.forEach(p=>{
    svg += `<g>
      <circle cx="${p.x}" cy="${p.y}" r="9" fill="#0b4742"/>
      <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#fff"/>
    </g>`;
  });
  svg += `</svg>`;
  el.innerHTML = svg;
}
drawMap('dashMap', [{x:90,y:80},{x:170,y:110},{x:230,y:60}]);
drawMap('symMap', [{x:90,y:80},{x:170,y:110},{x:230,y:60}]);
drawMap('hospMap', [{x:60,y:60},{x:120,y:100},{x:180,y:70},{x:230,y:130},{x:90,y:150}]);
drawMap('supportMap', [{x:90,y:80},{x:170,y:110},{x:230,y:60}]);
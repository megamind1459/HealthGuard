/* ===== Navigation: sidebar + tabs + bottom nav all control the same page state ===== */
const pages = ['dashboard','symptom','hub','hospitals','reports','support'];
function goTo(page){
  pages.forEach(p=>{
    document.getElementById('page-'+p).classList.toggle('active', p===page);
  });
  document.querySelectorAll('.navlink[data-page]').forEach(b=>b.classList.toggle('active', b.dataset.page===page));
  document.querySelectorAll('.tab[data-page]').forEach(b=>b.classList.toggle('active', b.dataset.page===page));
  document.querySelectorAll('.bn-item[data-page]').forEach(b=>b.classList.toggle('active', b.dataset.page===page));
  closeDrawer();
  window.scrollTo({top:0, behavior:'instant' in window ? 'instant' : 'auto'});
}
document.querySelectorAll('.navlink[data-page], .tab[data-page], .bn-item[data-page]').forEach(btn=>{
  btn.addEventListener('click', ()=> goTo(btn.dataset.page));
});

/* ===== Mobile drawer (hamburger) ===== */
const sidebarEl = document.getElementById('sidebar');
const backdropEl = document.getElementById('sidebarBackdrop');
function openDrawer(){
  sidebarEl.classList.add('open');
  backdropEl.classList.add('show');
}
function closeDrawer(){
  sidebarEl.classList.remove('open');
  backdropEl.classList.remove('show');
}
document.getElementById('hamburgerBtn').addEventListener('click', openDrawer);
document.getElementById('sidebarCloseBtn').addEventListener('click', closeDrawer);
backdropEl.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeDrawer(); });

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
const bellMobile = document.getElementById('bellBtnMobile');
if(bellMobile){
  bellMobile.addEventListener('click', ()=>{
    alert('Notifications:\n• High BP risk flagged — review Reports\n• Reminder: log today\'s wellness numbers\n• New article: Managing Malaria Risk');
  });
}
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

/* ===== Symptom Checker: AI-backed chat (OpenAI) ===== */
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const aiStatus = document.getElementById('aiStatus');
const aiConnectBar = document.getElementById('aiConnectBar');
const aiConnectToggle = document.getElementById('aiConnectToggle');
const aiKeyRow = document.getElementById('aiKeyRow');
const aiKeyNote = document.getElementById('aiKeyNote');
const openaiKeyInput = document.getElementById('openaiKey');
const aiKeySaveBtn = document.getElementById('aiKeySave');

const OPENAI_KEY_STORAGE = 'healthguard_openai_key';
const SYSTEM_PROMPT = `You are the AI assistant inside "HealthGuard AI", a health-guidance app for Lagos, Nigeria.
Keep replies short (2-4 sentences), warm, and plain-language. Ask one clarifying question at a time when symptoms are vague.
You are NOT a doctor and must not give a definitive diagnosis or prescribe medication or dosages.
For anything that sounds urgent (chest pain, difficulty breathing, severe bleeding, stroke signs, loss of consciousness), tell the person to seek emergency care immediately and mention the Urgent Care Contacts in the Support tab.
Otherwise, help them describe their symptoms and gently point them to the Early Disease Assessment form below the chat, or to Locate Hospitals / Health Hub when relevant.`;

let chatHistory = [{role:'system', content: SYSTEM_PROMPT}];

function getStoredKey(){
  try { return localStorage.getItem(OPENAI_KEY_STORAGE) || ''; } catch(e){ return ''; }
}
function setStoredKey(key){
  try { if(key) localStorage.setItem(OPENAI_KEY_STORAGE, key); else localStorage.removeItem(OPENAI_KEY_STORAGE); } catch(e){}
}
function refreshAiStatus(){
  const key = getStoredKey();
  if(key){
    aiStatus.textContent = '🟢 Connected to GPT-4o-mini';
    aiStatus.className = 'ai-status on';
    aiConnectToggle.textContent = 'Change key';
  } else {
    aiStatus.textContent = '⚪ GPT not connected — running on basic replies';
    aiStatus.className = 'ai-status';
    aiConnectToggle.textContent = 'Connect GPT';
  }
}
aiConnectToggle.addEventListener('click', ()=>{
  const showing = aiKeyRow.style.display !== 'none';
  aiKeyRow.style.display = showing ? 'none' : 'flex';
  aiKeyNote.style.display = showing ? 'none' : 'block';
  if(!showing) openaiKeyInput.value = getStoredKey();
});
aiKeySaveBtn.addEventListener('click', ()=>{
  const val = openaiKeyInput.value.trim();
  setStoredKey(val);
  refreshAiStatus();
  aiKeyRow.style.display = 'none';
  aiKeyNote.style.display = 'none';
  addMsg(val ? "GPT is connected. Ask me about how you're feeling." : "GPT disconnected — back to basic replies.", 'bot');
});
refreshAiStatus();

function addMsg(text, who){
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}
function addTypingIndicator(){
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

/* Basic fallback replies used only when no API key is connected */
const botReplies = {
  fever:"I see — fever can point to malaria or typhoid here in Lagos. Have you had chills or body aches too?",
  headache:"Noted. How long has the headache lasted, and is it paired with light sensitivity?",
  cough:"Thanks. Is the cough dry or are you bringing up phlegm?",
  default:"Got it, I've noted that. Tell me a bit more, or fill in the Early Disease Assessment below for a risk score. (Connect GPT above for fuller conversations.)"
};
function basicReplyFor(text){
  const t = text.toLowerCase();
  if(t.includes('fever')) return botReplies.fever;
  if(t.includes('headache')) return botReplies.headache;
  if(t.includes('cough')) return botReplies.cough;
  return botReplies.default;
}

async function getAiReply(userText){
  const key = getStoredKey();
  chatHistory.push({role:'user', content:userText});
  if(!key){
    return basicReplyFor(userText);
  }
  try{
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + key
      },
      body: JSON.stringify({
        model:'gpt-4o-mini',
        messages: chatHistory,
        max_tokens: 200,
        temperature: 0.6
      })
    });
    if(!res.ok){
      const errBody = await res.json().catch(()=>({}));
      const msg = errBody?.error?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "Sorry, I didn't get a reply — try again.";
    chatHistory.push({role:'assistant', content:reply});
    return reply;
  } catch(err){
    aiStatus.textContent = '🔴 GPT error — check your API key';
    aiStatus.className = 'ai-status err';
    return `I couldn't reach GPT just now (${err.message}). Falling back to a basic reply: ${basicReplyFor(userText)}`;
  }
}

let sending = false;
async function sendChat(text){
  if(!text.trim() || sending) return;
  sending = true;
  addMsg(text,'user');
  document.getElementById('symInput').value = text;
  const typingEl = addTypingIndicator();
  const reply = await getAiReply(text);
  typingEl.remove();
  addMsg(reply, 'bot');
  sending = false;
}
document.getElementById('sendBtn').addEventListener('click', ()=>{
  const v = chatInput.value;
  chatInput.value='';
  sendChat(v);
});
chatInput.addEventListener('keydown', (e)=>{
  if(e.key==='Enter'){ const v = chatInput.value; chatInput.value=''; sendChat(v); }
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
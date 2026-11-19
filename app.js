const paths={walk:'<path d="m7 21 3-7 3 3 1 5m-4-8 1-6 4 4 4 1M7 9l4-2"/><circle cx="12" cy="3" r="2"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',person:'<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',arrow:'<path d="m9 5 7 7-7 7"/>',back:'<path d="m14 5-7 7 7 7"/>',calendar:'<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16"/>',leaf:'<path d="M5 19C0 5 12 3 21 3c0 12-4 18-13 15M4 21 17 8"/>',cleanup:'<path d="m5 7 14 0M9 4h6M7 7l1 14h8l1-14M10 11v6m4-6v6"/>',history:'<path d="m3 8 9-5 9 5H3Zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18"/>',check:'<path d="m5 12 4 4L20 5"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[n]||paths.walk}</svg>`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories=['All','Walks','Runs','Cleanups','Nature','History','Other'];
let profile={username:'pondvisitor',avatar:'initials'};
const seed=[{id:'sunset',type:'Walk',tags:['Walks'],title:'Sunset pond walk',date:'2026-11-19',time:'16:30',duration:'30 minutes',host:'pondpal',initials:'PP',meeting:'Duck Pond gazebo',instruction:'Meet beside the gazebo entrance, on the pond-facing side.',going:6,tag:'Come on your own',description:'A relaxed loop with a quick hello at the gazebo. Come on your own; no need to keep a conversation going the whole way.'}, {id:'run',type:'Run',tags:['Runs'],title:'Morning pond run',date:'2026-11-20',time:'08:00',duration:'25 minutes',distance:'2 miles',host:'morningmiles',initials:'MM',meeting:'Duck Pond bridge',instruction:'Meet at the end of the bridge nearest Duck Pond Drive.',going:4,tag:'10–11 min/mile · conversational pace',description:'A short warm-up, then two miles at the listed pace. We plan to finish together. Bring water and arrive ready to start.'}, {id:'birds',type:'Nature',tags:['Walks','Nature'],title:'Beginner bird walk',date:'2026-11-21',time:'09:00',duration:'45 minutes',host:'pondwatcher',initials:'PW',meeting:'Duck Pond gazebo',instruction:'Meet beside the gazebo entrance, on the pond-facing side.',going:8,tag:'Beginners welcome',description:'A slow walk to look and listen for birds. No experience or binoculars needed. Bring binoculars if you have them.'}, {id:'cleanup',type:'Cleanup',tags:['Cleanups'],title:'Saturday pond cleanup',date:'2026-11-21',time:'10:00',duration:'1 hour',host:'pondneighbors',initials:'PN',meeting:'Duck Pond gazebo',instruction:'Meet beside the gazebo entrance. Look for the cleanup supplies.',going:5,tag:'Supplies provided',description:'Help collect litter along the pond paths. We’ll explain the tasks and share supplies before starting. Wear closed-toe shoes.'}, {id:'history',type:'History',tags:['Walks','History'],title:'Stories around the pond',date:'2026-11-22',time:'14:00',duration:'40 minutes',host:'localstories',initials:'LS',meeting:'Duck Pond gazebo',instruction:'Meet beside the gazebo entrance, on the pond-facing side.',going:3,tag:'Local history walk',description:'A short walk with stops to share stories about the pond and its surroundings. Curious newcomers are welcome; no preparation needed.'}];
seed.push({id:'soccer',type:'Other',tags:['Other'],title:'Casual soccer near Duck Pond',date:'2026-11-19',time:'17:30',duration:'45 minutes',host:'pondkickabout',initials:'PK',meeting:'Duck Pond gazebo',instruction:'Meet at the gazebo before walking to the field together.',going:4,tag:'All skill levels welcome',description:'A casual pickup game. Bring water and shoes you can run in.'});
let events=seed.map(e=>({...e})),state={},filter='All',homeScroll=0,recent=true,reportLevel='Moderate',reportAge='10 min ago',draft={},preview=null,sequence=0,pendingCancel=null,toastTimer,showPeople=false,previousRoute='';
const main=document.getElementById('main'),dock=document.getElementById('action-dock');
const getRoute=()=>location.hash.slice(1).split('?')[0] || 'home';
const accountLink = (destination, signup = !savedAccount) =>
 `#profile/${signup ? 'signup' : 'login'}?return=${encodeURIComponent(destination)}`;
function accountDestination() {
 const route = new URLSearchParams(location.hash.split('?')[1]).get('return');
 if (['home', 'schedule', 'create', 'profile', 'profile/edit'].includes(route)) return route;
 if (events.some(activity => route === 'activity/' + activity.id)) return route;
 return 'profile';
}
const eventIcon=e=>e.type==='Cleanup'?'cleanup':e.type==='History'?'history':e.type==='Nature'?'leaf':e.type==='Other'?'person':'walk';
const avatar=(initials='')=>`<span class="avatar ${initials?'named':''}">${initials?esc(initials):icon('person')}</span>`;
const avatars=(n=3)=>n>0?`<span class="avatars">${Array.from({length:Math.min(n,3)},(_,i)=>i===1?avatar('PJ'):avatar()).join('')}</span>`:'';
const count=e=>e.going+(state[e.id]?.joined?1:0);
const dateLabel=e=>new Date(e.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
const timeLabel=e=>new Date('2026-11-17T'+e.time+':00').toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
const tagMap={Walk:'Walks',Run:'Runs',Cleanup:'Cleanups',History:'History',Nature:'Nature',Other:'Other'};
const initials=()=>profile.username.slice(0,2).toUpperCase();
const myAvatar=()=>profile.avatar==='duck'?'<span class="avatar named">🦆</span>':avatar(initials());
const userHost=()=>esc(profile.username);
function toast(text){const t=document.getElementById('toast');t.textContent=text;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),2300)}
function resetDock(){dock.hidden=true;dock.innerHTML='';document.body.classList.remove('has-dock')}
function enableDock(html){dock.innerHTML=html;dock.hidden=false;document.body.classList.add('has-dock')}
function backLink(label='Explore',href='#home'){return `<a class="back" href="${href}">${icon('back')}${label}</a>`}
function card(e){return `<a class="activity-card" data-activity-type="${esc(e.type)}" href="#activity/${esc(e.id)}"><div class="card-top"><span class="type">${icon(eventIcon(e))}${esc(e.type)}</span><span>${esc(dateLabel(e))} · ${esc(timeLabel(e))}</span></div><h2>${esc(e.title)}</h2>${e.tag?`<p class="activity-summary">${esc(e.tag)}</p>`:''}<div class="card-meta">${icon('clock')}<span>${[e.duration,e.distance].filter(Boolean).map(esc).join(' · ')}</span></div><div class="card-meta">${icon('pin')}<span>${esc(e.meeting)}</span></div><div class="card-bottom"><span class="people-count">${avatars(count(e))}${count(e)} signed up</span><span class="${e.cancelled?'cancelled-label':state[e.id]?.joined?'signed-tag':'tag'}">${e.cancelled?'Cancelled':demoSignedIn && e.mine?'You’re hosting':demoSignedIn && state[e.id]?.joined?'✓ Signed up':''}</span></div></a>`}
function home(){
 resetDock();
 const activityResults = () => {
  const shown = events.filter(e => !e.cancelled && (filter === 'All' || e.tags.includes(filter)))
   .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
  return shown.length ? shown.map(card).join('') :
   '<div class="empty"><h2>No activities in this category yet</h2><a class="secondary" href="#create">Create an activity</a></div>';
 };
 main.innerHTML=`<div class="home-head"><div><h1>Explore</h1><p>Upcoming at the pond</p></div><a class="create" href="#create">＋ Create activity</a></div>
 <div class="explore-filter"><label for="explore-type">Activity type</label><select id="explore-type">${categories.map(type => `<option value="${type}" ${filter === type ? 'selected' : ''}>${type === 'All' ? 'All activities' : type}</option>`).join('')}</select></div>
 <a class="pond-strip" href="#pond"><span><span class="status-dot"></span><strong>${recent?'Pond: '+esc(reportLevel):'No recent reports'}</strong><span class="report-age">${recent?esc(reportAge)+' · reported':'Typical patterns'}</span></span>${icon('arrow')}</a>
 <section class="activity-list explore-list" aria-label="Upcoming activities">${activityResults()}</section>`;
 const list = main.querySelector('.explore-list');
 document.getElementById('explore-type').onchange = event => {
  filter = event.currentTarget.value;
  list.innerHTML = activityResults();
 };
 main.scrollTop=homeScroll;
}
function mapDiagram(){return `<div class="map-preview"><svg viewBox="0 0 360 134" preserveAspectRatio="none" role="img" aria-label="Illustrative pond diagram; meeting-point pin is not verified"><rect width="360" height="134" fill="#e2ede7"/><path d="M-10 110C50 73 53 27 130 22S196 60 236 53 282 0 370 7" fill="none" stroke="#f9fcfa" stroke-width="13"/><path d="M100 88C74 50 151 37 193 52S282 47 287 82 227 118 177 113 116 112 100 88" fill="#91b6a8"/><g fill="#b6d0bf"><circle cx="48" cy="39" r="11"/><circle cx="57" cy="24" r="8"/><circle cx="312" cy="109" r="13"/><circle cx="28" cy="122" r="10"/><circle cx="213" cy="13" r="8"/></g><text x="156" y="87" fill="#24564f" font-size="10" font-family="sans-serif">DUCK POND</text><circle cx="121" cy="44" r="15" fill="#24564f"/><path d="M121 35a6 6 0 0 0-6 6c0 4 6 9 6 9s6-5 6-9a6 6 0 0 0-6-6" fill="white"/><circle cx="121" cy="41" r="2" fill="#24564f"/></svg><span class="map-caption">Illustrative pin · not verified</span></div>`}
function eventContent(e,isPreview=false){const s=state[e.id]||{};return `${isPreview?'<div class="preview-label">PREVIEW · NOT PUBLISHED</div>':''}<header class="detail-header">${backLink(isPreview?'Edit activity':'All activities',isPreview?'#create':'#home')}<div class="title-row"><span class="type">${icon(eventIcon(e))}${esc(e.type)}</span>${e.cancelled?'<span class="cancelled-label">Cancelled</span>':''}</div><h1>${esc(e.title)}</h1>${e.tag?`<p class="activity-summary">${esc(e.tag)}</p>`:''}<div class="host">${e.mine?myAvatar():avatar(e.initials)}<span>Hosted by <strong>@${esc(e.host)}</strong></span></div></header><section class="facts" aria-label="Activity essentials"><div class="fact">${icon('calendar')}<div><strong>${esc(dateLabel(e))}</strong><small>${esc(timeLabel(e))}</small></div></div><div class="fact">${icon('walk')}<div><strong>${esc(e.duration)}</strong>${e.distance?`<small>${esc(e.distance)}</small>`:''}</div></div><div class="fact">${icon('pin')}<div><strong>${esc(e.meeting)}</strong><small>VT Duck Pond</small></div></div><div class="fact">${icon('person')}<div><strong>${isPreview?'No sign-ups yet':count(e)+' signed up'}</strong><small>${isPreview?'After publishing':'Planning to attend'}</small></div></div></section><div class="details"><section class="detail-section"><h2>What to expect</h2><p>${esc(e.description)}</p></section><section class="detail-section"><div class="meeting-top"><h2>Meeting point</h2><a class="map-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Virginia Tech '+e.meeting)}" target="_blank" rel="noopener">Google Maps</a></div><span class="meeting-name">${esc(e.meeting)}</span>${e.instruction?`<p>${esc(e.instruction)}</p>`:''}${mapDiagram()}</section>${isPreview?'':`<section class="detail-section"><button class="people-trigger" id="people-toggle" aria-expanded="${showPeople}"><span>Who’s signed up</span><span>${count(e)} ${icon('arrow')}</span></button><div class="people-summary">${avatars(count(e))}<span>${count(e)?'Private unless people choose to share.':'No sign-ups yet.'}</span></div><ul class="attendee-list" ${showPeople?'':'hidden'}>${Array.from({length:e.going},(_,i)=>`<li>${i===1?avatar('PJ')+'<span>@pondjane</span>':avatar()+'<span>Private attendee</span>'}</li>`).join('')}${s.joined?`<li>${s.visible?myAvatar():avatar()}<span>${s.visible?'@'+userHost():'Private attendee'} ${demoSignedIn?'<small>(you)</small>':''}</span></li>`:''}</ul></section>`}</div>`}
function visibilityLabel(s){return `<label class="privacy-label"><input type="checkbox" id="visibility" ${s.visible?'checked':''}><span>Show my name & avatar</span><span class="privacy-state">${s.visible?'Visible':'Private'}</span></label>`}
function details(id,keepScroll=false){const e=events.find(x=>x.id===id);if(!e){location.hash='home';return}const pos=main.scrollTop,s=state[id]||{joined:false,visible:false};main.innerHTML=eventContent(e);if(e.cancelled){enableDock('<div class="joined-state" style="color:var(--action)">This activity is cancelled</div><a class="secondary" href="#home">Find another activity</a>')}else if(!demoSignedIn){
 enableDock(`<a class="primary" href="${accountLink('activity/'+e.id)}">Sign in to join</a><p class="dock-note">Your sign-up is private by default.</p>`)
 }else if(e.mine){enableDock('<div class="host-actions"><span>You’re hosting this activity</span><button class="cancel-link" id="cancel-host">Cancel activity</button></div>');document.getElementById('cancel-host').onclick=()=>{pendingCancel=e.id;document.getElementById('cancel-dialog').showModal()}}else{enableDock(`${visibilityLabel(s)}${s.joined?`<div class="joined-state"><span class="join-check">${icon('check')}</span>You’re signed up</div><div class="dock-buttons"><a class="secondary" href="#schedule">My Schedule</a><button class="cancel-link" id="cancel">Cancel sign-up</button></div><p class="dock-note">Cancel quietly · No notifications</p>`:'<button class="primary" id="join">Join activity</button><p class="dock-note">Private unless you choose to share</p>'}`);document.getElementById('visibility').onchange=function(){const checked=this.checked;state[id]={...s,visible:checked};details(id,true);if(s.joined)toast(checked?'Username and avatar are now visible.':'You now appear as Private attendee.')};if(s.joined)document.getElementById('cancel').onclick=()=>{state[id]={joined:false,visible:false};details(id,true);toast('Sign-up cancelled · No notifications')};else document.getElementById('join').onclick=()=>{state[id]={joined:true,visible:document.getElementById('visibility').checked};details(id,true);dock.querySelector('.join-check').classList.add('join-ripple');toast('Added to My Schedule')}}if(!e.cancelled)document.getElementById('people-toggle').onclick=()=>{showPeople=!showPeople;details(id,true)};main.scrollTop=keepScroll?pos:0}
function schedule(){resetDock();const listed=events.filter(e=>state[e.id]?.joined||e.mine).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));const cancelled=listed.filter(e=>e.cancelled);main.innerHTML=`<div class="page-heading"><h1>My Schedule</h1><p>Your plans and activities you’re hosting.</p></div>${cancelled.map(e=>`<div class="notification" role="status"><strong>${esc(e.title)} was cancelled.</strong></div>`).join('')}${listed.length?`<section class="activity-list" aria-label="Scheduled activities">${listed.map(card).join('')}</section>`:`<section class="empty schedule-empty">${pondIllustration(true)}<h2>No plans yet, @${userHost()}</h2><p>Join an activity and it’ll show up here.</p><a class="primary" href="#home">Explore activities</a></section>`}`}
function pond(){
 resetDock();
 main.innerHTML=`<div class="page-heading"><h1>Pond Info</h1></div><div class="details">
 <section class="detail-section current-report"><div class="report-heading"><h2>Recent report</h2><span class="subtle-pill">Anonymous</span></div>
 <div class="pond-report"><span class="condition-icon" aria-hidden="true">${icon('person')}</span><div><strong>${recent?esc(reportLevel):'No recent reports'}</strong><small>${recent?'1 report · '+esc(reportAge):'No report in the last 30 min'}</small></div></div>
 <a class="primary" href="#report">Report busyness</a></section>
 <section class="detail-section"><div class="report-heading"><h2>Typical by time of day</h2><span class="subtle-pill">Historical</span></div>
 <div class="bars" role="img" aria-label="Illustrative typical busyness: 8 am quiet, noon moderate, 3 pm moderate, 5 pm busy, 8 pm moderate">${[['8 am',25,'Quiet'],['Noon',58,'Moderate'],['3 pm',58,'Moderate'],['5 pm',90,'Busy'],['8 pm',58,'Moderate']].map(([t,h,l])=>`<div class="bar ${h===90?'peak':''}"><span class="bar-value">${l}</span><div style="height:${h}%"></div><span>${t}</span></div>`).join('')}</div></section>
 <details class="about-reports"><summary>About these reports</summary><p>Anonymous reports expire after 30 minutes. Typical patterns describe past conditions, not what is happening now. No individual locations are shown.</p><p class="small-note">Prototype: report ages and chart values are simulated.</p></details></div>`;
}
function report(){resetDock();main.innerHTML=`<div class="page-heading">${backLink('Pond Info','#pond')}<h1>How busy is the pond?</h1></div><form class="form" id="report-form"><fieldset class="report-choices"><legend class="sr-only">Current busyness</legend>${[['Quiet','Plenty of space'],['Moderate','Some people around'],['Busy','Lots of people around']].map(([t,h])=>`<label class="report-choice"><input type="radio" name="level" value="${t}" required><span><strong>${t}</strong><small>${h}</small></span></label>`).join('')}</fieldset><p class="small-note">Anonymous · Expires in 30 min</p><button class="primary" type="submit">Submit report</button></form>`;document.getElementById('report-form').onsubmit=e=>{e.preventDefault();reportLevel=new FormData(e.target).get('level');reportAge='Just now';recent=true;location.hash='pond';toast('Report submitted')}}
function create(){
 resetDock();const d={type:'Walk',date:'2026-11-21',time:'10:00',meeting:'Duck Pond gazebo',...draft};
 main.innerHTML=`<div class="page-heading">${backLink()}<h1>Create activity</h1></div><form class="form" id="create-form">
 <label class="field"><span>Activity name</span><input name="title" maxlength="65" placeholder="e.g. Casual soccer" value="${esc(d.title)}" required></label>
 <label class="field"><span>Short summary (optional)</span><input name="tag" id="summary-input" maxlength="60" aria-describedby="summary-help summary-count" placeholder="e.g. Beginners welcome or 10–11 min/mile" value="${esc(d.tag)}"><small class="field-meta"><span id="summary-help">Shown on the activity card.</span><span id="summary-count">${(d.tag||'').length}/60</span></small></label>
 <label class="field"><span>Category</span><select name="type" id="activity-type">${['Walk','Run','Cleanup','History','Nature','Other'].map(t=>`<option ${t===d.type?'selected':''}>${t}</option>`).join('')}</select></label>
 <div class="form-row"><label class="field"><span>Date</span><input type="date" name="date" value="${esc(d.date)}" required></label><label class="field"><span>Start time</span><input type="time" name="time" value="${esc(d.time)}" required></label></div>
 <label class="field"><span>Meeting point</span><input name="meeting" value="${esc(d.meeting)}" placeholder="e.g. Duck Pond gazebo" maxlength="80" required></label>
 <details class="extra-directions" ${d.instruction?'open':''}><summary>Extra directions (optional)</summary><label class="field"><span class="sr-only">Extra directions</span><textarea name="instruction" placeholder="e.g. Pond-facing entrance; look for the orange bag" maxlength="150">${esc(d.instruction)}</textarea></label></details>
 <label class="field"><span>Expected duration</span><input name="duration" value="${esc(d.duration)}" placeholder="e.g. 45 minutes" maxlength="45" required></label>
 <label class="field" id="distance-field" ${['Walk','Run'].includes(d.type)?'':'hidden'}><span>Distance (optional)</span><input name="distance" value="${esc(d.distance)}" placeholder="e.g. 2 miles" maxlength="45" ${['Walk','Run'].includes(d.type)?'':'disabled'}></label>
 <label class="field"><span>What to expect</span><textarea name="description" maxlength="400" placeholder="What you’ll do, who it suits, and what to bring" required>${esc(d.description)}</textarea></label>
 <p class="disclosure">Host: <strong>@${userHost()}</strong> · Visible to everyone</p><p class="error" id="form-error" role="alert" hidden></p><button class="primary" type="submit">Preview activity</button></form>`;
 const form=document.getElementById('create-form');
 const capture=()=>{draft={...draft,...Object.fromEntries(new FormData(form))};document.getElementById('summary-count').textContent=document.getElementById('summary-input').value.length+'/60'};
 form.oninput=capture;
 document.getElementById('activity-type').onchange=function(){const distance=['Walk','Run'].includes(this.value);document.getElementById('distance-field').hidden=!distance;form.elements.distance.disabled=!distance;capture()};
 form.onsubmit=e=>{e.preventDefault();capture();const values=Object.fromEntries(new FormData(form));for(const k of Object.keys(values))values[k]=values[k].trim();const error=document.getElementById('form-error');if(!values.title||!values.meeting||!values.description||!values.duration){error.textContent='Add the missing activity details.';error.hidden=false;return}preview={...values,id:'preview',tags:[tagMap[values.type]],host:profile.username,initials:initials(),going:0,mine:true};location.hash='preview'};
}
function previewActivity(){if(!preview){location.hash='create';return}main.innerHTML=eventContent(preview,true);enableDock(`<p class="dock-note" style="margin:2px 0 9px">Host: @${userHost()} · Visible to everyone</p><div class="dock-buttons"><a class="secondary" href="#create">Edit</a><button class="primary" id="publish">Publish activity</button></div>`);document.getElementById('publish').onclick=()=>{const e={...preview,id:'created-'+(++sequence)};events.push(e);preview=null;draft={};filter='All';homeScroll=0;location.hash='home';toast('Activity published')}}
const demoStorageKey = 'duck-walk.demo-account';
let savedAccount = null;
let accountStorageAvailable = true;
try {
 const saved = JSON.parse(localStorage.getItem(demoStorageKey));
 if (saved && typeof saved.username === 'string' && /^[A-Za-z0-9_.-]{2,24}$/.test(saved.username)) savedAccount = saved;
} catch {
 accountStorageAvailable = false;
}
let demoSignedIn = savedAccount?.signedIn === true;
if (savedAccount) {
 profile = {username: savedAccount.username, avatar: savedAccount.avatar === 'duck' ? 'duck' : 'initials'};
}

function saveDemoAccount() {
 savedAccount = {...profile, signedIn: demoSignedIn};
 try {
  localStorage.setItem(demoStorageKey, JSON.stringify(savedAccount));
 } catch {
  accountStorageAvailable = false;
 }
}

function setDemoProfile(username, destination) {
 demoSignedIn = true;
 if (username !== profile.username) {
  profile = {username, avatar: 'initials'};
  state = {};
  events = events.filter(activity => !activity.mine);
  draft = {};
  preview = null;
 }
 for (const activity of events) {
  if (activity.mine) {
   activity.host = username;
   activity.initials = initials();
  }
 }
 saveDemoAccount();
 if (getRoute() === destination) render();
 else location.hash = destination;
}

function pondIllustration(quiet = false) {
 return `<svg class="account-landscape" viewBox="0 0 390 176" aria-hidden="true">
  <defs>
   <linearGradient id="pond-water" x2="0" y2="1">
    <stop stop-color="#c0d9cb"/><stop offset="1" stop-color="#e2ece3"/>
   </linearGradient>
   <filter id="pond-grain">
    <feTurbulence type="fractalNoise" baseFrequency=".56" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComposite in2="SourceAlpha" operator="in"/>
    <feBlend in2="SourceGraphic" mode="soft-light"/>
   </filter>
   <g id="pond-duck">
    <path d="M-13 3Q-20 5-24 3M-12 7q-7 2-12 1" stroke="#fffdf8" fill="none" stroke-linecap="round"/>
    <path d="M-13 0Q-19-6-15-6Q-7-2 0-5L2-12Q5-17 11-14Q15-11 12-6L10-3Q16-2 9 3Q1 8-9 4Z" fill="#385a4f"/>
    <path d="m13-11 7 2-8 2" fill="#bc6936"/>
    <path d="M-10 0q7 4 13 0" fill="none" stroke="#f6e6cf" stroke-width="2" stroke-linecap="round"/>
    <circle cx="10" cy="-11" r="1" fill="#fffdf8"/>
   </g>
  </defs>
  <path d="M0 64Q42 58 77 65T151 67Q218 46 279 58T390 54V176H0Z" fill="url(#pond-water)" opacity=".82"/>
  <g filter="url(#pond-grain)" opacity=".77">
   <circle cx="294" cy="38" r="21" fill="#e9be8a"/>
   <path d="M0 65Q28 32 60 54T130 57Q169 49 207 63Q130 69 81 78T0 77Z" fill="#8fab91"/>
   <path d="M224 64q33-26 71-11t95-9v36q-63-10-113-6z" fill="#a4beaa"/>
   <path d="M0 151q24-22 78-13l-6 38H0Zm390-16q-34 0-60 28l60 13Z" fill="#9db59a"/>
  </g>
  <g stroke="#fffdf8" stroke-width="2" opacity=".8" fill="none" stroke-linecap="round">
   <path d="M86 92q26-3 48 0m115-7q31-3 49 0m-61 62q27-3 49 0m-172 9q29-2 44 0m-1-26h21m101-15h38"/>
  </g>
  <g transform="translate(137 110)"><g class="${quiet ? '' : 'swimming-duck'}"><use href="#pond-duck"/></g></g>
  ${quiet ? '' : `<g transform="translate(222 132) scale(-.78 .78)"><g class="swimming-duck swimming-duck-slow"><use href="#pond-duck"/></g></g>`}
  <g fill="none" stroke="#486759" stroke-width="2" stroke-linecap="round">
   <path d="M23 163q-3-22-13-27m16 28q7-26 15-31m-13 31q-3-25 1-41m339 44q-6-25-19-35m20 36q2-24 10-40m-6 40q3-13 13-20"/>
  </g>
 </svg>`;
}

function accountPage(signup) {
 resetDock();
 const destination = accountDestination();
 const activity = events.find(item => destination === 'activity/' + item.id);
 const action = signup ? 'Create a demo account' : 'Log in';
 const reason = activity ? action + ' to join ' + activity.title + '.' :
  ({schedule:action + ' to see your plans.',create:action + ' to host an activity.'})[destination];
 const back = activity ? destination : 'home';
 const title = signup ? 'Create an account' : 'Log in';
 main.innerHTML = `<div class="account-page">
  ${pondIllustration()}
  <h1>${title}</h1>
  <p class="account-intro">${esc(reason || (signup ? 'Choose how people will see you at the pond.' : 'Meet up at Virginia Tech Duck Pond.'))}</p>
  <form id="account-form" aria-describedby="account-note">
   ${signup ? `<label class="field"><span>Username</span>
    <input name="username" required minlength="2" maxlength="24" pattern="[A-Za-z0-9_]{2,24}" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="pondwalker">
    <small>2–24 letters, numbers, or underscores.</small>
   </label>` : `<div class="account-identity">${myAvatar()}<span>@${userHost()}</span></div>`}
   <p id="account-note" class="small-note">Demo account. ${accountStorageAvailable ? 'Saved on this browser.' : 'Available until you reload.'}</p>
   <button type="submit" class="primary">${signup ? 'Create demo account' : 'Log in as demo user'}</button>
  </form>
  <p class="account-switch">${signup
   ? (savedAccount ? `Already have an account? <a href="${accountLink(destination,false)}">Log in</a>` : '')
   : `<a class="secondary" href="${accountLink(destination, true)}">Create an account</a>`}</p>
  <a class="back" href="#${esc(back)}">${activity ? 'Back to activity' : 'Continue exploring'}</a>
 </div>`;
 document.getElementById('account-form').onsubmit = event => {
  event.preventDefault();
  const username = signup ? new FormData(event.currentTarget).get('username') : profile.username;
  setDemoProfile(username, destination);
  toast(signup ? 'Demo account created' : 'Logged in to the demo');
 };
}

function profilePage(){
 resetDock();main.innerHTML=`<div class="page-heading profile-heading"><h1>Profile</h1><button class="secondary" id="demo-signout" type="button">Log out</button></div><div class="profile-card">${myAvatar()}<div><h2>@${userHost()}</h2><a class="text-button" href="#profile/edit">Edit profile</a></div></div><div class="details"><section class="detail-section"><h2>Activity visibility</h2><p>You join privately. Choose to share your name and avatar on each activity.</p></section><section class="detail-section"><h2>Event history</h2><div class="history-empty">${icon('calendar')}<span>No past activities yet</span></div></section></div>`;const signout = document.getElementById('demo-signout');if(signout)signout.onclick=logoutDemo;
}
function logoutDemo() {
 demoSignedIn = false;
 saveDemoAccount();
 location.hash = 'profile/login';
 toast('Logged out of the demo');
}

function editProfile(){
 resetDock();main.innerHTML=`<div class="page-heading">${backLink('Profile','#profile')}<h1>Edit profile</h1></div><form class="form" id="profile-form"><label class="field"><span>Username</span><input aria-label="Username" aria-describedby="username-help" name="username" value="${userHost()}" minlength="2" maxlength="24" pattern="[A-Za-z0-9_.-]{2,24}" title="2–24 letters, numbers, dots, underscores or hyphens" required autocomplete="off"><small id="username-help">Used when you host or choose to be visible.</small></label><fieldset class="avatar-options"><legend>Avatar</legend><label><input type="radio" name="avatar" value="initials" ${profile.avatar==='initials'?'checked':''}><span class="avatar named">${initials()}</span>Initials</label><label><input type="radio" name="avatar" value="duck" ${profile.avatar==='duck'?'checked':''}><span class="avatar named">🦆</span>Duck</label></fieldset><button class="primary" type="submit">Save changes</button></form>`;
 document.getElementById('profile-form').onsubmit=e=>{e.preventDefault();const form=new FormData(e.target);profile={username:form.get('username').trim(),avatar:form.get('avatar')};for(const activity of events)if(activity.mine){activity.host=profile.username;activity.initials=initials()}saveDemoAccount();location.hash='profile';toast('Profile updated')};
}

function updateTabs(){const r=getRoute(),active=r.startsWith('profile')?'profile':r==='schedule'?'schedule':['pond','report'].includes(r)?'pond':'home';document.querySelectorAll('[data-tab]').forEach(a=>{a.classList.toggle('active',a.dataset.tab===active);if(a.dataset.tab===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}
function render(){const r=getRoute();
 if (r === 'profile/login' && !savedAccount) {
  location.replace(accountLink(accountDestination(), true));
  return;
 }

 if (!demoSignedIn && ['schedule','create','preview','profile','profile/edit'].includes(r)) {
  location.replace(accountLink(r === 'preview' ? 'create' : r));
  return;
 }
if(previousRoute==='home')homeScroll=main.scrollTop;if(!r.startsWith('activity/')||!previousRoute.startsWith('activity/'))showPeople=false;if(r.startsWith('activity/'))details(r.slice(9));else if(r==='schedule')schedule();else if(r==='pond')pond();else if(r==='report')report();else if(r==='profile')demoSignedIn ? profilePage() : accountPage(false);else if(r==='profile/edit')demoSignedIn ? editProfile() : accountPage(false);else if(r==='profile/login')accountPage(false);else if(r==='profile/signup')accountPage(true);else if(r==='create')create();else if(r==='preview')previewActivity();else home();if(r!=='home')main.scrollTop=0;updateTabs();previousRoute=r}
window.addEventListener('hashchange', render);
document.querySelector('.close-dialog').onclick = event => event.currentTarget.closest('dialog').close();
document.getElementById('confirm-cancel').onclick=()=>{const e=events.find(e=>e.id===pendingCancel);document.getElementById('cancel-dialog').close();if(e){e.cancelled=true;details(e.id,true);toast('Activity cancelled · Notification simulated')}pendingCancel=null};render();

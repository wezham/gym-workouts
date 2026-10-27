/* IRON training dashboard. No remote runtime dependencies. */
(() => {
  'use strict';
  const plan = JSON.parse(document.getElementById('program-data').textContent);
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const civilToday = () => new Intl.DateTimeFormat('en-CA',{timeZone:plan.timezone || 'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const civilDay = value => {const [y,m,d]=value.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000;};
  function currentState() {
    const elapsed=civilDay(civilToday())-civilDay(plan.startDate);
    return {week:Math.max(0,Math.min(plan.weeks.length-1,Math.floor(elapsed/7))),before:elapsed<0,after:elapsed>=plan.weeks.length*7};
  }
  const current=currentState();
  const state={week:current.week,day:'Day 1'};
  const storageKey='iron-training:'+plan.startDate;
  let journal={}; let storageAvailable=true;
  try {const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))journal=saved;}catch{storageAvailable=false;}
  const key = index => `${state.week+1}:${state.day}:${index}`;
  function save() {try{localStorage.setItem(storageKey,JSON.stringify(journal));}catch{storageAvailable=false;} $('save-note').textContent=storageAvailable?'Your checks and training notes save on this device.':'Device storage is unavailable. Checks and notes last for this visit only.';}
  const entries = () => plan.weeks[state.week].days[state.day];
  function renderWeeks() {
    $('week-list').innerHTML=plan.weeks.map((week,index)=>`<button type="button" class="week-button ${index===state.week?'active':''}" data-week="${index+1}" aria-pressed="${index===state.week}" aria-label="Week ${week.weekNumber}: ${esc(week.focus)}"><span class="week-num">${String(week.weekNumber).padStart(2,'0')}</span><span><span class="week-name">${esc(week.focus)}${index===current.week&&!current.before&&!current.after?'<span class="current-indicator">now</span>':''}</span><span class="week-phase">${esc(week.phase)}</span></span><span class="week-arrow" aria-hidden="true">↗</span></button>`).join('');
    $('week-list').querySelectorAll('button').forEach((button,index)=>button.addEventListener('click',()=>{state.week=index;render();}));
  }
  function renderCompletion() {
    const done=entries().filter((_,index)=>journal[key(index)]?.done).length;
    $('completion-count').textContent=`${done} / ${entries().length} movements complete`;
    $('session-progress').value=100*done/entries().length;
  }
  function renderExercises() {
    $('exercise-list').innerHTML=entries().map((entry,index)=>{
      const record=journal[key(index)]||{};
      return `<article class="exercise ${record.done?'done':''}" data-exercise="${index}"><div class="exercise-top"><input id="exercise-${index}" class="checkbox checkbox-primary" type="checkbox" ${record.done?'checked':''} aria-label="Complete ${esc(entry.exercise)}"><span class="block">${esc(entry.block)}</span><div><h3><label for="exercise-${index}">${esc(entry.exercise)}</label></h3><div class="exercise-caption">${entry.region==='lower'?'Lower body':'Upper body'} · ${esc(entry.notes)}</div></div><div class="prescription"><strong>${entry.sets} × ${esc(entry.reps)}</strong><span>REST ${entry.rest} SEC</span></div></div><details><summary>Technique, swaps & training log</summary><p>${esc(entry.description)}</p><p><strong>Equipment busy?</strong> ${esc(entry.alternative)}</p><label class="log-label" for="log-${index}">Load, reps & notes</label><input id="log-${index}" class="input log-input" type="text" maxlength="300" placeholder="e.g. 20 kg · 10 / 9 / 8 reps" value="${esc(record.note||'')}" autocomplete="off"><button class="btn btn-outline exercise-rest" type="button" data-rest="${entry.rest}">Start ${entry.rest}s rest</button></details></article>`;
    }).join('');
    $('exercise-list').querySelectorAll('.exercise').forEach((article,index)=>{
      article.querySelector('input[type=checkbox]').addEventListener('change',event=>{journal[key(index)]={...journal[key(index)],done:event.target.checked};article.classList.toggle('done',event.target.checked);save();renderCompletion();});
      article.querySelector('.log-input').addEventListener('input',event=>{journal[key(index)]={...journal[key(index)],note:event.target.value};save();});
      article.querySelector('[data-rest]').addEventListener('click',event=>{setTimer(Number(event.target.dataset.rest));startTimer();});
    });
    renderCompletion();
  }
  function render() {
    const week=plan.weeks[state.week], moves=entries();
    const upper=moves.filter(x=>x.region==='upper').reduce((sum,x)=>sum+x.sets,0),lower=moves.filter(x=>x.region==='lower').reduce((sum,x)=>sum+x.sets,0);
    $('session-eyebrow').textContent=`WEEK ${String(week.weekNumber).padStart(2,'0')} / ${plan.weeks.length}`;
    $('phase-badge').textContent=week.phase;
    $('session-title').textContent=state.day==='Day 1'?'Push, pull. Repeat.':'Fresh angles. Same intent.';
    $('session-focus').textContent=week.focus;
    $('session-number').textContent=state.day==='Day 1'?'01':'02';
    ['Day 1','Day 2'].forEach((day,index)=>{const button=$('day-'+(index+1));button.classList.toggle('active',state.day===day);button.setAttribute('aria-pressed',String(state.day===day));});
    $('session-meta').innerHTML=`<span><strong>${moves.length}</strong> movements</span><span><strong>${upper+lower}</strong> working sets</span><span><strong>${upper} upper / ${lower} lower</strong></span><span><strong>${esc(week.rir)} RIR</strong> target</span>`;
    $('session-note').textContent=week.rir>=4?'Recovery week: lighter loads, fewer sets. Finish feeling fresh.':'First two lifts: straight sets. B pair: alternate if convenient. Legs: controlled sets. D pair: optional superset.';
    renderWeeks();renderExercises();save();
  }
  function renderGuidance() {
    const labels={schedule:'Make room for recovery',warmup:'Earn your working sets',progression:'Add a little. Keep it clean.',effort:'Leave something in the tank',variety:'Variety with a purpose',balance:'Your 80 / 20 emphasis',goal:'Build for the long run',core:'A little extra, if you like',cycle:'Finish, reflect, refresh'};
    const guide=plan.guidance||{};
    $('guidance-grid').innerHTML=Object.entries(labels).filter(([key])=>guide[key]).map(([key,title],index)=>`<article class="guidance-card"><span class="rule-number">${String(index+1).padStart(2,'0')} / ${esc(key.toUpperCase())}</span><h3>${title}</h3><p>${esc(guide[key])}</p></article>`).join('')+(Array.isArray(guide.sources)?`<article class="guidance-card"><span class="rule-number">THE READING</span><h3>Built on the fundamentals</h3><p>${guide.sources.filter(source=>/^https:\/\//.test(source.url)).map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`).join('<br>')}</p></article>`:'');
  }
  let timerSeconds=90,timerEnd=null,timerInterval=null;
  function renderTimer() {$('timer-display').textContent=`${String(Math.floor(timerSeconds/60)).padStart(2,'0')}:${String(timerSeconds%60).padStart(2,'0')}`;$('timer-toggle').textContent=timerEnd?'Pause':timerSeconds===0?'Restart':'Start';}
  function stopTimer() {clearInterval(timerInterval);timerInterval=null;timerEnd=null;}
  function setTimer(seconds) {stopTimer();timerSeconds=seconds;renderTimer();$('timer-status').textContent='';}
  function startTimer() {
    if(timerEnd)return;
    if(timerSeconds===0)timerSeconds=Number($('timer-duration').value);
    timerEnd=Date.now()+timerSeconds*1000;
    timerInterval=setInterval(()=>{timerSeconds=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));if(timerSeconds===0){stopTimer();$('timer-status').textContent='Rest complete. Ready for your next set.';}renderTimer();},250);renderTimer();
  }
  $('timer-toggle').addEventListener('click',()=>{if(timerEnd){timerSeconds=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));stopTimer();renderTimer();}else startTimer();});
  $('timer-reset').addEventListener('click',()=>setTimer(Number($('timer-duration').value)));
  $('timer-duration').addEventListener('change',()=>setTimer(Number($('timer-duration').value)));
  $('day-1').addEventListener('click',()=>{state.day='Day 1';render();});
  $('day-2').addEventListener('click',()=>{state.day='Day 2';render();});
  $('current-week').addEventListener('click',()=>{state.week=currentState().week;render();});
  $('cycle-length').textContent=String(plan.weeks.length).padStart(2,'0');
  $('week-count').textContent=plan.weeks.length+' WEEKS';
  const startLabel=new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(plan.startDate+'T00:00:00Z'));
  $('cycle-date').textContent=`Starts ${startLabel} · ${plan.timezone}${current.before?' · Cycle not started yet.':current.after?' · Cycle complete. Review your loads before starting a new cycle.':''}`;
  renderGuidance();render();renderTimer();
})();

/*
  Mobility Game - static JS
  - i18n (EN/DE)
  - identity/help modals
  - dice list and modal with 3D roll
  - landing options, points & challenge flows
  - bottom sheet with stats + emissions line chart (canvas)
  - localStorage persistence + CSV export
*/

(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const StorageKeys = {
    lang: 'mg.lang',
    state: 'mg.state',
  };

  const defaultState = {
    currentLanguage: 'en',
    useIdentity: false,
    activeIdentity: null, // { id, name }
    points: 0,
    challengeCount: 0,
    rounds: [], // { turn, diceId, diceColor, steps, emissions, pointsAfter }
  };

  const translations = {
    en: {
      'nav.play': 'Play',
      'landing.title': 'Sustainable Mobility Game',
      'landing.subtitle': 'Learn and play about sustainable mobility choices.',
      'landing.cta': 'Start Game',
      'game.identity': 'Identity cards',
      'game.help': 'Help',
      'identity.title': 'Play with identity cards?',
      'identity.desc': 'Identity cards let you role-play (e.g., young, elderly, person with disabilities) to reflect diverse mobility needs.',
      'help.title': 'How to play',
      'help.desc': 'Choose a die, roll it, then follow the board steps and note emissions. Use points/challenge if you land on those spaces.',
      'dice.small': 'Roll to see your mobility action!',
      'dice.cta': 'Tap the die to roll',
      'landingOptions.title': 'Did you land on a special field?',
      'landingOptions.points': 'Points',
      'landingOptions.challenge': 'Challenge',
      'points.title': 'Add points',
      'points.hint': 'How many points?',
      'challenge.title': 'Challenge',
      'challenge.points': 'Points',
      'stats.points': 'Points',
      'stats.challenges': 'Challenges',
      'stats.reset': 'Reset',
      'stats.download': 'Download CSV',
      'chart.rounds': 'Rounds',
      'chart.emissions': 'Emissions',
      'common.no': 'No',
      'common.yes': 'Yes',
      'common.next': 'Next',
      'common.done': 'Done',
    },
    de: {
      'nav.play': 'Spielen',
      'landing.title': 'Spiel zur nachhaltigen Mobilität',
      'landing.subtitle': 'Lerne und spiele über nachhaltige Mobilitätsentscheidungen.',
      'landing.cta': 'Spiel starten',
      'game.identity': 'Identitätskarten',
      'game.help': 'Hilfe',
      'identity.title': 'Mit Identitätskarten spielen?',
      'identity.desc': 'Identitätskarten ermöglichen Rollenspiel (z. B. jung, älter, mit Behinderungen), um unterschiedliche Mobilitätsbedürfnisse zu berücksichtigen.',
      'help.title': 'So funktioniert es',
      'help.desc': 'Wähle einen Würfel, würfle, folge den Feldern und notiere Emissionen. Nutze Punkte/Herausforderung bei entsprechenden Feldern.',
      'dice.small': 'Würfle für deine Mobilitätsaktion!',
      'dice.cta': 'Tippe zum Würfeln',
      'landingOptions.title': 'Bist du auf einem Sonderfeld gelandet?',
      'landingOptions.points': 'Punkte',
      'landingOptions.challenge': 'Herausforderung',
      'points.title': 'Punkte hinzufügen',
      'points.hint': 'Wie viele Punkte?',
      'challenge.title': 'Herausforderung',
      'challenge.points': 'Punkte',
      'stats.points': 'Punkte',
      'stats.challenges': 'Herausforderungen',
      'stats.reset': 'Zurücksetzen',
      'stats.download': 'CSV herunterladen',
      'chart.rounds': 'Runden',
      'chart.emissions': 'Emissionen',
      'common.no': 'Nein',
      'common.yes': 'Ja',
      'common.next': 'Weiter',
      'common.done': 'Fertig',
    }
  };

  const identities = [
    { id: 'youth', name: { en: 'Young person', de: 'Junge Person' } },
    { id: 'elderly', name: { en: 'Elderly', de: 'Ältere Person' } },
    { id: 'disability', name: { en: 'Person with disabilities', de: 'Person mit Behinderung' } },
  ];

  const challenges = [
    { id: 'c1', text: { en: 'Bike to your destination in the rain.', de: 'Fahre bei Regen mit dem Fahrrad zum Ziel.' } },
    { id: 'c2', text: { en: 'Public transport delay: plan a detour.', de: 'ÖPNV verspätet: Plane eine Umleitung.' } },
    { id: 'c3', text: { en: 'Car-free day: choose an alternative.', de: 'Autofreier Tag: Wähle eine Alternative.' } },
  ];

  // Each die has 3 outcomes (parallel faces): steps & emissions
  // Also provide color for chart
  const diceDefs = [
    { id: 'A', color: getCss('--dice-a'), name: { en: 'Walking', de: 'Zu Fuß' } , heroIndexBase: 0, outcomes: [
      { face: 1, steps: 1, emissions: 0, spriteIndex: 0 },
      { face: 2, steps: 1, emissions: 0, spriteIndex: 1 },
      { face: 3, steps: 2, emissions: 0, spriteIndex: 2 },
    ] },
    { id: 'B', color: getCss('--dice-b'), name: { en: 'Bike', de: 'Fahrrad' } , heroIndexBase: 3, outcomes: [
      { face: 1, steps: 3, emissions: 1, spriteIndex: 3 },
      { face: 2, steps: 2, emissions: 1, spriteIndex: 4 },
      { face: 3, steps: 3, emissions: 2, spriteIndex: 5 },
    ] },
    { id: 'C', color: getCss('--dice-c'), name: { en: 'Public Transport', de: 'ÖPNV' } , heroIndexBase: 6, outcomes: [
      { face: 1, steps: 3, emissions: 2, spriteIndex: 6 },
      { face: 2, steps: 4, emissions: 3, spriteIndex: 7 },
      { face: 3, steps: 4, emissions: 4, spriteIndex: 8 },
    ] },
    { id: 'D', color: getCss('--dice-d'), name: { en: 'Car', de: 'Auto' } , heroIndexBase: 9, outcomes: [
      { face: 1, steps: 5, emissions: 4, spriteIndex: 9 },
      { face: 2, steps: 5, emissions: 5, spriteIndex: 10 },
      { face: 3, steps: 6, emissions: 6, spriteIndex: 11 },
    ] },
  ];

  function getCss(varName){
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  function loadState(){
    const raw = localStorage.getItem(StorageKeys.state);
    if(!raw){
      const pref = localStorage.getItem(StorageKeys.lang);
      const lang = pref ? pref : (navigator.language?.startsWith('de') ? 'de' : 'en');
      const init = { ...defaultState, currentLanguage: lang };
      saveState(init);
      return init;
    }
    try{
      const data = JSON.parse(raw);
      return { ...defaultState, ...data };
    }catch{
      return { ...defaultState };
    }
  }
  function saveState(state){
    localStorage.setItem(StorageKeys.state, JSON.stringify(state));
  }
  function setLanguage(lang){
    const state = loadState();
    state.currentLanguage = lang;
    localStorage.setItem(StorageKeys.lang, lang);
    saveState(state);
    applyI18n(lang);
    updateUIFromState();
  }
  function t(key){
    const st = loadState();
    return translations[st.currentLanguage]?.[key] ?? translations.en[key] ?? key;
  }
  function applyI18n(lang){
    $$('[data-i18n]').forEach(el => { el.textContent = translations[lang]?.[el.dataset.i18n] ?? el.textContent; });
    $$('[data-i18n-title]').forEach(el => { el.title = translations[lang]?.[el.dataset.i18nTitle] ?? el.title; });
  }

  // Rendering helpers
  function renderDiceList(){
    const container = $('#dice-list');
    if(!container) return;
    container.innerHTML = '';
    const st = loadState();
    diceDefs.forEach((die, idx) => {
      const btn = document.createElement('button');
      btn.className = 'dice-btn';
      btn.dataset.diceId = die.id;
      btn.innerHTML = `
        <div class="thumb" style="background-position-y: -${(die.heroIndexBase)*64}px"></div>
        <div class="name">${die.name[st.currentLanguage] || die.name.en}</div>
        <div><button class="help" aria-label="help">?</button></div>
      `;
      btn.addEventListener('click', (ev) => {
        if(ev.target.closest('.help')){
          showHelpForDie(die);
        } else {
          openDiceModal(die);
        }
      });
      container.appendChild(btn);
    });
  }

  function showHelpForDie(die){
    const help = $('#modal-help');
    if(!help) return;
    help.showModal();
  }

  // Dice modal state
  let currentDie = null;
  let lastRoll = null; // { outcome, faceRotation }
  let hasRolled = false;

  function openDiceModal(die){
    currentDie = die;
    lastRoll = null;
    hasRolled = false;
    const dlg = $('#modal-dice');
    const hero = $('#dice-hero-image');
    const cube = $('#dice-cube');
    const cta = $('#dice-cta');
    const step = $('#dice-step');
    step.hidden = true;
    cta.textContent = t('dice.cta');
    hero.style.backgroundPositionY = `-${1068}px`;
    setCubeFacesForDie(cube, die);
    dlg.showModal();
    // Auto-roll shortly after opening to ensure transitions apply
    setTimeout(() => rollDie(), 60);
  }

  function setCubeFacesForDie(cube, die){
    const sizeY = 94; // sprite frame height placeholder
    const faces = $$('.face', cube);
    // Map three outcomes to parallel faces
    const mapping = [
      { cls: 'front', idx: 0 }, { cls: 'back', idx: 0 },
      { cls: 'right', idx: 1 }, { cls: 'left', idx: 1 },
      { cls: 'top', idx: 2 }, { cls: 'bottom', idx: 2 },
    ];
    mapping.forEach((m, i) => {
      const outcome = die.outcomes[m.idx];
      const el = cube.querySelector('.' + m.cls);
      if(el){
      	el.style.backgroundPositionY = `-${outcome.spriteIndex*sizeY}px`; 
        /*switch(outcome.spriteIndex){
          case 0: el.style.backgroundPositionY = `-${0*sizeY}px`; break;
          case 1: el.style.backgroundPositionY = `-${1*sizeY}px`; break;
          case 2: el.style.backgroundPositionY = `-${1.96*sizeY}px`; break;
          case 3: el.style.backgroundPositionY = `-${2.95*sizeY}px`; break;
          case 4: el.style.backgroundPositionY = `-${3.92*sizeY}px`; break;
          case 5: el.style.backgroundPositionY = `-${4.9*sizeY}px`; break;
          case 6: el.style.backgroundPositionY = `-${5.89*sizeY}px`; break;
          case 7: el.style.backgroundPositionY = `-${6.85*sizeY}px`; break;
          case 8: el.style.backgroundPositionY = `-${7.83*sizeY}px`; break;
          case 9: el.style.backgroundPositionY = `-${8.82*sizeY}px`; break;
          case 10: el.style.backgroundPositionY = `-${9.8*sizeY}px`; break;
          case 11: el.style.backgroundPositionY = `-${10.77*sizeY}px`; break;

        }*/
      }
    });
    cube.style.transform = 'rotateX(0deg) rotateY(0deg)';
  }

  function rollDie(){
    if(!currentDie) return;
    const cube = $('#dice-cube');
    const duration = 800 + Math.floor(Math.random()*600); // 0.8-1.4s
    const targetIdx = Math.floor(Math.random()*3); // 0..2 (three outcomes)
    const rotations = [
      { x: 0, y: 0 }, // front
      { x: 0, y: -90 }, // right
      { x: -90, y: 0 }, // top
    ];
    const faceTarget = rotations[targetIdx];
    // spin random and settle to faceTarget
    const randX = 360* (2 + Math.floor(Math.random()*2));
    const randY = 360* (2 + Math.floor(Math.random()*2));
    cube.style.transitionDuration = duration + 'ms';
    cube.style.transform = `rotateX(${randX + faceTarget.x}deg) rotateY(${randY + faceTarget.y}deg)`;
    hasRolled = true;
    // when done
    setTimeout(() => {
      const outcome = currentDie.outcomes[targetIdx];
      lastRoll = { outcome, faceRotation: faceTarget };
      logRound(currentDie, outcome);
      updateDiceHeroAfterRoll(currentDie, outcome);
      $('#dice-cta').textContent = `+${outcome.steps} / ${outcome.emissions} CO₂`;
    }, duration + 20);
  }

  function updateDiceHeroAfterRoll(die, outcome){
    const hero = $('#dice-hero-image');
    hero.style.backgroundPositionY = `-${outcome.spriteIndex*89}px`;
  }

  function logRound(die, outcome){
    const st = loadState();
    const turn = st.rounds.length + 1;
    const entry = {
      turn,
      diceId: die.id,
      diceColor: die.color,
      steps: outcome.steps,
      emissions: outcome.emissions,
      pointsAfter: st.points,
    };
    st.rounds.push(entry);
    saveState(st);
    refreshStats();
    drawEmissionsChart();
  }

  function openLandingOptions(){
    const dlg = $('#modal-landing');
    dlg.showModal();
  }

  function openPointsModal(presetDoneCallback){
    const dlg = $('#modal-points');
    const input = $('#points-input');
    input.value = '';
    dlg.returnValue = '';
    dlg.showModal();
    $('#points-done').onclick = () => {
      const add = parseInt(input.value || '0', 10) || 0;
      const st = loadState();
      st.points += add;
      saveState(st);
      refreshStats();
      dlg.close('done');
      if(typeof presetDoneCallback === 'function') presetDoneCallback();
    };
  }

  function openChallengeModal(afterFlow){
    const st = loadState();
    const lang = st.currentLanguage;
    const pick = challenges[Math.floor(Math.random()*challenges.length)];
    const dlg = $('#modal-challenge');
    $('#challenge-text').textContent = pick.text[lang] || pick.text.en;
    dlg.showModal();
    $('#challenge-points').onclick = () => {
      dlg.close('points');
      openPointsModal(() => { resetDiceModalState(); if(afterFlow) afterFlow(); });
    };
    $('#challenge-done').onclick = () => {
      const s = loadState();
      s.challengeCount += 1;
      saveState(s);
      refreshStats();
      resetDiceModalState();
      dlg.close('done');
      if(afterFlow) afterFlow();
    };
  }

  function resetDiceModalState(){
    currentDie = null; lastRoll = null; hasRolled = false;
    $('#modal-dice')?.close?.();
  }

  function refreshStats(){
    const st = loadState();
    $('#stat-points-value').textContent = String(st.points);
    $('#stat-challenges-value').textContent = String(st.challengeCount);
  }

  function updateUIFromState(){
    const st = loadState();
    applyI18n(st.currentLanguage);
    // active identity pill
    const pill = $('#active-identity');
    if(pill){
      if(st.useIdentity && st.activeIdentity){
        const label = st.activeIdentity.name[st.currentLanguage] || st.activeIdentity.name.en;
        pill.textContent = label;
        pill.hidden = false;
      } else {
        pill.hidden = true;
      }
    }
    refreshStats();
    renderDiceList();
    drawEmissionsChart();
  }

  // Emissions chart (simple canvas line chart)
  function drawEmissionsChart(){
    const canvas = $('#emissions-chart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const st = loadState();
    const rounds = st.rounds;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w = rect.width; const h = rect.height;
    ctx.clearRect(0,0,w,h);

    // Layout
    const marginLeft = 44, marginRight = 12, marginTop = 16, marginBottom = 32;
    const plotW = Math.max(1, w - marginLeft - marginRight);
    const plotH = Math.max(1, h - marginTop - marginBottom);

    // Axes
    ctx.strokeStyle = '#2a2f3a'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, marginTop + plotH);
    ctx.lineTo(marginLeft + plotW, marginTop + plotH);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Inter, system-ui, sans-serif';
    // Y label rotated
    ctx.save();
    ctx.translate(14, marginTop + plotH/2);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = 'center';
    ctx.fillText(t('chart.emissions'), 0, 0);
    ctx.restore();
    // X label
    ctx.textAlign = 'center';
    ctx.fillText(t('chart.rounds'), marginLeft + plotW/2, h - 8);

    // Scale
    const maxY = Math.max(5, ...rounds.map(r=>r.emissions));
    const stepX = plotW / Math.max(1, rounds.length);

    // Points
    rounds.forEach((r, i) => {
      const x = marginLeft + (i+1)*stepX;
      const y = marginTop + plotH - (r.emissions / maxY) * plotH;
      ctx.fillStyle = r.diceColor || '#888';
      ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
    });
    // Line
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.beginPath();
    rounds.forEach((r, i) => {
      const x = marginLeft + (i+1)*stepX;
      const y = marginTop + plotH - (r.emissions / maxY) * plotH;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }

  // CSV export
  function downloadCsv(){
    const st = loadState();
    const rows = [['turn','dice_id','color','steps','emissions','points']];
    let sumSteps = 0, sumEm = 0, sumPts = 0;
    st.rounds.forEach(r => {
      rows.push([r.turn, r.diceId, r.diceColor, r.steps, r.emissions, r.pointsAfter]);
      sumSteps += r.steps; sumEm += r.emissions; sumPts = r.pointsAfter; // pointsAfter reflects cumulative
    });
    rows.push(['SUM','', '', sumSteps, sumEm, sumPts]);
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mobility_game_round.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // Bottom sheet interactions
  function setupBottomSheet(){
    const sheet = $('#bottom-sheet');
    const handle = $('#sheet-handle');
    let startY = 0; let startOpen = false; let dragging = false; let dragged = false; let usedEndEvent = "";

    const onStart = (y) => { startY = y; startOpen = sheet.getAttribute('aria-expanded') === 'true'; dragging = true; document.body.style.userSelect = 'none'; };
    const onMove = (y) => {
      if(!dragging) return;
      const dy = y - startY;
      if(dy < -10) sheet.setAttribute('aria-expanded','true');
      if(dy > 10) sheet.setAttribute('aria-expanded','false');
      dragged = true;
    };
    const onEnd = (event, y) => { 
    	dragging = false;
    	if (usedEndEvent == ""){ usedEndEvent = event; }
    	
    	if(dragged){ dragged = false; document.body.style.userSelect = ''; }
    	else if (usedEndEvent == event && y == startY){ sheet.setAttribute('aria-expanded', sheet.getAttribute('aria-expanded')==='true'?'false':'true'); } 
    };

    handle.addEventListener('pointerdown', (e)=>{ handle.setPointerCapture(e.pointerId); onStart(e.clientY); });
    handle.addEventListener('touchstart', (e)=>{ handle.setPointerCapture(e.changedTouches[0].identifier); onStart(e.changedTouches[0].clientY); });
    handle.addEventListener('pointermove', (e)=> onMove(e.clientY));
    handle.addEventListener('touchmove', (e)=> onMove(e.changedTouches[0].clientY));
    handle.addEventListener('pointerup', (e)=> onEnd('pointerup', e.clientY));
    handle.addEventListener('touchend', (e)=> onEnd('touchend', e.changedTouches[0].clientY));
    handle.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); sheet.setAttribute('aria-expanded', sheet.getAttribute('aria-expanded')==='true'?'false':'true'); }
    });
  }

  // Identity modal flow
  function setupIdentity(){
    const btn = $('#btn-identity');
    const dlg = $('#modal-identity');
    if(!btn || !dlg) return;
    btn.addEventListener('click', () => {
      dlg.returnValue = '';
      dlg.showModal();
    });
    dlg.addEventListener('close', () => {
      const st = loadState();
      if(dlg.returnValue === 'yes'){
        const pick = identities[Math.floor(Math.random()*identities.length)];
        st.useIdentity = true;
        st.activeIdentity = pick;
      } else if(dlg.returnValue === 'no'){
        st.useIdentity = false;
        st.activeIdentity = null;
      }
      saveState(st);
      updateUIFromState();
    });
  }

  // Language switch on landing
  function setupLanguageSwitch(){
    $$('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
    const st = loadState();
    applyI18n(st.currentLanguage);
  }

  function setupHelp(){
    $('#btn-help')?.addEventListener('click', ()=> $('#modal-help').showModal());
  }

  function setupDiceModal(){
    const cube = $('#dice-cube');
    const next = $('#dice-next');
    cube?.addEventListener('click', () => rollDie());
    next?.addEventListener('click', (e) => {
      e.preventDefault();
      if(!hasRolled){ rollDie(); return; }
      $('#modal-dice')?.close?.('next');
      openLandingOptions();
    });
  }

  function setupLandingFlow(){
    const dlg = $('#modal-landing');
    $('#landing-points')?.addEventListener('click', (e)=>{ e.preventDefault(); dlg.close('points'); openPointsModal(()=>{ resetDiceModalState(); }); });
    $('#landing-challenge')?.addEventListener('click', (e)=>{ e.preventDefault(); dlg.close('challenge'); openChallengeModal(()=>{}); });
    dlg?.addEventListener('close', ()=>{
      if(dlg.returnValue === 'no'){ resetDiceModalState(); }
    });
  }

  function setupStatsActions(){
    $('#btn-reset')?.addEventListener('click', ()=>{
      const lang = loadState().currentLanguage;
      // Clear saved state and set known baseline
      saveState({ ...defaultState, currentLanguage: lang });
      // Reset transient runtime bits
      currentDie = null; lastRoll = null; hasRolled = false;
      // Close any open modals
      try{ $('#modal-dice')?.close?.(); }catch{}
      try{ $('#modal-landing')?.close?.(); }catch{}
      try{ $('#modal-points')?.close?.(); }catch{}
      try{ $('#modal-challenge')?.close?.(); }catch{}
      // Collapse sheet
      $('#bottom-sheet')?.setAttribute('aria-expanded','false');
      // Refresh UI and redraw empty chart
      updateUIFromState();
      drawEmissionsChart();
    });
    $('#btn-download')?.addEventListener('click', downloadCsv);
    $('#stat-points')?.addEventListener('click', ()=> openPointsModal(()=>{}));
  }

  function init(){
    // ensure assets path placeholders exist even if images missing
    // Page-specific
    const page = document.body.dataset.page;
    if(page === 'landing'){
      setupLanguageSwitch();
    }
    if(page === 'game'){
      setupHelp();
      setupIdentity();
      setupDiceModal();
      setupLandingFlow();
      setupBottomSheet();
      setupStatsActions();
      updateUIFromState();
      window.addEventListener('resize', drawEmissionsChart);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();



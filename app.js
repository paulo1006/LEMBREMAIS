// ── CONSTANTES DE STATUS (Refatoração 1: eliminar magic strings) ──
const STATUS = { TAKEN: 'taken', PENDING: 'pending', MISSED: 'missed' };
const FREQ_LABEL = { daily: 'Todos os dias', weekly: 'Semanal', monthly: 'Mensal' };

// ── STATE ──
// Refatoração 2: localStorage com tratamento de erro
function safeLoad(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

const state = {
  currentScreen: 'splash',
  user: safeLoad('lembre_user', null),
  medications: safeLoad('lembre_meds', []),
  history: safeLoad('lembre_history', []),
  editingMed: null,
  detailMed: null,
  filterTab: 'todos',
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  times: ['08:00'],
};

function save() {
  try {
    localStorage.setItem('lembre_meds', JSON.stringify(state.medications));
    localStorage.setItem('lembre_history', JSON.stringify(state.history));
    if (state.user) localStorage.setItem('lembre_user', JSON.stringify(state.user));
  } catch (e) {
    console.warn('Erro ao salvar dados locais:', e);
  }
}

// ── NAVIGATION ──
function go(screen) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.setAttribute('aria-hidden', 'true');
  });
  const el = document.getElementById(screen);
  el.classList.add('active');
  el.removeAttribute('aria-hidden');
  state.currentScreen = screen;
  updateNav(screen);
  if (screen === 'home') renderHome();
  if (screen === 'medications') renderMedications();
  if (screen === 'history') renderHistory();
  if (screen === 'calendar') renderCalendar();
  if (screen === 'profile') renderProfile();
  if (screen === 'medDetail') renderDetail();
  if (screen === 'addMed') renderAddMed();
  // Acessibilidade: mover foco para o título da tela (Correção 3)
  setTimeout(() => {
    const heading = el.querySelector('h1, .header-title, .login-title, .splash-title');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
  }, 50);
}

function updateNav(screen) {
  const navMap = { home: 0, medications: 1, history: 2, calendar: 3, profile: 4 };
  document.querySelectorAll('.nav-item').forEach((el, i) => {
    const isActive = navMap[screen] === i;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

// ── TOAST (Acessibilidade: região aria-live) ──
function toast(msg) {
  const live = document.getElementById('a11y-live');
  if (live) live.textContent = msg;
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); if (live) live.textContent = ''; }, 2600);
}

// ── DEBOUNCE (Performance 2) ──
function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}
const debouncedRenderMedications = debounce(renderMedications, 300);

// ── SPLASH ──
function renderSplash() {
  const el = document.getElementById('splash');
  el.innerHTML = `
    <div class="splash-logo" role="img" aria-label="Ícone de medicamento">💊</div>
    <h1 class="splash-title">Lembre+</h1>
    <div class="splash-sub">Seu horário, sua saúde</div>
    <div class="splash-loader" aria-live="polite"><div class="spinner" aria-hidden="true"></div> Carregando...</div>
  `;
}

// ── ONBOARDING ──
const slides = [
  { emoji: '🔔', title: 'Nunca mais esqueça seu medicamento', desc: 'Receba lembretes nos horários certos e cuide da sua saúde todos os dias.' },
  { emoji: '💊', title: 'Organize seus medicamentos', desc: 'Cadastre, visualize e gerencie todos os seus remédios em um só lugar.' },
  { emoji: '📊', title: 'Acompanhe seu histórico', desc: 'Veja quantas doses foram tomadas, pendentes ou atrasadas.' },
];
let slideIndex = 0;
function renderOnboarding() {
  const sl = slides[slideIndex];
  document.getElementById('onboarding').innerHTML = `
    <button class="onboarding-skip" onclick="go('login')" aria-label="Pular apresentação">Pular</button>
    <div class="onboarding-img" role="img" aria-label="${sl.title}">${sl.emoji}</div>
    <div class="dots" role="tablist" aria-label="Slides de apresentação">
      ${slides.map((_, i) => `<div class="dot ${i === slideIndex ? 'active' : ''}" role="tab" aria-selected="${i === slideIndex}" aria-label="Slide ${i+1} de ${slides.length}"></div>`).join('')}
    </div>
    <h2 class="onboarding-title">${sl.title}</h2>
    <p class="onboarding-desc">${sl.desc}</p>
    <button class="btn btn-primary" onclick="nextSlide()">${slideIndex < slides.length - 1 ? 'Próximo' : 'Começar'}</button>
  `;
}
function nextSlide() {
  slideIndex++;
  if (slideIndex >= slides.length) { go('login'); slideIndex = 0; }
  else renderOnboarding();
}

// ── LOGIN ──
let loginTab = 'login';
function renderLogin() {
  document.getElementById('login').innerHTML = `
    <h1 class="login-title">Bem-vindo(a)! 👋</h1>
    <div class="login-sub">Faça login para continuar</div>
    <div class="tab-row" role="tablist">
      <div class="tab ${loginTab === 'login' ? 'active' : ''}" role="tab" aria-selected="${loginTab === 'login'}" tabindex="0" onclick="setLoginTab('login')" onkeydown="if(event.key==='Enter')setLoginTab('login')">Entrar</div>
      <div class="tab ${loginTab === 'cadastro' ? 'active' : ''}" role="tab" aria-selected="${loginTab === 'cadastro'}" tabindex="0" onclick="setLoginTab('cadastro')" onkeydown="if(event.key==='Enter')setLoginTab('cadastro')">Cadastrar</div>
    </div>
    ${loginTab === 'login' ? `
      <div class="input-group">
        <span class="input-icon" aria-hidden="true">✉️</span>
        <input type="email" id="loginEmail" placeholder="E-mail" autocomplete="email" aria-label="E-mail" />
      </div>
      <div class="input-group">
        <span class="input-icon" aria-hidden="true">🔒</span>
        <input type="password" id="loginPass" placeholder="Senha" autocomplete="current-password" aria-label="Senha" />
      </div>
      <div class="forgot" role="button" tabindex="0">Esqueci minha senha</div>
      <button class="btn btn-primary" onclick="doLogin()">Entrar</button>
      <div class="divider" aria-hidden="true">ou entre com</div>
      <div class="social-row">
        <button class="btn-social" onclick="socialLogin('Google')" aria-label="Entrar com Google">🔵 Google</button>
        <button class="btn-social" onclick="socialLogin('Facebook')" aria-label="Entrar com Facebook">🔷 Facebook</button>
      </div>
    ` : `
      <div class="input-group">
        <span class="input-icon" aria-hidden="true">👤</span>
        <input type="text" id="regName" placeholder="Nome completo" autocomplete="name" aria-label="Nome completo" />
      </div>
      <div class="input-group">
        <span class="input-icon" aria-hidden="true">✉️</span>
        <input type="email" id="regEmail" placeholder="E-mail" autocomplete="email" aria-label="E-mail" />
      </div>
      <div class="input-group">
        <span class="input-icon" aria-hidden="true">🔒</span>
        <input type="password" id="regPass" placeholder="Senha" autocomplete="new-password" aria-label="Senha" />
      </div>
      <button class="btn btn-primary" style="margin-top:8px" onclick="doRegister()">Criar conta</button>
    `}
  `;
}
function setLoginTab(tab) { loginTab = tab; renderLogin(); }
function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (!email || !pass) { toast('Preencha todos os campos'); return; }
  state.user = { name: email.split('@')[0], email };
  save();
  go('home');
}
function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  if (!name || !email) { toast('Preencha todos os campos'); return; }
  state.user = { name, email };
  save();
  toast('Conta criada com sucesso!');
  go('home');
}
function socialLogin(provider) {
  state.user = { name: 'Usuário', email: `usuario@${provider.toLowerCase()}.com` };
  save();
  go('home');
}

// ── HOME ──
// Refatoração 3: separar cálculo de dados da renderização
function computeTodaySummary() {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHistory = state.history.filter(h => h.date === todayStr);
  return {
    taken:   todayHistory.filter(h => h.status === STATUS.TAKEN).length,
    pending: todayHistory.filter(h => h.status === STATUS.PENDING).length,
    missed:  todayHistory.filter(h => h.status === STATUS.MISSED).length,
    total:   todayHistory.length,
  };
}

function findNextMedication() {
  const now = new Date();
  const timeNow = now.getHours() * 60 + now.getMinutes();
  let nextMed = null, nextTime = null, minDiff = Infinity;
  state.medications.filter(m => m.active !== false).forEach(med => {
    med.times.forEach(t => {
      const [h, m2] = t.split(':').map(Number);
      const diff = (h * 60 + m2) - timeNow;
      if (diff >= 0 && diff < minDiff) { minDiff = diff; nextMed = med; nextTime = t; }
    });
  });
  return { nextMed, nextTime };
}

function renderHome() {
  const now = new Date();
  const days = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
  const name = state.user?.name || 'Usuário';
  const { nextMed, nextTime } = findNextMedication();
  const { taken, pending, missed, total } = computeTodaySummary();

  document.getElementById('home').innerHTML = `
    <div class="home-header">
      <button class="home-bell" aria-label="Notificações">🔔</button>
      <h1 class="home-greeting">Olá, ${name}! 👋</h1>
      <div class="home-date" aria-label="Data de hoje: ${dateStr}">${dateStr}</div>
      ${nextMed ? `
        <div class="next-card" aria-label="Próximo medicamento: ${nextMed.name} às ${nextTime}">
          <div class="next-label">Próximo medicamento</div>
          <div class="next-time" aria-hidden="true">${nextTime}</div>
          <div class="next-name">${nextMed.name}</div>
          <div class="next-dose">${nextMed.dose}</div>
          <button class="btn-taken" onclick="markTaken('${nextMed.id}','${nextTime}')">Marcar como tomado ✓</button>
        </div>
      ` : `
        <div class="next-card">
          <div class="next-label">Nenhum medicamento pendente hoje</div>
          <div class="next-name" style="margin-top:8px">Ótimo trabalho! 🎉</div>
        </div>
      `}
    </div>
    <section class="section" aria-labelledby="summary-title">
      <div class="section-title" id="summary-title">Resumo de hoje</div>
      <div class="stats-grid" role="list">
        <div class="stat-card" role="listitem" aria-label="${taken} doses tomadas"><div class="stat-icon" aria-hidden="true">✅</div><div><div class="stat-label">Tomados</div><div class="stat-value" style="color:var(--green)">${taken}</div></div></div>
        <div class="stat-card" role="listitem" aria-label="${pending} doses pendentes"><div class="stat-icon" aria-hidden="true">⏳</div><div><div class="stat-label">Pendentes</div><div class="stat-value" style="color:var(--orange)">${pending}</div></div></div>
        <div class="stat-card" role="listitem" aria-label="${missed} doses atrasadas"><div class="stat-icon" aria-hidden="true">❌</div><div><div class="stat-label">Atrasados</div><div class="stat-value" style="color:var(--red)">${missed}</div></div></div>
        <div class="stat-card" role="listitem" aria-label="${total} doses no total"><div class="stat-icon" aria-hidden="true">💊</div><div><div class="stat-label">Total</div><div class="stat-value">${total}</div></div></div>
      </div>
    </section>
    <nav class="bottom-nav" aria-label="Navegação principal">${navHTML('home')}</nav>
  `;
}

function markTaken(id, time) {
  const todayStr = new Date().toISOString().split('T')[0];
  const med = state.medications.find(m => m.id === id);
  if (!med) return;
  const existing = state.history.find(h => h.date === todayStr && h.medId === id && h.time === time);
  if (existing) { existing.status = STATUS.TAKEN; }
  else { state.history.push({ id: Date.now(), medId: id, name: med.name, dose: med.dose, time, date: todayStr, status: STATUS.TAKEN }); }
  save();
  toast(`${med.name} marcado como tomado! ✓`);
  renderHome();
}

// ── MEDICATIONS ──
function renderMedications() {
  const search = document.getElementById('medSearch')?.value?.toLowerCase() || '';
  let meds = state.medications;
  if (state.filterTab === 'ativos') meds = meds.filter(m => m.active !== false);
  if (state.filterTab === 'inativos') meds = meds.filter(m => m.active === false);
  if (search) meds = meds.filter(m => m.name.toLowerCase().includes(search));

  const colors = ['#E8F5E9','#FFF3E0','#F3E5F5','#E3F2FD','#FCE4EC'];
  const emojis = ['💊','💉','🌡️','🩺','💆'];

  document.getElementById('medications').innerHTML = `
    <header class="header">
      <h1 class="header-title">Meus Medicamentos</h1>
      <button class="icon-btn" onclick="openAddMed()" aria-label="Adicionar medicamento">➕</button>
    </header>
    <div class="search-bar" role="search">
      <span class="search-icon" aria-hidden="true">🔍</span>
      <input id="medSearch" type="search" placeholder="Buscar medicamento" oninput="debouncedRenderMedications()" value="${search}" aria-label="Buscar medicamento" />
    </div>
    <div class="filter-tabs" role="group" aria-label="Filtrar medicamentos">
      ${['todos','ativos','inativos'].map(f => `
        <button class="filter-tab ${state.filterTab === f ? 'active' : ''}" onclick="setFilter('${f}')" aria-pressed="${state.filterTab === f}">
          ${f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      `).join('')}
    </div>
    <ul class="med-list" aria-label="Lista de medicamentos">
      ${meds.length === 0 ? `<li style="text-align:center;padding:40px;color:var(--text-secondary);list-style:none">
        ${state.medications.length === 0 ? '📋 Nenhum medicamento cadastrado.<br><br><small>Toque em ➕ para adicionar</small>' : 'Nenhum resultado encontrado'}
      </li>` : meds.map((m, i) => `
        <li class="med-item" onclick="openDetail('${m.id}')" role="button" tabindex="0" aria-label="${m.name}, ${m.dose}, horários: ${m.times.join(', ')}" onkeydown="if(event.key==='Enter')openDetail('${m.id}')">
          <div class="med-icon" style="background:${colors[i % colors.length]}" aria-hidden="true">${emojis[i % emojis.length]}</div>
          <div class="med-info">
            <div class="med-name">${m.name}</div>
            <div class="med-dose">${m.dose}</div>
            <div class="med-times">🕐 ${m.times.join(' · ')}</div>
          </div>
          <span class="med-arrow" aria-hidden="true">›</span>
        </li>
      `).join('')}
    </ul>
    <nav class="bottom-nav" aria-label="Navegação principal">${navHTML('medications')}</nav>
  `;
}

function setFilter(f) { state.filterTab = f; renderMedications(); }

// ── DETAIL ──
function openDetail(id) {
  state.detailMed = state.medications.find(m => m.id === id);
  go('medDetail');
}

function renderDetail() {
  const m = state.detailMed;
  if (!m) return;
  const freq = FREQ_LABEL[m.freq] || m.freq;
  document.getElementById('medDetail').innerHTML = `
    <header class="header">
      <button class="header-back" onclick="go('medications')" aria-label="Voltar para meus medicamentos">←</button>
      <h1 class="header-title">${m.name}</h1>
      <button class="icon-btn" onclick="openEditMed('${m.id}')" aria-label="Editar ${m.name}">✏️</button>
    </header>
    <div class="detail-img" role="img" aria-label="Ícone do medicamento">💊</div>
    <dl>
      <div class="detail-section">
        <dt class="detail-label">Dose</dt>
        <dd class="detail-value">${m.dose}</dd>
      </div>
      <div class="detail-section">
        <dt class="detail-label">Frequência</dt>
        <dd class="detail-value">${freq}</dd>
      </div>
      <div class="detail-section">
        <dt class="detail-label">Horários</dt>
        <dd>${m.times.map(t => `<div class="time-chip" aria-label="Horário: ${t}">🕐 ${t}</div>`).join('')}</dd>
      </div>
      ${m.notes ? `<div class="detail-section"><dt class="detail-label">Observações</dt><dd class="detail-value">${m.notes}</dd></div>` : ''}
    </dl>
    <div class="btn-area">
      <button class="btn btn-primary" onclick="markTakenNow('${m.id}')">Marcar como tomado ✓</button>
      <button class="btn btn-outline" onclick="toggleActive('${m.id}')">${m.active === false ? 'Ativar medicamento' : 'Desativar medicamento'}</button>
      <button class="btn btn-gray" onclick="deleteMed('${m.id}')">🗑️ Excluir</button>
    </div>
    <nav class="bottom-nav" aria-label="Navegação principal">${navHTML('medications')}</nav>
  `;
}

function markTakenNow(id) {
  const m = state.medications.find(m => m.id === id);
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const todayStr = now.toISOString().split('T')[0];
  state.history.push({ id: Date.now(), medId: id, name: m.name, dose: m.dose, time, date: todayStr, status: STATUS.TAKEN });
  save();
  toast(`${m.name} marcado como tomado! ✓`);
}

function toggleActive(id) {
  const m = state.medications.find(m => m.id === id);
  m.active = m.active === false;
  save();
  toast(m.active ? 'Medicamento ativado' : 'Medicamento desativado');
  renderDetail();
}

function deleteMed(id) {
  if (!confirm('Excluir este medicamento?')) return;
  state.medications = state.medications.filter(m => m.id !== id);
  save();
  toast('Medicamento excluído');
  go('medications');
}

// ── ADD / EDIT MED ──
function openAddMed() { state.editingMed = null; state.times = ['08:00']; go('addMed'); }
function openEditMed(id) {
  state.editingMed = state.medications.find(m => m.id === id);
  state.times = [...state.editingMed.times];
  go('addMed');
}

function renderAddMed() {
  const m = state.editingMed;
  document.getElementById('addMed').innerHTML = `
    <header class="header">
      <button class="header-back" onclick="${m ? "go('medDetail')" : "go('medications')"}" aria-label="Voltar">←</button>
      <h1 class="header-title">${m ? 'Editar Medicamento' : 'Adicionar Medicamento'}</h1>
    </header>
    <div class="photo-picker" role="button" tabindex="0" aria-label="Adicionar foto do medicamento">📷<span>Adicionar foto (opcional)</span></div>
    <form onsubmit="event.preventDefault();saveMed()">
      <div class="form-group">
        <label class="form-label" for="fName">Nome do medicamento</label>
        <input class="form-input" id="fName" type="text" placeholder="Ex.: Dipirona 500mg" value="${m?.name || ''}" autocomplete="off" required />
      </div>
      <div class="form-group">
        <label class="form-label" for="fDose">Dose</label>
        <input class="form-input" id="fDose" type="text" placeholder="Ex.: 1 comprimido" value="${m?.dose || ''}" autocomplete="off" required />
      </div>
      <div class="form-group">
        <label class="form-label" for="fFreq">Frequência</label>
        <select class="form-input" id="fFreq" required>
          <option value="">Selecione</option>
          <option value="daily" ${m?.freq === 'daily' ? 'selected' : ''}>Todos os dias</option>
          <option value="weekly" ${m?.freq === 'weekly' ? 'selected' : ''}>Semanal</option>
          <option value="monthly" ${m?.freq === 'monthly' ? 'selected' : ''}>Mensal</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Horários</label>
        <div class="times-list" id="timesList" role="group" aria-label="Lista de horários">
          ${state.times.map((t, i) => `
            <div class="time-row">
              <input type="time" value="${t}" onchange="updateTime(${i}, this.value)" aria-label="Horário ${i+1}" />
              ${state.times.length > 1 ? `<button class="btn-remove-time" onclick="removeTime(${i})" aria-label="Remover horário ${i+1}" type="button">✕</button>` : ''}
            </div>
          `).join('')}
        </div>
        <button class="btn-add-time" onclick="addTime()" type="button" aria-label="Adicionar mais um horário">➕ Adicionar horário</button>
      </div>
      <div class="form-group">
        <label class="form-label" for="fNotes">Observações (opcional)</label>
        <input class="form-input" id="fNotes" type="text" placeholder="Ex.: Tomar após as refeições" value="${m?.notes || ''}" autocomplete="off" />
      </div>
      <div class="form-group">
        <button class="btn btn-primary" type="submit">Salvar medicamento</button>
      </div>
    </form>
  `;
}

function addTime() { state.times.push('08:00'); renderAddMed(); }
function removeTime(i) { state.times.splice(i, 1); renderAddMed(); }
function updateTime(i, v) { state.times[i] = v; }

function saveMed() {
  const name = document.getElementById('fName').value.trim();
  const dose = document.getElementById('fDose').value.trim();
  const freq = document.getElementById('fFreq').value;
  const notes = document.getElementById('fNotes').value.trim();
  if (!name || !dose || !freq) { toast('Preencha os campos obrigatórios'); return; }

  if (state.editingMed) {
    Object.assign(state.editingMed, { name, dose, freq, times: [...state.times], notes });
    toast('Medicamento atualizado!');
    save();
    go('medDetail');
  } else {
    state.medications.push({ id: String(Date.now()), name, dose, freq, times: [...state.times], notes, active: true });
    generateTodayHistory();
    toast('Medicamento salvo! 💊');
    save();
    go('medications');
  }
}

function generateTodayHistory() {
  const todayStr = new Date().toISOString().split('T')[0];
  state.medications.filter(m => m.active !== false).forEach(med => {
    med.times.forEach(time => {
      const exists = state.history.some(h => h.date === todayStr && h.medId === med.id && h.time === time);
      if (!exists) {
        state.history.push({ id: Date.now() + Math.random(), medId: med.id, name: med.name, dose: med.dose, time, date: todayStr, status: STATUS.PENDING });
      }
    });
  });
}

// ── HISTORY ──
function renderHistory() {
  const filter = document.getElementById('histFilter')?.value || 'todos';
  const grouped = {};
  let items = [...state.history];
  if (filter !== 'todos') items = items.filter(h => h.status === filter);
  items.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  items.forEach(h => { if (!grouped[h.date]) grouped[h.date] = []; grouped[h.date].push(h); });

  const fmt = d => {
    const dt = new Date(d + 'T12:00:00');
    const today = new Date().toISOString().split('T')[0];
    if (d === today) return 'Hoje - ' + dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
    const yd = new Date(); yd.setDate(yd.getDate()-1);
    if (d === yd.toISOString().split('T')[0]) return 'Ontem - ' + dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
    return dt.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });
  };

  const badgeMap = { [STATUS.TAKEN]: 'badge-taken', [STATUS.PENDING]: 'badge-pending', [STATUS.MISSED]: 'badge-missed' };
  const labelMap = { [STATUS.TAKEN]: 'Tomado', [STATUS.PENDING]: 'Pendente', [STATUS.MISSED]: 'Não tomado' };

  document.getElementById('history').innerHTML = `
    <header class="header">
      <h1 class="header-title">Histórico</h1>
      <label for="histFilter" class="visually-hidden">Filtrar histórico</label>
      <select id="histFilter" class="form-input" style="width:auto;padding:8px 12px;font-size:13px" onchange="renderHistory()" aria-label="Filtrar histórico">
        <option value="todos">Todos</option>
        <option value="${STATUS.TAKEN}">Tomados</option>
        <option value="${STATUS.PENDING}">Pendentes</option>
        <option value="${STATUS.MISSED}">Não tomados</option>
      </select>
    </header>
    ${Object.keys(grouped).length === 0 ? `<p style="text-align:center;padding:60px;color:var(--text-secondary)" role="status">📋 Nenhum registro encontrado</p>` :
      Object.entries(grouped).map(([date, hs]) => `
        <section class="history-group" aria-labelledby="date-${date}">
          <h2 class="history-date" id="date-${date}">${fmt(date)}</h2>
          ${hs.map(h => `
            <div class="history-item">
              <div class="history-time">${h.time}</div>
              <div class="history-info">
                <div class="history-name">${h.name}</div>
                <div class="history-dose">${h.dose}</div>
              </div>
              <span class="badge ${badgeMap[h.status]}" aria-label="Status: ${labelMap[h.status]}">${labelMap[h.status]}</span>
            </div>
          `).join('')}
        </section>
      `).join('')}
    <nav class="bottom-nav" aria-label="Navegação principal">${navHTML('history')}</nav>
  `;
}

// ── CALENDAR ──
function renderCalendar() {
  const firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
  const daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate();
  const today = new Date();
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const days = ['D','S','T','Q','Q','S','S'];
  const daysLong = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const selected = `${state.calYear}-${String(state.calMonth+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const selHist = state.history.filter(h => h.date === selected);
  const taken = selHist.filter(h => h.status === STATUS.TAKEN).length;
  const pending = selHist.filter(h => h.status === STATUS.PENDING).length;
  const missed = selHist.filter(h => h.status === STATUS.MISSED).length;

  document.getElementById('calendar').innerHTML = `
    <header class="header"><h1 class="header-title">Calendário</h1></header>
    <div class="cal-nav">
      <button class="cal-arrow" onclick="changeMonth(-1)" aria-label="Mês anterior">‹</button>
      <div class="cal-month" aria-live="polite" aria-atomic="true">${months[state.calMonth]} ${state.calYear}</div>
      <button class="cal-arrow" onclick="changeMonth(1)" aria-label="Próximo mês">›</button>
    </div>
    <div class="cal-grid" role="grid" aria-label="Calendário de ${months[state.calMonth]} ${state.calYear}">
      <div class="cal-days-header" role="row">
        ${days.map((d, i) => `<div class="cal-day-label" role="columnheader" aria-label="${daysLong[i]}">${d}</div>`).join('')}
      </div>
      <div class="cal-days">
        ${cells.map(d => d === null
          ? `<div class="cal-day other-month" role="gridcell" aria-hidden="true"></div>`
          : `<div class="cal-day ${d === today.getDate() && state.calMonth === today.getMonth() && state.calYear === today.getFullYear() ? 'today' : ''}" role="gridcell" aria-label="${d} de ${months[state.calMonth]}${d === today.getDate() ? ', hoje' : ''}" tabindex="0">${d}</div>`
        ).join('')}
      </div>
    </div>
    <section class="cal-summary" aria-labelledby="cal-summary-title">
      <h2 class="cal-summary-title" id="cal-summary-title">Resumo do dia ${today.getDate()}/${state.calMonth+1}</h2>
      <div class="cal-stat"><div class="cal-dot" style="background:var(--green)" aria-hidden="true"></div> Tomados: <strong>${taken}</strong></div>
      <div class="cal-stat"><div class="cal-dot" style="background:var(--orange)" aria-hidden="true"></div> Pendentes: <strong>${pending}</strong></div>
      <div class="cal-stat"><div class="cal-dot" style="background:var(--red)" aria-hidden="true"></div> Atrasados: <strong>${missed}</strong></div>
    </section>
    <nav class="bottom-nav" aria-label="Navegação principal">${navHTML('calendar')}</nav>
  `;
}
function changeMonth(d) {
  state.calMonth += d;
  if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
  if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
  renderCalendar();
}

// ── PROFILE ──
function renderProfile() {
  const u = state.user || { name: 'Usuário', email: '' };
  document.getElementById('profile').innerHTML = `
    <header class="header"><h1 class="header-title">Perfil</h1></header>
    <div class="profile-header">
      <div class="avatar" role="img" aria-label="Foto de perfil de ${u.name}">👤<div class="avatar-edit" aria-hidden="true">✏️</div></div>
      <div class="profile-name">${u.name}</div>
      <div class="profile-email">${u.email}</div>
    </div>
    <nav class="profile-menu" aria-label="Menu do perfil">
      <button class="menu-item" onclick="toast('Em breve!')" aria-label="Dados pessoais"><span class="menu-icon" aria-hidden="true">👤</span><span class="menu-label">Dados pessoais</span><span class="menu-arrow" aria-hidden="true">›</span></button>
      <button class="menu-item" onclick="toast('Em breve!')" aria-label="Notificações"><span class="menu-icon" aria-hidden="true">🔔</span><span class="menu-label">Notificações</span><span class="menu-arrow" aria-hidden="true">›</span></button>
      <button class="menu-item" onclick="toast('Em breve!')" aria-label="Cuidador / Contato"><span class="menu-icon" aria-hidden="true">👥</span><span class="menu-label">Cuidador / Contato</span><span class="menu-arrow" aria-hidden="true">›</span></button>
      <button class="menu-item" onclick="toast('Lembre+ v1.0 — App de lembretes de medicamentos')" aria-label="Sobre o app"><span class="menu-icon" aria-hidden="true">ℹ️</span><span class="menu-label">Sobre o app</span><span class="menu-arrow" aria-hidden="true">›</span></button>
      <button class="menu-item danger" onclick="logout()" aria-label="Sair da conta"><span class="menu-icon" aria-hidden="true">🚪</span><span class="menu-label">Sair da conta</span><span class="menu-arrow" aria-hidden="true">›</span></button>
    </nav>
    <nav class="bottom-nav" aria-label="Navegação principal">${navHTML('profile')}</nav>
  `;
}

function logout() {
  if (!confirm('Deseja sair da conta?')) return;
  state.user = null;
  localStorage.removeItem('lembre_user');
  loginTab = 'login';
  go('login');
}

// ── NAV HTML ──
function navHTML(active) {
  const items = [
    { screen: 'home',        icon: '🏠', label: 'Início' },
    { screen: 'medications', icon: '💊', label: 'Medicamentos' },
    { screen: 'history',     icon: '📋', label: 'Histórico' },
    { screen: 'calendar',    icon: '📅', label: 'Calendário' },
    { screen: 'profile',     icon: '👤', label: 'Perfil' },
  ];
  return items.map(it => `
    <button class="nav-item ${it.screen === active ? 'active' : ''}"
      onclick="go('${it.screen}')"
      aria-label="${it.label}"
      aria-current="${it.screen === active ? 'page' : 'false'}">
      <span class="nav-icon" aria-hidden="true">${it.icon}</span>
      <span class="nav-label">${it.label}</span>
    </button>
  `).join('');
}

// ── INIT ──
function init() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="a11y-live" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>
    <div id="splash"      class="screen active" role="main" aria-label="Carregando Lembre+"></div>
    <div id="onboarding"  class="screen" role="main" aria-label="Apresentação" aria-hidden="true"></div>
    <div id="login"       class="screen" role="main" aria-label="Login" aria-hidden="true"></div>
    <div id="home"        class="screen" role="main" aria-label="Início" aria-hidden="true"></div>
    <div id="medications" class="screen" role="main" aria-label="Meus Medicamentos" aria-hidden="true"></div>
    <div id="medDetail"   class="screen" role="main" aria-label="Detalhes do Medicamento" aria-hidden="true"></div>
    <div id="addMed"      class="screen" role="main" aria-label="Adicionar Medicamento" aria-hidden="true"></div>
    <div id="history"     class="screen" role="main" aria-label="Histórico" aria-hidden="true"></div>
    <div id="calendar"    class="screen" role="main" aria-label="Calendário" aria-hidden="true"></div>
    <div id="profile"     class="screen" role="main" aria-label="Perfil" aria-hidden="true"></div>
  `;

  renderSplash();
  renderOnboarding();
  renderLogin();
  generateTodayHistory();

  setTimeout(() => {
    if (state.user) { go('home'); }
    else { go('onboarding'); renderOnboarding(); }
  }, 2000);
}

init();

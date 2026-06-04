// ── STATE ──
const state = {
  currentScreen: 'splash',
  user: JSON.parse(localStorage.getItem('lembre_user') || 'null'),
  medications: JSON.parse(localStorage.getItem('lembre_meds') || '[]'),
  history: JSON.parse(localStorage.getItem('lembre_history') || '[]'),
  editingMed: null,
  detailMed: null,
  filterTab: 'todos',
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  times: ['08:00'],
};

function save() {
  localStorage.setItem('lembre_meds', JSON.stringify(state.medications));
  localStorage.setItem('lembre_history', JSON.stringify(state.history));
  if (state.user) localStorage.setItem('lembre_user', JSON.stringify(state.user));
}

// ── NAVIGATION ──
function go(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screen).classList.add('active');
  state.currentScreen = screen;
  updateNav(screen);
  if (screen === 'home') renderHome();
  if (screen === 'medications') renderMedications();
  if (screen === 'history') renderHistory();
  if (screen === 'calendar') renderCalendar();
  if (screen === 'profile') renderProfile();
  if (screen === 'medDetail') renderDetail();
  if (screen === 'addMed') renderAddMed();
}

function updateNav(screen) {
  const navMap = { home: 0, medications: 1, history: 2, calendar: 3, profile: 4 };
  document.querySelectorAll('.nav-item').forEach((el, i) => {
    el.classList.toggle('active', navMap[screen] === i);
  });
}

// ── TOAST ──
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ── SPLASH ──
function renderSplash() {
  const el = document.getElementById('splash');
  el.innerHTML = `
    <div class="splash-logo">💊</div>
    <div class="splash-title">Lembre+</div>
    <div class="splash-sub">Seu horário, sua saúde</div>
    <div class="splash-loader"><div class="spinner"></div> Carregando...</div>
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
    <span class="onboarding-skip" onclick="go('login')">Pular</span>
    <div class="onboarding-img">${sl.emoji}</div>
    <div class="dots">
      ${slides.map((_, i) => `<div class="dot ${i === slideIndex ? 'active' : ''}"></div>`).join('')}
    </div>
    <div class="onboarding-title">${sl.title}</div>
    <div class="onboarding-desc">${sl.desc}</div>
    <button class="btn btn-primary" onclick="nextSlide()">Próximo</button>
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
    <div class="login-title">Bem-vindo(a)! 👋</div>
    <div class="login-sub">Faça login para continuar</div>
    <div class="tab-row">
      <div class="tab ${loginTab === 'login' ? 'active' : ''}" onclick="setLoginTab('login')">Entrar</div>
      <div class="tab ${loginTab === 'cadastro' ? 'active' : ''}" onclick="setLoginTab('cadastro')">Cadastrar</div>
    </div>
    ${loginTab === 'login' ? `
      <div class="input-group"><span class="input-icon">✉️</span><input type="email" id="loginEmail" placeholder="E-mail" /></div>
      <div class="input-group"><span class="input-icon">🔒</span><input type="password" id="loginPass" placeholder="Senha" /></div>
      <div class="forgot">Esqueci minha senha</div>
      <button class="btn btn-primary" onclick="doLogin()">Entrar</button>
      <div class="divider">ou entre com</div>
      <div class="social-row">
        <button class="btn-social" onclick="socialLogin('Google')">🔵 Google</button>
        <button class="btn-social" onclick="socialLogin('Facebook')">🔷 Facebook</button>
      </div>
    ` : `
      <div class="input-group"><span class="input-icon">👤</span><input type="text" id="regName" placeholder="Nome completo" /></div>
      <div class="input-group"><span class="input-icon">✉️</span><input type="email" id="regEmail" placeholder="E-mail" /></div>
      <div class="input-group"><span class="input-icon">🔒</span><input type="password" id="regPass" placeholder="Senha" /></div>
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
function renderHome() {
  const now = new Date();
  const days = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
  const name = state.user?.name || 'Usuário';

  // find next medication
  const timeNow = now.getHours() * 60 + now.getMinutes();
  let nextMed = null, nextTime = null, minDiff = Infinity;
  state.medications.filter(m => m.active !== false).forEach(med => {
    med.times.forEach(t => {
      const [h, m2] = t.split(':').map(Number);
      const diff = (h * 60 + m2) - timeNow;
      if (diff >= 0 && diff < minDiff) { minDiff = diff; nextMed = med; nextTime = t; }
    });
  });

  const todayStr = now.toISOString().split('T')[0];
  const todayHistory = state.history.filter(h => h.date === todayStr);
  const taken = todayHistory.filter(h => h.status === 'taken').length;
  const pending = todayHistory.filter(h => h.status === 'pending').length;
  const missed = todayHistory.filter(h => h.status === 'missed').length;
  const total = todayHistory.length;

  document.getElementById('home').innerHTML = `
    <div class="home-header">
      <span class="home-bell">🔔</span>
      <div class="home-greeting">Olá, ${name}! 👋</div>
      <div class="home-date">${dateStr}</div>
      ${nextMed ? `
        <div class="next-card">
          <div class="next-label">Próximo medicamento</div>
          <div class="next-time">${nextTime}</div>
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
    <div class="section">
      <div class="section-title">Resumo de hoje</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">✅</div><div><div class="stat-label">Tomados</div><div class="stat-value" style="color:var(--green)">${taken}</div></div></div>
        <div class="stat-card"><div class="stat-icon">⏳</div><div><div class="stat-label">Pendentes</div><div class="stat-value" style="color:var(--orange)">${pending}</div></div></div>
        <div class="stat-card"><div class="stat-icon">❌</div><div><div class="stat-label">Atrasados</div><div class="stat-value" style="color:var(--red)">${missed}</div></div></div>
        <div class="stat-card"><div class="stat-icon">💊</div><div><div class="stat-label">Total</div><div class="stat-value">${total}</div></div></div>
      </div>
    </div>
    <div class="bottom-nav">${navHTML('home')}</div>
  `;
}

function markTaken(id, time) {
  const todayStr = new Date().toISOString().split('T')[0];
  const med = state.medications.find(m => m.id === id);
  if (!med) return;
  const existing = state.history.find(h => h.date === todayStr && h.medId === id && h.time === time);
  if (existing) { existing.status = 'taken'; }
  else { state.history.push({ id: Date.now(), medId: id, name: med.name, dose: med.dose, time, date: todayStr, status: 'taken' }); }
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
    <div class="header">
      <div class="header-title">Meus Medicamentos</div>
      <button class="icon-btn" onclick="openAddMed()">➕</button>
    </div>
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input id="medSearch" type="text" placeholder="Buscar medicamento" oninput="renderMedications()" value="${search}" />
    </div>
    <div class="filter-tabs">
      ${['todos','ativos','inativos'].map(f => `
        <div class="filter-tab ${state.filterTab === f ? 'active' : ''}" onclick="setFilter('${f}')">
          ${f.charAt(0).toUpperCase() + f.slice(1)}
        </div>
      `).join('')}
    </div>
    <div class="med-list">
      ${meds.length === 0 ? `<div style="text-align:center;padding:40px;color:var(--text-light)">
        ${state.medications.length === 0 ? '📋 Nenhum medicamento cadastrado.<br><br><small>Toque em ➕ para adicionar</small>' : 'Nenhum resultado encontrado'}
      </div>` : meds.map((m, i) => `
        <div class="med-item" onclick="openDetail('${m.id}')">
          <div class="med-icon" style="background:${colors[i % colors.length]}">${emojis[i % emojis.length]}</div>
          <div class="med-info">
            <div class="med-name">${m.name}</div>
            <div class="med-dose">${m.dose}</div>
            <div class="med-times">🕐 ${m.times.join(' · ')}</div>
          </div>
          <div class="med-arrow">›</div>
        </div>
      `).join('')}
    </div>
    <div class="bottom-nav">${navHTML('medications')}</div>
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
  const freq = { daily: 'Todos os dias', weekly: 'Semanal', monthly: 'Mensal' }[m.freq] || m.freq;
  document.getElementById('medDetail').innerHTML = `
    <div class="header">
      <span class="header-back" onclick="go('medications')">←</span>
      <div class="header-title">${m.name}</div>
      <button class="icon-btn" onclick="openEditMed('${m.id}')">✏️</button>
    </div>
    <div class="detail-img">💊</div>
    <div class="detail-section">
      <div class="detail-label">Dose</div>
      <div class="detail-value">${m.dose}</div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Frequência</div>
      <div class="detail-value">${freq}</div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Horários</div>
      <div>${m.times.map(t => `<div class="time-chip">🕐 ${t}</div>`).join('')}</div>
    </div>
    ${m.notes ? `<div class="detail-section"><div class="detail-label">Observações</div><div class="detail-value">${m.notes}</div></div>` : ''}
    <div class="btn-area">
      <button class="btn btn-primary" onclick="markTakenNow('${m.id}')">Marcar como tomado ✓</button>
      <button class="btn btn-outline" onclick="toggleActive('${m.id}')">${m.active === false ? 'Ativar medicamento' : 'Desativar medicamento'}</button>
      <button class="btn btn-gray" onclick="deleteMed('${m.id}')">🗑️ Excluir</button>
    </div>
    <div class="bottom-nav">${navHTML('medications')}</div>
  `;
}

function markTakenNow(id) {
  const m = state.medications.find(m => m.id === id);
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const todayStr = now.toISOString().split('T')[0];
  state.history.push({ id: Date.now(), medId: id, name: m.name, dose: m.dose, time, date: todayStr, status: 'taken' });
  save();
  toast(`${m.name} marcado como tomado! ✓`);
}

function toggleActive(id) {
  const m = state.medications.find(m => m.id === id);
  m.active = m.active === false ? true : false;
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
    <div class="header">
      <span class="header-back" onclick="${m ? "go('medDetail')" : "go('medications')"}">←</span>
      <div class="header-title">${m ? 'Editar Medicamento' : 'Adicionar Medicamento'}</div>
    </div>
    <div class="photo-picker">📷<span>Adicionar foto (opcional)</span></div>
    <div class="form-group">
      <label class="form-label">Nome do medicamento</label>
      <input class="form-input" id="fName" type="text" placeholder="Ex.: Dipirona 500mg" value="${m?.name || ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Dose</label>
      <input class="form-input" id="fDose" type="text" placeholder="Ex.: 1 comprimido" value="${m?.dose || ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Frequência</label>
      <select class="form-input" id="fFreq">
        <option value="">Selecione</option>
        <option value="daily" ${m?.freq === 'daily' ? 'selected' : ''}>Todos os dias</option>
        <option value="weekly" ${m?.freq === 'weekly' ? 'selected' : ''}>Semanal</option>
        <option value="monthly" ${m?.freq === 'monthly' ? 'selected' : ''}>Mensal</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Horários</label>
      <div class="times-list" id="timesList">
        ${state.times.map((t, i) => `
          <div class="time-row">
            <input type="time" value="${t}" onchange="updateTime(${i}, this.value)" />
            ${state.times.length > 1 ? `<button class="btn-remove-time" onclick="removeTime(${i})">✕</button>` : ''}
          </div>
        `).join('')}
      </div>
      <button class="btn-add-time" onclick="addTime()">➕ Adicionar horário</button>
    </div>
    <div class="form-group">
      <label class="form-label">Observações (opcional)</label>
      <input class="form-input" id="fNotes" type="text" placeholder="Ex.: Tomar após as refeições" value="${m?.notes || ''}" />
    </div>
    <div class="form-group">
      <button class="btn btn-primary" onclick="saveMed()">Salvar medicamento</button>
    </div>
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
        state.history.push({ id: Date.now() + Math.random(), medId: med.id, name: med.name, dose: med.dose, time, date: todayStr, status: 'pending' });
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

  const badgeMap = { taken: 'badge-taken', pending: 'badge-pending', missed: 'badge-missed' };
  const labelMap = { taken: 'Tomado', pending: 'Pendente', missed: 'Não tomado' };

  document.getElementById('history').innerHTML = `
    <div class="header">
      <div class="header-title">Histórico</div>
      <select id="histFilter" class="form-input" style="width:auto;padding:8px 12px;font-size:13px" onchange="renderHistory()">
        <option value="todos">Todos</option>
        <option value="taken">Tomados</option>
        <option value="pending">Pendentes</option>
        <option value="missed">Não tomados</option>
      </select>
    </div>
    ${Object.keys(grouped).length === 0 ? `<div style="text-align:center;padding:60px;color:var(--text-light)">📋 Nenhum registro encontrado</div>` :
      Object.entries(grouped).map(([date, hs]) => `
        <div class="history-group">
          <div class="history-date">${fmt(date)}</div>
          ${hs.map(h => `
            <div class="history-item">
              <div class="history-time">${h.time}</div>
              <div class="history-info">
                <div class="history-name">${h.name}</div>
                <div class="history-dose">${h.dose}</div>
              </div>
              <span class="badge ${badgeMap[h.status]}">${labelMap[h.status]}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    <div class="bottom-nav">${navHTML('history')}</div>
  `;
}

// ── CALENDAR ──
function renderCalendar() {
  const firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
  const daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate();
  const today = new Date();
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const days = ['D','S','T','Q','Q','S','S'];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const selected = `${state.calYear}-${String(state.calMonth+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const selHist = state.history.filter(h => h.date === selected);
  const taken = selHist.filter(h => h.status === 'taken').length;
  const pending = selHist.filter(h => h.status === 'pending').length;
  const missed = selHist.filter(h => h.status === 'missed').length;

  document.getElementById('calendar').innerHTML = `
    <div class="header"><div class="header-title">Calendário</div></div>
    <div class="cal-nav">
      <button class="cal-arrow" onclick="changeMonth(-1)">‹</button>
      <div class="cal-month">${months[state.calMonth]} ${state.calYear}</div>
      <button class="cal-arrow" onclick="changeMonth(1)">›</button>
    </div>
    <div class="cal-grid">
      <div class="cal-days-header">${days.map(d => `<div class="cal-day-label">${d}</div>`).join('')}</div>
      <div class="cal-days">
        ${cells.map(d => d === null
          ? `<div class="cal-day other-month"></div>`
          : `<div class="cal-day ${d === today.getDate() && state.calMonth === today.getMonth() && state.calYear === today.getFullYear() ? 'today' : ''}">${d}</div>`
        ).join('')}
      </div>
    </div>
    <div class="cal-summary">
      <div class="cal-summary-title">Resumo do dia ${today.getDate()}/${state.calMonth+1}</div>
      <div class="cal-stat"><div class="cal-dot" style="background:var(--green)"></div> Tomados: <strong>${taken}</strong></div>
      <div class="cal-stat"><div class="cal-dot" style="background:var(--orange)"></div> Pendentes: <strong>${pending}</strong></div>
      <div class="cal-stat"><div class="cal-dot" style="background:var(--red)"></div> Atrasados: <strong>${missed}</strong></div>
    </div>
    <div class="bottom-nav">${navHTML('calendar')}</div>
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
    <div class="header"><div class="header-title">Perfil</div></div>
    <div class="profile-header">
      <div class="avatar">👤<div class="avatar-edit">✏️</div></div>
      <div class="profile-name">${u.name}</div>
      <div class="profile-email">${u.email}</div>
    </div>
    <div class="profile-menu">
      <div class="menu-item"><span class="menu-icon">👤</span><span class="menu-label">Dados pessoais</span><span class="menu-arrow">›</span></div>
      <div class="menu-item"><span class="menu-icon">🔔</span><span class="menu-label">Notificações</span><span class="menu-arrow">›</span></div>
      <div class="menu-item"><span class="menu-icon">👥</span><span class="menu-label">Cuidador / Contato</span><span class="menu-arrow">›</span></div>
      <div class="menu-item"><span class="menu-icon">ℹ️</span><span class="menu-label">Sobre o app</span><span class="menu-arrow">›</span></div>
      <div class="menu-item danger" onclick="logout()"><span class="menu-icon">🚪</span><span class="menu-label">Sair da conta</span><span class="menu-arrow">›</span></div>
    </div>
    <div class="bottom-nav">${navHTML('profile')}</div>
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
    { screen: 'home', icon: '🏠', label: 'Início' },
    { screen: 'medications', icon: '💊', label: 'Medicamentos' },
    { screen: 'history', icon: '📋', label: 'Histórico' },
    { screen: 'calendar', icon: '📅', label: 'Calendário' },
    { screen: 'profile', icon: '👤', label: 'Perfil' },
  ];
  return items.map(it => `
    <div class="nav-item ${it.screen === active ? 'active' : ''}" onclick="go('${it.screen}')">
      <span class="nav-icon">${it.icon}</span>
      <span class="nav-label">${it.label}</span>
    </div>
  `).join('');
}

// ── INIT ──
function init() {
  // Build screen skeletons
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="splash" class="screen active"></div>
    <div id="onboarding" class="screen"></div>
    <div id="login" class="screen"></div>
    <div id="home" class="screen"></div>
    <div id="medications" class="screen"></div>
    <div id="medDetail" class="screen"></div>
    <div id="addMed" class="screen"></div>
    <div id="history" class="screen"></div>
    <div id="calendar" class="screen"></div>
    <div id="profile" class="screen"></div>
  `;

  renderSplash();
  renderOnboarding();
  renderLogin();

  generateTodayHistory();

  // Splash → Onboarding or Home
  setTimeout(() => {
    if (state.user) { go('home'); }
    else { go('onboarding'); renderOnboarding(); }
  }, 2000);
}

init();

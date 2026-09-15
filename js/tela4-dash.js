/* ===================================
   TELA 4 — Dashboard (Gestor do Site)
   =================================== */

let dashUsersPanel, dashChatPanel, dashContent;
let tela4Initialized = false;
let dashActiveTab = 'users';

function initTela4() {
  dashUsersPanel = document.getElementById('dash-users-panel');
  dashChatPanel = document.getElementById('dash-chat-panel');
  dashContent = document.getElementById('dash-content');

  if (!tela4Initialized) {
    // Botão voltar ao chat
    document.getElementById('btn-back-chat').addEventListener('click', () => {
      navegarPara('tela-3');
    });

    // Botão atualizar
    document.getElementById('btn-refresh-dash').addEventListener('click', carregarUsuarios);

    // Tabs
    document.getElementById('tab-users').addEventListener('click', () => switchTab('users'));
    document.getElementById('tab-chat-mirror').addEventListener('click', () => switchTab('chat'));

    // Socket.io: escutar mensagens para o espelho
    if (socket) {
      socket.on('chatMessage', (data) => {
        renderizarMensagemDashboard(data);
      });

      socket.on('usuarioDeletado', (data) => {
        carregarUsuarios(); // Recarregar lista
      });

      socket.on('usuarioAtualizado', (data) => {
        carregarUsuarios(); // Recarregar lista
      });
    }

    tela4Initialized = true;
  }

  carregarUsuarios();
}

// ── Tab Switcher ──
function switchTab(tab) {
  dashActiveTab = tab;

  // Atualizar tabs visuais
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  // Mostrar painel correto
  if (tab === 'users') {
    dashUsersPanel.classList.remove('hidden');
    dashChatPanel.classList.add('hidden');
  } else {
    dashUsersPanel.classList.add('hidden');
    dashChatPanel.classList.remove('hidden');
  }
}

// ── Carregar usuários da API ──
async function carregarUsuarios() {
  const resultado = await apiFetch('/api/usuarios');

  if (resultado.ok && Array.isArray(resultado.data)) {
    renderizarCards(resultado.data);
  } else {
    // Modo offline — mostrar usuário atual como exemplo
    const mockUsers = [];
    if (estadoGlobal.nome) {
      mockUsers.push({
        id: estadoGlobal.id,
        nome: estadoGlobal.nome,
        curso: estadoGlobal.curso,
        idade: estadoGlobal.idade,
        status: 'online'
      });
    }
    renderizarCards(mockUsers);
  }
}

// ── Renderizar cards de usuários ──
function renderizarCards(usuarios) {
  const emptyEl = document.getElementById('dash-empty');

  // Limpar cards anteriores (preservar empty state)
  const cards = dashUsersPanel.querySelectorAll('.dash-card');
  cards.forEach(c => c.remove());

  if (usuarios.length === 0) {
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';

  usuarios.forEach((user, index) => {
    const card = criarCard(user);
    card.style.animationDelay = `${index * 80}ms`;
    dashUsersPanel.appendChild(card);
  });
}

// ── Criar card de um usuário ──
function criarCard(user) {
  const card = document.createElement('div');
  card.className = 'dash-card';
  card.dataset.userId = user.id;

  const iniciais = (user.nome || '??').charAt(0).toUpperCase();
  const status = user.status || 'online';
  const isBlocked = status === 'blocked';

  card.innerHTML = `
    <div class="dash-card-header">
      <div class="dash-card-avatar">${iniciais}</div>
      <div>
        <div class="dash-card-name">${escapeHtml(user.nome || 'Sem nome')}</div>
      </div>
      <span class="dash-card-badge ${isBlocked ? 'blocked' : 'online'}">
        ${isBlocked ? '🔒 Bloqueado' : '● Online'}
      </span>
    </div>

    <div class="dash-card-details">
      <div class="dash-card-detail">
        <span class="dash-card-detail-label">Curso</span>
        <span class="dash-card-detail-value">${escapeHtml(user.curso || '—')}</span>
      </div>
      <div class="dash-card-detail">
        <span class="dash-card-detail-label">Idade</span>
        <span class="dash-card-detail-value">${user.idade || '—'}</span>
      </div>
      <div class="dash-card-detail">
        <span class="dash-card-detail-label">ID</span>
        <span class="dash-card-detail-value" style="font-size:0.7rem; opacity:0.6;">${user.id || '—'}</span>
      </div>
    </div>

    <div class="dash-card-actions">
      <button class="dash-card-action-btn delete" data-action="delete" data-id="${user.id}" aria-label="Deletar ${user.nome}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Excluir
      </button>
      <button class="dash-card-action-btn block" data-action="block" data-id="${user.id}" aria-label="${isBlocked ? 'Desbloquear' : 'Bloquear'} ${user.nome}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${isBlocked
            ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'
            : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>'
          }
        </svg>
        ${isBlocked ? 'Desbloquear' : 'Bloquear'}
      </button>
    </div>
  `;

  // Event listeners nos botões
  const deleteBtn = card.querySelector('[data-action="delete"]');
  const blockBtn = card.querySelector('[data-action="block"]');

  deleteBtn.addEventListener('click', () => deletarUsuario(user.id, user.nome));
  blockBtn.addEventListener('click', () => alternarBloqueio(user.id, card));

  return card;
}

// ── Deletar usuário ──
async function deletarUsuario(id, nome) {
  // Confirmação visual
  if (!confirm(`Tem certeza que deseja excluir ${nome}?`)) return;

  const resultado = await apiFetch(`/api/usuarios/${id}`, {
    method: 'DELETE'
  });

  if (socket && socket.connected) {
    socket.emit('deletarUsuario', { id });
  }

  // Remover card visualmente
  const card = dashUsersPanel.querySelector(`[data-user-id="${id}"]`);
  if (card) {
    card.style.transform = 'scale(0.9)';
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 300);
  }

  // Se deletou a si mesmo, voltar para Tela 1
  if (id === estadoGlobal.id) {
    estadoGlobal.nome = null;
    estadoGlobal.curso = null;
    estadoGlobal.idade = null;
    estadoGlobal.id = null;
    setTimeout(() => navegarPara('tela-1'), 500);
  }
}

// ── Alternar bloqueio ──
async function alternarBloqueio(id, card) {
  const badge = card.querySelector('.dash-card-badge');
  const blockBtn = card.querySelector('[data-action="block"]');
  const isCurrentlyBlocked = badge.classList.contains('blocked');

  // Toggle visual
  if (isCurrentlyBlocked) {
    badge.className = 'dash-card-badge online';
    badge.textContent = '● Online';
    blockBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
      </svg>
      Bloquear
    `;
  } else {
    badge.className = 'dash-card-badge blocked';
    badge.textContent = '🔒 Bloqueado';
    blockBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      Desbloquear
    `;
  }

  // Notificar via API — PUT /api/usuarios/:id/status
  const newBanned = !isCurrentlyBlocked;
  const resultado = await apiFetch(`/api/usuarios/${id}/status`, {
    method: 'PUT',
    body: { isBanned: newBanned }
  });

  if (!resultado.ok) {
    console.warn('[Tela4] Falha ao atualizar status:', resultado.error);
  }

  // Notificar via Socket.io
  if (socket && socket.connected) {
    socket.emit('atualizarUsuario', { id, isBanned: newBanned });
  }
}

// ── Renderizar mensagem no espelho do dashboard ──
function renderizarMensagemDashboard(data) {
  if (!dashChatPanel) {
    dashChatPanel = document.getElementById('dash-chat-panel');
  }
  if (!dashChatPanel) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'dash-chat-msg';
  msgEl.innerHTML = `
    <div class="dash-chat-msg-sender">${escapeHtml(data.nome || 'Anônimo')}</div>
    <div class="dash-chat-msg-text">${escapeHtml(data.texto)}</div>
    <div class="dash-chat-msg-time">${data.hora || formatarHora()}</div>
  `;

  dashChatPanel.appendChild(msgEl);

  // Auto-scroll se a aba de chat estiver ativa
  if (dashActiveTab === 'chat') {
    const dashContentEl = document.getElementById('dash-content');
    dashContentEl.scrollTop = dashContentEl.scrollHeight;
  }
}

// ── Escape HTML (caso não exista globalmente) ──
if (typeof escapeHtml !== 'function') {
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/* ===================================
   TELA 3 — Chat em Tempo Real (Socket.IO)
   =================================== */

// ── Estado da Tela 3 ──
let tela3Initialized = false;
let chatMessages;
let chatInput;
let chatStatus;

// ── Inicialização da Tela 3 ──
function initTela3() {
  chatMessages = document.getElementById('chat-messages');
  chatInput    = document.getElementById('chat-input');
  chatStatus   = document.getElementById('chat-status');

  if (!tela3Initialized) {
    // Botão enviar
    document.getElementById('chat-send-btn').addEventListener('click', enviarMensagem);

    // Enter para enviar (Shift+Enter não enviaria se fosse textarea, mas é <input>)
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });

    // Botão ir para Dashboard
    document.getElementById('btn-go-dash').addEventListener('click', () => {
      navegarPara('tela-4');
    });

    // ── Listeners do Socket.IO ──
    if (socket) {
      // Histórico ao conectar/reconectar
      socket.on('historicoMensagens', (historico) => {
        chatMessages.innerHTML = '';
        if (Array.isArray(historico) && historico.length > 0) {
          historico.forEach(msg => renderizarMensagem(msg));
          scrollParaFim();
        } else {
          renderizarSistema('💬 Seja bem-vindo ao Chat IHC! Nenhuma mensagem ainda.');
        }
      });

      // Nova mensagem em tempo real
      socket.on('chatMessage', (data) => {
        // Evitar duplicata: só renderiza se não for o mesmo ID de socket emitindo
        renderizarMensagem(data);
        scrollParaFim();
      });

      // Atualizações de status de conexão
      socket.on('connect', () => {
        atualizarStatus('Online', true);
        // Ao reconectar, pedir histórico novamente
        socket.emit('pedirHistorico');
      });

      socket.on('disconnect', () => {
        atualizarStatus('Reconectando...', false);
      });

      socket.on('connect_error', () => {
        atualizarStatus('Sem conexão', false);
      });

      // Escutar se o usuário atual foi banido pelo dashboard
      socket.on('usuarioAtualizado', (data) => {
        if (data && data.id === estadoGlobal.id) {
          if (data.status === 'blocked') {
            renderizarSistema('🔒 Você foi bloqueado pelo administrador e não pode enviar mensagens.');
            chatInput.disabled = true;
            document.getElementById('chat-send-btn').disabled = true;
          } else {
            renderizarSistema('✅ Sua conta foi desbloqueada.');
            chatInput.disabled = false;
            document.getElementById('chat-send-btn').disabled = false;
          }
        }
      });
    }

    tela3Initialized = true;
  }

  // Atualizar status de conexão ao entrar na tela
  if (socket && socket.connected) {
    atualizarStatus('Online', true);
  } else {
    atualizarStatus('Conectando...', false);
  }

  // Focar no input
  setTimeout(() => chatInput.focus(), 300);
}

// ── Enviar mensagem ──
function enviarMensagem() {
  const texto = chatInput.value.trim();
  if (!texto) return;

  const data = {
    id:    estadoGlobal.id   || gerarId(),
    nome:  estadoGlobal.nome || 'Anônimo',
    texto: texto,
    hora:  formatarHora()
  };

  if (socket && socket.connected) {
    // Renderizar imediatamente na própria tela (otimistic UI)
    renderizarMensagem(data, true);
    socket.emit('chatMessage', data);
  } else {
    // Modo offline: só mostra localmente
    renderizarSistema('⚠ Sem conexão com o servidor. Mensagem não enviada.');
  }

  chatInput.value = '';
  chatInput.focus();
  scrollParaFim();
}

// ── Renderizar bolha de mensagem ──
function renderizarMensagem(data, isOptimistic = false) {
  // Se for otimista (já renderizada antes do servidor confirmar), ignorar a confirmação do servidor
  if (!isOptimistic && data.id === estadoGlobal.id) {
    // Mensagem enviada pelo próprio usuário que chegou de volta via socket — ignorar (já foi renderizada)
    return;
  }

  const isSelf = data.id === estadoGlobal.id;

  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${isSelf ? 'self' : 'other'}`;
  msgEl.dataset.msgId = `${data.id}-${data.hora}`;

  const senderEl = document.createElement('div');
  senderEl.className = 'chat-msg-sender';
  // Oculta o nome nas mensagens próprias (estilo WhatsApp)
  senderEl.textContent = isSelf ? 'Você' : (data.nome || 'Anônimo');
  senderEl.style.display = isSelf ? 'none' : 'block';

  const textEl = document.createElement('div');
  textEl.className = 'chat-msg-text';
  textEl.textContent = data.texto;

  const timeEl = document.createElement('div');
  timeEl.className = 'chat-msg-time';
  timeEl.textContent = data.hora || formatarHora();

  msgEl.appendChild(senderEl);
  msgEl.appendChild(textEl);
  msgEl.appendChild(timeEl);

  chatMessages.appendChild(msgEl);
  scrollParaFim();
}

// ── Renderizar mensagem de sistema ──
function renderizarSistema(texto) {
  if (!chatMessages) return;

  const el = document.createElement('div');
  el.className = 'chat-msg-system';
  el.textContent = texto;
  chatMessages.appendChild(el);
  scrollParaFim();
}

// ── Auto-scroll ──
function scrollParaFim() {
  if (!chatMessages) return;
  // Usar requestAnimationFrame para garantir que o DOM foi atualizado
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// ── Atualizar status de conexão no header ──
function atualizarStatus(texto, isOnline) {
  if (!chatStatus) {
    chatStatus = document.getElementById('chat-status');
  }
  if (!chatStatus) return;

  chatStatus.textContent = texto;
  chatStatus.style.color = isOnline
    ? 'var(--chat-accent)'
    : 'rgba(233, 237, 239, 0.4)';
}

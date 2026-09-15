const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// ── Middlewares ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Armazenamento em memória ──
let usuarios = [];
let mensagens = [];

// ============================================
//  ROTAS DA API REST
// ============================================

// GET /api/usuarios — Listar todos os usuários (Dashboard)
app.get('/api/usuarios', (req, res) => {
  res.json(usuarios);
});

// POST /api/usuarios — Cadastrar novo usuário (Tela 1 - CLI)
app.post('/api/usuarios', (req, res) => {
  const { nome, curso, idade } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const novoUsuario = {
    id,
    nome: String(nome).trim(),
    curso: curso ? String(curso).trim() : 'Não informado',
    idade: Number(idade) || null,
    status: 'online',
    createdAt: new Date().toISOString()
  };

  usuarios.push(novoUsuario);
  console.log(`[API] Novo usuário cadastrado: ${novoUsuario.nome} (${novoUsuario.id})`);

  // Notificar todos os clientes conectados (ex: Dashboard aberto)
  io.emit('usuarioCadastrado', novoUsuario);

  res.status(201).json(novoUsuario);
});

// PUT /api/usuarios/:id — Atualizar dados do usuário (Tela 2 - Formulário)
app.put('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const { nome, curso, idade } = req.body;

  let usuario = usuarios.find(u => u.id === id);

  if (usuario) {
    if (nome) usuario.nome = String(nome).trim();
    if (curso) usuario.curso = String(curso).trim();
    if (idade !== undefined) usuario.idade = Number(idade);

    console.log(`[API] Usuário atualizado: ${usuario.nome} (${usuario.id})`);
    io.emit('usuarioAtualizado', usuario);
    return res.json(usuario);
  }

  // Caso tenha sido criado em modo offline com ID local
  const novoUsuario = {
    id,
    nome: nome ? String(nome).trim() : 'Usuário',
    curso: curso ? String(curso).trim() : 'Não informado',
    idade: Number(idade) || null,
    status: 'online',
    createdAt: new Date().toISOString()
  };
  usuarios.push(novoUsuario);
  io.emit('usuarioAtualizado', novoUsuario);
  res.json(novoUsuario);
});

// DELETE /api/usuarios/:id — Excluir usuário (Tela 4 - Dashboard)
app.delete('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const index = usuarios.findIndex(u => u.id === id);

  if (index !== -1) {
    const removido = usuarios.splice(index, 1)[0];
    console.log(`[API] Usuário excluído: ${removido.nome} (${removido.id})`);
  }

  io.emit('usuarioDeletado', { id });
  res.json({ ok: true, id });
});

// PUT /api/usuarios/:id/status — Bloquear/Desbloquear (Tela 4 - Dashboard)
app.put('/api/usuarios/:id/status', (req, res) => {
  const { id } = req.params;
  const { isBanned } = req.body;

  const usuario = usuarios.find(u => u.id === id);
  if (usuario) {
    usuario.status = isBanned ? 'blocked' : 'online';
    console.log(`[API] Status de ${usuario.nome} → ${usuario.status}`);
    io.emit('usuarioAtualizado', usuario);
    return res.json(usuario);
  }

  res.status(404).json({ error: 'Usuário não encontrado' });
});

// GET /api/mensagens — Histórico de mensagens do chat
app.get('/api/mensagens', (req, res) => {
  res.json(mensagens);
});

// ============================================
//  WEBSOCKETS — Socket.io
// ============================================

io.on('connection', (socket) => {
  console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

  // Enviar histórico de mensagens para o novo cliente
  socket.emit('historicoMensagens', mensagens);

  // Receber nova mensagem e distribuir para todos
  socket.on('chatMessage', (data) => {
    if (!data || !data.texto || !String(data.texto).trim()) return;

    const hora = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const mensagemFormatada = {
      id: data.id || socket.id,
      nome: data.nome ? String(data.nome).trim() : 'Anônimo',
      texto: String(data.texto).trim(),
      hora: data.hora || hora
    };

    mensagens.push(mensagemFormatada);
    if (mensagens.length > 150) mensagens.shift(); // Limite de 150 em memória

    console.log(`[Chat] [${mensagemFormatada.hora}] ${mensagemFormatada.nome}: ${mensagemFormatada.texto}`);

    // Reenviar para TODOS os outros clientes (quem enviou já renderizou via otimistic UI)
    socket.broadcast.emit('chatMessage', mensagemFormatada);
  });

  // Dashboard excluiu um usuário via socket
  socket.on('deletarUsuario', (data) => {
    if (data && data.id) {
      usuarios = usuarios.filter(u => u.id !== data.id);
      io.emit('usuarioDeletado', { id: data.id });
    }
  });

  // Dashboard alterou status de bloqueio via socket
  socket.on('atualizarUsuario', (data) => {
    if (data && data.id) {
      const u = usuarios.find(user => user.id === data.id);
      if (u && data.isBanned !== undefined) {
        u.status = data.isBanned ? 'blocked' : 'online';
      }
      io.emit('usuarioAtualizado', u || data);
    }
  });

  // Reenviar histórico quando cliente pede (ex: após reconexão)
  socket.on('pedirHistorico', () => {
    socket.emit('historicoMensagens', mensagens);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
  });
});

// ── Inicialização do Servidor ──
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n===========================================`);
  console.log(`🚀 Servidor IHC rodando com sucesso!`);
  console.log(`📡 URL Local:   http://localhost:${PORT}`);
  console.log(`💬 Socket.io:   Ativo e aguardando conexões`);
  console.log(`===========================================\n`);
});

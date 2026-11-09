document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const messages = document.getElementById('messagesList');
  const welcome = document.getElementById('welcomeScreen');
  const typing = document.getElementById('typingIndicator');
  const history = document.getElementById('historyList');

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  let chats = JSON.parse(localStorage.getItem('apna_ai_chats') || '{}');
  let currentChat = 'chat_' + Date.now();

  function save() {
    localStorage.setItem('apna_ai_chats', JSON.stringify(chats));
  }

  function renderHistory() {
    history.innerHTML = '';

    Object.keys(chats).reverse().forEach(id => {
      const item = document.createElement('li');
      item.className = 'history-item';
      item.textContent = chats[id].title;

      item.onclick = () => {
        currentChat = id;
        messages.innerHTML = '';
        welcome.style.display = 'none';

        chats[id].messages.forEach(msg => {
          appendMessage(msg.role, msg.content);
        });

        closeSidebar();
      };

      history.appendChild(item);
    });
  }

  function appendMessage(role, content) {
    const div = document.createElement('div');
    div.className = 'message ' +
      (role === 'user' ? 'user-message' : 'ai-message');

    if (role === 'assistant') {
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = 'AI';
      div.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = content;

    div.appendChild(bubble);
    messages.appendChild(div);

    document.getElementById('chatContainer').scrollTop =
      document.getElementById('chatContainer').scrollHeight;
  }

  async function sendMessage(text) {
    if (!text.trim() || sendBtn.disabled) return;

    if (!chats[currentChat]) {
      chats[currentChat] = {
        title: text.slice(0, 28),
        messages: []
      };
    }

    chats[currentChat].messages.push({
      role: 'user',
      content: text
    });

    appendMessage('user', text);
    welcome.style.display = 'none';
    input.value = '';

    save();
    renderHistory();

    typing.classList.add('active');
    sendBtn.disabled = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          messages: chats[currentChat].messages
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI connection failed');
      }

      appendMessage('assistant', data.reply);

      chats[currentChat].messages.push({
        role: 'assistant',
        content: data.reply
      });

      save();

    } catch (error) {
      appendMessage('assistant', 'APNA AI: ' + error.message);
    } finally {
      typing.classList.remove('active');
      sendBtn.disabled = false;
      input.focus();
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  document.querySelectorAll('.prompt-chip').forEach(btn => {
    btn.onclick = () => sendMessage(btn.dataset.text);
  });

  document.getElementById('newChatBtn').onclick = () => {
    currentChat = 'chat_' + Date.now();
    messages.innerHTML = '';
    welcome.style.display = 'flex';
    closeSidebar();
  };

  document.getElementById('clearCurrentBtn').onclick = () => {
    if (confirm('Clear current chat?')) {
      delete chats[currentChat];
      save();
      currentChat = 'chat_' + Date.now();
      messages.innerHTML = '';
      welcome.style.display = 'flex';
      renderHistory();
    }
  };

  document.getElementById('clearAllBtn').onclick = () => {
    if (confirm('Delete all chat history?')) {
      chats = {};
      save();
      currentChat = 'chat_' + Date.now();
      messages.innerHTML = '';
      welcome.style.display = 'flex';
      renderHistory();
    }
  };

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }

  document.getElementById('openSidebarBtn').onclick = () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  };

  document.getElementById('closeSidebarBtn').onclick = closeSidebar;
  overlay.onclick = closeSidebar;

  renderHistory();
});

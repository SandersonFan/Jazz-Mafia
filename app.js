const SUPABASE_URL = 'https://oturtamtzhwunjophzav.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dXJ0YW10emh3dW5qb3BoemF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzE0NzAsImV4cCI6MjA2MjgwNzQ3MH0.efg_5tb8fHn606QLUspHlbThzMXA6bLRITnNudctoYE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send-btn');
let currentUser = '';

function setUserName() {
  let name = localStorage.getItem('chatUser') || '';
  if (!name) {
    name = prompt('Enter your name:');
    while (!name || !name.trim()) {
      name = prompt('Please enter a valid name:');
    }
    localStorage.setItem('chatUser', name.trim());
  }
  currentUser = name.trim();
  document.getElementById('current-user').textContent = currentUser;
}

// Fetch and display messages
async function loadMessages() {
  chatMessages.innerHTML = '<div class="loading">Loading messages...</div>';
  let { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    chatMessages.innerHTML = '<div class="error">Error loading messages.</div>';
    return;
  }
  chatMessages.innerHTML = '';
  messages.forEach(msg => {
    appendMessage(msg.username, msg.text, msg.created_at);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Listen for new messages in real-time
function subscribeToMessages() {
  supabase
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
      const msg = payload.new;
      appendMessage(msg.username, msg.text, msg.created_at);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .subscribe();
}

function appendMessage(user, text, createdAt) {
  const div = document.createElement('div');
  div.className = 'chat-message';
  div.innerHTML = `
    <div class="chat-meta">
      <span class="user">${user}</span>
      <span class="timestamp">${createdAt ? new Date(createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
    </div>
    <div class="text">${text}</div>
  `;
  chatMessages.appendChild(div);
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = currentUser;
  const text = messageInput.value.trim();
  if (!username || !text) return;
  const { data, error } = await supabase
    .from('messages')
    .insert([{ username, text }])
    .select();
  if (error) {
    chatMessages.innerHTML += '<div class="error">Failed to send message.</div>';
  }
  messageInput.value = '';
  messageInput.focus();
});

// Send message on Enter key (without shift)
messageInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendButton.click();
  }
});

// Responsive: scroll to bottom on resize
window.addEventListener('resize', () => {
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

window.addEventListener('DOMContentLoaded', () => {
  setUserName();
  loadMessages();
  subscribeToMessages();
  messageInput.focus();
});

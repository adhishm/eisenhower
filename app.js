const quadrants = {
  'do-first': { label: 'Do first', subtitle: 'Urgent & important', tone: 'coral', icon: '↗' },
  schedule: { label: 'Schedule', subtitle: 'Important, not urgent', tone: 'blue', icon: '◷' },
  delegate: { label: 'Delegate', subtitle: 'Urgent, not important', tone: 'amber', icon: '↗' },
  eliminate: { label: 'Eliminate', subtitle: 'Neither urgent nor important', tone: 'slate', icon: '×' }
};
const initialTasks = [
  { id: 1, title: 'Finish project proposal', quadrant: 'do-first' },
  { id: 2, title: 'Book dentist appointment', quadrant: 'schedule' },
  { id: 3, title: 'Reply to team emails', quadrant: 'delegate' },
  { id: 4, title: 'Plan next week', quadrant: null },
  { id: 5, title: 'Review pull requests', quadrant: null }
];
let tasks = JSON.parse(localStorage.getItem('eisenhower-tasks') || 'null') || initialTasks;
let activeFilter = 'all';
let searchTerm = '';
let editingId = null;
let draggingId = null;

const $ = selector => document.querySelector(selector);
const save = () => { localStorage.setItem('eisenhower-tasks', JSON.stringify(tasks)); render(); };
const count = quadrant => tasks.filter(task => task.quadrant === quadrant).length;

function renderFilters() {
  const items = [
    ['all', '▦', 'All tasks'], ['inbox', '⌑', 'Inbox'],
    ...Object.entries(quadrants).map(([key, q]) => [key, q.icon, q.label, q.tone])
  ];
  $('#filters').innerHTML = '<p class="nav-label">My tasks</p>' + items.map(([key, icon, label, tone]) => `<button class="filter-button ${activeFilter === key ? 'active' : ''}" data-filter="${key}"><span class="filter-icon ${tone || ''}">${icon}</span><span>${label}</span><span class="filter-count">${key === 'all' ? tasks.length : key === 'inbox' ? count(null) : count(key)}</span></button>`).join('') + '<p class="nav-label">Matrix</p>';
  $('#filters').querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { activeFilter = button.dataset.filter; render(); }));
}

function card(task) {
  return `<article class="task-card" draggable="true" data-id="${task.id}"><span class="drag-handle">⠿</span><span class="task-title">${escapeHtml(task.title)}</span><div class="task-actions"><button data-edit="${task.id}" aria-label="Edit task">✎</button><button data-delete="${task.id}" aria-label="Delete task">♲</button></div></article>`;
}
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }
function visible(task) { return (activeFilter === 'all' || (activeFilter === 'inbox' ? !task.quadrant : task.quadrant === activeFilter)) && task.title.toLowerCase().includes(searchTerm.toLowerCase()); }

function render() {
  renderFilters();
  $('#matrix').innerHTML = Object.entries(quadrants).map(([key, q]) => `<section class="quadrant ${q.tone}" data-quadrant="${key}"><div class="quadrant-header"><div class="quadrant-heading"><span class="quadrant-icon">${q.icon}</span><div><h2>${q.label}</h2><p>${q.subtitle}</p></div></div><span class="task-count">${count(key)}</span></div><div class="quadrant-body">${tasks.filter(t => t.quadrant === key && visible(t)).map(card).join('') || '<div class="empty-state">Drop tasks here</div>'}</div></section>`).join('');
  const inbox = tasks.filter(t => !t.quadrant && visible(t));
  $('#inbox-count').textContent = count(null);
  $('#inbox-tasks').innerHTML = inbox.map(card).join('') || '<span class="empty-inbox">No tasks in your inbox</span>';
  document.querySelectorAll('.task-card').forEach(element => {
    element.addEventListener('dragstart', () => { draggingId = Number(element.dataset.id); element.classList.add('dragging'); });
    element.addEventListener('dragend', () => element.classList.remove('dragging'));
    element.querySelector('[data-edit]').addEventListener('click', () => openModal(Number(element.dataset.id)));
    element.querySelector('[data-delete]').addEventListener('click', () => { tasks = tasks.filter(task => task.id !== Number(element.dataset.id)); save(); });
  });
  document.querySelectorAll('[data-quadrant]').forEach(zone => { zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('drag-over'); }); zone.addEventListener('dragleave', () => zone.classList.remove('drag-over')); zone.addEventListener('drop', () => { if (draggingId) { tasks = tasks.map(task => task.id === draggingId ? { ...task, quadrant: zone.dataset.quadrant === 'inbox' ? null : zone.dataset.quadrant } : task); draggingId = null; save(); } }); });
}
function openModal(id = null) { editingId = id; const task = tasks.find(item => item.id === id); $('#modal-eyebrow').textContent = id ? 'Edit task' : 'New task'; $('#modal-title').textContent = id ? 'Update task' : 'What needs doing?'; $('#save-task').textContent = id ? 'Save changes' : 'Add task'; $('#task-name').value = task ? task.title : ''; $('#modal-backdrop').classList.remove('hidden'); $('#task-name').focus(); }
function closeModal() { $('#modal-backdrop').classList.add('hidden'); editingId = null; }
$('#add-task').addEventListener('click', () => openModal()); $('#add-task-main').addEventListener('click', () => openModal()); $('#close-modal').addEventListener('click', closeModal); $('#cancel-modal').addEventListener('click', closeModal); $('#modal-backdrop').addEventListener('click', event => { if (event.target === $('#modal-backdrop')) closeModal(); });
$('#search').addEventListener('input', event => { searchTerm = event.target.value; render(); });
$('#task-form').addEventListener('submit', event => { event.preventDefault(); const title = $('#task-name').value.trim(); if (!title) return; if (editingId) tasks = tasks.map(task => task.id === editingId ? { ...task, title } : task); else tasks.push({ id: Date.now(), title, quadrant: null }); closeModal(); save(); });
render();

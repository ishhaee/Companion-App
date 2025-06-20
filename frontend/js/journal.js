document.addEventListener('DOMContentLoaded', () => {
  let isViewingArchived = false;
  let journalToDelete = null;

  const backButton = document.getElementById('back-button');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const toggleArchived = document.getElementById('toggle-archived');
  const journalForm = document.getElementById('journal-form');
  const journalList = document.getElementById('journal-list');
  const journalListTitle = document.getElementById('journal-list-title');
  const deleteModal = document.getElementById('delete-modal');
  const cancelDelete = document.getElementById('cancel-delete');
  const confirmDelete = document.getElementById('confirm-delete');

  backButton.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('hidden');
  });

  toggleArchived.addEventListener('click', (e) => {
    e.preventDefault();
    isViewingArchived = !isViewingArchived;
    toggleArchived.textContent = isViewingArchived ? 'View Active Journals' : 'View Archived Journals';
    journalListTitle.textContent = isViewingArchived ? 'Archived Journals' : 'Your Journals';
    renderJournals();
  });

  async function renderJournals() {
    journalList.innerHTML = `<h2 id="journal-list-title" class="text-xl font-semibold text-blue-700 mb-4">${isViewingArchived ? 'Archived Journals' : 'Your Journals'}</h2>`;
    try {
      const response = await fetch(`http://localhost:3000/api/journals?archived=${isViewingArchived}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const journals = await response.json();
      if (journals.length === 0) {
        journalList.innerHTML += '<p class="text-blue-700">No journals found.</p>';
        return;
      }
      journals.forEach(journal => {
        const journalDiv = document.createElement('div');
        journalDiv.className = 'bg-blue-100 p-4 rounded-lg shadow-md relative';
        journalDiv.innerHTML = `
          <h3 class="text-lg font-semibold text-blue-700">${journal.title}</h3>
          <p class="text-blue-600 text-sm">${new Date(journal.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p class="text-blue-700 mt-2">${journal.content.substring(0, 100)}${journal.content.length > 100 ? '...' : ''}</p>
          <button class="journal-menu-toggle absolute top-2 right-2 text-blue-700">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <div class="journal-menu hidden absolute right-2 top-8 w-48 bg-white text-blue-700 rounded-lg shadow-lg">
            <a href="#" class="edit-journal block p-4 hover:bg-blue-100" data-id="${journal.id}">Edit Journal</a>
            <a href="#" class="${isViewingArchived ? 'unarchive-journal' : 'archive-journal'} block p-4 hover:bg-blue-100" data-id="${journal.id}">${isViewingArchived ? 'Unarchive Journal' : 'Archive Journal'}</a>
            <a href="#" class="delete-journal block p-4 hover:bg-blue-100" data-id="${journal.id}">Delete Journal</a>
          </div>
        `;
        journalList.appendChild(journalDiv);

        const menuToggle = journalDiv.querySelector('.journal-menu-toggle');
        const menu = journalDiv.querySelector('.journal-menu');
        menuToggle.addEventListener('click', () => {
          menu.classList.toggle('hidden');
        });

        journalDiv.querySelector('.edit-journal').addEventListener('click', (e) => {
          e.preventDefault();
          const journal = journals.find(j => j.id === parseInt(e.target.dataset.id));
          document.getElementById('journal-title').value = journal.title;
          document.getElementById('journal-content').value = journal.content;
          journalForm.dataset.editId = journal.id;
          journalForm.querySelector('button').textContent = 'Update Journal';
        });

        journalDiv.querySelector(isViewingArchived ? '.unarchive-journal' : '.archive-journal').addEventListener('click', async (e) => {
          e.preventDefault();
          await fetch(`http://localhost:3000/api/journals/${e.target.dataset.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ archived: !isViewingArchived }),
          });
          renderJournals();
        });

        journalDiv.querySelector('.delete-journal').addEventListener('click', (e) => {
          e.preventDefault();
          journalToDelete = parseInt(e.target.dataset.id);
          deleteModal.classList.remove('hidden');
        });
      });
    } catch (error) {
      journalList.innerHTML += '<p class="text-red-700">Error loading journals.</p>';
    }
  }

  journalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('journal-title').value;
    const content = document.getElementById('journal-content').value;
    try {
      if (journalForm.dataset.editId) {
        await fetch(`http://localhost:3000/api/journals/${journalForm.dataset.editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ title, content }),
        });
        delete journalForm.dataset.editId;
        journalForm.querySelector('button').textContent = 'Save Journal';
      } else {
        await fetch('http://localhost:3000/api/journals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ title, content }),
        });
      }
      journalForm.reset();
      renderJournals();
    } catch (error) {
      alert('Error saving journal.');
    }
  });

  cancelDelete.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
    journalToDelete = null;
  });

  confirmDelete.addEventListener('click', async () => {
    try {
      await fetch(`http://localhost:3000/api/journals/${journalToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      deleteModal.classList.add('hidden');
      journalToDelete = null;
      renderJournals();
    } catch (error) {
      alert('Error deleting journal.');
    }
  });

  renderJournals();
});
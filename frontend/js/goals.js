document.addEventListener('DOMContentLoaded', () => {
  let isViewingArchived = false;
  let goalToDelete = null;

  const backButton = document.getElementById('back-button');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const toggleArchived = document.getElementById('toggle-archived');
  const goalForm = document.getElementById('goal-form');
  const goalList = document.getElementById('goal-list');
  const goalListTitle = document.getElementById('goal-list-title');
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
    toggleArchived.textContent = isViewingArchived ? 'View Active Goals' : 'View Archived Goals';
    goalListTitle.textContent = isViewingArchived ? 'Archived Goals' : 'Your Goals';
    renderGoals();
  });

  function groupGoalsByDate(goals) {
    const grouped = {};
    goals.forEach(goal => {
      const date = new Date(goal.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(goal);
    });
    return grouped;
  }

  async function renderGoals() {
    goalList.innerHTML = `<h2 id="goal-list-title" class="text-xl font-semibold text-blue-700 mb-4">${isViewingArchived ? 'Archived Goals' : 'Your Goals'}</h2>`;
    try {
      const response = await fetch(`http://localhost:3000/api/goals?archived=${isViewingArchived}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const goals = await response.json();
      if (goals.length === 0) {
        goalList.innerHTML += '<p class="text-blue-700">No goals found.</p>';
        return;
      }
      const groupedGoals = groupGoalsByDate(goals);
      Object.keys(groupedGoals)
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(date => {
          const dateDiv = document.createElement('div');
          dateDiv.className = 'mb-6';
          dateDiv.innerHTML = `<h3 class="text-lg font-semibold text-blue-700 mb-2">${date}</h3>`;
          const goalsDiv = document.createElement('div');
          goalsDiv.className = 'space-y-4';
          groupedGoals[date].forEach(goal => {
            const goalDiv = document.createElement('div');
            goalDiv.className = `bg-blue-100 p-4 rounded-lg shadow-md relative ${goal.completed ? 'completed-goal' : ''}`;
            goalDiv.innerHTML = `
              <div class="flex items-center">
                <input type="checkbox" class="goal-checkbox mr-2" data-id="${goal.id}" ${goal.completed ? 'checked' : ''}>
                <div class="flex-1">
                  <h4 class="text-md font-semibold text-blue-700">${goal.title}</h4>
                  <p class="text-blue-700 mt-2">${goal.description.substring(0, 100)}${goal.description.length > 100 ? '...' : ''}</p>
                </div>
                <button class="goal-menu-toggle absolute top-2 right-2 text-blue-700">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="goal-menu hidden absolute right-2 top-8 w-48 bg-white text-blue-700 rounded-lg shadow-lg">
                  <a href="#" class="edit-goal block p-4 hover:bg-blue-100" data-id="${goal.id}">Edit Goal</a>
                  <a href="#" class="${isViewingArchived ? 'unarchive-goal' : 'archive-goal'} block p-4 hover:bg-blue-100" data-id="${goal.id}">${isViewingArchived ? 'Unarchive Goal' : 'Archive Goal'}</a>
                  <a href="#" class="delete-goal block p-4 hover:bg-blue-100" data-id="${goal.id}">Delete Goal</a>
                </div>
              </div>
            `;
            goalsDiv.appendChild(goalDiv);

            const menuToggle = goalDiv.querySelector('.goal-menu-toggle');
            const menu = goalDiv.querySelector('.goal-menu');
            menuToggle.addEventListener('click', () => {
              menu.classList.toggle('hidden');
            });

            const checkbox = goalDiv.querySelector('.goal-checkbox');
            checkbox.addEventListener('change', async (e) => {
              await fetch(`http://localhost:3000/api/goals/${e.target.dataset.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ completed: e.target.checked }),
              });
              renderGoals();
            });

            goalDiv.querySelector('.edit-goal').addEventListener('click', (e) => {
              e.preventDefault();
              const goal = goals.find(g => g.id === parseInt(e.target.dataset.id));
              document.getElementById('goal-title').value = goal.title;
              document.getElementById('goal-description').value = goal.description;
              goalForm.dataset.editId = goal.id;
              goalForm.querySelector('button').textContent = 'Update Goal';
            });

            goalDiv.querySelector(isViewingArchived ? '.unarchive-goal' : '.archive-goal').addEventListener('click', async (e) => {
              e.preventDefault();
              await fetch(`http://localhost:3000/api/goals/${e.target.dataset.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ archived: !isViewingArchived }),
              });
              renderGoals();
            });

            goalDiv.querySelector('.delete-goal').addEventListener('click', (e) => {
              e.preventDefault();
              goalToDelete = parseInt(e.target.dataset.id);
              deleteModal.classList.remove('hidden');
            });
          });
          dateDiv.appendChild(goalsDiv);
          goalList.appendChild(dateDiv);
        });
    } catch (error) {
      goalList.innerHTML += '<p class="text-red-700">Error loading goals.</p>';
    }
  }

  goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('goal-title').value;
    const description = document.getElementById('goal-description').value;
    try {
      if (goalForm.dataset.editId) {
        await fetch(`http://localhost:3000/api/goals/${goalForm.dataset.editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ title, description }),
        });
        delete goalForm.dataset.editId;
        goalForm.querySelector('button').textContent = 'Save Goal';
      } else {
        await fetch('http://localhost:3000/api/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ title, description }),
        });
      }
      goalForm.reset();
      renderGoals();
    } catch (error) {
      alert('Error saving goal.');
    }
  });

  cancelDelete.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
    goalToDelete = null;
  });

  confirmDelete.addEventListener('click', async () => {
    try {
      await fetch(`http://localhost:3000/api/goals/${goalToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      deleteModal.classList.add('hidden');
      goalToDelete = null;
      renderGoals();
    } catch (error) {
      alert('Error deleting goal.');
    }
  });

  renderGoals();
});
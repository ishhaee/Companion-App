document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('back-button');
  const sleepForm = document.getElementById('sleep-form');
  const sleepTimeInput = document.getElementById('sleep-time');
  const awakeTimeInput = document.getElementById('awake-time');
  const durationResult = document.getElementById('duration-result');
  const sleepChartCanvas = document.getElementById('sleep-chart').getContext('2d');

  let sleepChart = new Chart(sleepChartCanvas, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Sleep Duration (hours)',
        data: [],
        backgroundColor: '#3B82F6',
        borderColor: '#1E40AF',
        borderWidth: 1,
      }],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours',
            color: '#1E40AF',
          },
        },
        x: {
          title: {
            display: true,
            text: 'Date',
            color: '#1E40AF',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: '#1E40AF',
          },
        },
      },
    },
  });

  backButton.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  async function updateChart() {
    try {
      const response = await fetch('http://localhost:3000/api/sleep-records', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const sleepRecords = await response.json();
      const today = new Date();
      const labels = [];
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push(dateStr);
        const record = sleepRecords.find(r => new Date(r.date).toDateString() === date.toDateString());
        data.push(record ? parseFloat(record.duration) : 0);
      }
      sleepChart.data.labels = labels;
      sleepChart.data.datasets[0].data = data;
      sleepChart.update();
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }

  sleepForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sleepTime = sleepTimeInput.value;
    const awakeTime = awakeTimeInput.value;
    if (sleepTime && awakeTime) {
      try {
        const response = await fetch('http://localhost:3000/api/sleep-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ sleepTime, awakeTime }),
        });
        const sleepRecord = await response.json();
        durationResult.textContent = `Sleep Duration: ${sleepRecord.duration} hours`;
        sleepForm.reset();
        updateChart();
      } catch (error) {
        durationResult.textContent = 'Error saving sleep record';
      }
    } else {
      durationResult.textContent = 'Please enter valid sleep and awake times';
    }
  });

  updateChart();
});
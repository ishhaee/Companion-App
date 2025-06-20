document.addEventListener('DOMContentLoaded', () => {
  // Show auth form after 2.5 seconds
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
  }, 2500);

  const form = document.getElementById('auth-form');
  const toggleLink = document.getElementById('toggle-form');
  const formTitle = document.getElementById('form-title');
  const errorMessage = document.getElementById('error-message');
  let isLogin = true;

  // Toggle between login and signup
  toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    formTitle.textContent = isLogin ? 'Login' : 'Sign Up';
    toggleLink.textContent = isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login';
    form.querySelector('button').textContent = isLogin ? 'Login' : 'Sign Up';
    if (errorMessage) {
      errorMessage.classList.add('hidden');
      errorMessage.textContent = '';
    }
    form.reset(); // Clear form inputs
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Input validation
    if (!username || !password) {
      errorMessage.textContent = 'Username and password are required';
      errorMessage.classList.remove('hidden');
      errorMessage.classList.add('text-red-500');
      return;
    }

    if (password.length < 6) {
      errorMessage.textContent = 'Password must be at least 6 characters';
      errorMessage.classList.remove('hidden');
      errorMessage.classList.add('text-red-500');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      console.log('API Response:', { status: response.status, data }); // Debug log

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          console.log('Token stored:', localStorage.getItem('token')); // Debug log
          window.location.href = 'dashboard.html';
        } else {
          errorMessage.textContent = 'Registration successful! Please log in.';
          errorMessage.classList.remove('hidden', 'text-red-500');
          errorMessage.classList.add('text-green-500');
          isLogin = true;
          formTitle.textContent = 'Login';
          toggleLink.textContent = "Don't have an account? Sign Up";
          form.querySelector('button').textContent = 'Login';
          form.reset();
        }
      } else {
        errorMessage.textContent = data.error || (isLogin ? 'Login failed' : 'Registration failed');
        errorMessage.classList.remove('hidden');
        errorMessage.classList.add('text-red-500');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      errorMessage.textContent = 'Network error. Please check your connection or server status.';
      errorMessage.classList.remove('hidden');
      errorMessage.classList.add('text-red-500');
    }
  });
});
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const changePassword = document.getElementById('change-password');
    const logout = document.getElementById('logout');

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('hidden');
    });

    changePassword.addEventListener('click', (e) => {
        e.preventDefault();
        // Placeholder: Implement change password logic
        console.log('Change Password clicked');
    });

    logout.addEventListener('click', (e) => {
        e.preventDefault();
        // Placeholder: Implement logout logic
        console.log('Logout clicked');
        window.location.href = 'index.html';
    });
});
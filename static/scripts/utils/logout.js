document.querySelector('.logout').addEventListener('click', (e) => {
    e.preventDefault();
    console.log("Logging out...");

    // Clear token from localStorage
    localStorage.removeItem('authToken');

    // Redirect to login page
    window.location.href = "https://whatever-qw7l.onrender.com/login";
});

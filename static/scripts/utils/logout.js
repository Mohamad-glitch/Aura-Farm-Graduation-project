document.querySelector('.logout').addEventListener('click', (e) => {
    e.preventDefault();
    console.log("Logging out...");

    // Clear token from localStorage
    localStorage.removeItem('authToken');

    // Redirect to login page
    window.location.href = "https://http://127.0.0.1:8000/login";
});

// Handle login form submission
document.querySelector('.login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Login form submitted");

    // Get user input values
    const email = document.getElementById('email').value;
    const passkey = document.getElementById('password').value;
    const data = { user_email: email, password: passkey };

    try {
        // Send login request to backend
        const response = await fetch('http://127.0.0.1:8000/login_1', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        // Handle failed login
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            alert('Login failed. Please check your credentials and try again.');
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();

        // Save authentication token to localStorage
        localStorage.setItem('authToken', responseData.token);

        // Redirect to home page on successful login
        window.location.href = "http://127.0.0.1:8000/home";
    } catch (error) {
        console.error('Error:', error);
        alert('Login failed. Please check your credentials and try again.');
    }
});

// Auto-login if token exists in localStorage
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            // Validate token with backend
            const response = await fetch('http://127.0.0.1:8000/validate_token', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                // Redirect to home if token is valid
                window.location.href = "http://127.0.0.1:8000/home";
            } else {
                // Remove invalid token
                console.warn('Token invalid. Clearing token.');
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            console.error('Error validating token:', error);
        }
    }
});
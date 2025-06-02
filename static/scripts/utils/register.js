// Handle registration form submission
document.querySelector('.login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get user input values
    const full_name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validate required fields
    if (!full_name || !email || !password || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
    }
    // Check if passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    try {
        // Send registration request to backend
        const response = await fetch('http://127.0.0.1:8000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',  
            body: JSON.stringify({ full_name, email, password })
        });
        
        console.log('Response status:', response.status);

        // If backend redirects, follow the redirect
        if (response.redirected) {
            window.location.href = response.url;
        }

        if (response.ok) {
            // Registration successful
            const data = await response.json();
            console.log('Response body:', data);
            alert('Registration successful!');
            // Redirect or handle success
        } else {
            // Registration failed, show error
            const errorText = await response.text();
            console.log('Response body:', errorText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
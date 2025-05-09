document.querySelector('.login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const full_name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!full_name || !email || !password || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
    }
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    try {
        const response = await fetch('https://whatever-qw7l.onrender.com/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',  
            body: JSON.stringify({ full_name, email, password })
        });
        
        console.log('Response status:', response.status);
        if (response.redirected) {
            window.location.href = response.url;  // Redirect manually
        }

        if (response.ok) {
            const data = await response.json();
            console.log('Response body:', data);
            alert('Registration successful!');
            // Redirect or handle success
        } else {
            const errorText = await response.text();
            console.log('Response body:', errorText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
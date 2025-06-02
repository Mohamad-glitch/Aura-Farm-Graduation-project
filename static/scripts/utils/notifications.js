export function setupNotifications(notificationButtonId) {
    const notificationButton = document.getElementById(notificationButtonId);
    

    const notificationBadge = document.createElement('span');
    const notificationDropdown = document.createElement('div');

    notificationBadge.className = 'notification-badge';
    notificationBadge.textContent = '0';
    notificationBadge.style.display = 'none';
    notificationButton.appendChild(notificationBadge);

    notificationDropdown.className = 'notification-dropdown';
    notificationDropdown.innerHTML = '<div class="notification-item">There are no notifications</div>'; // Default message
    notificationButton.parentNode.appendChild(notificationDropdown);

    notificationButton.addEventListener('click', () => {
        if (notificationDropdown.classList.contains('open')) {
            notificationDropdown.style.maxHeight = '0'; // Collapse the dropdown
            notificationDropdown.style.opacity = '0'; // Fade out
            setTimeout(() => notificationDropdown.classList.remove('open'), 300); // Remove class after animation
        } else {
            notificationDropdown.classList.add('open');
            notificationDropdown.style.maxHeight = '250px'; // Expand the dropdown
            notificationDropdown.style.opacity = '1'; // Fade in
        }
    });

    function addNotification(message) {
        if (notificationDropdown.querySelector('.notification-item').textContent === 'There are no notifications') {
            notificationDropdown.innerHTML = ''; // Clear default message
        }

        const notificationCount = parseInt(notificationBadge.textContent, 10) + 1;
        notificationBadge.textContent = notificationCount;
        notificationBadge.style.display = 'block';

        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        notificationItem.textContent = message;
        notificationDropdown.appendChild(notificationItem);
    }

    return { addNotification };
}

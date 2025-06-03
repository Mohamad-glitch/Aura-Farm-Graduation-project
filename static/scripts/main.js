import { treeAnimation } from './utils/loading_animation.js';
import { setupAddCard } from './utils/add.js';
import { initCalendar } from './utils/calender.js';
import { loadCardsFromStorage } from './utils/card_transfer.js';
import { toggleEditMode } from './utils/edit_mode.js';
import { fetchWeather } from './utils/weather.js';
import { setupNotifications } from './utils/notifications.js';
import { updateUsername } from './utils/current_user.js';
import { themeToggle } from './utils/toggle_theme.js';
import { setupChatbot } from './utils/chatbot.js'; // Import the chatbot setup function



document.addEventListener('DOMContentLoaded', function () {
    treeAnimation();
    updateUsername();
    initCalendar();
    fetchWeather("Irbid");

    const toggle_theme = document.getElementById('toggle-theme')
    if(localStorage.getItem('theme')){
        toggle_theme.innerHTML = '<i class = "fas fa-sun"></i>';
    }
        else{    toggle_theme.innerHTML = '<i class = "fas fa-moon"></i>';
    }

    // Set up edit button
    const editButton = document.getElementById('edit');
    if (editButton) {
        editButton.addEventListener('click', toggleEditMode);
    }

    // Set up Add Card AFTER loading from storage
    const { createCropCard, MAX_CROPS, addCardBtn } = setupAddCard();
    loadCardsFromStorage(createCropCard, MAX_CROPS, addCardBtn);

    themeToggle('toggle-theme');
    const { fetchNotifications } = setupNotifications("notif");
    const notifButton = document.getElementById("notif");
    if (notifButton && fetchNotifications) {
        notifButton.addEventListener("click", fetchNotifications);
    }

    // Initialize chatbot
    setupChatbot();
});
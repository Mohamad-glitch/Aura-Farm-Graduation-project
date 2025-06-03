import { initCalendar } from './utils/calender.js';
import { loadCardsFromStorage, saveCardsToStorage } from './utils/card_transfer.js';
import { setupAddCard } from './utils/add.js';
import { setupNotifications } from './utils/notifications.js'; // Import notifications

document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar
    initCalendar();
    
    // Initialize add card functionality
    const { createCropCard, MAX_CROPS, addCardBtn } = setupAddCard();
    
    // Load cards from storage
    loadCardsFromStorage(createCropCard, MAX_CROPS, addCardBtn);
    
    // Initialize notifications
    const { addNotification } = setupNotifications('noti');
    // test test
    setTimeout(() => addNotification('first notification'), 3000);    

    // Save cards before page unload
    window.addEventListener('beforeunload', saveCardsToStorage);
});
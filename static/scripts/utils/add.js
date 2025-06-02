import { saveCardsToStorage } from './card_transfer.js';
import { isEditMode } from './edit_mode.js';
export const MAX_CROPS = 4; // Maximum number of crops allowed
let addCardBtn;

export function setupAddCard() {
    addCardBtn = document.getElementById('add-card');
    const container = document.querySelector('.growth-cards');

    if (!addCardBtn || !container) {
        console.error("Could not find required elements");
        return { createCropCard, MAX_CROPS, addCardBtn };
    }

    addCardBtn.addEventListener('click', () => {
        const currentCrops = container.querySelectorAll('.card:not(.add-card)');
        // Prevent adding more than MAX_CROPS cards
        if (currentCrops.length >= MAX_CROPS) {
            addCardBtn.style.display = "none";
            return;
        }

        // Prompt user for crop name
        const cropName = prompt("Enter the crop name:");
        if (!cropName || cropName.trim() === "") {
            alert("Crop name cannot be empty.");
            return;
        }

        // Create and insert new crop card
        const newCard = createCropCard({ name: cropName.trim() }, container);
        container.insertBefore(newCard, addCardBtn);
        const data = {
            name: cropName,
            growth_percent: 0,
            harvest_ready: false
        };
        // Hide add button if max crops reached
        if (currentCrops.length + 1 >= MAX_CROPS) {
            addCardBtn.style.display = "none";
        }
        // Save new card data to storage
        saveCardsToStorage(data);
    });
    return { createCropCard, MAX_CROPS, addCardBtn };
}
/**
 * Creates a crop card DOM element with event listeners for stats and removal.
 * @param {Object} crop - Crop data object.
 * @param {HTMLElement} container - The container to which the card belongs.
 * @param {string} id - Unique card ID.
 * @param {number} progress - Growth progress percentage.
 * @returns {HTMLElement} The created card element.
 */
function createCropCard(crop, container, id = `crop-${Date.now()}`, progress = 0) {
    const card = document.createElement('div');
    card.className = 'card';
    card.id = id;
    card.innerHTML = `
        <h3 class="fas">${crop.name}</h3>
        <button class="remove-card" style="display: none">
            <i class="fas fa-times"></i>
        </button>
        <div class="progress" style="--progress: ${progress}%">
            <span>${progress}% Growth</span>
        </div>
    `;

    // Card click event: fetch and display sensor stats and window status
    card.addEventListener ('click', async() => {
        if (isEditMode) return;

        const statsCard = document.querySelector('.stats.card');
        if (statsCard) {
            statsCard.querySelector('h3').textContent = crop.name;

            let id = card.id;
            try {
                // Fetch sensor statistics from backend
                const response = await fetch('http://127.0.0.1:8000/farms/sensorStats', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
        
                if (!response.ok) {
                    throw new Error(`Failed to fetch user data: ${response.statusText}`);
                }
        
                const data = await response.json();
                const temp = data.temperature;
                const humidity = data.humidity;
                const moisture = data.soil_moisture;     
                
                console.log(data);
                const temp_stat = document.getElementById('temp');
                const hum_stat = document.getElementById('humidity');
                const moi_stat = document.getElementById('soil-moisture');

                temp_stat.textContent = `${temp} °C`;
                hum_stat.textContent = `${humidity} %`;
                moi_stat.textContent = `${moisture} %`;



            } catch (error) {
                console.error('Error fetching user data:', error);
            }

            try {
                // Fetch window status from backend
                const response = await fetch('http://127.0.0.1:8000/farms/window-status', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
        
                if (!response.ok) {
                    throw new Error(`Failed to fetch user data: ${response.statusText}`);
                }

                const a = await response.json();
                console.log(a);
                const window = a.status;   
                const window_status = document.getElementById('window');
                window_status.textContent = `${window}`; 
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
    });

    // Remove button click event: deletes card from backend and UI
    const removeBtn = card.querySelector('.remove-card');
    removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        let id = card.id;
        if (confirm('Are you sure you want to remove this card?')) {
            try {
                // Send DELETE request to backend to remove crop
                const response = await fetch(`http://127.0.0.1:8000/farms/crops/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`},
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error deleting card:', errorText);
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                console.log(`Card with ID ${id} deleted successfully.`);
                card.remove();

                // Show add button if below max crops after removal
                const currentCrops = container.querySelectorAll('.card:not(.add-card)');
                if (currentCrops.length < MAX_CROPS) {
                    addCardBtn.style.display = "flex";
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });
    // Focus on the card title for accessibility
    const title = card.querySelector('h3');
    title.focus();
    return card;
}
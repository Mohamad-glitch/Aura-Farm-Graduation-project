import { saveCardsToStorage } from './card_transfer.js';
import { isEditMode } from './edit_mode.js';
export const MAX_CROPS = 4; // MAX_CROPS is exported
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
        if (currentCrops.length >= MAX_CROPS) {
            addCardBtn.style.display = "none";
            return;
        }

        const cropName = prompt("Enter the crop name:");
        if (!cropName || cropName.trim() === "") {
            alert("Crop name cannot be empty.");
            return;
        }

        const newCard = createCropCard({ name: cropName.trim() }, container);
        container.insertBefore(newCard, addCardBtn);
        const data = {
            name: cropName,
            growth_percent: 0,
            harvest_ready: false
        };

        if (currentCrops.length + 1 >= MAX_CROPS) {
            addCardBtn.style.display = "none";
        }

        saveCardsToStorage(data);
    });
    return { createCropCard, MAX_CROPS, addCardBtn };
}
// creating a crop card
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

    // Add click event to update the stats card
    card.addEventListener ('click', async() => {
        if (isEditMode) return;

        const statsCard = document.querySelector('.stats.card');
        if (statsCard) {
            statsCard.querySelector('h3').textContent = crop.name;

            let id = card.id;
            try {
                const response = await fetch('https://whatever-qw7l.onrender.com/farms/sensorStats', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
        
                if (!response.ok) {
                    throw new Error(`Failed to fetch user data: ${response.statusText}`);
                }
        
                const data = await response.json();
                const temp = data.temperature; //10
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
                const response = await fetch('https://whatever-qw7l.onrender.com/farms/window-status', {
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

    // remove button click event listener
    const removeBtn = card.querySelector('.remove-card');
    removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        let id = card.id;
        if (confirm('Are you sure you want to remove this card?')) {
            try {
                const response = await fetch(`https://whatever-qw7l.onrender.com/farms/crops/${id}`, {
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

                const currentCrops = container.querySelectorAll('.card:not(.add-card)');
                if (currentCrops.length < MAX_CROPS) {
                    addCardBtn.style.display = "flex";
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });
    
    const title = card.querySelector('h3');
    title.focus();
    return card;
}
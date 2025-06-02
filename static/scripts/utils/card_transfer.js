// Indicates if cards are currently being loaded from storage (prevents save during load)
let isLoadingFromStorage = false;
// Used to trigger a one-time reload after saving a card
let oneTimeReload = false;

/**
 * Saves a crop card's data to the backend storage.
 * Sends a POST request with crop data to the backend API.
 * @param {Object} cardData - The crop card data to save.
 * @returns {Promise<Object>} The saved card data from the backend.
 */
export async function saveCardsToStorage(cardData) {
    if (isLoadingFromStorage || !cardData) return;
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Validate and prepare request body
        const body = {
            name: String(cardData.name || "Unnamed Crop").slice(0, 50), // Limit name length
            growth_percent: Number(cardData.growth_percent) || 0,
            harvest_ready: Boolean(cardData.harvest_ready),
        };

        const response = await fetch(`http://127.0.0.1:8000/farms/crops`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        
        // Optionally reload the page after saving (if flagged)
        if (oneTimeReload) {
            oneTimeReload = false;
            location.reload();
        }
        return await response.json();
    } catch (error) {
        console.error('Error saving card data:', error);
        throw error; // Re-throw for calling code to handle
    }
}

/**
 * Loads crop cards from backend storage and renders them in the UI.
 * Handles authentication, fetches cards, and manages add button visibility.
 * @param {Function} createCropCard - Function to create a crop card DOM element.
 * @param {number} maxCrops - Maximum number of crop cards allowed.
 * @param {HTMLElement} addCardBtn - The "Add Card" button element.
 */
export async function loadCardsFromStorage(createCropCard, maxCrops, addCardBtn) {
    const container = document.querySelector('.growth-cards');
    if (!container) return;

    try {
        isLoadingFromStorage = true;
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Clear existing cards from the UI (except the add card button)
        const existingCards = container.querySelectorAll('.card:not(.add-card)');
        existingCards.forEach(card => card.remove());

        // Fetch crop cards from backend
        const response = await fetch('http://127.0.0.1:8000/farms/crops', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const cardsData = await response.json();

        // Process and display unique cards
        const cardsContainer = document.createDocumentFragment();
        const uniqueCards = new Map();

        cardsData.forEach(card => {
            if (!uniqueCards.has(card.id)) {
                uniqueCards.set(card.id, card);
                const cardElement = createCropCard(
                    {
                        name: card.name,
                        growth_percent: card.growth_percent,
                        harvest_ready: card.harvest_ready,
                        id: card.id
                    },
                    container,
                    card.id,
                    card.growth_percent
                );
                cardsContainer.appendChild(cardElement);
            }
        });

        // Insert all loaded cards before the add card button
        container.insertBefore(cardsContainer, container.lastElementChild);

        // Update add button visibility based on number of cards
        if (addCardBtn) {
            addCardBtn.style.display = uniqueCards.size >= maxCrops ? "none" : "flex";
        }
    } catch (error) {
        console.error('Error loading cards:', error);
        // Consider showing user feedback here
    } finally {
        isLoadingFromStorage = false;
    }
}
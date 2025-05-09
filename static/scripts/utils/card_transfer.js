let isLoadingFromStorage = false;
let oneTimeReload = false;
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

        const response = await fetch(`https://whatever-qw7l.onrender.com/farms/crops`, {
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

export async function loadCardsFromStorage(createCropCard, maxCrops, addCardBtn) {
    const container = document.querySelector('.growth-cards');
    if (!container) return;

    try {
        isLoadingFromStorage = true;
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Clear existing cards
        const existingCards = container.querySelectorAll('.card:not(.add-card)');
        existingCards.forEach(card => card.remove());

        const response = await fetch('https://whatever-qw7l.onrender.com/farms/crops', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const cardsData = await response.json();

        // Process and display cards
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

        container.insertBefore(cardsContainer, container.lastElementChild);

        // Update add button visibility
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
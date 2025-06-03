export function setupChatbot() {
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');

    if (!chatbotMessages || !chatbotInput || !chatbotSend) {
        console.error('Chatbot elements not found.');
        return;
    }

    // Add starting message from the bot
    const botMessageElement = document.createElement('div');
    botMessageElement.className = 'chatbot-message bot';
    botMessageElement.innerHTML = "<i class='fas fa-user'></i> Hello, how can I help you?";
    chatbotMessages.appendChild(botMessageElement);

    chatbotSend.addEventListener('click', async () => {
        const userMessage = chatbotInput.value.trim();
        if (!userMessage) return;
    
        // Display user message
        const userMessageElement = document.createElement('div');
        userMessageElement.className = 'chatbot-message user';
        userMessageElement.textContent = userMessage;
        chatbotMessages.appendChild(userMessageElement);
    
        chatbotInput.value = '';
    
        // Display loading message
        const loadingElement = document.createElement('div');
        loadingElement.className = 'chatbot-message bot loading';
        loadingElement.innerHTML ='<i class="fas fa-user"></i> Typing...';
        chatbotMessages.appendChild(loadingElement);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    
        // Send user's message to the server and fetch chatbot response
        try {
            const response = await fetch('http://127.0.0.1:8000/chat_bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: userMessage }),
            });
    
            if (!response.ok) {
                throw new Error(`Failed to fetch chatbot response: ${response.statusText}`);
            }
    
            const botMessage = await response.json();
    
            // Replace loading message with bot response
            loadingElement.remove();
    
            const botResponseElement = document.createElement('div');
            botResponseElement.className = 'chatbot-message bot';
            botResponseElement.innerHTML ='<i class="fas fa-user"></i> ' + formatBotResponse(botMessage.content);
            chatbotMessages.appendChild(botResponseElement);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        } catch (error) {
            console.error('Error fetching chatbot response:', error);
    
            // Replace loading message with an error message
            loadingElement.innerHTML = '<i class="fas fa-user"></i> Error fetching response. Please try again.';
            loadingElement.classList.remove('loading');
        }
    });
    // Allow "Enter" key to send message
    chatbotInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            chatbotSend.click();
        }
    });
}

// Format bot response with no bold formatting
function formatBotResponse(content) {
    return (
        '<div>' +
        content
            .replace(/\*\*/g, '') 
            .replace(/^### (.*)$/gm, '<h3>$1</h3>')
            .replace(/^---$/gm, '<hr>')
            .replace(/^\- (.*?): (.*)$/gm, '<li>$1: $2</li>')
            .replace(/^\- (.*)$/gm, '<li>$1</li>')
            .replace(/\n{2,}/g, '</ul><br><ul>')
            .replace(/\n/g, '') 
            .replace(/<li>/, '<ul><li>') 
            .replace(/<\/li>$/, '</li></ul>') + 
        '</div>'
    );
}

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

        // Send user's message to the server and fetch chatbot response
        try {
            const response = await fetch('https://whatever-qw7l.onrender.com/chat_bot', {
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

            const botResponseElement = document.createElement('div');
            botResponseElement.className = 'chatbot-message bot';

            botResponseElement.innerHTML = formatBotResponse(botMessage.content);
            chatbotMessages.appendChild(botResponseElement);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        } catch (error) {
            console.error('Error fetching chatbot response:', error);
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
            .replace(/\*\*/g, '') // Remove all **bold markers**
            .replace(/^### (.*)$/gm, '<h3>$1</h3>')
            .replace(/^---$/gm, '<hr>')
            .replace(/^\- (.*?): (.*)$/gm, '<li>$1: $2</li>') // handle things like "- Roots: anchor plant"
            .replace(/^\- (.*)$/gm, '<li>$1</li>')
            .replace(/\n{2,}/g, '</ul><br><ul>')
            .replace(/\n/g, '') // remove leftover line breaks
            .replace(/<li>/, '<ul><li>') // start list
            .replace(/<\/li>$/, '</li></ul>') + // end list
        '</div>'
    );
}

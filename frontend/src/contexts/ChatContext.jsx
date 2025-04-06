import { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const sendMessage = useCallback(async (message) => {
        if (!message.trim()) return;

        setIsLoading(true);
        setError(null);

        // Add user message to the chat
        setMessages(prev => [...prev, { role: 'user', content: message }]);

        try {
            const response = await fetch('http://localhost:8000/api/v1/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiMessage = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const content = line.slice(6);
                        aiMessage += content;
                        setMessages(prev => {
                            const newMessages = [...prev];
                            const lastMessage = newMessages[newMessages.length - 1];
                            
                            if (lastMessage && lastMessage.role === 'assistant') {
                                lastMessage.content = aiMessage;
                                return newMessages;
                            } else {
                                return [...newMessages, { role: 'assistant', content: aiMessage }];
                            }
                        });
                    }
                }
            }
        } catch (err) {
            setError(err.message);
            setMessages(prev => [...prev, { role: 'error', content: err.message }]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetChat = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/chat/reset', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to reset chat');
            }

            setMessages([]);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    return (
        <ChatContext.Provider value={{
            messages,
            isLoading,
            error,
            sendMessage,
            resetChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}; 
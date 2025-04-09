import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [threadId, setThreadId] = useState(null);
    const [toolOutputs, setToolOutputs] = useState([]);

    // Initialize thread ID on component mount
    useEffect(() => {
        // Check if a thread ID exists in localStorage
        const storedThreadId = localStorage.getItem('chatThreadId');
        if (storedThreadId) {
            setThreadId(storedThreadId);
        } else {
            // Generate a new thread ID and store it
            const newThreadId = uuidv4();
            localStorage.setItem('chatThreadId', newThreadId);
            setThreadId(newThreadId);
        }
    }, []);

    const sendMessage = useCallback(async (message) => {
        if (!message.trim() || !threadId) return;

        setIsLoading(true);
        setError(null);
        setToolOutputs([]);  // Clear previous tool outputs

        // Add user message to the chat
        setMessages(prev => [...prev, { role: 'user', content: message }]);

        try {
            const response = await fetch('http://localhost:8000/api/v1/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    thread_id: threadId
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            // Store message ID for the current conversation flow
            const currentMessageId = uuidv4();
            let announcementSent = false;
            let toolStatusSent = false;
            const currentToolOutputs = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonData = JSON.parse(line.slice(6));
                            const { content, type, complete, tool_outputs } = jsonData;
                            
                            // Track tool outputs if they exist in the payload
                            if (tool_outputs) {
                                setToolOutputs(tool_outputs);
                            }
                            
                            if (!content && complete && type === 'response') continue; // Skip empty completion messages
                            
                            // Handle different message types
                            if (type === 'announcement' && !announcementSent) {
                                // Add the tool usage announcement as a separate message
                                setMessages(prev => [...prev, { 
                                    role: 'assistant', 
                                    content, 
                                    messageId: `${currentMessageId}-announcement`,
                                    isAnnouncement: true
                                }]);
                                announcementSent = true;
                            } 
                            else if (type === 'tool_status' && !toolStatusSent) {
                                // Add searching status as a separate message
                                setMessages(prev => [...prev, { 
                                    role: 'assistant', 
                                    content, 
                                    messageId: `${currentMessageId}-status`,
                                    isStatus: true
                                }]);
                                toolStatusSent = true;
                            }
                            else if (type === 'tool_output') {
                                // Store tool output
                                console.log("Tool output received:", content);
                                currentToolOutputs.push(content);
                                setToolOutputs(prev => [...prev, content]);
                                
                                // Don't add raw tool outputs to messages anymore
                                // Raw outputs will only be displayed in ContentContainer
                            }
                            else if (type === 'response') {
                                // Handle the main response content
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const lastResponseIndex = newMessages.findIndex(
                                        msg => msg.role === 'assistant' && 
                                        msg.messageId === currentMessageId &&
                                        !msg.isAnnouncement &&
                                        !msg.isStatus &&
                                        !msg.isTool
                                    );
                                    
                                    if (lastResponseIndex >= 0) {
                                        // Update existing response message
                                        newMessages[lastResponseIndex].content = content;
                                        // Also store tool outputs if available
                                        if (currentToolOutputs.length > 0 && !newMessages[lastResponseIndex].hasToolOutputs) {
                                            newMessages[lastResponseIndex].hasToolOutputs = true;
                                            newMessages[lastResponseIndex].toolOutputs = [...currentToolOutputs];
                                        }
                                    } else {
                                        // Add a new response message
                                        const newMessage = { 
                                            role: 'assistant', 
                                            content, 
                                            messageId: currentMessageId
                                        };
                                        
                                        // Add tool outputs if available
                                        if (currentToolOutputs.length > 0) {
                                            newMessage.hasToolOutputs = true;
                                            newMessage.toolOutputs = [...currentToolOutputs];
                                        }
                                        
                                        newMessages.push(newMessage);
                                    }
                                    return newMessages;
                                });
                            }
                            else if (type === 'error') {
                                setError(content);
                                setMessages(prev => [...prev, { role: 'error', content }]);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE message:', e);
                        }
                    }
                }
            }
        } catch (err) {
            setError(err.message);
            setMessages(prev => [...prev, { role: 'error', content: err.message }]);
        } finally {
            setIsLoading(false);
        }
    }, [threadId]);

    const resetChat = useCallback(async () => {
        if (!threadId) return;
        
        try {
            const response = await fetch('http://localhost:8000/api/v1/chat/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ thread_id: threadId }),
            });

            if (!response.ok) {
                throw new Error('Failed to reset chat');
            }

            setMessages([]);
            setError(null);
            setToolOutputs([]);
        } catch (err) {
            setError(err.message);
        }
    }, [threadId]);

    const startNewThread = useCallback(() => {
        // Generate a new thread ID
        const newThreadId = uuidv4();
        localStorage.setItem('chatThreadId', newThreadId);
        setThreadId(newThreadId);
        setMessages([]);
        setError(null);
        setToolOutputs([]);
    }, []);

    return (
        <ChatContext.Provider value={{
            messages,
            isLoading,
            error,
            threadId,
            toolOutputs,
            sendMessage,
            resetChat,
            startNewThread
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
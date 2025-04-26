import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useThread } from './ThreadContext';
import { getAuthHeaders } from '../utils/auth';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toolOutputs, setToolOutputs] = useState([]);
    
    // Get active thread from ThreadContext instead of managing thread ID internally
    const { activeThread } = useThread();
    
    // Fetch messages for a specific thread
    const fetchThreadMessages = useCallback(async (threadId) => {
        if (!threadId) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            console.log('Fetching messages for thread:', threadId);
            const response = await fetch(`http://localhost:8000/api/v1/threads/${threadId}/messages`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error fetching thread messages:', errorText);
                throw new Error(`Failed to fetch messages: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Thread messages received:', data);
            
            // Make sure messages are in the expected format for the frontend
            const formattedMessages = data.messages && data.messages.length > 0 
                ? data.messages.map(msg => {
                    // Make sure each message has the required properties
                    return {
                        role: msg.role || 'assistant',
                        content: msg.content || '',
                        messageId: msg.messageId || uuidv4(),
                        ...(msg.rawOutput && { rawOutput: true }),
                        ...(msg.hasToolOutputs && { hasToolOutputs: true, toolOutputs: msg.toolOutputs || [] })
                    };
                  })
                : [];
            
            console.log('Formatted messages:', formattedMessages);
            setMessages(formattedMessages);
            
            // If there are tool outputs in the response, set them
            if (data.tool_outputs && data.tool_outputs.length > 0) {
                setToolOutputs(data.tool_outputs);
            } else {
                setToolOutputs([]);
            }
        } catch (err) {
            console.error('Error fetching thread messages:', err);
            setError(err.message);
            setMessages([]);
            setToolOutputs([]);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const sendMessage = useCallback(async (message) => {
        if (!message.trim() || !activeThread) return;

        setIsLoading(true);
        setError(null);
        setToolOutputs([]);  // Clear previous tool outputs

        // Add user message to the chat
        setMessages(prev => [...prev, { role: 'user', content: message }]);

        try {
            const response = await fetch('http://localhost:8000/api/v1/chat/stream', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ 
                    message,
                    thread_id: activeThread.thread_id,
                    context_type: activeThread.context_type,
                    task_type: activeThread.task_type
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to send message: ${response.status} ${errorText}`);
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
    }, [activeThread]);

    const resetChat = useCallback(async () => {
        if (!activeThread) return;
        
        try {
            const response = await fetch('http://localhost:8000/api/v1/chat/reset', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ 
                    thread_id: activeThread.thread_id 
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to reset chat: ${response.status} ${errorText}`);
            }

            setMessages([]);
            setError(null);
            setToolOutputs([]);
        } catch (err) {
            setError(err.message);
            console.error('Error resetting chat:', err);
        }
    }, [activeThread]);

    // Load messages when active thread changes
    useEffect(() => {
        if (activeThread?.thread_id) {
            fetchThreadMessages(activeThread.thread_id);
        } else {
            // Clear messages if no active thread
            setMessages([]);
            setError(null);
            setToolOutputs([]);
        }
    }, [activeThread?.thread_id, fetchThreadMessages]);

    return (
        <ChatContext.Provider value={{
            messages,
            isLoading,
            error,
            toolOutputs,
            sendMessage,
            resetChat,
            fetchThreadMessages
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
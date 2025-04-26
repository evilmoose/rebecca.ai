import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getAuthHeaders } from '../utils/auth';

const ThreadContext = createContext();

export const ThreadProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Fetch threads on initial load
    useEffect(() => {
        if (isAuthenticated) {
            fetchThreads();
        }
    }, [isAuthenticated]);
    
    const fetchThreads = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/v1/threads', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setThreads(data);
                
                // If no active thread, set the most recent one
                if (!activeThread && data.length > 0) {
                    setActiveThread(data[0]);
                }
            } else {
                console.error('Failed to fetch threads:', await response.text());
            }
        } catch (error) {
            console.error('Failed to fetch threads:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const createThread = async (contextType = "general_chat", taskType = null, title = null, firstMessage = null) => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/v1/threads', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    context_type: contextType,
                    task_type: taskType,
                    title: title
                })
            });
            
            if (response.ok) {
                const newThread = await response.json();
                
                // Explicitly fetch all threads to ensure the UI is up-to-date
                await fetchThreads();
                
                // Set the active thread to the newly created one
                setActiveThread(newThread);
                
                // If a first message is provided, send it to initialize thread history
                if (firstMessage && newThread.thread_id) {
                    try {
                        console.log("Sending first message to thread:", firstMessage);
                        const msgResponse = await fetch('http://localhost:8000/api/v1/chat/message', {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({
                                message: firstMessage,
                                thread_id: newThread.thread_id,
                                context_type: contextType,
                                task_type: taskType
                            })
                        });
                        
                        if (msgResponse.ok) {
                            console.log("First message sent successfully");
                        } else {
                            console.error("Failed to send first message:", await msgResponse.text());
                        }
                    } catch (msgError) {
                        console.error("Error sending first message:", msgError);
                    }
                }
                
                return newThread;
            } else {
                console.error('Failed to create thread:', await response.text());
                return null;
            }
        } catch (error) {
            console.error('Failed to create thread:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Archive a thread
    const archiveThread = async (threadId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/v1/threads/${threadId}/archive`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                // Update local threads state
                setThreads(prev => prev.filter(t => t.thread_id !== threadId));
                
                // If the archived thread was active, set the most recent thread as active
                if (activeThread && activeThread.thread_id === threadId) {
                    if (threads.length > 0) {
                        const remainingThreads = threads.filter(t => t.thread_id !== threadId);
                        setActiveThread(remainingThreads.length > 0 ? remainingThreads[0] : null);
                    } else {
                        setActiveThread(null);
                    }
                }
                
                return true;
            }
            console.error('Failed to archive thread:', await response.text());
            return false;
        } catch (error) {
            console.error('Failed to archive thread:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <ThreadContext.Provider value={{
            threads,
            activeThread,
            isLoading,
            setActiveThread,
            createThread,
            archiveThread,
            refreshThreads: fetchThreads
        }}>
            {children}
        </ThreadContext.Provider>
    );
};

export const useThread = () => {
    const context = useContext(ThreadContext);
    if (!context) {
        throw new Error('useThread must be used within a ThreadProvider');
    }
    return context;
}; 
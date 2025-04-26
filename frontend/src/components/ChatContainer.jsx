import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Code, Plus } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useThread } from '../contexts/ThreadContext';
import Message from './Message';
import Spinner from './Spinner';

const ChatContainer = ({ onClose }) => {
    const { messages, isLoading, sendMessage, resetChat } = useChat();
    const { activeThread, createThread } = useThread();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (messages.length > 0 && isFirstLoad) {
            scrollToBottom();
            setIsFirstLoad(false);
        }
    }, [messages, isFirstLoad]);

    // Debug logging for messages
    useEffect(() => {
        console.log('ChatContainer messages:', messages);
        console.log('Active thread:', activeThread);
    }, [messages, activeThread]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        
        const messageContent = inputValue;
        setInputValue('');
        
        // If no active thread exists, create one with this message as the first message
        if (!activeThread) {
            await createThread("general_chat", null, "New Chat", messageContent);
            return;
        }
        
        // Otherwise, send message to existing thread
        await sendMessage(messageContent);
    };

    const handleNewThread = async () => {
        await createThread("general_chat", null, "New Chat");
    };

    // Get context type display name
    const getContextDisplayName = () => {
        const types = {
            'general_chat': 'General Chat',
            'research': 'Research',
            'blog_creation': 'Blog Writing',
            'video_processing': 'Video Processing',
            'code_writing': 'Code Assistant',
            'task_specific': activeThread?.task_type || 'Specialized Task'
        };
        
        return types[activeThread?.context_type] || 'Chat';
    };

    const renderWelcomeMessage = () => {
        if (messages.length === 0) {
            return (
                <div className="p-6 text-center bg-gray-50 rounded-lg my-4">
                    <h2 className="text-xl font-semibold mb-2">Welcome to Rebecca Chat</h2>
                    <p className="text-gray-600">Start a new conversation by typing a message below.</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Chat header with thread info */}
            <div className="p-3 border-b flex items-center justify-between bg-gray-50">
                <div>
                    <h3 className="font-medium">
                        {activeThread?.title || getContextDisplayName()}
                    </h3>
                    {activeThread?.task_type && (
                        <div className="text-xs text-gray-500">
                            Task: {activeThread.task_type}
                        </div>
                    )}
                </div>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        &times;
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {renderWelcomeMessage()}
                
                {messages.map((message, index) => (
                    <Message key={index} {...message} />
                ))}
                
                {isLoading && (
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Code className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Spinner size="sm" color="gray" />
                                <span className="text-sm text-gray-500">Loading...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="border-t p-3 bg-white">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={`Message ${getContextDisplayName()}...`}
                        className="flex-1 bg-transparent outline-none text-gray-700"
                        disabled={isLoading || !activeThread}
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !inputValue.trim() || !activeThread}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
                <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t">
                    <button 
                        onClick={resetChat}
                        disabled={!activeThread}
                        className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear Chat
                    </button>
                    <button 
                        onClick={handleNewThread}
                        className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        New Thread
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatContainer; 
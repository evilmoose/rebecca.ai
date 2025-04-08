import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Code } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import Message from './Message';

const ChatContainer = ({ onClose }) => {
    const { messages, isLoading, sendMessage, resetChat } = useChat();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        
        await sendMessage(inputValue);
        setInputValue('');
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {messages.map((message, index) => (
                    <Message key={index} {...message} />
                ))}
                {isLoading && (
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Code className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent outline-none text-gray-700"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                    <button 
                        onClick={resetChat}
                        className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear Chat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatContainer; 
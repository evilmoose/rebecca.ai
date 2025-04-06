import MainPanelFooter from "./MainPanelFooter";
import MainPanelHeader from "./MainPaneHeader";
import { PenLine, Image, UserCircle, Code, Send, Trash2, Video } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useState, useRef, useEffect } from 'react';

const ActionCard = ({ icon: Icon, title, onClick }) => (
    <div 
        className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
    >
        <div className={`p-2 rounded-lg mr-3 ${title.includes('Write') ? 'bg-amber-50' : 
            title.includes('Image') ? 'bg-blue-50' : 
            title.includes('Video') ? 'bg-purple-50' : 'bg-pink-50'}`}>
            <Icon className={`h-5 w-5 ${title.includes('Write') ? 'text-amber-600' : 
                title.includes('Image') ? 'text-blue-600' : 
                title.includes('Video') ? 'text-purple-600' : 'text-pink-600'}`} />
        </div>
        <span className="text-sm text-gray-700">{title}</span>
        <span className="ml-auto text-lg text-gray-400">+</span>
    </div>
);

const Message = ({ role, content }) => (
    <div className={`flex items-start gap-3 mb-6 ${role === 'user' ? 'justify-end' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
            {role === 'user' ? (
                <UserCircle className="w-6 h-6 text-blue-600" />
            ) : (
                <Code className="w-6 h-6 text-gray-600" />
            )}
        </div>
        <div className={`flex-grow max-w-[80%] ${
            role === 'user' ? 'bg-blue-50' : 'bg-gray-50'
        } p-3 rounded-lg`}>
            <p className="text-sm text-gray-900">{content}</p>
        </div>
    </div>
);

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

const VideoUploadContainer = () => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Get the authentication token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch('/api/v1/video/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
                body: formData,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Session expired. Please log in again.');
                }
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Upload failed');
            }

            const data = await response.json();
            // Handle the response data (transcript and summary)
            console.log('Upload successful:', data);
        } catch (error) {
            console.error('Upload error:', error);
            setError(error.message);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 h-full overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 min-h-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload and Process Video</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}
                
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="video-upload"
                        />
                        <label
                            htmlFor="video-upload"
                            className="cursor-pointer block"
                        >
                            <Video className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">
                                {file ? file.name : 'Click to select a video file'}
                            </p>
                        </label>
                    </div>

                    {file && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">File: {file.name}</span>
                                <span className="text-sm text-gray-600">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </span>
                            </div>
                            
                            {isUploading && (
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-purple-600 h-2.5 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            )}
                            
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {isUploading ? 'Processing...' : 'Upload and Process'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ContentContainer = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 min-h-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Here's the results of 5 attention-grabbing headlines:</h2>
            <ol className="list-decimal pl-4 space-y-3">
                <li className="text-gray-700">"Revolutionize Customer Engagement with AI Chat Copywriter"</li>
                <li className="text-gray-700">"Unleash the Power of AI Chat Copywriters for Transformative Customer Experiences"</li>
                <li className="text-gray-700">"Chatbots on Steroids: Meet the AI Copywriter Transforming Conversations"</li>
                <li className="text-gray-700">"From Bland to Brilliant: AI Chat Copywriters Make Brands Conversational Rockstars"</li>
                <li className="text-gray-700">"Say Goodbye to Boring Chats: AI Copywriters Elevate Conversational Marketing"</li>
            </ol>
            <div className="flex items-center gap-4 mt-6 pt-4 border-t">
                <button className="text-gray-600 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
                <button className="text-gray-600 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                </button>
                <button className="text-gray-600 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2" />
                    </svg>
                </button>
                <button className="ml-auto text-gray-600 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
);

const MainPanel = ({ 
    id, 
    className, 
    isCollapsed, 
    toggleCollapse,
    isInputFocused,
    setIsInputFocused 
}) => {
    const [selectedTask, setSelectedTask] = useState(null);

    const handleTaskSelect = (task) => {
        setSelectedTask(task);
        setIsInputFocused(true);
    };

    return (
        <div 
            id={id} 
            className={`
                ${className}
                transition-all duration-300 ease-in-out
                ${isCollapsed ? 'ml-0' : 'ml-[250px]'}
                flex flex-col h-screen
            `}
            style={{
                width: isCollapsed ? '100%' : 'calc(100% - 250px)'
            }}
        >
            <MainPanelHeader
                id={"main-panel-header"}
                className={"bg-white shadow-sm p-2 border-b flex-none"} 
                isCollapsed={isCollapsed}
                toggleCollapse={toggleCollapse}   
            />

            <div className="flex-1 p-4 bg-gray-50 min-h-0">
                {!isInputFocused ? (
                    // Welcome View
                    <div className="max-w-4xl mx-auto pt-12 pb-8">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome Rebecca.ai</h1>
                            <p className="text-gray-600">Get started by selecting a task below. Not sure where to start?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                            <ActionCard 
                                icon={PenLine} 
                                title="Write copy" 
                                onClick={() => handleTaskSelect('copy')}
                            />
                            <ActionCard 
                                icon={Image} 
                                title="Image generation" 
                                onClick={() => handleTaskSelect('image')}
                            />
                            <ActionCard 
                                icon={Video} 
                                title="Transcribe and Summarize Video" 
                                onClick={() => handleTaskSelect('video')}
                            />
                            <ActionCard 
                                icon={Code} 
                                title="Write code" 
                                onClick={() => handleTaskSelect('code')}
                            />
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-3">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="text"
                                    placeholder="Summarize the latest"
                                    className="flex-1 bg-transparent outline-none text-gray-700"
                                    onFocus={() => setIsInputFocused(true)}
                                />
                                <button className="text-gray-400 hover:text-gray-600">
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                                <button className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    Attach
                                </button>
                                <button className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    Voice Message
                                </button>
                                <button className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Browse Prompts
                                </button>
                                <span className="ml-auto text-sm text-gray-400">20 / 3,000</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Split View
                    <div className="h-full grid grid-cols-2 gap-4 min-h-0">
                        <ChatContainer onClose={() => setIsInputFocused(false)} />
                        {selectedTask === 'video' ? (
                            <VideoUploadContainer />
                        ) : (
                            <ContentContainer />
                        )}
                    </div>
                )}
            </div>

            <MainPanelFooter 
                id={"main-panel-footer"}
                className={"bg-neutral-800 text-white p-2 text-center flex-none"}  
            />
        </div>
    );
};

export default MainPanel;
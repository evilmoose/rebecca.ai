import { Menu, Search, Plus, Archive, ChevronDown, Loader } from 'lucide-react';
import { useThread } from '../contexts/ThreadContext';
import { useState } from 'react';

const SidePanel = ({ id, className, isCollapsed, toggleCollapse, setIsInputFocused }) => {
    const { threads, activeThread, setActiveThread, createThread, archiveThread, isLoading } = useThread();
    const [isHoveringOver, setIsHoveringOver] = useState(null);
    const [showNewChatOptions, setShowNewChatOptions] = useState(false);
    const [archivingThreadId, setArchivingThreadId] = useState(null);

    const handleNewChat = async (contextType = "general_chat", taskType = null, title = null) => {
        await createThread(contextType, taskType, title);
        setIsInputFocused(false);
        setShowNewChatOptions(false);
    };

    const handleArchiveThread = async (e, threadId) => {
        e.stopPropagation(); // Prevent thread selection when clicking archive button
        
        // Set loading state for this specific thread
        setArchivingThreadId(threadId);
        
        try {
            const success = await archiveThread(threadId);
            if (!success) {
                console.error("Failed to archive thread");
            }
        } catch (error) {
            console.error("Error archiving thread:", error);
        } finally {
            setArchivingThreadId(null);
        }
    };
    
    // Group threads by task type
    const groupedThreads = {};
    threads.forEach(thread => {
        const key = thread.task_type || 'general_chat';
        if (!groupedThreads[key]) {
            groupedThreads[key] = [];
        }
        groupedThreads[key].push(thread);
    });
    
    // Get display name for task type
    const getTaskName = (key) => {
        const names = {
            'general_chat': 'General Chat',
            'blog_creation': 'Blog Creation',
            'research': 'Research',
            'video_processing': 'Video Processing',
            'code_writing': 'Code Writing',
            'news': 'News Research'
        };
        return names[key] || key;
    };

    // Define specialized chat options
    const chatOptions = [
        { 
            name: "General Chat", 
            contextType: "general_chat", 
            description: "Ask me anything - general conversation and questions"
        },
        { 
            name: "Research Assistant", 
            contextType: "research", 
            taskType: "news", 
            description: "Get information about current events and news"
        },
        { 
            name: "Blog Writer", 
            contextType: "blog_creation", 
            description: "Help with writing and editing blog content"
        },
        { 
            name: "Code Assistant", 
            contextType: "code_writing", 
            description: "Programming help across multiple languages"
        },
        { 
            name: "Video Analyzer", 
            contextType: "video_processing", 
            description: "Help with understanding and processing videos"
        }
    ];

    return (
        <div 
            id={id} 
            className={`
                fixed left-0 top-0 bottom-0
                ${isCollapsed ? 'translate-x-100' : ''}
                bg-gray-100 shadow-md
                ${className}
            `}
            style={{
                width: '250px',
                transform: isCollapsed ? 'translateX(-100%)' : 'none',
                transition: 'transform 0.3s ease-in-out',
                zIndex: 1000
            }}>
            <div className="flex justify-between p-3">
                <Menu 
                    className="cursor-pointer" 
                    onClick={() => toggleCollapse()}
                />
                <Search className="cursor-pointer" />
            </div>

            {/* New Chat Button */}
            <div className="px-3 mt-2 relative">
                <button
                    onClick={() => setShowNewChatOptions(!showNewChatOptions)}
                    className={`w-full flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-700 hover:text-gray-900 ${isLoading ? 'opacity-50 cursor-default' : ''}`}
                    disabled={isLoading}
                >
                    <div className="flex items-center gap-2">
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        <span>New Chat</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showNewChatOptions ? 'transform rotate-180' : ''}`} />
                </button>

                {/* Enhanced Dropdown Menu */}
                {showNewChatOptions && !isLoading && (
                    <div className="absolute left-0 right-0 mt-1 px-3 py-2 bg-white rounded-lg shadow-md z-10">
                        <div className="space-y-1">
                            {chatOptions.map(option => (
                                <div 
                                    key={option.name}
                                    className="w-full p-2 hover:bg-gray-100 rounded cursor-pointer"
                                    onClick={() => handleNewChat(
                                        option.contextType, 
                                        option.taskType, 
                                        option.name
                                    )}
                                >
                                    <div className="font-medium text-sm">{option.name}</div>
                                    <div className="text-xs text-gray-500">{option.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Thread Groups */}
            <div className="mt-4 px-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                {Object.entries(groupedThreads).map(([type, typeThreads]) => (
                    <div key={type} className="mb-4">
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2 px-2">
                            {getTaskName(type)}
                        </h3>
                        {typeThreads.map(thread => (
                            <div 
                                key={thread.thread_id}
                                className={`relative w-full flex justify-between items-center rounded-md mb-1 cursor-pointer ${
                                    activeThread?.thread_id === thread.thread_id 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'hover:bg-gray-200'
                                } ${archivingThreadId === thread.thread_id ? 'opacity-50' : ''}`}
                                onClick={() => {
                                    console.log('Thread selected:', thread);
                                    setActiveThread(thread);
                                    setIsInputFocused(true); // Make sure we switch to chat view
                                }}
                                onMouseEnter={() => setIsHoveringOver(thread.thread_id)}
                                onMouseLeave={() => setIsHoveringOver(null)}
                            >
                                <div className="p-2 flex-grow">
                                    <div className="truncate text-sm">
                                        {thread.title || `${getTaskName(thread.context_type)} ${new Date(thread.created_at).toLocaleDateString()}`}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {new Date(thread.last_activity_at).toLocaleTimeString()}
                                    </div>
                                </div>
                                {(isHoveringOver === thread.thread_id || archivingThreadId === thread.thread_id) && (
                                    <button 
                                        className="p-2 text-gray-500 hover:text-red-500 disabled:opacity-50"
                                        onClick={(e) => handleArchiveThread(e, thread.thread_id)}
                                        disabled={archivingThreadId === thread.thread_id}
                                    >
                                        {archivingThreadId === thread.thread_id ? 
                                            <Loader className="w-4 h-4 animate-spin" /> : 
                                            <Archive className="w-4 h-4" />
                                        }
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {threads.length === 0 && (
                    <div className="text-center text-gray-500 mt-4">
                        {isLoading ? 
                            <div className="flex justify-center items-center">
                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                Loading chats...
                            </div> : 
                            "No threads yet. Start a new chat!"
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidePanel;
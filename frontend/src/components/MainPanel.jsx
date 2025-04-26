import { useState, useEffect } from 'react';
import { PenLine, Video, Code, Send, Search, Newspaper, Brain } from 'lucide-react';
import MainPanelHeader from "./MainPaneHeader";
import MainPanelFooter from "./MainPanelFooter";
import ActionCard from "./ActionCard";
import ChatContainer from "./ChatContainer";
import ContentContainer from "./ContentContainer";
import VideoProcessingContainer from "./VideoProcessingContainer";
import { useThread } from '../contexts/ThreadContext';

const MainPanel = ({ 
    id, 
    className, 
    isCollapsed, 
    toggleCollapse,
    isInputFocused,
    setIsInputFocused 
}) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const { activeThread, setActiveThread } = useThread();

    // Set input focus when active thread changes
    useEffect(() => {
        if (activeThread) {
            setIsInputFocused(true);
            console.log('MainPanel: Setting input focus to true due to active thread change');
        }
    }, [activeThread, setIsInputFocused]);

    const handleTaskSelect = (taskType, thread) => {
        console.log("Task selected:", taskType, thread);
        if (thread) {
            setActiveThread(thread);
            setSelectedTask(taskType);
            // Ensure we switch to the chat view
            setIsInputFocused(true);
        } else {
            console.error("No thread provided to handleTaskSelect");
        }
    };

    // Define available action cards
    const actionCards = [
        {
            icon: Newspaper,
            title: "Blog Writer",
            taskType: "blog_creation",
            description: "Create engaging blog posts, articles, and content marketing materials"
        },
        {
            icon: Search,
            title: "Research Assistant",
            taskType: "research",
            description: "Find up-to-date information and answers to complex questions"
        },
        {
            icon: Video,
            title: "Video Assistant",
            taskType: "video_processing",
            description: "Transcribe, summarize, and extract insights from video content"
        },
        {
            icon: Code,
            title: "Code Assistant",
            taskType: "code_writing",
            description: "Generate code, debug issues, and get programming help"
        },
        {
            icon: Brain,
            title: "General Assistant",
            taskType: null,
            contextType: "general_chat",
            description: "Chat about anything and get answers to your questions"
        }
    ];

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
                    // Welcome View with Task Selection
                    <div className="max-w-4xl mx-auto pt-12 pb-8">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to Rebecca.ai</h1>
                            <p className="text-gray-600">Get started by selecting a specialized assistant below</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                            {actionCards.map((card, index) => (
                                <ActionCard 
                                    key={index}
                                    icon={card.icon} 
                                    title={card.title}
                                    taskType={card.taskType}
                                    contextType={card.contextType || "task_specific"}
                                    description={card.description}
                                    onSelect={handleTaskSelect}
                                />
                            ))}
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-3">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="text"
                                    placeholder="Ask me anything..."
                                    className="flex-1 bg-transparent outline-none text-gray-700"
                                    onFocus={() => setIsInputFocused(true)}
                                />
                                <button 
                                    className="text-gray-400 hover:text-gray-600"
                                    onClick={() => setIsInputFocused(true)}
                                >
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
                    // Chat Container and Content Container
                    <div className="h-full grid grid-cols-2 gap-4 min-h-0">
                        <ChatContainer onClose={() => setIsInputFocused(false)} />
                        {activeThread?.context_type === 'video_processing' ? (
                            <VideoProcessingContainer />
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
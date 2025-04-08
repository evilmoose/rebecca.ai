import { useState } from 'react';
import { PenLine, Image, Video, Code, Send } from 'lucide-react';
import MainPanelHeader from "./MainPaneHeader";
import MainPanelFooter from "./MainPanelFooter";
import ActionCard from "./ActionCard";
import ChatContainer from "./ChatContainer";
import ContentContainer from "./ContentContainer";
import VideoProcessingContainer from "./VideoProcessingContainer";

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
import { useThread } from '../contexts/ThreadContext';
import { useState } from 'react';
import { getAuthHeaders } from '../utils/auth';

const ActionCard = ({ icon: Icon, title, taskType, description, contextType = "task_specific", onSelect }) => {
    const { createThread } = useThread();
    const [isLoading, setIsLoading] = useState(false);
    
    const handleClick = async () => {
        if (isLoading) return;
        
        setIsLoading(true);
        try {
            // Create a new thread with task-specific context
            const thread = await createThread(contextType, taskType, title);
            
            // Make sure we have a thread and that onSelect is called properly
            if (thread && onSelect) {
                console.log(`Created thread for task "${taskType}"`, thread);
                onSelect(taskType, thread);
            } else if (!thread) {
                console.error("Thread creation failed or returned null");
            }
        } catch (error) {
            console.error("Error creating thread:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Define background and text colors based on task type
    const getColorClasses = () => {
        switch (taskType) {
            case 'blog_creation':
                return { bg: 'bg-amber-50', text: 'text-amber-600' };
            case 'research':
                return { bg: 'bg-blue-50', text: 'text-blue-600' };
            case 'video_processing':
                return { bg: 'bg-purple-50', text: 'text-purple-600' };
            case 'code_writing':
                return { bg: 'bg-green-50', text: 'text-green-600' };
            default:
                return { bg: 'bg-gray-50', text: 'text-gray-600' };
        }
    };
    
    const { bg, text } = getColorClasses();
    
    return (
        <div 
            className={`relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 ${isLoading ? 'opacity-75' : ''}`}
            onClick={handleClick}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${text}`} />
                </div>
                <h3 className="text-lg font-medium">{title}</h3>
            </div>
            <div className="pl-12 text-sm text-gray-500">
                {description || getDefaultDescription()}
            </div>
            
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-lg">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
    
    function getDefaultDescription() {
        switch (taskType) {
            case 'blog_creation':
                return 'Create engaging content for blogs, social media, or marketing';
            case 'research':
                return 'Search the web for current information and in-depth research';
            case 'video_processing':
                return 'Upload, transcribe and summarize video content';
            case 'code_writing':
                return 'Generate and debug code in various programming languages';
            default:
                return 'AI-powered assistance for your tasks';
        }
    }
};

export default ActionCard; 
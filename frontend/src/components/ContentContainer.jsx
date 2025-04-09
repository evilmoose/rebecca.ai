import { useEffect, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { ThumbsUp, ThumbsDown, Copy, Share2 } from 'lucide-react';

const ContentContainer = () => {
    const { messages, toolOutputs } = useChat();
    const [lastUserQuery, setLastUserQuery] = useState("");
    
    // Find the latest tool outputs and user query
    useEffect(() => {
        if (messages.length === 0) return;
        
        // Update the last user query
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                setLastUserQuery(messages[i].content || "");
                break;
            }
        }
    }, [messages]);
    
    // Format the raw search results from toolOutputs or from message tool outputs
    const getRawSearchResults = () => {
        // First check if we have direct tool outputs
        if (toolOutputs && toolOutputs.length > 0) {
            return toolOutputs;
        }
        
        // Otherwise check for tool outputs in messages
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            if (message.role === 'tool' && message.rawOutput) {
                return [message.content];
            }
            if (message.hasToolOutputs && message.toolOutputs) {
                return message.toolOutputs;
            }
        }
        
        return [];
    };
    
    const rawResults = getRawSearchResults();
    
    // If no search results, show default content
    if (rawResults.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 h-full overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 min-h-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                        <p className="mb-2">No search results to display yet.</p>
                        <p className="text-sm">Ask a question that requires searching for information.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-lg shadow-sm p-6 h-full overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 min-h-0">
                <div className="mb-4 border-b pb-2">
                    <h2 className="text-lg font-semibold text-gray-900">Raw Search Results</h2>
                    <p className="text-sm text-gray-500">For query: "{lastUserQuery}"</p>
                </div>
                
                <div className="space-y-6">
                    {rawResults.map((content, index) => {
                        // Try to parse JSON content if it's in JSON format
                        let parsedContent;
                        try {
                            if (typeof content === 'string' && (content.startsWith('[') || content.startsWith('{'))) {
                                parsedContent = JSON.parse(content);
                            }
                        } catch (e) {
                            // Not JSON or invalid JSON
                        }
                        
                        // Display either the parsed JSON or the raw content
                        return (
                            <div key={index} className="border border-gray-200 rounded-lg">
                                <div className="bg-gray-50 p-2 border-b border-gray-200">
                                    <h3 className="font-medium text-gray-700">Search Result #{index + 1}</h3>
                                </div>
                                <div className="p-3">
                                    {parsedContent ? (
                                        <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                                            {JSON.stringify(parsedContent, null, 2)}
                                        </pre>
                                    ) : (
                                        typeof content === 'string' ? (
                                            // Try to handle our special marker format
                                            content.includes("[[SEARCH_RESULT]]") ? (
                                                <div className="space-y-4">
                                                    {content.split("[[SEARCH_RESULT]]")
                                                        .filter(part => part.includes("[[/SEARCH_RESULT]]"))
                                                        .map((part, idx) => {
                                                            const resultContent = part.split("[[/SEARCH_RESULT]]")[0];
                                                            const lines = resultContent.split('\n').filter(l => l.trim());
                                                            
                                                            // Extract components
                                                            const titleLine = lines.find(l => l.trim().startsWith('- '));
                                                            const urlLine = lines.find(l => l.includes('URL:'));
                                                            const descLine = lines.find(l => l.includes('Description:'));
                                                            
                                                            const title = titleLine ? titleLine.replace(/^-\s*/, '').trim() : "Result";
                                                            const url = urlLine ? urlLine.replace('URL:', '').trim() : "";
                                                            const description = descLine ? descLine.replace('Description:', '').trim() : "";
                                                            
                                                            return (
                                                                <div key={idx} className="border-b pb-3 last:border-b-0">
                                                                    <h3 className="font-medium text-blue-700 mb-1">{title}</h3>
                                                                    {url && (
                                                                        <a 
                                                                            href={url} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="text-green-600 text-sm hover:underline block mb-2 truncate"
                                                                        >
                                                                            {url}
                                                                        </a>
                                                                    )}
                                                                    {description && (
                                                                        <p className="text-gray-600 text-sm">{description}</p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            ) : (
                                                // Regular string content
                                                <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                                                    {content}
                                                </pre>
                                            )
                                        ) : (
                                            // Non-string content
                                            <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                                                {JSON.stringify(content, null, 2)}
                                            </pre>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="flex items-center gap-4 mt-6 pt-4 border-t">
                    <button 
                        className="text-gray-600 hover:text-gray-800" 
                        title="Copy results"
                        onClick={() => {
                            navigator.clipboard.writeText(rawResults.join('\n\n'));
                            alert("Search results copied to clipboard");
                        }}
                    >
                        <Copy className="h-5 w-5" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800" title="Like">
                        <ThumbsUp className="h-5 w-5" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800" title="Dislike">
                        <ThumbsDown className="h-5 w-5" />
                    </button>
                    <button className="ml-auto text-gray-600 hover:text-gray-800" title="Share">
                        <Share2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentContainer; 
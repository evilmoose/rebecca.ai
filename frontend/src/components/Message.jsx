import { UserCircle, Code, Search } from 'lucide-react';

const Message = ({ role, content }) => {
    // Debug logging for message props
    console.log('Message component props:', { role, content });
    
    // Function to check if content has search results format
    const hasSearchResults = (text) => {
        if (!text) return false;
        return text.includes("Here are the top search results:") || 
               text.includes("search results:") ||
               (text.includes("URL:") && text.includes("Description:"));
    };

    // Clean up repetitive tool usage announcements
    const cleanToolAnnouncement = (text) => {
        if (!text) return "";
        
        // Remove repetitive "I will use the available tool" announcements
        const pattern = /(I will use the available tool to find information about.*?\.)\s*/gi;
        const firstMatch = text.match(pattern);
        
        if (firstMatch && firstMatch.length > 0) {
            // Keep only the first announcement
            return text.replace(pattern, (match, p1, offset) => {
                return offset === text.indexOf(p1) ? p1 + "\n\n" : "";
            });
        }
        
        return text;
    };

    // Function to format the search results
    const formatSearchResults = (text) => {
        if (!hasSearchResults(text)) return cleanToolAnnouncement(text);

        // First clean up any tool announcements
        const cleanedText = cleanToolAnnouncement(text);

        // Split the text to extract the search results
        let header = "";
        let results = "";

        if (cleanedText.includes("Here are the top search results:")) {
            const parts = cleanedText.split("Here are the top search results:");
            header = parts[0];
            results = parts[1];
        } else if (cleanedText.includes("search results:")) {
            const indexOfResults = cleanedText.indexOf("search results:");
            header = cleanedText.substring(0, indexOfResults + 15);
            results = cleanedText.substring(indexOfResults + 15);
        } else {
            // Just split at the first URL if we can't find a clear separator
            const urlIndex = cleanedText.indexOf("URL:");
            if (urlIndex > -1) {
                const previousLinebreak = cleanedText.lastIndexOf("\n", urlIndex);
                if (previousLinebreak > -1) {
                    header = cleanedText.substring(0, previousLinebreak);
                    results = cleanedText.substring(previousLinebreak);
                }
            }
        }

        if (!results) return cleanedText;

        return (
            <>
                {header && <p className="mb-4">{header.trim()}</p>}
                <div className="mt-3">
                    <h4 className="font-medium mb-3 text-gray-700">Search Results</h4>
                    <div className="search-results space-y-3">
                        {results.split("- ").filter(Boolean).map((result, index) => {
                            const lines = result.trim().split("\n");
                            const title = lines[0]?.trim();
                            const url = lines[1]?.replace("URL:", "").trim();
                            const description = lines[2]?.replace("Description:", "").trim();
                            
                            return (
                                <div key={index} className="bg-white p-3 rounded shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                                    <p className="font-medium text-blue-800">{title}</p>
                                    {url && (
                                        <a href={url} target="_blank" rel="noopener noreferrer" 
                                           className="text-xs text-green-700 hover:underline truncate block mt-1">
                                            {url}
                                        </a>
                                    )}
                                    {description && <p className="text-sm mt-2 text-gray-600">{description}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </>
        );
    };

    const getIcon = () => {
        if (role === 'user') {
            return <UserCircle className="w-6 h-6 text-blue-600" />;
        } else if (content && hasSearchResults(content)) {
            return <Search className="w-6 h-6 text-indigo-600" />;
        } else {
            return <Code className="w-6 h-6 text-gray-600" />;
        }
    };

    // Get the processed content
    const processedContent = content && 
        (hasSearchResults(content) ? formatSearchResults(content) : cleanToolAnnouncement(content));

    return (
        <div className={`flex items-start gap-3 mb-6 ${role === 'user' ? 'justify-end' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                role === 'user' ? 'bg-blue-100' : 
                (content && hasSearchResults(content)) ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
                {getIcon()}
            </div>
            <div className={`flex-grow max-w-[80%] ${
                role === 'user' ? 'bg-blue-50' : 
                (content && hasSearchResults(content)) ? 'bg-indigo-50' : 'bg-gray-50'
            } p-3 rounded-lg`}>
                <div className="text-sm text-gray-900">
                    {processedContent}
                </div>
            </div>
        </div>
    );
};

export default Message; 
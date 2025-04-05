import { Menu, Search, Plus } from 'lucide-react';

const SidePanel = ({ id, className, isCollapsed, toggleCollapse, isInputFocused, setIsInputFocused }) => {

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
            <div className="px-3 mt-2">
                <button
                    onClick={() => setIsInputFocused(false)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-700 hover:text-gray-900"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Chat</span>
                </button>
            </div>

            {/* Chat History will go here */}
            <div className="mt-4 px-3">
                {/* Add chat history items here */}
            </div>
        </div>
    );
};

export default SidePanel;
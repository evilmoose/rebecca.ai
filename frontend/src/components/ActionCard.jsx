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

export default ActionCard; 
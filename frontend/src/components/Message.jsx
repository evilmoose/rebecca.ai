import { UserCircle, Code } from 'lucide-react';

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

export default Message; 
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

export default ContentContainer; 
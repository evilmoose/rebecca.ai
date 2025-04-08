import { useState } from 'react';
import { Video } from 'lucide-react';
import videoService from '../api/video';

const VideoProcessingContainer = () => {
    const [file, setFile] = useState(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('file'); // 'file' or 'youtube'

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleYoutubeUrlChange = (event) => {
        if (event && event.target) {
            setYoutubeUrl(event.target.value);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setFile(null);
        setYoutubeUrl('');
        setError(null);
    };

    const handleProcess = async () => {
        if (activeTab === 'file' && !file) return;
        if (activeTab === 'youtube' && !youtubeUrl.trim()) return;

        setIsProcessing(true);
        setError(null);

        try {
            let data;
            if (activeTab === 'file') {
                data = await videoService.uploadFile(file);
            } else {
                data = await videoService.processYoutubeUrl(youtubeUrl.trim());
            }

            console.log('Processing successful:', data);
            
            // Clear form after successful processing
            if (activeTab === 'file') {
                setFile(null);
            } else {
                setYoutubeUrl('');
            }
        } catch (error) {
            console.error('Processing error:', error);
            setError(error.message);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 h-full overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 min-h-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Process Video</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex border-b mb-4">
                    <button
                        type="button"
                        className={`px-4 py-2 ${activeTab === 'file' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
                        onClick={() => handleTabChange('file')}
                    >
                        Upload File
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 ${activeTab === 'youtube' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
                        onClick={() => handleTabChange('youtube')}
                    >
                        YouTube URL
                    </button>
                </div>
                
                <div className="space-y-4">
                    {activeTab === 'file' ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="video-upload"
                            />
                            <label
                                htmlFor="video-upload"
                                className="cursor-pointer block"
                            >
                                <Video className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                    {file ? file.name : 'Click to select a video file'}
                                </p>
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <input
                                type="text"
                                defaultValue=""
                                onChange={handleYoutubeUrlChange}
                                placeholder="Enter YouTube URL"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                            />
                        </div>
                    )}

                    {(file || youtubeUrl) && (
                        <div className="space-y-2">
                            {activeTab === 'file' && file && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">File: {file.name}</span>
                                    <span className="text-sm text-gray-600">
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </span>
                                </div>
                            )}
                            
                            {isProcessing && (
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-purple-600 h-2.5 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            )}
                            
                            <button
                                type="button"
                                onClick={handleProcess}
                                disabled={isProcessing}
                                className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Process Video'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoProcessingContainer; 
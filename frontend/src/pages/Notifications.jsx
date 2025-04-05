import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LayoutWithScroll from '../components/LayoutWithScroll';

const Notifications = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Sample notifications data - in a real app, this would come from an API
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Welcome to ArtOfWorkflows',
      message: 'Thank you for joining! Explore our features to streamline your workflow.',
      time: '2 days ago',
      read: true,
      type: 'system',
      link: '/dashboard'
    },
    {
      id: 2,
      title: 'System Update',
      message: 'We\'ve added new features to improve your experience.',
      time: '1 week ago',
      read: true,
      type: 'system',
      link: null
    },
    {
      id: 3,
      title: 'New Blog Post',
      message: 'Check out our latest blog post on workflow automation.',
      time: '2 weeks ago',
      read: true,
      type: 'blog',
      link: '/blog/123'
    },
    {
      id: 4,
      title: 'Account Security',
      message: 'We recommend enabling two-factor authentication for added security.',
      time: '3 weeks ago',
      read: true,
      type: 'security',
      link: '/profile'
    }
  ]);

  useEffect(() => {
    // Simulate API call
    const fetchNotifications = async () => {
      // In a real app, you would fetch notifications from an API
      // For now, we'll just simulate a delay
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'system':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'blog':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
            <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
          </svg>
        );
      case 'security':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <LayoutWithScroll>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-neutral-800">Notifications</h1>
          <div className="flex space-x-2">
            {notifications.some(n => !n.read) && (
              <button 
                onClick={markAllAsRead}
                className="px-3 py-1 text-sm bg-white border border-neutral-300 rounded-md hover:bg-neutral-50"
              >
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button 
                onClick={clearAllNotifications}
                className="px-3 py-1 text-sm bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 text-red-600"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-neutral-800">No notifications</h2>
            <p className="mt-2 text-neutral-600">You don't have any notifications at the moment.</p>
            <Link to="/dashboard" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md divide-y divide-neutral-200">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-neutral-50 transition-colors duration-150 ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{notification.title}</p>
                        <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-neutral-500 mt-1">{notification.time}</p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-primary hover:text-primary-dark"
                          >
                            Mark as read
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {notification.link && (
                      <div className="mt-2">
                        <Link 
                          to={notification.link} 
                          className="text-sm text-primary hover:text-primary-dark font-medium"
                        >
                          View details
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutWithScroll>
  );
};

export default Notifications; 
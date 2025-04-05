import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import LayoutWithScroll from '../components/LayoutWithScroll';

const Profile = () => {
  const { currentUser, getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
  });

  useEffect(() => {
    // Fetch user profile data
    const fetchUserProfile = async () => {
      try {
        // In a real app, you would fetch this from your API
        // For now, we'll just use the currentUser data
        setFormData({
          name: currentUser.name || '',
          email: currentUser.email || '',
          company: currentUser.company || '',
          jobTitle: currentUser.jobTitle || '',
          phone: currentUser.phone || '',
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load profile data');
      }
    };

    if (currentUser) {
      fetchUserProfile();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, you would call your API to update the profile
      // Example:
      // const response = await fetch('/api/v1/users/me', {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     ...getAuthHeaders(),
      //   },
      //   body: JSON.stringify(formData),
      // });
      
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutWithScroll>
      <h1 className="text-3xl font-bold text-primary mb-6">Your Profile</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your full name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your email address"
                disabled
              />
              <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
            </div>
            
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-neutral-700 mb-1">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your company name"
              />
            </div>
            
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-neutral-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your job title"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your phone number"
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-accent-blue text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Account Settings</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">Change Password</h3>
            <p className="text-neutral-600 mb-4">
              Update your password to keep your account secure.
            </p>
            <button className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300">
              Change Password
            </button>
          </div>
          
          <div className="pt-6 border-t border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-800 mb-2">Notification Preferences</h3>
            <p className="text-neutral-600 mb-4">
              Control which notifications you receive from us.
            </p>
            <button className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300">
              Manage Notifications
            </button>
          </div>
          
          <div className="pt-6 border-t border-neutral-200">
            <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
            <p className="text-neutral-600 mb-4">
              Permanently delete your account and all associated data.
            </p>
            <button className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </LayoutWithScroll>
  );
};

export default Profile; 
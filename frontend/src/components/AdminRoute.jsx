import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AdminRoute component that redirects to login if user is not authenticated
 * or to dashboard if user is not an admin
 */
const AdminRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // Show loading state if auth is still being checked
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If not logged in, redirect to login page
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user is not admin, redirect to dashboard
    if (!currentUser.is_superuser) {
        return <Navigate to="/dashboard" replace />;
    }

    // User is authenticated and is an admin, render the protected content
    return children;
};

export default AdminRoute; 
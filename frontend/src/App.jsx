import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import SimpleFooter from './components/SimpleFooter';
import NormalFooter from './components/NormalFooter';
import { ChatProvider } from './contexts/ChatContext';
import MainPanel from './components/MainPanel';
import SidePanel from './components/SidePanel';
import { useState } from 'react';

// Wrapper component to conditionally render different layouts
const AppContent = () => {
  const location = useLocation();
  const path = location.pathname;
  
  // Pages that should have normal scrolling and full footer
  const normalScrollPages = ['/', '/login', '/signup'];
  const shouldUseNormalScroll = normalScrollPages.includes(path);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  return (
    <ChatProvider>
      <div className="flex h-screen bg-gray-50">
        <SidePanel 
          isCollapsed={isCollapsed}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isInputFocused={isInputFocused}
          setIsInputFocused={setIsInputFocused}
        />
        <MainPanel 
          isCollapsed={isCollapsed}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isInputFocused={isInputFocused}
          setIsInputFocused={setIsInputFocused}
        />
      </div>
    </ChatProvider>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

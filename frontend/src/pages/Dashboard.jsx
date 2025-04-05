/*
`Dashboard.jsx` component is a protected page rendered after login. It shows either 
a personal dashboard or an admin dashboard, depending on the user's role.
*/
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import SidePanel from '../components/SidePanel';
import MainPanel from '../components/MainPanel';

const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    // Function to check window width and update collapse state
    const handleResize = () => {
        if (window.innerWidth < 768) { // 768px is Bootstrap's md breakpoint
            setIsSidePanelCollapsed(true);
        } else {
            setIsSidePanelCollapsed(false);
        }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away to set initial state
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidePanel = () => {
    setIsSidePanelCollapsed(prevState => !prevState);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <div id="app-container" className="flex flex-grow">
        <SidePanel
          isCollapsed={isSidePanelCollapsed}
          toggleCollapse={toggleSidePanel}
          id={"side-panel-container"}
          className={""}
          isInputFocused={isInputFocused}
          setIsInputFocused={setIsInputFocused}
        />
        <MainPanel
          id={"main-panel"}
          className={"flex-grow flex flex-col"}
          isCollapsed={isSidePanelCollapsed}
          toggleCollapse={toggleSidePanel}
          isInputFocused={isInputFocused}
          setIsInputFocused={setIsInputFocused}
        />
      </div>
    </div>
  );
};

export default Dashboard; 
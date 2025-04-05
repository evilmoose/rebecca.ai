import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu } from 'lucide-react';
import Navbar from './Navbar';

const MainPanelHeader = ({ id, className, isCollapsed, toggleCollapse }) => {

    return (
        /* Header */
        <div id={id} className={`${className} flex items-center`}>
            {isCollapsed && (
                <Menu 
                    className="cursor-pointer mr-3" 
                    onClick={() => toggleCollapse()}
                />
            )}
            <Navbar />
        </div>
    );
};

export default MainPanelHeader;
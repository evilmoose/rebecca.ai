import React from 'react';

/**
 * SimpleFooter component that displays a single line of copyright text
 */
const SimpleFooter = () => {
  return (
    <footer className="bg-neutral-800 text-white py-3 text-center">
      <p className="text-neutral-400">&copy; {new Date().getFullYear()} ArtOfWorkflows. All rights reserved.</p>
    </footer>
  );
};

export default SimpleFooter; 
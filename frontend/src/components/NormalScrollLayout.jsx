import React from 'react';

/**
 * NormalScrollLayout component that allows normal page scrolling
 * Use this for pages like Home, Solutions, and Pricing that should have normal scrolling behavior
 */
const NormalScrollLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-100">
      {children}
    </div>
  );
};

export default NormalScrollLayout; 
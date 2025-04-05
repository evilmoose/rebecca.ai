import React from 'react';

/**
 * NormalFooter component that displays the full footer for pages with normal scrolling
 */
const NormalFooter = () => {
  return (
    <footer className="bg-neutral-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">ArtOfWorkflows</h3>
            <p className="text-neutral-400">
              Streamline your business processes with our powerful workflow management solution.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-neutral-400 hover:text-white">Home</a></li>
              <li><a href="/login" className="text-neutral-400 hover:text-white">Login</a></li>
              <li><a href="/signup" className="text-neutral-400 hover:text-white">Sign Up</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-neutral-400">
              Email: info@artofworkflows.com<br />
              Phone: (123) 456-7890
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-neutral-700 text-center text-neutral-400">
          <p>&copy; {new Date().getFullYear()} ArtOfWorkflows. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default NormalFooter; 
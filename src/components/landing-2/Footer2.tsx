import React from 'react';

const Footer2 = () => {
  return (
    <footer className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between">
        <p className="font-jetbrains text-xs text-white/40">
          &copy; {new Date().getFullYear()} Raffled. All rights reserved.
        </p>
        <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-white/40 hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">Discord</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer2;
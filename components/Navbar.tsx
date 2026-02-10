import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons } from './Icons';
import { UserRole, User } from '../types';
import { LOGO_URL, LOGO_FALLBACK } from '../constants';
import { useDialog } from '../context/DialogContext';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [imgSrc, setImgSrc] = useState(LOGO_URL);
  const { confirm } = useDialog();

  const isAdmin = user?.role === UserRole.ADMIN;

  const isActive = (path: string) => location.pathname === path ? "text-parish-pink font-bold" : "text-gray-600 hover:text-parish-blue";

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3">
              <img 
                className="h-12 w-12 object-contain rounded-full shadow-sm" 
                src={imgSrc} 
                alt="Parish Logo" 
                onError={() => setImgSrc(LOGO_FALLBACK)}
              />
              <div className="hidden md:block">
                <h1 className="text-lg font-serif font-bold text-parish-blue leading-tight">
                  Quasi-Parish of Our Lady
                </h1>
                <h2 className="text-xs font-medium text-parish-pink tracking-widest">
                  OF MIRACULOUS MEDAL
                </h2>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link to="/" className={isActive('/')}>Home</Link>
            {!user && <Link to="/services" className={isActive('/services')}>Services</Link>}
            <Link to="/schedules" className={isActive('/schedules')}>Mass & Events</Link>
            <Link to="/bulletin" className={isActive('/bulletin')}>Bulletin</Link>
            <Link to="/donations" className={isActive('/donations')}>Donations</Link>
            
            {isAdmin && (
              <>
                <div className="h-6 w-px bg-gray-300"></div>
                <Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>Dashboard</Link>
                <Link to="/admin/records" className={isActive('/admin/records')}>Records</Link>
              </>
            )}

            {user ? (
              <button 
                onClick={async () => {
                  const shouldLogout = await confirm({
                    title: 'Logout?',
                    message: 'You will be signed out of the admin area.',
                    confirmText: 'Logout',
                    destructive: true
                  });
                  if (shouldLogout) onLogout();
                }}
                className="flex items-center gap-2 bg-parish-blue text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                <Icons.LogOut size={16} /> Logout
              </button>
            ) : (
              <Link 
                to="/login"
                className="flex items-center gap-2 border border-parish-blue text-parish-blue px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                <Icons.Shield size={16} /> Staff Login
              </Link>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isOpen ? <Icons.X size={24} /> : <Icons.Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-parish-blue">Home</Link>
            {!user && <Link to="/services" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-parish-blue">Services</Link>}
            <Link to="/schedules" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-parish-blue">Schedules</Link>
            <Link to="/bulletin" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-parish-blue">Bulletin</Link>
            <Link to="/donations" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-parish-blue">Donations</Link>
            
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-parish-blue font-semibold">Admin Dashboard</Link>
                <Link to="/admin/records" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700">Records Management</Link>
              </>
            )}
            
            <div className="border-t border-gray-200 my-2"></div>
            {user ? (
              <button
                onClick={async () => {
                  const shouldLogout = await confirm({
                    title: 'Logout?',
                    message: 'You will be signed out of the admin area.',
                    confirmText: 'Logout',
                    destructive: true
                  });
                  if (shouldLogout) {
                    onLogout();
                    setIsOpen(false);
                  }
                }}
                className="w-full text-left block px-3 py-2 text-base font-medium text-red-600"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-parish-blue">Staff Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

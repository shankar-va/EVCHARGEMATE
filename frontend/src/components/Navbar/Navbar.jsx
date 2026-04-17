import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Zap, Menu, X, User } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || user?.username || 'User';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled glass-panel' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <Zap className="logo-icon" size={28} />
          <span className="logo-text">EV<span className="text-gradient">-CHARGEMATE</span></span>
        </Link>

        {/* Desktop Menu */}
        <div className="nav-links desktop-only">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/stations" className="nav-link">Find Stations</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              {user?.role === 'admin' && (
                <Link to="/admin/dashboard" className="nav-link">Admin Dashboard</Link>
              )}
              <div className="user-menu">
                <span className="user-greeting">Hi, {displayName?.split(' ')[0] || 'User'}</span>
                <button onClick={handleLogout} className="btn-secondary nav-btn">Logout</button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth?mode=login" className="nav-link">Login</Link>
              <Link to="/auth?mode=register" className="btn-primary nav-btn">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-toggle mobile-only" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu glass-panel ${isMobileMenuOpen ? 'open' : ''}`}>
        <Link to="/" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
        <Link to="/stations" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Find Stations</Link>
        {user ? (
          <>
            <Link to="/dashboard" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className="mobile-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
            <button onClick={handleLogout} className="btn-secondary nav-btn mobile-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/auth?mode=login" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
            <Link to="/auth?mode=register" className="btn-primary nav-btn mobile-btn" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles = {
  navbar: {
    backgroundColor: '#1b5e20',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  logo: {
    color: 'white',
    fontSize: '22px',
    fontWeight: 'bold',
    textDecoration: 'none',
    letterSpacing: '1px',
  },
  logoSpan: {
    color: '#a5d6a7',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navLink: {
    color: '#c8e6c9',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  userInfo: {
    color: '#a5d6a7',
    fontSize: '14px',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #a5d6a7',
    color: '#a5d6a7',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={styles.navbar}>
      <Link to="/dashboard" style={styles.logo}>
        Smart<span style={styles.logoSpan}>CHDR</span>
      </Link>
      <div style={styles.nav}>
        {user ? (
          <>
            <Link to="/dashboard" style={styles.navLink}>
              Dashboard
            </Link>
            <span style={styles.userInfo}>
              👋 {user.full_name}
            </span>
            <button 
              style={styles.logoutBtn} 
              onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.navLink}>Login</Link>
            <Link to="/register" style={styles.navLink}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
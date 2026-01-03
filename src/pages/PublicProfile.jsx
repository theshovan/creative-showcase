import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Masonry from 'react-masonry-css';
import './PublicProfile.css';

const PublicProfile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, [username]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const [userResponse, imagesResponse] = await Promise.all([
        axios.get(`/api/users/${username}`),
        axios.get(`/api/images/user/${username}`)
      ]);
      
      setUser(userResponse.data);
      setImages(imagesResponse.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const breakpointColumns = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="not-found">
        <h2>User not found</h2>
        <Link to="/" className="btn-back-home">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="public-profile">
      {/* Background grid texture */}
      <div className="grid-texture"></div>
      
      <nav className="public-nav">
        <div className="nav-container">
          <Link to="/" className="logo">ArtShowcase</Link>
          <div className="nav-links">
            {currentUser ? (
              <>
                {/* Plus icon for upload/dashboard */}
                <Link to="/profile" className="nav-btn nav-upload-btn" title="Upload Artwork">
                  <span className="plus-icon">+</span>
                </Link>
                
                {/* User profile dropdown */}
                <div className="user-dropdown-container" ref={dropdownRef}>
                  <button 
                    className="user-profile-btn"
                    onClick={toggleUserDropdown}
                    title="User Profile"
                  >
                    
                    <span className="username-truncated">{currentUser.username}</span>
                    <span className="dropdown-arrow">▾</span>
                  </button>
                  
                  {showUserDropdown && (
                    <div className="user-dropdown-menu">
                      
                      
                      <div className="dropdown-divider"></div>
                      
                      <Link 
                        to="/" 
                        className="dropdown-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        
                        Home Page
                      </Link>
                      
                      <Link 
                        to={`/profile/${currentUser.username}`} 
                        className="dropdown-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        
                        My Art
                      </Link>
                      
                      
                      
                      <div className="dropdown-divider"></div>
                      
                      <button 
                        onClick={handleLogout} 
                        className="dropdown-item logout-item"
                      >
                       
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/signup" className="btn-signup">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <header className="profile-header">
        <div className="header-content">
          <div className="profile-avatar">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.username} />
            ) : (
              <div className="avatar-placeholder">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1>{user.username}</h1>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">{images.length}</span>
                <span className="stat-label">Artworks</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {images.reduce((sum, img) => sum + img.likesCount, 0)}
                </span>
                <span className="stat-label">Likes</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {new Date(user.createdAt).getFullYear()}
                </span>
                <span className="stat-label">Member Since</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="public-gallery">
        <h2>Gallery</h2>
        {images.length === 0 ? (
          <div className="empty-gallery">
            <p>No artwork uploaded yet</p>
            <p>This user hasn't shared any artwork</p>
          </div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumns}
            className="masonry-grid"
            columnClassName="masonry-grid-column"
          >
            {images.map((image) => (
              <div key={image._id} className="public-image-card">
                <img src={image.imageUrl} alt={image.title} />
                <div className="public-image-info">
                  <h3>{image.title}</h3>
                  <p className="image-description">{image.description}</p>
                  <div className="public-image-stats">
                    <span className="likes">🖤 {image.likesCount || 0}</span>
                    
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        )}
      </main>
    </div>
  );
};

export default PublicProfile;
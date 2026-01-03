import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './LandingPage.css';

const LandingPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [likedImages, setLikedImages] = useState(new Set());
  const [showHeartAnimation, setShowHeartAnimation] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const tapTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRandomImages();
  }, []);

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

  const fetchRandomImages = async () => {
    try {
      const response = await axios.get('/api/images/random');
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const openImageModal = (image, index) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  const navigateToNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setSelectedImage(images[currentImageIndex + 1]);
    } else {
      setCurrentImageIndex(0);
      setSelectedImage(images[0]);
    }
  };

  const navigateToPreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setSelectedImage(images[currentImageIndex - 1]);
    } else {
      setCurrentImageIndex(images.length - 1);
      setSelectedImage(images[images.length - 1]);
    }
  };

  const handleLikeImage = async (imageId, imageIndex = null) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const isLiked = likedImages.has(imageId);
      const newLikedImages = new Set(likedImages);
      
      if (isLiked) {
        newLikedImages.delete(imageId);
        await axios.delete(`/api/images/${imageId}/like`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        newLikedImages.add(imageId);
        await axios.post(`/api/images/${imageId}/like`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      
      setLikedImages(newLikedImages);
      
      const updatedImages = [...images];
      const imageToUpdate = imageIndex !== null ? 
        updatedImages[imageIndex] : 
        updatedImages.find(img => img._id === imageId);
      
      if (imageToUpdate) {
        imageToUpdate.likesCount = isLiked ? 
          Math.max(0, imageToUpdate.likesCount - 1) : 
          (imageToUpdate.likesCount || 0) + 1;
        
        setImages(updatedImages);
        
        if (selectedImage && selectedImage._id === imageId) {
          setSelectedImage({
            ...selectedImage,
            likesCount: isLiked ? 
              Math.max(0, selectedImage.likesCount - 1) : 
              (selectedImage.likesCount || 0) + 1
          });
        }
      }
      
      if (!isLiked) {
        setShowHeartAnimation(imageId);
        setTimeout(() => setShowHeartAnimation(null), 1000);
      }
      
    } catch (error) {
      console.error('Error liking image:', error);
    }
  };

  const handleImageClick = (image, index) => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    const now = Date.now();
    const lastTap = image.lastTap || 0;
    const timeSinceLastTap = now - lastTap;

    if (timeSinceLastTap < 300) {
      handleLikeImage(image._id, index);
      
      setShowHeartAnimation(image._id);
      setTimeout(() => setShowHeartAnimation(null), 1000);
      
      image.lastTap = 0;
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        openImageModal(image, index);
      }, 300);
      
      image.lastTap = now;
    }
  };

  const handleModalImageDoubleTap = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLikeImage(selectedImage._id, currentImageIndex);
    
    setShowHeartAnimation(selectedImage._id);
    setTimeout(() => setShowHeartAnimation(null), 1000);
  };

  const handleKeyDown = (e) => {
    if (selectedImage) {
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowRight') {
        navigateToNextImage();
      } else if (e.key === 'ArrowLeft') {
        navigateToPreviousImage();
      } else if (e.key === 'l' || e.key === 'L') {
        handleLikeImage(selectedImage._id, currentImageIndex);
      }
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, [selectedImage, currentImageIndex]);

  const breakpointColumns = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">ArtShowcase</Link>
          <div className="nav-links">
            {user ? (
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
                    
                    <span className="username-truncated">{user.username}</span>
                    <span className="dropdown-arrow">▾</span>
                  </button>
                  
                  {showUserDropdown && (
                    <div className="user-dropdown-menu">
                      
                      
                      <div className="dropdown-divider"></div>
                      
                      <Link 
                        to="/profile" 
                        className="dropdown-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        
                        Upload Your Art
                      </Link>
                      
                      <Link 
                        to={`/profile/${user.username}`} 
                        className="dropdown-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        
                       Your Art
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

      <header className="hero">
        <h1>Showcase Your Digital Art & Memories</h1>
        <p>A platform for artists to share their creativity with the world</p>
        
      </header>

      <main className="gallery-container">
        <h2>--Featured Artwork--</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumns}
            className="masonry-grid"
            columnClassName="masonry-grid-column"
          >
            {images.map((image, index) => (
              <div 
                key={image._id} 
                className="image-card"
                onClick={() => handleImageClick(image, index)}
              >
                <div className="image-wrapper">
                  <img 
                    src={image.imageUrl} 
                    alt={image.title}
                    loading="lazy"
                  />
                  
                  {showHeartAnimation === image._id && (
                    <div className="heart-animation">🤍</div>
                  )}
                  
                  <button 
                    className={`image-like-btn ${likedImages.has(image._id) ? 'liked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeImage(image._id, index);
                    }}
                    aria-label={likedImages.has(image._id) ? 'Unlike' : 'Like'}
                  >
                    🖤
                  </button>
                  
                  <div className="like-count-overlay">
                    <span className="like-icon">🖤</span>
                    <span className="like-number">{image.likesCount || 0}</span>
                  </div>
                </div>
                
                <div className="image-info">
                  <h3>{image.title}</h3>
                  <p>by {image.artistUsername}</p>
                  <div className="image-stats">
                    <span>🖤 {image.likesCount || 0}</span>
                   
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        )}
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeImageModal}>
              &times;
            </button>
            
            <div 
              className="modal-image-container"
              onDoubleClick={handleModalImageDoubleTap}
            >
              <img 
                src={selectedImage.imageUrl} 
                alt={selectedImage.title}
                className="modal-image"
              />
              
              
              
              <button 
                className="modal-nav-btn modal-prev-btn"
                onClick={navigateToPreviousImage}
              >
                &#8249;
              </button>
              
              <button 
                className="modal-nav-btn modal-next-btn"
                onClick={navigateToNextImage}
              >
                &#8250;
              </button>
              
              
            </div>
            
            <div className="modal-image-info">
              <div className="modal-header">
                <div>
                  <h2>{selectedImage.title}</h2>
                  <p className="modal-artist">
                    By-- <Link to={`/profile/${selectedImage.artistUsername}`} className="artist-link">
                      {selectedImage.artistUsername}
                    </Link>
                  </p>
                </div>
                <button 
                  className={`modal-like-action-btn ${likedImages.has(selectedImage._id) ? 'liked' : ''}`}
                  onClick={() => handleLikeImage(selectedImage._id, currentImageIndex)}
                >
                  <span className="like-icon">🤍</span>
                  <span className="like-text">
                    {likedImages.has(selectedImage._id) ? 'Liked' : 'Like'}
                  </span>
                  <span className="like-count">{selectedImage.likesCount || 0}</span>
                </button>
              </div>
              
              {selectedImage.description && (
                <p className="modal-description">{selectedImage.description}</p>
              )}
              
              <div className="modal-image-stats">
              
                <div className="stat-item">
  <span className="stat-icon">Created At</span>
  <span className="stat-value">
    {new Date(selectedImage.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}
  </span>
</div>
              </div>
              
              {selectedImage.tags && selectedImage.tags.length > 0 && (
                <div className="modal-tags">
                  {selectedImage.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              )}
              
              <div className="modal-footer">
                <div className="modal-counter">
                  {currentImageIndex + 1} / {images.length}
                </div>
                
              </div>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default LandingPage;
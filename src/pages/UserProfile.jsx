import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Masonry from 'react-masonry-css';
import './UserProfile.css';

const UserProfile = () => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    category: 'other'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [deleting, setDeleting] = useState(null); // Track which image is being deleted
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserImages();
    }
  }, [user]);

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

  const fetchUserImages = async () => {
    try {
      console.log('Fetching images for user:', user.username);
      const response = await axios.get(`/api/images/user/${user.username}`);
      console.log('Fetched images:', response.data);
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images');
    }
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    const uploadData = new FormData();
    uploadData.append('image', selectedFile);
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    uploadData.append('tags', formData.tags);
    uploadData.append('category', formData.category);
    
    setUploading(true);
    try {
      const response = await axios.post('/api/images/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSuccess('Image uploaded successfully!');
      
      setFormData({
        title: '',
        description: '',
        tags: '',
        category: 'other'
      });
      setSelectedFile(null);
      setPreview('');
      if (document.getElementById('file-input')) {
        document.getElementById('file-input').value = '';
      }
      
      setTimeout(() => {
        fetchUserImages();
      }, 500);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Upload failed. Please try again.';
      setError(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    console.log('Attempting to delete image:', imageId);
    console.log('Current user:', user);
    console.log('Token exists:', !!localStorage.getItem('token'));
    
    setDeleting(imageId);
    
    try {
      // Get the image first to show debugging info
      const imageToDelete = images.find(img => img._id === imageId);
      console.log('Image to delete:', imageToDelete);
      
      const response = await axios.delete(`/api/images/${imageId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Delete response:', response.data);
      
      setSuccess('Image deleted successfully!');
      
      // Remove the image from the local state immediately
      setImages(prevImages => prevImages.filter(img => img._id !== imageId));
      
    } catch (error) {
      console.error('Error deleting image:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Failed to delete image';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Unauthorized: Please login again';
          logout();
          navigate('/login');
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to delete this image';
        } else if (error.response.status === 404) {
          errorMessage = 'Image not found';
        } else {
          errorMessage = error.response.data?.error || error.response.data?.message || 'Delete failed';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message || 'Delete failed';
      }
      
      setError(`Delete failed: ${errorMessage}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const breakpointColumns = {
    default: 3,
    1100: 2,
    700: 1
  };

  return (
    <div className="user-profile">
      <nav className="profile-nav">
        <div className="nav-container">
          <Link to="/" className="logo">ArtShowcase</Link>
          <div className="nav-links">
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
                    to={`/profile/${user.username}`} 
                    className="dropdown-item"
                    onClick={() => setShowUserDropdown(false)}
                  ><span className="dropdown-icon"></span>
                    Your Art
                  </Link>
                  <Link 
                    to="/" 
                    className="dropdown-item"
                    onClick={() => setShowUserDropdown(false)}
                  ><span className="dropdown-icon"></span>
                    Home page
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
          </div>
        </div>
      </nav>

      <div className="profile-container">
        <aside className="sidebar">
         

          <form onSubmit={handleUpload} className="upload-form">
            <h3>Upload New Artwork</h3>
            
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="file-input">Image *</label>
              <input
                type="file"
                id="file-input"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.gif,.webp"
                required
              />
              {selectedFile && (
                <p className="file-info">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              {preview && (
                <div className="image-preview">
                  <img src={preview} alt="Preview" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({...formData, title: e.target.value});
                  setError('');
                }}
                placeholder="Enter title"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your artwork"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="e.g., digital, landscape, abstract"
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="digital-art">Digital Art</option>
                <option value="photography">Photography</option>
                <option value="painting">Painting</option>
                <option value="illustration">Illustration</option>
                <option value="3d">3D Art</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn-upload"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner-small"></span>
                  Uploading...
                </>
              ) : (
                'Upload Artwork'
              )}
            </button>
            
            <p className="upload-hint">
              Max file size: 10MB. Supported formats: JPEG, PNG, GIF, WebP
            </p>
          </form>
        </aside>

        <main className="gallery-section">
          <h2>My Artwork ({images.length})</h2>
          {images.length === 0 ? (
            <div className="empty-state">
              <p>You haven't uploaded any artwork yet.</p>
              <p>Start by uploading your first piece!</p>
            </div>
          ) : (
            <Masonry
              breakpointCols={breakpointColumns}
              className="masonry-grid"
              columnClassName="masonry-grid-column"
            >
              {images.map((image) => (
                <div key={image._id} className="image-card">
                  <img src={image.imageUrl} alt={image.title} />
                  <div className="image-actions">
                    <button 
                      onClick={() => handleDeleteImage(image._id)}
                      className="btn-delete"
                      disabled={deleting === image._id}
                    >
                      {deleting === image._id ? (
                        <>
                          <span className="spinner-tiny"></span>
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                  <div className="image-info">
                    <h3>{image.title}</h3>
                    <p>{image.description}</p>
                    <div className="image-meta">
                      <span>🖤 {image.likesCount || 0}</span>
                      
                      <span> {new Date(image.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </Masonry>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
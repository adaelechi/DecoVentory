// DecoVentory API Configuration
const hostname = window.location.hostname;
const isLocalIP = 
  hostname === 'localhost' || 
  hostname === '127.0.0.1' || 
  hostname.startsWith('192.168.') || 
  hostname.startsWith('10.') || 
  hostname.startsWith('172.');

const API_BASE_URL = isLocalIP 
  ? `http://${hostname}:3000/api` 
  : 'https://decoventory.onrender.com/api'; // Render backend remains for now

const IMAGE_BASE_URL = isLocalIP 
  ? `http://${hostname}:3000` 
  : 'https://decoventory.onrender.com';

// Returns the correct image src — if image_url is already a full URL (Cloudinary),
// use it directly; otherwise prepend the backend base URL (local /uploads/ fallback)
function getImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return IMAGE_BASE_URL + imageUrl;
}


// Helper functions for auth token
const getAuthToken = () => localStorage.getItem('decoventory_token');
const saveAuthToken = (token) => localStorage.setItem('decoventory_token', token);
const clearAuthToken = () => localStorage.removeItem('decoventory_token');
const isAuthenticated = () => !!getAuthToken();

// API Service
const API = {
  // Authentication
  login: async (passcode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await response.json();
      if (data.success && data.token) {
        saveAuthToken(data.token);
      }
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Network error. Please check if the server is running.' };
    }
  },

  logout: () => {
    clearAuthToken();
    window.location.href = '/Dashboard/index.html';
  },

  // Materials
  getMaterials: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/materials`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  },

  createMaterial: async (materialData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(materialData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating material:', error);
      return { error: 'Failed to create material' };
    }
  },

  updateMaterial: async (id, materialData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(materialData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating material:', error);
      return { error: 'Failed to update material' };
    }
  },

  deleteMaterial: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting material:', error);
      return { error: 'Failed to delete material' };
    }
  },

  // Color Combos
  getColorCombos: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/color-combos`);
      if (!response.ok) {
        console.warn('GET /color-combos status:', response.status);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching color combos:', error);
      return [];
    }
  },

  createColorCombo: async (comboData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/color-combos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(comboData)
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Failed to create color combo' };
      }
      return data;
    } catch (error) {
      console.error('Error creating color combo:', error);
      return { error: 'Failed to create color combo' };
    }
  },

  updateColorCombo: async (id, comboData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/color-combos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(comboData)
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Failed to update color combo' };
      }
      return data;
    } catch (error) {
      console.error('Error updating color combo:', error);
      return { error: 'Failed to update color combo' };
    }
  },

  deleteColorCombo: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/color-combos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Failed to delete color combo' };
      }
      return data;
    } catch (error) {
      console.error('Error deleting color combo:', error);
      return { error: 'Failed to delete color combo' };
    }
  }
};

// Check authentication on protected pages
function checkAuth() {
  if (!isAuthenticated()) {
    if (window.showToast) {
      showToast.error('Please login first');
      setTimeout(() => {
        window.location.href = '/Dashboard/index.html';
      }, 1500);
    } else {
      window.location.href = '/Dashboard/index.html';
    }
  }
}

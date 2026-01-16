// DecoVentory API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

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
    window.location.href = '../Loginpage/index.html';
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
  }
};

// Check authentication on protected pages
function checkAuth() {
  if (!isAuthenticated()) {
    alert('Please login first');
    window.location.href = '../ExecLogin/index.html';
  }
}

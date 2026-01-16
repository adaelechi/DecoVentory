const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('decoventory_token');
};

// Helper function to save auth token
const saveAuthToken = (token) => {
  localStorage.setItem('decoventory_token', token);
};

// Helper function to remove auth token
const clearAuthToken = () => {
  localStorage.removeItem('decoventory_token');
};

// API Service
const DecoVentoryAPI = {
  
  // Authentication
  auth: {
    login: async (passcode) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await response.json();
      if (data.success) {
        saveAuthToken(data.token);
      }
      return data;
    },
    
    changePasscode: async (currentPasscode, newPasscode) => {
      const response = await fetch(`${API_BASE_URL}/auth/change-passcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ currentPasscode, newPasscode })
      });
      return await response.json();
    },
    
    logout: () => {
      clearAuthToken();
    },
    
    isAuthenticated: () => {
      return !!getAuthToken();
    }
  },

  // Materials
  materials: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/materials`);
      return await response.json();
    },
    
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/materials/${id}`);
      return await response.json();
    },
    
    getByCategory: async (category) => {
      const response = await fetch(`${API_BASE_URL}/materials/category/${category}`);
      return await response.json();
    },
    
    create: async (materialData) => {
      const response = await fetch(`${API_BASE_URL}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(materialData)
      });
      return await response.json();
    },
    
    update: async (id, materialData) => {
      const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(materialData)
      });
      return await response.json();
    },
    
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      return await response.json();
    }
  },

  // Chapel Logs
  chapelLogs: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/chapel-logs`);
      return await response.json();
    },
    
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/chapel-logs/${id}`);
      return await response.json();
    },
    
    create: async (logData) => {
      const response = await fetch(`${API_BASE_URL}/chapel-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(logData)
      });
      return await response.json();
    },
    
    update: async (id, logData) => {
      const response = await fetch(`${API_BASE_URL}/chapel-logs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(logData)
      });
      return await response.json();
    },
    
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/chapel-logs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      return await response.json();
    }
  },

  // Events
  events: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/events`);
      return await response.json();
    },
    
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/events/${id}`);
      return await response.json();
    },
    
    create: async (eventData) => {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(eventData)
      });
      return await response.json();
    },
    
    markReturned: async (id, lostItems = [], damagedItems = []) => {
      const response = await fetch(`${API_BASE_URL}/events/${id}/return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ lost_items: lostItems, damaged_items: damagedItems })
      });
      return await response.json();
    },
    
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      return await response.json();
    }
  },

  // Borrowers
  borrowers: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/borrowers`);
      return await response.json();
    },
    
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/borrowers/${id}`);
      return await response.json();
    },
    
    create: async (borrowerData) => {
      const response = await fetch(`${API_BASE_URL}/borrowers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(borrowerData)
      });
      return await response.json();
    },
    
    markReturned: async (id, items) => {
      const response = await fetch(`${API_BASE_URL}/borrowers/${id}/return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ items })
      });
      return await response.json();
    },
    
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/borrowers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      return await response.json();
    }
  },

  // Activity Logs
  activityLogs: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/activity-logs`);
      return await response.json();
    },
    
    getByMaterial: async (materialId) => {
      const response = await fetch(`${API_BASE_URL}/activity-logs/material/${materialId}`);
      return await response.json();
    },
    
    getByActionType: async (actionType) => {
      const response = await fetch(`${API_BASE_URL}/activity-logs/action/${actionType}`);
      return await response.json();
    }
  }
};

// Example Usage:
/*

// Login
const result = await DecoVentoryAPI.auth.login('DecoUnit2026');
if (result.success) {
  console.log('Logged in!');
}

// Get all materials
const materials = await DecoVentoryAPI.materials.getAll();
console.log(materials);

// Create a material (requires authentication)
const newMaterial = await DecoVentoryAPI.materials.create({
  name: 'Red Carpet',
  category: 'Fabrics',
  total_quantity: 10,
  condition: 'Good'
});

// Create borrower with items
const borrower = await DecoVentoryAPI.borrowers.create({
  borrower_name: 'John Doe',
  borrower_contact: '0201234567',
  purpose: 'Wedding',
  borrow_date: '2026-01-15',
  expected_return_date: '2026-01-22',
  items: [
    { material_id: 1, quantity: 5 },
    { material_id: 2, quantity: 10 }
  ]
});

*/

# Frontend API Integration

The frontend communicates with the backend exclusively via the `api.js` utility file located at the project root.

## 🛠️ Usage Pattern

To use the API in a new page, include the script tag and then call the `API` object methods.

### Example: Fetching Materials
```javascript
// In your page's main.js
async function loadMaterials() {
  const materials = await API.getMaterials();
  
  if (materials.length > 0) {
    renderMaterials(materials);
  } else {
    showToast.error('Failed to load materials');
  }
}
```

### Example: Protected Request (Creating an item)
```javascript
const materialData = { name: 'New Vase', category: 'Props', ... };
const result = await API.createMaterial(materialData);

if (result.id) {
  showToast.success('Material added successfully!');
}
```

## 🔐 Authentication Flow

1. **Login:** The user submits a passcode via the Login page.
2. **Token Storage:** `API.login()` sends the passcode to the backend. If successful, it receives a JWT and saves it to `localStorage` under the key `decoventory_token`.
3. **Authorization Header:** For all protected routes (POST, PUT, DELETE), the `API` object automatically retrieves the token and adds it to the `Authorization` header.
4. **Auth Guard:** Protected pages call `checkAuth()` on load to verify the user is logged in. If not, they are redirected to the Dashboard.

## 🌐 Environment Switching

The `api.js` file automatically detects if the app is running on `localhost`.
- **Local:** Connects to `http://localhost:3000/api`
- **Production:** Connects to the Render backend URL.

This ensures that developers don't have to manually change URLs when moving from development to production.

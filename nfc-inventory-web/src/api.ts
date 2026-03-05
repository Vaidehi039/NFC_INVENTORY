const API_URL = '/api';

export const login = async (email: any, password: any) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    let errorText = 'Login failed';
    if (!response.ok) {
        try {
            const errorData = await response.json();
            errorText = errorData.detail || errorData.error || errorText;
        } catch {
            // If response is not JSON, use status text
            errorText = response.statusText || errorText;
        }
        throw new Error(errorText);
    }
    return response.json();
};

export const googleLogin = async (token: string) => {
    const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Google Login failed');
    }
    return response.json();
};

export const register = async (name: any, email: any, password: any, role?: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
    });
    if (!response.ok) {
        let errorMsg = 'Registration failed';
        try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorData.error || errorMsg;
        } catch {
            const text = await response.text();
            errorMsg = text || response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
    }
    return response.json();
};

export const forgotPassword = async (email: string) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Request failed');
    }
    return response.json();
};

export const getDashboardStats = async (token: any) => {
    const response = await fetch(`${API_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
};

export const getProducts = async (token: any) => {
    const response = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
};

export const addProduct = async (token: any, productData: any) => {
    const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
    }
    return response.json();
};

export const getProductBySku = async (token: any, sku: string) => {
    const response = await fetch(`${API_URL}/product/${sku}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Product not found');
    return response.json();
};

export const linkTag = async (token: any, productId: number, tagId: string) => {
    const response = await fetch(`${API_URL}/link-tag`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, tag_id: tagId }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to link tag');
    }
    return response.json();
};

export const updateProduct = async (token: any, productId: number, productData: any) => {
    const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData),
    });
    if (!response.ok) {
        let errorMsg = 'Failed to update product';
        try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorData.error || errorMsg;
        } catch {
            errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
    }
    return response.json();
};

export const deleteProduct = async (token: any, productId: number) => {
    const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        let errorMsg = 'Failed to delete product';
        try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorData.error || errorMsg;
        } catch {
            errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
    }
    return response.json();
};

export const getUsers = async (token: any) => {
    const response = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
};

export const updateUser = async (token: any, userId: number, userData: any) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
};

export const deleteUser = async (token: any, userId: number) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        },
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
};

export const getLogs = async (token: any) => {
    const response = await fetch(`${API_URL}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
};

export const productTransaction = async (token: any, productId: number, action: 'IN' | 'OUT', quantity: number) => {
    const response = await fetch(`${API_URL}/products/${productId}/transaction`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, quantity }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Transaction failed');
    }
    return response.json();
};

export const nfcScanAction = async (token: any, tag_id: string, action: string, quantity: number) => {
    const response = await fetch(`${API_URL}/scan-action`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            tag_id,
            action,
            quantity
        }),
    });

    if (!response.ok) {
        throw new Error("Scan failed");
    }

    return response.json();
};

// Store NFC scan data in XAMPP MySQL database
export const storeNfcScan = async (token: any, serial_number: string, tag_data?: string, reader_type?: string) => {
    const response = await fetch(`${API_URL}/nfc-scan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ serial_number, tag_data, reader_type }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to store NFC scan');
    }
    return response.json();
};

// Get NFC scan history from database
export const getNfcScans = async (token: any) => {
    const response = await fetch(`${API_URL}/nfc-scans`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch NFC scans');
    return response.json();
};

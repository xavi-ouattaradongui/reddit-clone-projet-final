import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:1337',
    headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`
    }
});

export default api;
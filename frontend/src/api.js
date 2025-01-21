import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/", // Backend URL
    timeout: 5000, // 5-second timeout (optional)
});

export default api;

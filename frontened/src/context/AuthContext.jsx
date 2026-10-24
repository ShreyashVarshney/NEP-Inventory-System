import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuuthContext = createContext();

// Request interceptor: sanitize or auto-attach Authorization headers
axios.interceptors.request.use(
    (config) => {
        const currentToken = localStorage.getItem("pos-token");
        // Remove malformed "Bearer null" or "Bearer undefined"
        if (
            config.headers?.Authorization === "Bearer null" ||
            config.headers?.Authorization === "Bearer undefined" ||
            config.headers?.authorization === "Bearer null" ||
            config.headers?.authorization === "Bearer undefined"
        ) {
            delete config.headers.Authorization;
            delete config.headers.authorization;
        }

        // If not set and token exists, attach it
        if (currentToken && currentToken !== "null" && currentToken !== "undefined") {
            if (!config.headers.Authorization && !config.headers.authorization) {
                config.headers.Authorization = `Bearer ${currentToken}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: automatically handle 401 Unauthorized (expired/invalid token)
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Ignore 401s on the login endpoint itself so user sees "Invalid credentials"
            const url = error.config?.url || "";
            if (!url.includes("/api/auth/login")) {
                localStorage.removeItem("pos-user");
                localStorage.removeItem("pos-token");
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const token = localStorage.getItem("pos-token");
            const storedUser = localStorage.getItem("pos-user");
            if (!token || token === "null" || token === "undefined") {
                localStorage.removeItem("pos-user");
                localStorage.removeItem("pos-token");
                return null;
            }
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem("pos-user", JSON.stringify(userData));
        localStorage.setItem("pos-token", token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("pos-user");
        localStorage.removeItem("pos-token");
    };

    return (
        <AuuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuuthContext);
export default AuthProvider;


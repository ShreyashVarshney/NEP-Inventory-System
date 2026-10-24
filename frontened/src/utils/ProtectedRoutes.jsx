import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

const ProtectedRoutes = ({ children, requiredRole }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("pos-token");
        if (!user || !token || token === "null" || token === "undefined") {
            logout();
            navigate('/login');
            return;
        }
        if (!requiredRole.includes(user.role)) {
            navigate('/unauthorized');
        }
    }, [user, navigate, requiredRole, logout]);

    const token = localStorage.getItem("pos-token");
    if (!user || !token || token === "null" || token === "undefined") return null;
    if (!requiredRole.includes(user.role)) return null;
    return children;
};

export default ProtectedRoutes;
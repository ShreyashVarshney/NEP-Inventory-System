import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

const Root = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("pos-token");
        if (!user || !token || token === "null" || token === "undefined") {
            if (user) logout();
            navigate("/login");
            return;
        }

        if (user.role === "admin" || user.role === "staff") {
            navigate("/admin-dashboard");
        } else if (user.role === "customer") {
            navigate("/admin-dashboard");
        } else {
            navigate("/login");
        }
    }, [user, navigate, logout]);

    return null;
};

export default Root;
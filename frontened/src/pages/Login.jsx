import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
   
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        

        try {
            const response = await axios.post(
                "http://localhost:3000/api/auth/login",
                {
                    email,
                    password,
                }
            );
            console.log(response.data);

            if (response.data.success) {
                await login(response.data.user, response.data.token);

                if (response.data.user.role === "admin") {
                    navigate("/admin/dashboard");
                } else {
                    navigate("/customer/dashboard");
                }
            } else {
               alert(response.data.error);
            }
        }  catch (error) {
    console.error("Login error:", error);
    console.log("Backend response:", error.response?.data);

    setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong."
    );
} finally {
    setLoading(false);
}
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-700 via-green-600 to-gray-100 px-4 py-8 sm:px-6">

            {/* Heading */}
            <div className="mb-6 text-center sm:mb-8">
                <h1 className="text-2xl font-bold tracking-wide text-white sm:text-3xl md:text-4xl">
                    NEP Inventory System
                </h1>

                <p className="mt-2 text-sm text-green-50 sm:text-base">
                    Equipment Management Portal
                </p>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl sm:p-8">

                <h2 className="mb-2 text-center text-2xl font-bold text-gray-800 sm:text-3xl">
                    Login
                </h2>

                <p className="mb-6 text-center text-sm text-gray-500">
                    Sign in to access your account
                </p>

                {/* Error Message */}
                {error && (
                    <div
                        className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Email Address
                        </label>

                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            autoComplete="username"
                            required
                            disabled={loading}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100 sm:text-base"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>

                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                            disabled={loading}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100 sm:text-base"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition duration-200 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

                <p className="mt-6 text-center text-xs text-gray-400 sm:text-sm">
                    NEP Inventory System
                </p>

            </div>
        </div>
    );
};

export default Login;

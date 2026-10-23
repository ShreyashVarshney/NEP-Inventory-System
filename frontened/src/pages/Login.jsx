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
                "/api/auth/login",
                {
                    email,
                    password,
                }
            );

            if (response.data.success) {
                await login(response.data.user, response.data.token);
                navigate("/admin-dashboard");
            } else {
                setError(response.data.error || "Login failed");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to sign in. Please verify your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-8 sm:px-6 relative overflow-hidden">
            {/* Header Branding - Clean typography without logo graphic */}
            <div className="mb-8 text-center flex flex-col items-center">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-widest uppercase">
                    NEP INDIA PVT LTD
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-emerald-400 font-semibold tracking-wider">
                    Equipment Management System
                </p>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl sm:p-8">
                <div className="mb-6 text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Sign In
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                        Enter your credentials to access equipment portal
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div
                        className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300"
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@gmail.com"
                            autoComplete="username"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-800/40"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-800/40"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition duration-200 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-emerald-600/30 text-sm"
                    >
                        {loading ? "Authenticating..." : "Sign In to Portal"}
                    </button>
                </form>

                {/* Default Credentials Hint */}
                <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                    <p className="font-semibold text-slate-300">Default Credentials:</p>
                    <p className="font-mono text-emerald-400 mt-0.5">admin@gmail.com / admin</p>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-slate-500 font-medium">
                © {new Date().getFullYear()} NEP INDIA PVT LTD • All Rights Reserved
            </div>
        </div>
    );
};

export default Login;

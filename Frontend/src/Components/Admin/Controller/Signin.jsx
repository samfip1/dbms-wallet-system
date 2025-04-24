import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminSignIn = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: "",
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = "Username is required";
        } else if (formData.username.length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        setSuccessMessage("");

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:3000/admin/login", 
                {
                    username: formData.username,
                    password: formData.password,
                }
                //whenever 400 request comes it's likely the parameter we are sending are not correct
            );

            setSuccessMessage(
                "Successfully signed in! Redirecting to dashboard..."
            );

            setFormData({
                username: "",
                password: "",
            });

            setTimeout(() => {
                navigate("/admin/dashboard");
            }, 1458);
        } catch (error) {
            console.error("API Error:", error);
            setApiError(
                error.response?.data?.message ||
                    "An unexpected error occurred. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-blue-900 mb-2 text-center">
                    Login to your <b>Admin</b> Account
                </h2>

                {apiError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-center">
                        {apiError}
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-center">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.username
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.username && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.username}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.password
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={`w-full py-3 px-4 rounded-md font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            isLoading
                                ? "bg-blue-300 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-600"
                        }`}
                        disabled={isLoading}
                    >
                        {isLoading ? "Logging Account..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Does not have a Account?{" "}
                    <button
                        onClick={() => {
                            navigate("/admin/signup");
                        }}
                        className="text-blue-500 font-medium hover:underline"
                    >
                        Signup now
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AdminSignIn;

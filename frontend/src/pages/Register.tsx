import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import AuthContainer from "../components/common/AuthContainer";
import { toast } from "react-toastify";

const initialState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const Register: React.FC = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<Partial<typeof initialState>>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<{
    [K in keyof typeof initialState]?: boolean;
  }>({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: Partial<typeof initialState> = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email))
      newErrors.email = "Enter a valid email";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!form.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("registeredUser", JSON.stringify(form));
      toast.success("Registration successful! Please log in.");
      navigate("/login");
    }, 1800);
  };

  return (
    <AuthContainer
      left={
        <div className="max-w-md text-center">
          <img
            src="/vite.svg"
            alt="Brand Logo"
            className="h-16 w-16 mx-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-blue-700 tracking-tight">
            Welcome to AI Assistant
          </h1>
          <p className="text-lg md:text-xl text-blue-900/80 mb-6">
            Ask Questions & Get Quality Answers.
            <br />
            <span className="text-blue-400 font-semibold">
              Start your journey today.
            </span>
          </p>
          <div className="hidden md:block mt-12">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
              alt="Onboarding"
              className="rounded-2xl shadow-lg opacity-80"
            />
          </div>
        </div>
      }
    >
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-8 space-y-6"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        aria-label="Sign up form"
        noValidate
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-blue-800">
          Sign Up
        </h2>
        <p className="text-blue-600 mb-4">
          Create your account to get started.
        </p>
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-blue-900 mb-1"
            >
              Full Name
            </label>
            <motion.input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white/70 shadow-sm ${
                errors.fullName && touched.fullName
                  ? "border-red-400 ring-2 ring-red-300"
                  : "border-blue-200 focus:ring-blue-400"
              }`}
              value={form.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              required
              whileFocus={{ scale: 1.03, boxShadow: "0 0 0 4px #93c5fd55" }}
            />
            {errors.fullName && touched.fullName && (
              <span
                id="fullName-error"
                className="text-xs text-red-500 mt-1 block"
              >
                {errors.fullName}
              </span>
            )}
          </div>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-blue-900 mb-1"
            >
              Email
            </label>
            <motion.input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white/70 shadow-sm ${
                errors.email && touched.email
                  ? "border-red-400 ring-2 ring-red-300"
                  : "border-blue-200 focus:ring-blue-400"
              }`}
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              required
              whileFocus={{ scale: 1.03, boxShadow: "0 0 0 4px #93c5fd55" }}
            />
            {errors.email && touched.email && (
              <span
                id="email-error"
                className="text-xs text-red-500 mt-1 block"
              >
                {errors.email}
              </span>
            )}
          </div>
          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-blue-900 mb-1"
            >
              Password
            </label>
            <motion.input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white/70 shadow-sm ${
                errors.password && touched.password
                  ? "border-red-400 ring-2 ring-red-300"
                  : "border-blue-200 focus:ring-blue-400"
              }`}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              required
              whileFocus={{ scale: 1.03, boxShadow: "0 0 0 4px #93c5fd55" }}
            />
            {errors.password && touched.password && (
              <span
                id="password-error"
                className="text-xs text-red-500 mt-1 block"
              >
                {errors.password}
              </span>
            )}
          </div>
          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-blue-900 mb-1"
            >
              Confirm Password
            </label>
            <motion.input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white/70 shadow-sm ${
                errors.confirmPassword && touched.confirmPassword
                  ? "border-red-400 ring-2 ring-red-300"
                  : "border-blue-200 focus:ring-blue-400"
              }`}
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
              required
              whileFocus={{ scale: 1.03, boxShadow: "0 0 0 4px #93c5fd55" }}
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <span
                id="confirmPassword-error"
                className="text-xs text-red-500 mt-1 block"
              >
                {errors.confirmPassword}
              </span>
            )}
          </div>
        </div>
        {/* Submit Button */}
        <div>
          <motion.button
            type="submit"
            className={`w-full flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
            aria-busy={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="flex items-center">
                <LoadingSpinner small />
                <span className="ml-2">Signing up...</span>
              </span>
            ) : (
              "Sign Up"
            )}
          </motion.button>
        </div>
        {/* Redirect to Login */}
        <div className="text-center text-sm text-blue-700 mt-2">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-all"
          >
            Login
          </Link>
        </div>
      </motion.form>
    </AuthContainer>
  );
};

export default Register;

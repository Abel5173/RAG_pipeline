import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
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
    <div
      className="min-h-screen w-full flex flex-col md:flex-row items-center justify-center font-['Montserrat',_Poppins,_Arial,_sans-serif] relative"
      style={{
        background: "linear-gradient(120deg, #941c8a 0%, #f7b620 100%)",
      }}
    >
      {/* Sparkle/Star Animation Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg
          width="100%"
          height="100%"
          className="absolute inset-0"
          style={{ filter: "blur(0.5px)" }}
        >
          <g>
            {[...Array(18)].map((_, i) => (
              <circle
                key={i}
                cx={Math.random() * 100 + "%"}
                cy={Math.random() * 100 + "%"}
                r={Math.random() * 1.2 + 0.6}
                fill="#fefffe"
                opacity={Math.random() * 0.7 + 0.2}
              >
                <animate
                  attributeName="opacity"
                  values="0.2;1;0.2"
                  dur={`${2 + Math.random() * 2}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.3}s`}
                />
              </circle>
            ))}
          </g>
        </svg>
      </div>
      {/* Left: Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex w-full md:w-1/2 h-full items-center justify-center py-12 px-6 md:px-12 bg-transparent"
      >
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="mb-8"
          >
            {/* Brain + Lightning SVG */}
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              className="drop-shadow-lg"
            >
              <defs>
                <radialGradient id="brainGlow" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#f7b620" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#941c8a" stopOpacity="0.2" />
                </radialGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <ellipse
                cx="40"
                cy="40"
                rx="28"
                ry="26"
                fill="url(#brainGlow)"
                filter="url(#glow)"
                opacity="0.9"
              />
              <path
                d="M28 40c0-8 6-14 12-14s12 6 12 14-6 14-12 14"
                stroke="#fefffe"
                strokeWidth="3"
                fill="none"
                filter="url(#glow)"
              />
              <path
                d="M40 28v8l6 2-6 8v6"
                stroke="#f7b620"
                strokeWidth="3"
                fill="none"
                filter="url(#glow)"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 text-[#fefffe] drop-shadow-lg">
            Welcome to{" "}
            <span className="text-[#f7b620] drop-shadow-lg">IntelliGuide</span>
          </h1>
          <p className="text-lg md:text-2xl font-medium text-[#fefffe] opacity-90 mb-2">
            Your AI-powered assistant for policies, procedures, and precision.
          </p>
        </div>
      </motion.div>
      {/* Right: Sign Up Form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        className="relative z-10 flex w-full md:w-1/2 h-full items-center justify-center py-12 px-6 md:px-12"
      >
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-[rgba(254,255,254,0.08)] backdrop-blur-lg border border-white/15 rounded-2xl shadow-2xl px-8 py-10 flex flex-col gap-7"
          style={{
            boxShadow:
              "0 8px 32px 0 rgba(148,28,138,0.18), 0 1.5px 8px 0 #f7b62044",
          }}
          aria-label="Sign up"
          noValidate
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-[#fefffe] text-center md:text-left">
            Create your account
          </h2>
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="fullName"
              className="text-[#fefffe] text-base font-medium mb-1"
            >
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              className={`bg-transparent border-0 border-b border-white/30 text-[#fefffe] placeholder-transparent focus:border-[#f7b620] focus:ring-0 focus:outline-none transition-all py-2 px-0 text-lg
                ${
                  errors.fullName && touched.fullName
                    ? "border-[#f7b620] shadow-[0_0_8px_0_#f7b62077]"
                    : ""
                }
              `}
              value={form.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              required
              style={{ fontFamily: "inherit" }}
            />
            {errors.fullName && touched.fullName && (
              <motion.span
                id="fullName-error"
                className="text-xs text-[#f7b620] mt-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {errors.fullName}
              </motion.span>
            )}
          </div>
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-[#fefffe] text-base font-medium mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`bg-transparent border-0 border-b border-white/30 text-[#fefffe] placeholder-transparent focus:border-[#f7b620] focus:ring-0 focus:outline-none transition-all py-2 px-0 text-lg
                ${
                  errors.email && touched.email
                    ? "border-[#f7b620] shadow-[0_0_8px_0_#f7b62077]"
                    : ""
                }
              `}
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              required
              style={{ fontFamily: "inherit" }}
            />
            {errors.email && touched.email && (
              <motion.span
                id="email-error"
                className="text-xs text-[#f7b620] mt-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {errors.email}
              </motion.span>
            )}
          </div>
          {/* Password */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-[#fefffe] text-base font-medium mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className={`bg-transparent border-0 border-b border-white/30 text-[#fefffe] placeholder-transparent focus:border-[#f7b620] focus:ring-0 focus:outline-none transition-all py-2 px-0 text-lg
                ${
                  errors.password && touched.password
                    ? "border-[#f7b620] shadow-[0_0_8px_0_#f7b62077]"
                    : ""
                }
              `}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              required
              style={{ fontFamily: "inherit" }}
            />
            {errors.password && touched.password && (
              <motion.span
                id="password-error"
                className="text-xs text-[#f7b620] mt-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {errors.password}
              </motion.span>
            )}
          </div>
          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="confirmPassword"
              className="text-[#fefffe] text-base font-medium mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={`bg-transparent border-0 border-b border-white/30 text-[#fefffe] placeholder-transparent focus:border-[#f7b620] focus:ring-0 focus:outline-none transition-all py-2 px-0 text-lg
                ${
                  errors.confirmPassword && touched.confirmPassword
                    ? "border-[#f7b620] shadow-[0_0_8px_0_#f7b62077]"
                    : ""
                }
              `}
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
              required
              style={{ fontFamily: "inherit" }}
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <motion.span
                id="confirmPassword-error"
                className="text-xs text-[#f7b620] mt-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {errors.confirmPassword}
              </motion.span>
            )}
          </div>
          {/* Submit Button */}
          <div>
            <motion.button
              type="submit"
              aria-label="Sign up"
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-lg bg-[#f7b620] text-[#fefffe] shadow-lg transition-all duration-150
                hover:shadow-[0_0_16px_0_#f7b62099] hover:bg-[#ffd966] focus:outline-none focus:ring-2 focus:ring-[#f7b620] focus:ring-offset-2
                ${loading ? "opacity-70 cursor-not-allowed" : ""}
              `}
              disabled={loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
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
          <div className="text-center text-sm mt-2">
            <span className="text-[#fefffe]">Already have an account? </span>
            <Link
              to="/login"
              className="text-[#fefffe] hover:text-[#941c8a] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#f7b620] rounded"
            >
              Login
            </Link>
          </div>
        </form>
      </motion.div>
      {/* Responsive stacking: branding on top on mobile */}
      <style>
        {`
          @media (max-width: 767px) {
            .md\\:w-1\\/2 { width: 100% !important; }
            .md\\:text-6xl { font-size: 2.5rem !important; }
            .md\\:px-12 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
          }
        `}
      </style>
    </div>
  );
};

export default Register;

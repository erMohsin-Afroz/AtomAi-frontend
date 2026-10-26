import React, { useState, useContext } from "react";
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut,
    signInWithCustomToken,
} from "firebase/auth";

import { auth } from "./firebase.js";
import { MyContext } from "./MyContext.jsx";
import "./AuthModal.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AuthModal = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useContext(MyContext);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    };

    const resetOtpFlow = () => {
        setOtpSent(false);
        setOtp("");
    };

    const handleModeChange = () => {
        setIsLogin((prev) => !prev);
        resetOtpFlow();

        setFormData({
            name: "",
            email: "",
            password: "",
        });

        setError("");
        setSuccess("");
    };

    
const getFirebaseError = (err) => {
    switch (err.code) {
        case "auth/email-already-in-use":
            return "An account with this email address already exists.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/weak-password":
            return "Password must contain at least 6 characters.";

        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Invalid email address or password.";

        case "auth/popup-closed-by-user":
            return "Google sign-in was cancelled before completion. Please try again.";

        case "auth/popup-blocked":
            return "The Google sign-in popup was blocked by your browser. Allow popups and try again.";

        case "auth/too-many-requests":
            return "Too many authentication attempts. Please try again later.";

        case "auth/network-request-failed":
            return "A network error occurred. Please check your internet connection and try again.";

        case "auth/operation-not-allowed":
            return "This authentication method is disabled. Enable the required provider in the Firebase Console.";

        case "auth/account-exists-with-different-credential":
            return "An account already exists with this email address using a different sign-in method.";

        default:
            return err.message || "An authentication error occurred. Please try again.";
    }
};


    const postJson = async (path, body) => {
        const response = await fetch(`${API_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Request failed.");
        }

        return data;
    };

    const completeLogin = async (firebaseUser) => {
        const token = await firebaseUser.getIdToken(true);

        const response = await fetch(`${API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok || !data.user) {
            throw new Error(
                data.message ||
                data.error ||
                "MongoDB profile have not fetch."
            );
        }

        login(data.user, token);
    };

    const handleSendOtp = async () => {
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const name = formData.name.trim();
            const email = formData.email.trim().toLowerCase();
            const password = formData.password;

            if (!name) {
                throw new Error("Enter your full name.");
            }

            if (name.length > 100) {
                throw new Error("Name max length is 100 characters.");
            }

            if (password.length < 6 || password.length > 128) {
                throw new Error(
                    "Password should 6 to 128 characters."
                );
            }

            await postJson("/api/auth/send-otp", { email });

            setFormData((prev) => ({
                ...prev,
                email,
            }));

            setOtpSent(true);
            setOtp("");

            setSuccess(
                "OTP has been sent on email. Check your inbox or spam folder."
            );
        } catch (err) {
            setError(err.message || "OTP has not sent.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            if (!/^\d{6}$/.test(otp.trim())) {
                throw new Error("Enter 6-digit OTP.");
            }

            const verificationData = await postJson(
                "/api/auth/verify-otp",
                {
                    email: formData.email.trim().toLowerCase(),
                    otp: otp.trim(),
                }
            );

            if (!verificationData.signupToken) {
                throw new Error(
                    "OTP verified, But signup token not found."
                );
            }

            if (auth.currentUser) {
                await signOut(auth);
            }

            const signupData = await postJson(
                "/api/auth/complete-signup",
                {
                    signupToken: verificationData.signupToken,
                    name: formData.name.trim(),
                    password: formData.password,
                }
            );

            if (!signupData.customToken) {
                throw new Error(
                    "Account created, But Firebase login token not found."
                );
            }

            const credential = await signInWithCustomToken(
                auth,
                signupData.customToken
            );

            await completeLogin(credential.user);

            resetOtpFlow();

            setSuccess(
                "Email OTP verified! Account created and login successful."
            );
        } catch (err) {
            setError(err.message || "OTP verification or signup failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isLogin) {
            if (!otpSent) {
                await handleSendOtp();
            } else {
                await handleVerifyOtp();
            }

            return;
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const email = formData.email.trim().toLowerCase();

            const credential = await signInWithEmailAndPassword(
                auth,
                email,
                formData.password
            );

            if (!credential.user.emailVerified) {
                await signOut(auth);

                throw new Error(
                    "Email not verified. Signup verification completed."
                );
            }

            await completeLogin(credential.user);
        } catch (err) {
            setError(
                err.code
                    ? getFirebaseError(err)
                    : err.message || "Login failed."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: "select_account",
            });

            const result = await signInWithPopup(auth, provider);

            await completeLogin(result.user);
        } catch (err) {
            setError(
                err.code
                    ? getFirebaseError(err)
                    : err.message || "Google login succesfull."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setError("");
        setSuccess("");

        const email = formData.email.trim().toLowerCase();

        if (!email) {
            setError(
                "Enter email for password reset."
            );
            return;
        }

        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);

            setSuccess(
                "If account exist for this email, reset link has been sent."
            );
        } catch (err) {
            setError(getFirebaseError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-brand-mark" aria-hidden="true">
                        <span>A</span>
                    </div>

                    <h2>
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </h2>

                    <p className="auth-subtitle">
                        {isLogin
                            ? "Login to continue to AtomAi"
                            : "Create your account and start chatting with AtomAi"}
                    </p>
                </div>

                {error && (
                    <div className="auth-error" role="alert">
                        <span className="auth-error-icon" aria-hidden="true">
                            !
                        </span>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="auth-success" role="status">
                        {success}
                    </div>
                )}

                <button
                    type="button"
                    className="google-auth-btn"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <svg
                        className="google-icon"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                    >
                        <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                        />
                        <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.73 6C44.44 38.07 46.98 31.94 46.98 24.55Z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
                        />
                        <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                        />
                    </svg>

                    <span>Continue with Google</span>
                </button>

                <div className="auth-divider" aria-hidden="true">
                    <span />
                    <p>OR CONTINUE WITH EMAIL</p>
                    <span />
                </div>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="auth-name">Full Name</label>

                            <input
                                id="auth-name"
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete="name"
                                maxLength={100}
                                required
                                disabled={otpSent}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="auth-email">
                            Email Address
                        </label>

                        <input
                            id="auth-email"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                            disabled={otpSent}
                        />
                    </div>

                    <div className="form-group">
                        <div className="password-label-row">
                            <label htmlFor="auth-password">
                                Password
                            </label>

                            {isLogin && (
                                <button
                                    type="button"
                                    className="forgot-password-btn"
                                    onClick={handleForgotPassword}
                                    disabled={loading}
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>

                        <input
                            id="auth-password"
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete={
                                isLogin
                                    ? "current-password"
                                    : "new-password"
                            }
                            minLength={6}
                            maxLength={128}
                            required
                            disabled={otpSent}
                        />
                    </div>

                    {!isLogin && otpSent && (
                        <div className="form-group">
                            <label htmlFor="auth-otp">
                                6-digit Email OTP
                            </label>

                            <input
                                id="auth-otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => {
                                    setOtp(
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    );
                                    setError("");
                                }}
                                maxLength={6}
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Please wait..."
                            : isLogin
                                ? "Login to AtomAi"
                                : !otpSent
                                    ? "Send Email OTP"
                                    : "Verify OTP"}

                        {!loading && (
                            <span
                                className="auth-btn-arrow"
                                aria-hidden="true"
                            >
                                →
                            </span>
                        )}
                    </button>

                    {!isLogin && otpSent && (
                        <button
                            type="button"
                            className="forgot-password-btn"
                            onClick={handleSendOtp}
                            disabled={loading}
                            style={{ marginTop: "12px" }}
                        >
                            Resend OTP
                        </button>
                    )}
                </form>

                <div className="auth-toggle">
                    <span>
                        {isLogin
                            ? "Don't have an account?"
                            : "Already have an account?"}
                    </span>

                    <button
                        type="button"
                        onClick={handleModeChange}
                        disabled={loading}
                    >
                        {isLogin ? "Sign Up" : "Login"}
                    </button>
                </div>

                <p className="auth-footer">
                    Secure access to your AtomAi workspace
                </p>
            </div>
        </main>
    );
};

export default AuthModal;

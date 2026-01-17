
export const getFriendlyErrorMessage = (error: any): string => {
    if (!error) return "An unknown error occurred.";

    // Extract message string
    const msg = (error.message || error.error_description || error.toString()).toLowerCase();

    // Map common Supabase/Auth errors
    if (msg.includes("invalid login credentials")) {
        return "Incorrect email or password. Please double-check and try again.";
    }

    if (msg.includes("user already registered") || msg.includes("unique constraint")) {
        return "This email is already associated with an account. Please sign in instead.";
    }

    if (msg.includes("rate limit") || msg.includes("too many requests")) {
        return "Too many attempts. Please wait a few minutes before trying again.";
    }

    if (msg.includes("password should be at least")) {
        return "Password is too weak. Please use at least 6 characters.";
    }

    if (msg.includes("database error")) {
        return "A system error occurred deeply within the portal. Please contact support.";
    }

    if (msg.includes("confirmed") && msg.includes("email")) {
        return "Please confirm your email address before logging in.";
    }

    if (msg.includes("network") || msg.includes("fetch")) {
        return "Network error. Please check your internet connection.";
    }

    // Admin/Role specific
    if (msg.includes("unauthorized") || msg.includes("access denied")) {
        return "You do not have permission to access this area.";
    }

    // Fallback: Capitalize first letter of original message
    try {
        return error.message.charAt(0).toUpperCase() + error.message.slice(1);
    } catch (e) {
        return "An unexpected error occurred.";
    }
};

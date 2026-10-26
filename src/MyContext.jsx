import {
    createContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { v1 as uuidv1 } from "uuid";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase.js";

export const MyContext = createContext(null);

export const MyContextProvider = ({ children }) => {
    const [token, setToken] = useState(
        () => localStorage.getItem("token") || null
    );

    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user")) || null;
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    });

    const [authLoading, setAuthLoading] = useState(true);

    const [theme, setTheme] = useState(
        () => localStorage.getItem("theme") || "dark"
    );

    const toggleTheme = () => {
        setTheme((prevTheme) => {
            const newTheme =
                prevTheme === "dark" ? "light" : "dark";

            localStorage.setItem("theme", newTheme);
            return newTheme;
        });
    };

    const [prompt, setPrompt] = useState("");
    const [reply, setReply] = useState(null);
    const [currThreadId, setCurrThreadId] = useState(uuidv1());
    const [prevChats, setPrevChats] = useState([]);
    const [newChat, setNewChat] = useState(true);
    const [allThreads, setAllThreads] = useState([]);

    const login = useCallback((userData, authToken) => {
        setUser(userData);
        setToken(authToken);

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", authToken);
    }, []);

    const clearSession = useCallback(() => {
        setUser(null);
        setToken(null);
        setAllThreads([]);
        setPrevChats([]);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setNewChat(true);

        localStorage.removeItem("user");
        localStorage.removeItem("token");
    }, []);

    useEffect(() => {
        let active = true;

        const unsubscribe = onAuthStateChanged(
            auth,
            async (firebaseUser) => {
                if (!firebaseUser) {
                    if (active) {
                        clearSession();
                        setAuthLoading(false);
                    }
                    return;
                }

                try {
                    if (
                        firebaseUser.providerData.some(
                            (provider) =>
                                provider.providerId === "password"
                        ) &&
                        !firebaseUser.emailVerified
                    ) {
                        await signOut(auth);
                        return;
                    }

                    const freshToken = await firebaseUser.getIdToken();

                    const response = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, 
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${freshToken}`,
                            },
                        }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                            data.error ||
                            "Unable to verify user profile."
                        );
                    }

                    if (!data.user) {
                        throw new Error("User profile not found.");
                    }

                    if (!active) return;

                    login(data.user, freshToken);
                } catch (err) {
                    console.error(
                        "Firebase session restore failed:",
                        err.message
                    );

                    if (active) {
                        clearSession();
                    }

                    if (auth.currentUser?.uid === firebaseUser.uid) {
                        await signOut(auth);
                    }
                } finally {
                    if (active) {
                        setAuthLoading(false);
                    }
                }
            }
        );

        return () => {
            active = false;
            unsubscribe();
        };
    }, [clearSession, login]);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Firebase logout failed:", err);
        } finally {
            clearSession();
        }
    }, [clearSession]);

    return (
        <MyContext.Provider
            value={{
                token,
                user,
                login,
                logout,
                authLoading,
                theme,
                toggleTheme,
                prompt,
                setPrompt,
                reply,
                setReply,
                currThreadId,
                setCurrThreadId,
                newChat,
                setNewChat,
                prevChats,
                setPrevChats,
                allThreads,
                setAllThreads,
            }}
        >
            {children}
        </MyContext.Provider>
    );
};

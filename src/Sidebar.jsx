import "./Sidebar.css";
import logo from "./assets/logo.svg";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

function Sidebar({ mobileSidebarOpen, onClose }) {
    const {
        token,
        allThreads,
        setAllThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats
    } = useContext(MyContext);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    // Fetch all chat threads
    const getAllThreads = async () => {
        if (!token) {
            setAllThreads([]);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/thread`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const res = await response.json();

            if (!response.ok) {
                console.error(
                    "Failed to fetch threads:",
                    response.status,
                    res
                );
                return;
            }

            if (!Array.isArray(res)) {
                console.error("Invalid threads response:", res);
                return;
            }

            const filteredData = res.map((thread) => ({
                threadId: thread.threadId,
                title: thread.title
            }));

            setAllThreads(filteredData);
        } catch (err) {
            console.error("Error fetching threads:", err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId, token]);

    // Create a new chat
    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
        onClose?.();
    };

    // Open an existing chat thread
    const changeThread = async (newThreadId) => {
        if (!token) {
            console.error("Cannot open thread: authentication token missing.");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/thread/${newThreadId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const res = await response.json();

            if (!response.ok) {
                console.error(
                    "Failed to load thread:",
                    response.status,
                    res
                );
                return;
            }

            if (!Array.isArray(res)) {
                console.error("Invalid thread response:", res);
                return;
            }

            setCurrThreadId(newThreadId);
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
            onClose?.();
        } catch (err) {
            console.error("Error opening thread:", err);
        }
    };

    // Delete a chat thread
    const deleteThread = async (threadId) => {
        if (!token) {
            console.error("Cannot delete thread: authentication token missing.");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/thread/${threadId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const res = await response.json();

            if (!response.ok) {
                console.error(
                    "Failed to delete thread:",
                    response.status,
                    res
                );
                return;
            }

            setAllThreads((prev) =>
                prev.filter((thread) => thread.threadId !== threadId)
            );

            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.error("Error deleting thread:", err);
        }
    };

    return (
        <section
            className={`sidebar ${mobileSidebarOpen ? "sidebarOpen" : ""}`}
        >
            <div className="sidebarTopActions">
                <button
                    type="button"
                    className="newChatBtn"
                    onClick={createNewChat}
                >
                    <img
                        src={logo}
                        alt="gpt logo"
                        className="logo"
                    />
                    <span>New Chat</span>
                </button>

                <button
                    type="button"
                    className="sidebarCloseBtn"
                    onClick={() => onClose?.()}
                    aria-label="Close sidebar"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            <ul className="history">
                {allThreads?.map((thread) => (
                    <li
                        key={thread.threadId}
                        onClick={() => changeThread(thread.threadId)}
                        className={
                            thread.threadId === currThreadId
                                ? "highlighted"
                                : ""
                        }
                    >
                        {thread.title}

                        <i
                            className="fa-solid fa-trash"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteThread(thread.threadId);
                            }}
                            role="button"
                            aria-label={`Delete ${thread.title}`}
                        ></i>
                    </li>
                ))}
            </ul>

            <div className="sign">
                <p>ATOM Pvt Ltd. &copy;</p>
            </div>
        </section>
    );
}

export default Sidebar;
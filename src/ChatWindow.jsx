import "./ChatWindow.css";
import logo from "./assets/logo.svg";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow({onMenuClick}) {
    const { 
        prompt, 
        setPrompt, 
        reply, 
        setReply, 
        currThreadId, 
        setPrevChats, 
        setNewChat, 
        token, 
        logout,
        theme,
        toggleTheme,
        user 
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const getReply = async () => {
        setLoading(true);
        setNewChat(false);

        console.log("message ", prompt, " threadId ", currThreadId);
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId
            })
        };

        try {
            const response = await fetch("http://localhost:8080/api/chat", options);
            const res = await response.json();
            console.log(res);
            setReply(res.reply);
        } catch(err) {
            console.log(err);
        }
        setLoading(false);
    }

    useEffect(() => {
        if(prompt && reply) {
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: "user",
                    content: prompt
                },{
                    role: "assistant",
                    content: reply
                }]
            ));
        }

        setPrompt("");
    }, [reply]);

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                const response = await fetch("http://localhost:8080/api/auth/delete-account", {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                const res = await response.json();
                console.log(res);

                if (response.ok) {
                    logout(); 
                }
            } catch (err) {
                console.log(err);
            }
        }
    };

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    return (
        <div className="chatWindow">
            <div className="navbar">
                <div className="navbarBrand">
                    <button
                    className="mobileMenuBtn"
                    onClick={onMenuClick}
                    aria-label="Toggle chat history"
                    title="Chat history">
                    <i className="fa-solid fa-bars"></i>
                   </button>

                   <span className="brandName"><img src={logo} alt="Atom logo" className="logoc" /><b>Atom</b><i className="fa-solid fa-chevron-down"></i></span>
                </div>
                
                <div className="navControls">
                    <div className="themeToggleBtn" onClick={toggleTheme} title="Toggle Theme">
                        <i className={theme === "dark" ? "fa-regular fa-sun" : "fa-solid fa-moon"}></i>
                    </div>

                    <div className="profileContainer" onClick={handleProfileClick}>
                        {/* User Name */}
                        <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                        <span className="userName">{user?.name || user?.username || "User"}</span>
                    </div>
                </div>
            </div>

            {
                isOpen && 
                <div className="dropDown">
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                    <div className="dropDownItem" onClick={logout}><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
                    <div className="dropDownItem" onClick={handleDeleteAccount} style={{ color: '#ff5555' }}> <i className="fa-solid fa-user-slash"></i> Delete Account</div>
                </div>
            }

            <Chat></Chat>

            <ScaleLoader color={theme === "dark" ? "#fff" : "#000"} loading={loading}>
            </ScaleLoader>
            
            <div className="chatInput">
                <div className="inputBox">
                    <input placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter'? getReply() : ''}
                    >
                           
                    </input>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    Atom is AI it can make mistakes.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;
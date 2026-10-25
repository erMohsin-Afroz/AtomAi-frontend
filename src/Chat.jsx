
import "./Chat.css";
import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

const promptCategories = [
    {
        icon: "fa-solid fa-code",
        title: "Write code",
        description: "Build something with code",
        prompt: "Help me write clean, efficient code for a project. Explain the solution step by step."
    },
    {
        icon: "fa-solid fa-graduation-cap",
        title: "Learn something",
        description: "Understand a new topic",
        prompt: "Teach me an interesting technical topic in simple language, with examples."
    },
    {
        icon: "fa-solid fa-laptop-code",
        title: "Prepare for an interview",
        description: "Practice technical questions",
        prompt: "Give me important full-stack developer interview questions with clear answers and examples."
    },
    {
        icon: "fa-solid fa-lightbulb",
        title: "Get creative",
        description: "Explore new ideas",
        prompt: "Suggest five creative and useful project ideas that I can build as a developer."
    }
];

function MessageActions({ content, messageId, liked, onLike, copiedId, onCopy }) {
    return (
        <div className="messageActions">
            <button
                type="button"
                className={`messageActionBtn ${copiedId === messageId ? "copied" : ""}`}
                onClick={() => onCopy(content, messageId)}
                aria-label="Copy AI response"
                title={copiedId === messageId ? "Copied!" : "Copy response"}
            >
                <i className={`fa-solid ${copiedId === messageId ? "fa-check" : "fa-copy"}`}></i>
                <span>{copiedId === messageId ? "Copied" : "Copy"}</span>
            </button>

            <button
                type="button"
                className={`messageActionBtn likeActionBtn ${liked ? "liked" : ""}`}
                onClick={() => onLike(messageId)}
                aria-label={liked ? "Unlike response" : "Like response"}
                aria-pressed={liked}
                title={liked ? "Unlike response" : "Like response"}
            >
                <i className={`${liked ? "fa-solid" : "fa-regular"} fa-thumbs-up`}></i>
                <span>Like</span>
            </button>
        </div>
    );
}

function Chat() {
    const {
        newChat,
        prevChats = [],
        reply,
        setPrompt,
        user,
        theme
    } = useContext(MyContext);

    const [latestReply, setLatestReply] = useState(null);
    const [likedMessages, setLikedMessages] = useState({});
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        if (reply === null) {
            setLatestReply(null);
            return;
        }

        if (!prevChats?.length) return;

        const content = reply.split(" ");
        let idx = 0;

        const interval = setInterval(() => {
            setLatestReply(content.slice(0, idx + 1).join(" "));
            idx++;

            if (idx >= content.length) {
                clearInterval(interval);
            }
        }, 40);

        return () => clearInterval(interval);
    }, [prevChats, reply]);

    const handlePromptSelect = (selectedPrompt) => {
        setPrompt(selectedPrompt);
    };

    const handleLike = (messageId) => {
        setLikedMessages(prev => ({
            ...prev,
            [messageId]: !prev[messageId]
        }));
    };

    const handleCopy = async (content, messageId) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedId(messageId);
        } catch (error) {
            console.error("Unable to copy response:", error);
        }
    };

    const showWelcome = newChat && prevChats.length === 0;

    return (
        <>
            {showWelcome ? (
                <div className={`welcomeScreen ${theme === "light" ? "welcomeLight" : ""}`}>
                    <div className="welcomeContent">
                        <div className="welcomeBadge">
                            <i className="fa-solid fa-sparkles"></i>
                            <span>Your AI workspace</span>
                        </div>

                        <div className="welcomeIcon">
                            <div className="welcomeIconGlow"></div>
                            <i className="fa-solid fa-atom"></i>
                        </div>

                        <h1 className="welcomeTitle">
                            {user?.name
                                ? <>Welcome , <span>{user.name.split(" ")[0]}.</span></>
                                : <>What can I <span>help you with?</span></>}
                        </h1>

                        <p className="welcomeSubtitle">
                            Your ideas, questions, and next big project start here.
                            Let's make something amazing together.
                        </p>

                        <div className="promptSection">
                            <div className="promptSectionHeader">
                                <span>EXPLORE YOUR POSSIBILITIES</span>
                                <i className="fa-solid fa-arrow-down"></i>
                            </div>

                            <div className="promptGrid">
                                {promptCategories.map((item) => (
                                    <button
                                        type="button"
                                        className="promptCard"
                                        key={item.title}
                                        onClick={() => handlePromptSelect(item.prompt)}
                                    >
                                        <span className="promptCardIcon">
                                            <i className={item.icon}></i>
                                        </span>

                                        <span className="promptCardText">
                                            <strong>{item.title}</strong>
                                            <small>{item.description}</small>
                                        </span>

                                        <i className="fa-solid fa-arrow-up-right-from-square promptCardArrow"></i>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="welcomeFooter">
                            <span className="welcomeStatusDot"></span>
                            <span>Ready when you are</span>
                            <span className="welcomeFooterDivider">·</span>
                            <span>Ask anything. Explore everything.</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="chats-wrapper">
                    <div className="chats">
                        {prevChats?.slice(0, -1).map((chat, idx) => {
                            const messageId = `history-${idx}`;

                            return (
                                <div
                                    className={chat.role === "user" ? "userDiv" : "gptDiv"}
                                    key={idx}
                                >
                                    {chat.role === "user" ? (
                                        <p className="userMessage">{chat.content}</p>
                                    ) : (
                                        <>
                                            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                                {chat.content}
                                            </ReactMarkdown>

                                            <MessageActions
                                                content={chat.content}
                                                messageId={messageId}
                                                liked={!!likedMessages[messageId]}
                                                onLike={handleLike}
                                                copiedId={copiedId}
                                                onCopy={handleCopy}
                                            />
                                        </>
                                    )}
                                </div>
                            );
                        })}

                        {prevChats?.length > 0 && (() => {
                            const lastChat = prevChats[prevChats.length - 1];

                            if (lastChat?.role === "user") {
                                return (
                                    <div className="userDiv" key="last-user">
                                        <p className="userMessage">{lastChat.content}</p>
                                    </div>
                                );
                            }

                            const messageId = `history-${prevChats.length - 1}`;
                            const displayedContent = latestReply === null
                                ? lastChat?.content
                                : latestReply;

                            return (
                                <div className="gptDiv" key="last-assistant">
                                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                        {displayedContent || ""}
                                    </ReactMarkdown>

                                    <MessageActions
                                        content={lastChat?.content || ""}
                                        messageId={messageId}
                                        liked={!!likedMessages[messageId]}
                                        onLike={handleLike}
                                        copiedId={copiedId}
                                        onCopy={handleCopy}
                                    />
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </>
    );
}

export default Chat;

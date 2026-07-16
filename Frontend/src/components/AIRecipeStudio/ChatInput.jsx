import { useState } from "react";
import { SendHorizontal } from "lucide-react";

const ChatInput = ({ sendMessage, isTyping }) => {
    const [text, setText] = useState("");

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed || isTyping) return;
        sendMessage(trimmed);
        setText("");
    };

    return (
        <div className="border-t p-4 flex gap-3 flex-shrink-0">
            <input
                type="text"
                placeholder={isTyping ? "AI is thinking..." : "Describe your recipe..."}
                value={text}
                disabled={isTyping}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition"
            />
            <button
                onClick={handleSend}
                disabled={isTyping || !text.trim()}
                className="bg-primary hover:bg-secondary transition px-5 rounded-xl text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <SendHorizontal size={20} />
            </button>
        </div>
    );
};

export default ChatInput;
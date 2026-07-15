import { useState } from "react";
import { SendHorizontal } from "lucide-react";

const ChatInput = ({ sendMessage }) => {
    const [text,setText] = useState("");

    const handleSend = () => {
        if (!text.trim()) return;

        sendMessage(text);
        setText("");
    };

    return (

        <div className="border-t p-4 flex gap-3">

            <input
                type="text"
                placeholder="Describe your recipe..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleSend();
                    }
                }}
                className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            />

            <button onClick={handleSend}
                className="bg-primary hover:bg-secondary transition px-5 rounded-xl text-white flex items-center justify-center"
            >

                <SendHorizontal size={20} />

            </button>

        </div>

    );

};

export default ChatInput;
import {Bot, User} from "lucide-react";

const ChatMessage = ({ message }) => {
    const isAI = message.sender === "ai";

    return (
        <div className = {`flex gap-3 mb-5 ${isAI ? "" : "justify-end"}`}>
            {isAI && (
                <div className="bg-primary text-white h-10 w-10 rounded-full flex items-center justify-center">
                    <Bot size = {18} />
                </div>
            )}

            <div className={`max-w-md rounded-2xl px-4 py-3 ${
                isAI
                    ? "bg-gray-100" : "bg-primary text-white"
            }`}>
                {message.text}
            </div>
            {!isAI && (

                <div className="bg-gray-300 h-10 w-10 rounded-full flex items-center justify-center">

                    <User size={18} />

                </div>

            )}
        </div>
    );


};

export default ChatMessage;
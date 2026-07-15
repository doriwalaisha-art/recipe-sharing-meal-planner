import { Bot } from "lucide-react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

const ChatWindow = ({ messages, sendMessage, isTyping }) => {

    return (

        <div className="bg-white rounded-3xl shadow-xl h-[78vh] flex flex-col overflow-hidden">

            <div className="border-b p-5 flex items-center gap-3">

                <div className="bg-primary p-2 rounded-full text-white">
                    <Bot size={20} />
                </div>

                <div>
                    <h2 className="font-bold text-lg">
                        AI Assistant
                    </h2>

                    <p className="text-gray-500 text-sm">
                        Ask me to create or edit recipes.
                    </p>
                </div>

            </div>

            <div className="flex-1 overflow-y-auto p-5">

                {messages.map((message, index) => (

                    <ChatMessage
                        key={index}
                        message={message}
                    />

                ))}
                {isTyping && <TypingIndicator />}

            </div>

            <ChatInput sendMessage={sendMessage} />

        </div>

    );

};

export default ChatWindow;
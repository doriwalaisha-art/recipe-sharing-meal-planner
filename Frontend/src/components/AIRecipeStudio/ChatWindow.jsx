import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

const ChatWindow = ({
    messages,
    sendMessage,
    isTyping,
    categories,
    difficulties,
    handleCreateRecipe,
    isCreating,
    handleCategorySelect,
    handleDifficultySelect,
    setSelectedImage,
}) => {
    const bottomRef = useRef(null);

    // Auto-scroll to bottom whenever messages update or typing changes
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const lastIndex = messages.length - 1;

    return (
        <div className="bg-white rounded-3xl shadow-xl h-[78vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b p-5 flex items-center gap-3 flex-shrink-0">
                <div className="bg-primary p-2 rounded-full text-white">
                    <Bot size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-lg">AI Assistant</h2>
                    <p className="text-gray-500 text-sm">
                        {isTyping ? "Thinking..." : "Ask me to create or edit recipes."}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5">
                {messages.map((message, index) => (
                    <ChatMessage
                        key={index}
                        message={message}
                        isLatest={index === lastIndex}
                        categories={categories}
                        difficulties={difficulties}
                        handleCreateRecipe={handleCreateRecipe}
                        isCreating={isCreating}
                        setSelectedImage={setSelectedImage}
                        handleCategorySelect={handleCategorySelect}
                        handleDifficultySelect={handleDifficultySelect}
                    />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <ChatInput sendMessage={sendMessage} isTyping={isTyping} />
        </div>
    );
};

export default ChatWindow;
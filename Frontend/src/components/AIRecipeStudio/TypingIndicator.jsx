import { Bot } from "lucide-react";

const TypingIndicator = () => {
    return (
        <div className="flex gap-3 mb-5">
            <div className="bg-primary text-white h-10 w-10 rounded-full flex items-center justify-center">
                <Bot size={18} />
            </div>

            <div className="bg-gray-100 rounded-2xl px-4 py-3 flex gap-2">
                <span className="h-2 w-2 bg-gray-500 rounded-full animate-pulse"></span>
                <span className="h-2 w-2 bg-gray-500 rounded-full animate-pulse"></span>
                <span className="h-2 w-2 bg-gray-500 rounded-full animate-pulse"></span>
            </div>
        </div>
    );
};

export default TypingIndicator;
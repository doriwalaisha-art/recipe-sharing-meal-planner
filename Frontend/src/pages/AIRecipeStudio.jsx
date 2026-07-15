import { useState } from 'react';
import API from "../api/axios";
import {Sparkles} from 'lucide-react';
import ChatWindow from "../components/AIRecipeStudio/ChatWindow"
import RecipePreview from "../components/AIRecipeStudio/RecipePreview";

const AIRecipeStudio = () => {
    const [messages,setMessages] = useState([
        {
            sender : "ai",
            text : "👋 Hello! I'm your AI Recipe Assistant. Describe any recipe naturally and I'll create it for you."
        }
    ]);
    const [recipe, setRecipe] = useState(null);
    const [isTyping, setIsTyping] = useState(false);    

    const sendMessage = async (text) => {

    if (!text.trim()) return;

    const userMessage = {
        sender: "user",
        text
    };

    setMessages(prev => [...prev, userMessage]);

    setIsTyping(true);

    try {

        const { data } = await API.post("/ai/chat", {
            message: text,
            recipe
        });

        setIsTyping(false);

        setMessages(prev => [
            ...prev,
            {
                sender: "ai",
                text: data.reply
            }
        ]);

        if (data.type === "create" || data.type === "update") {
            setRecipe(data.recipe);
        }

    } catch (error) {

        setIsTyping(false);

        setMessages(prev => [
            ...prev,
            {
                sender: "ai",
                text:
                    error.response?.data?.message ||
                    "Something went wrong."
            }
        ]);

    }

};
    return (

         <div className="min-h-screen bg-bgLight px-6 py-8">
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-white p-3 rounded-2xl shadow-lg">
                        <Sparkles size={28} />
                    </div>

                    <div>
                         <h1 className="text-4xl font-bold text-textDark">
                            AI Recipe Studio
                        </h1>

                        <p className="text-gray-500 mt-1">
                            Describe, create and edit recipes using AI.
                        </p>
                    </div>

                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <ChatWindow 
                    messages={messages}
                    sendMessage={sendMessage}
                    isTyping={isTyping}
                />

                <RecipePreview recipe={recipe} />

            </div>
        </div>
    );
};
export default AIRecipeStudio;
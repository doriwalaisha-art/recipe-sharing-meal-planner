import { useState,useEffect } from 'react';
import API from "../api/axios";
import {Sparkles} from 'lucide-react';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
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
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedDifficulty, setSelectedDifficulty] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const categories = [
        { _id: 1, name: "Breakfast" },
        { _id: 2, name: "Brunch" },
        { _id: 3, name: "Lunch" },
        { _id: 4, name: "Dinner" },
        { _id: 5, name: "Dessert" },
        { _id: 6, name: "Snacks" },
        { _id: 7, name: "Beverages" },
        { _id: 8, name: "Salad" },
        { _id: 9, name: "Soup" },
        { _id: 10, name: "Vegetarian" },
        { _id: 11, name: "Non-Vegetarian" },
        { _id: 12, name: "Vegan" },
        { _id: 13, name: "Healthy" },
        { _id: 14, name: "High-Protein" },
        { _id: 15, name: "Quick Meals" },
        { _id: 16, name: "Jain" },
    ];
    const difficulties = [
        { _id: 1, name: "Easy" },
        { _id: 2, name: "Medium" },
        { _id: 3, name: "Hard" },
    ];

    const navigate = useNavigate();   

        const handleCreateRecipe = async () => {
    try {
        const formData = new FormData();
        formData.append('title', recipe.title);
        formData.append('description', recipe.description || "A delicious recipe created with AI.");
        formData.append('category', recipe.category || "Dinner");
        formData.append('difficulty', recipe.difficulty || "Medium");
        
        let time = recipe.cookingTime;
        if (typeof time === 'string') time = parseInt(time.replace(/\D/g, ''), 10) || 0;
        formData.append('cookingTime', time);
        
        let serv = recipe.servings;
        if (typeof serv === 'string') serv = parseInt(serv.replace(/\D/g, ''), 10) || 1;
        formData.append('servings', serv);
        
        formData.append('ingredients', JSON.stringify(recipe.ingredients || []));
        formData.append('instructions', JSON.stringify(recipe.instructions || []));
        
        if (selectedImage) {
            formData.append('image', selectedImage);
        }

        await API.post('/recipes', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        toast.success("Recipe created successfully!");

        navigate("/");

    } catch (error) {

        toast.error(
            error.response?.data?.message ||
            "Failed to create recipe."
        );

    }
};

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
                text: data.reply,
                action: data.action
            }
        ]);

        if (data.type === "create" || data.type === "update" || data.type === "complete") {
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
            <div className="max-w-4xl mx-auto mb-8">
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

                <div className="max-w-4xl mx-auto">
                <ChatWindow 
                    messages={messages}
                    sendMessage={sendMessage}
                    isTyping={isTyping}
                    categories={categories}
                    handleCreateRecipe={handleCreateRecipe}
                    setSelectedImage={(image) => {
                        setSelectedImage(image);
                        // Convert to base64 or upload and get URL, then update recipe state
                        if (image) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                setRecipe(prev => ({...prev, image: reader.result}));
                                sendMessage("I have uploaded the image.");
                            };
                            reader.readAsDataURL(image);
                        }
                    }}
                    handleCategorySelect={(catName) => {
                        setSelectedCategory(catName);
                        sendMessage(`I choose the category: ${catName}`);
                    }}
                    difficulties={difficulties}
                    handleDifficultySelect={(diffName) => {
                        setSelectedDifficulty(diffName);
                        sendMessage(`I choose the difficulty: ${diffName}`);
                    }}
                />

            </div>
        </div>
    );
};
export default AIRecipeStudio;
import { useState, useRef, useEffect } from 'react';
import API from "../api/axios";
import { Sparkles } from 'lucide-react';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ChatWindow from "../components/AIRecipeStudio/ChatWindow";
import RecipePreview from "../components/AIRecipeStudio/RecipePreview";

const CATEGORIES = [
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

const DIFFICULTIES = [
    { _id: 1, name: "Easy" },
    { _id: 2, name: "Medium" },
    { _id: 3, name: "Hard" },
];

const INITIAL_MESSAGE = {
    sender: "ai",
    text: "👋 Hello! I'm your AI Recipe Assistant. Tell me a recipe you'd like to create and I'll guide you step by step.",
};

const AIRecipeStudio = () => {
    const [messages, setMessages] = useState([INITIAL_MESSAGE]);
    const [recipe, setRecipe] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const navigate = useNavigate();
    const abortRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    const handleCreateRecipe = async () => {
        if (!recipe) {
            toast.error("No recipe data available.");
            return;
        }
        if (!selectedImage) {
            toast.error("Please upload a recipe image first.");
            return;
        }
        if (isCreating) return;

        setIsCreating(true);
        try {
            const formData = new FormData();
            formData.append('title', recipe.title || "");
            formData.append('description', recipe.description || "A delicious AI-generated recipe.");
            formData.append('category', recipe.category || "Dinner");
            formData.append('difficulty', recipe.difficulty || "Medium");

            let time = recipe.cookingTime;
            if (typeof time === 'string') time = parseInt(time.replace(/\D/g, ''), 10) || 30;
            if (typeof time !== 'number' || isNaN(time)) time = 30;
            formData.append('cookingTime', time);

            let serv = recipe.servings;
            if (typeof serv === 'string') serv = parseInt(serv.replace(/\D/g, ''), 10) || 2;
            if (typeof serv !== 'number' || isNaN(serv)) serv = 2;
            formData.append('servings', serv);

            formData.append('ingredients', JSON.stringify(Array.isArray(recipe.ingredients) ? recipe.ingredients : []));
            formData.append('instructions', JSON.stringify(Array.isArray(recipe.instructions) ? recipe.instructions : []));
            formData.append('image', selectedImage);

            await API.post('/recipes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success("Recipe created successfully! 🎉");
            navigate("/");
        } catch (error) {
            console.error("[Create Recipe Error]", error);
            toast.error(error.response?.data?.message || "Failed to create recipe. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    const sendMessage = async (text) => {
        if (!text || !text.trim() || isTyping) return;

        const userMessage = { sender: "user", text: text.trim() };
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        // Cancel any ongoing request
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const { data } = await API.post("/ai/chat", {
                message: text.trim(),
                recipe: recipe || {},
            }, { signal: controller.signal });

            // Update recipe state on any non-invalid response
            if (data.type !== "invalid" && data.recipe) {
                // Only replace recipe.image with placeholder — never store base64 in recipe state
                const updatedRecipe = { ...data.recipe };
                if (
                    updatedRecipe.image &&
                    typeof updatedRecipe.image === "string" &&
                    updatedRecipe.image.length > 500
                ) {
                    updatedRecipe.image = "uploaded_image_placeholder";
                }
                setRecipe(updatedRecipe);
            }

            setMessages(prev => [
                ...prev,
                {
                    sender: "ai",
                    text: data.reply || "I'm ready to help!",
                    action: data.action || "ask_text",
                },
            ]);
        } catch (error) {
            if (error.name === "CanceledError" || error.name === "AbortError") return;

            console.error("[Send Message Error]", error);
            const errMsg =
                error.response?.data?.message ||
                (error.message?.includes("timeout") ? "Request timed out. Please try again." : "Something went wrong. Please try again.");

            setMessages(prev => [
                ...prev,
                { sender: "ai", text: errMsg, action: "ask_text" },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleCategorySelect = (catName) => {
        sendMessage(`I choose the category: ${catName}`);
    };

    const handleDifficultySelect = (diffName) => {
        sendMessage(`I choose the difficulty: ${diffName}`);
    };

    const handleImageSelect = (file) => {
        if (!file) return;
        setSelectedImage(file);
        // Update recipe state with placeholder only — never base64
        setRecipe(prev => ({ ...(prev || {}), image: "uploaded_image_placeholder" }));
        sendMessage("I have uploaded the recipe image.");
    };

    return (
        <div className="min-h-screen bg-bgLight px-4 md:px-6 py-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-white p-3 rounded-2xl shadow-lg">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-textDark">
                            AI Recipe Studio
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Describe, create, and edit recipes using AI.
                        </p>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat Panel */}
                <ChatWindow
                    messages={messages}
                    sendMessage={sendMessage}
                    isTyping={isTyping}
                    categories={CATEGORIES}
                    difficulties={DIFFICULTIES}
                    handleCreateRecipe={handleCreateRecipe}
                    isCreating={isCreating}
                    handleCategorySelect={handleCategorySelect}
                    handleDifficultySelect={handleDifficultySelect}
                    setSelectedImage={handleImageSelect}
                />

                {/* Recipe Preview Panel */}
                <RecipePreview
                    recipe={recipe}
                    onCreateRecipe={handleCreateRecipe}
                    isCreating={isCreating}
                    selectedImage={selectedImage}
                    setSelectedImage={handleImageSelect}
                    categories={CATEGORIES}
                    selectedCategory={recipe?.category || ""}
                    setSelectedCategory={(cat) => setRecipe(prev => ({ ...(prev || {}), category: cat }))}
                />
            </div>
        </div>
    );
};

export default AIRecipeStudio;
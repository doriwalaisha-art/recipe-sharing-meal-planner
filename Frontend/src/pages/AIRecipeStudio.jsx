import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Bot, User, CornerDownLeft, RotateCcw, Save, Play, Check, RefreshCw } from "lucide-react";
import API from "../api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const STEPS = [
    { key: "title", question: "What is the name of the recipe you want to create?", placeholder: "e.g., Paneer Butter Masala", chips: ["Butter Chicken", "Masala Dosa", "Veg Biryani", "Pasta Carbonara"] },
    { key: "foodType", question: "What type of food is this?", chips: ["Veg", "Non-Veg", "Vegan", "Jain"] },
    { key: "category", question: "Which meal category does it belong to?", chips: ["Breakfast", "Lunch", "Dinner", "Snacks", "Dessert"] },
    { key: "cuisine", question: "What is the cuisine?", chips: ["Indian", "Italian", "Chinese", "Mexican", "Thai"] },
    { key: "cookingTime", question: "What is the estimated cooking time (in minutes)?", placeholder: "e.g., 30", chips: ["15", "30", "45", "60"] },
    { key: "servings", question: "How many servings?", placeholder: "e.g., 2", chips: ["1", "2", "4", "6"] },
    { key: "difficulty", question: "Select the difficulty level:", chips: ["Easy", "Medium", "Hard"] },
    { key: "spiceLevel", question: "What is the spice level?", chips: ["Mild", "Medium", "Hot", "Extra Hot"] },
    { key: "notes", question: "Any special notes, diet restrictions, or preferences? (or write 'None')", placeholder: "e.g., Gluten-free, extra garlic...", chips: ["None", "Gluten-free", "Dairy-free", "Less oil"] }
];

const LOADING_MESSAGES = [
    "Thinking...",
    "Finding best ingredients...",
    "Creating cooking instructions...",
    "Calculating nutrition...",
    "Adding chef tips...",
    "Preparing your recipe...",
    "Almost Done..."
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800";

const AIRecipeStudio = () => {
    const navigate = useNavigate();
    
    // Conversation State
    const [started, setStarted] = useState(() => {
        return localStorage.getItem("ai_studio_started") === "true";
    });
    const [currentStepIndex, setCurrentStepIndex] = useState(() => {
        return parseInt(localStorage.getItem("ai_studio_step") || "0");
    });
    const [recipeDraft, setRecipeDraft] = useState(() => {
        const saved = localStorage.getItem("ai_studio_draft");
        return saved ? JSON.parse(saved) : {
            title: "", foodType: "", category: "", cuisine: "",
            cookingTime: "", servings: "", difficulty: "", spiceLevel: "", notes: ""
        };
    });
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem("ai_studio_messages");
        if (saved) return JSON.parse(saved);
        return [
            { sender: "ai", text: "🤖 Welcome to AI Recipe Studio! I will guide you step-by-step to create a premium recipe. Let's start! What is the name of your dish?" }
        ];
    });

    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [generatedRecipe, setGeneratedRecipe] = useState(() => {
        const saved = localStorage.getItem("ai_studio_recipe");
        return saved ? JSON.parse(saved) : null;
    });

    // Loading Screen state
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
    const [successCreated, setSuccessCreated] = useState(false);
    const [createdRecipeId, setCreatedRecipeId] = useState(null);

    // Edit prompt state
    const [editPrompt, setEditPrompt] = useState("");

    const chatEndRef = useRef(null);

    // Persist State to LocalStorage
    useEffect(() => {
        localStorage.setItem("ai_studio_started", started);
        localStorage.setItem("ai_studio_step", currentStepIndex);
        localStorage.setItem("ai_studio_draft", JSON.stringify(recipeDraft));
        localStorage.setItem("ai_studio_messages", JSON.stringify(messages));
        if (generatedRecipe) {
            localStorage.setItem("ai_studio_recipe", JSON.stringify(generatedRecipe));
        } else {
            localStorage.removeItem("ai_studio_recipe");
        }
    }, [started, currentStepIndex, recipeDraft, messages, generatedRecipe]);

    // Auto Scroll Chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Loading message rotation
    useEffect(() => {
        let interval;
        if (isTyping && currentStepIndex >= STEPS.length) {
            interval = setInterval(() => {
                setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isTyping, currentStepIndex]);

    const handleStart = () => {
        setStarted(true);
    };

    const handleSend = async (val) => {
        const text = val || inputText;
        if (!text.trim()) return;

        // User message
        const updatedMessages = [...messages, { sender: "user", text }];
        setMessages(updatedMessages);
        setInputText("");

        const currentStep = STEPS[currentStepIndex];
        const nextDraft = { ...recipeDraft, [currentStep.key]: text };
        setRecipeDraft(nextDraft);

        if (currentStepIndex < STEPS.length - 1) {
            const nextStepIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextStepIndex);
            setMessages((prev) => [
                ...prev,
                { sender: "ai", text: STEPS[nextStepIndex].question }
            ]);
        } else {
            // All steps finished -> Generate Recipe
            setIsTyping(true);
            setCurrentStepIndex(STEPS.length); // Final loading stage
            try {
                const response = await API.post("/ai/chat", {
                    action: "generate",
                    recipeDraft: nextDraft
                });
                if (response.data?.success && response.data?.recipe) {
                    setGeneratedRecipe(response.data.recipe);
                    setMessages((prev) => [
                        ...prev,
                        { sender: "ai", text: "✨ Ta-da! Your recipe has been generated successfully! Review the details in the preview panel below." }
                    ]);
                } else {
                    throw new Error("Failed to generate recipe");
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to generate recipe. Please try again.");
                // Reset step back to notes to allow retry
                setCurrentStepIndex(STEPS.length - 1);
            } finally {
                setIsTyping(false);
            }
        }
    };

    const handleUndo = () => {
        if (currentStepIndex === 0) return;
        const targetStepIndex = currentStepIndex - 1;
        setCurrentStepIndex(targetStepIndex);
        
        // Remove the last user message and the last AI response
        const newMessages = [...messages];
        while (newMessages.length > 0 && newMessages[newMessages.length - 1].sender !== "user") {
            newMessages.pop();
        }
        if (newMessages.length > 0) newMessages.pop(); // Remove the user response
        
        setMessages([
            ...newMessages,
            { sender: "ai", text: STEPS[targetStepIndex].question }
        ]);
    };

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset the conversation and start over?")) {
            localStorage.removeItem("ai_studio_started");
            localStorage.removeItem("ai_studio_step");
            localStorage.removeItem("ai_studio_draft");
            localStorage.removeItem("ai_studio_messages");
            localStorage.removeItem("ai_studio_recipe");
            setStarted(false);
            setCurrentStepIndex(0);
            setRecipeDraft({
                title: "", foodType: "", category: "", cuisine: "",
                cookingTime: "", servings: "", difficulty: "", spiceLevel: "", notes: ""
            });
            setMessages([
                { sender: "ai", text: "🤖 Welcome to AI Recipe Studio! I will guide you step-by-step to create a premium recipe. Let's start! What is the name of your dish?" }
            ]);
            setGeneratedRecipe(null);
            setSuccessCreated(false);
        }
    };

    // Conversational edits or regenerations
    const handleConversationalEdit = async () => {
        if (!editPrompt.trim()) return;
        setIsTyping(true);
        const userPrompt = editPrompt;
        setEditPrompt("");
        
        setMessages((prev) => [...prev, { sender: "user", text: userPrompt }]);

        try {
            const response = await API.post("/ai/chat", {
                action: "edit",
                currentRecipe: generatedRecipe,
                instruction: userPrompt
            });
            if (response.data?.success && response.data?.recipe) {
                setGeneratedRecipe(response.data.recipe);
                setMessages((prev) => [
                    ...prev,
                    { sender: "ai", text: `I have updated the recipe based on: "${userPrompt}"` }
                ]);
            }
        } catch (error) {
            toast.error("Failed to edit recipe. Please try again.");
        } finally {
            setIsTyping(false);
        }
    };

    const handleVariation = async (style) => {
        setIsTyping(true);
        try {
            const response = await API.post("/ai/chat", {
                action: "variation",
                currentRecipe: generatedRecipe,
                variation: style
            });
            if (response.data?.success && response.data?.recipe) {
                setGeneratedRecipe(response.data.recipe);
                setMessages((prev) => [
                    ...prev,
                    { sender: "ai", text: `Here is the ${style} variation of your recipe!` }
                ]);
            }
        } catch (error) {
            toast.error("Failed to apply variation.");
        } finally {
            setIsTyping(false);
        }
    };

    const handleRegenerateField = async (field) => {
        setIsTyping(true);
        try {
            const response = await API.post("/ai/chat", {
                action: "regenerate_field",
                currentRecipe: generatedRecipe,
                fieldToRegenerate: field
            });
            if (response.data?.success && response.data?.recipe) {
                setGeneratedRecipe(response.data.recipe);
                setMessages((prev) => [
                    ...prev,
                    { sender: "ai", text: `Regenerated ${field} successfully!` }
                ]);
            }
        } catch (error) {
            toast.error("Failed to regenerate.");
        } finally {
            setIsTyping(false);
        }
    };

    // Save recipe to DB
    const handleSaveRecipe = async () => {
        if (isCreatingRecipe) return;
        setIsCreatingRecipe(true);

        try {
            const recipeData = {
                title: generatedRecipe.title,
                description: generatedRecipe.description || "Delightful AI generated recipe.",
                category: generatedRecipe.category || recipeDraft.category || "Dinner",
                difficulty: generatedRecipe.difficulty || recipeDraft.difficulty || "Medium",
                cookingTime: parseInt(generatedRecipe.cookingTime) || 30,
                servings: parseInt(generatedRecipe.servings) || 2,
                ingredients: JSON.stringify(generatedRecipe.ingredients),
                instructions: JSON.stringify(generatedRecipe.instructions),
                image: DEFAULT_IMAGE
            };

            const response = await API.post("/recipes", recipeData);
            if (response.data?._id) {
                setCreatedRecipeId(response.data._id);
                setSuccessCreated(true);
                toast.success("Recipe Saved Successfully!");
                
                localStorage.removeItem("ai_studio_started");
                localStorage.removeItem("ai_studio_step");
                localStorage.removeItem("ai_studio_draft");
                localStorage.removeItem("ai_studio_messages");
                localStorage.removeItem("ai_studio_recipe");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save recipe to database.");
        } finally {
            setIsCreatingRecipe(false);
        }
    };

    // Welcome Screen
    if (!started) {
        return (
            <div className="min-h-screen bg-bgLight flex items-center justify-center px-4 py-10">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-orange-100 text-center transform transition duration-500 hover:scale-[1.01]">
                    <div className="bg-gradient-to-br from-primary to-secondary w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20 text-white">
                        <Bot size={40} className="animate-bounce" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-textDark mb-2">
                        🤖 AI Recipe Studio
                    </h1>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Welcome! I will help you craft a premium, customized cooking recipe step-by-step in less than one minute.
                    </p>
                    <button
                        onClick={handleStart}
                        className="w-full py-4 bg-primary hover:bg-secondary text-white font-bold rounded-2xl transition duration-300 shadow-md flex justify-center items-center gap-2 group"
                    >
                        <Play size={18} className="group-hover:translate-x-1 transition" /> Start Studio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bgLight py-8 px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-xl">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-textDark">AI Recipe Studio</h2>
                            <p className="text-xs text-gray-400">Step-by-step Chef Intelligence</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleReset}
                        className="text-xs text-red-500 hover:text-red-600 border border-red-100 hover:border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition font-medium"
                    >
                        <RotateCcw size={12} /> Reset Draft
                    </button>
                </div>

                {/* Main Studio View */}
                {!generatedRecipe ? (
                    // 1. Conversation Mode
                    <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden flex flex-col h-[70vh]">
                        {/* Progress Bar */}
                        <div className="bg-orange-50/30 px-6 py-3 border-b border-orange-100/50 flex justify-between items-center">
                            <span className="text-xs font-semibold text-primary">
                                Progress: Step {Math.min(currentStepIndex + 1, STEPS.length)} of {STEPS.length}
                            </span>
                            <div className="w-1/2 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-300"
                                    style={{ width: `${(Math.min(currentStepIndex + 1, STEPS.length) / STEPS.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Chat Messages Panel */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                            {messages.map((m, idx) => (
                                <div key={idx} className={`flex gap-3 ${m.sender === "user" ? "justify-end" : ""}`}>
                                    {m.sender === "ai" && (
                                        <div className="bg-primary text-white w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-md">
                                            <Bot size={16} />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                            m.sender === "user"
                                                ? "bg-primary text-white rounded-tr-none"
                                                : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200/55"
                                        }`}
                                    >
                                        {m.text}
                                    </div>
                                    {m.sender === "user" && (
                                        <div className="bg-gray-200 text-gray-700 w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center">
                                            <User size={16} />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Typing / Generating Loader */}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="bg-primary text-white w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center animate-pulse">
                                        <Bot size={16} />
                                    </div>
                                    <div className="bg-gray-100 rounded-2xl px-5 py-4 w-64 shadow-sm border border-orange-50/50 flex flex-col gap-2">
                                        <span className="text-xs text-primary font-bold animate-pulse">
                                            {LOADING_MESSAGES[loadingMessageIndex]}
                                        </span>
                                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary animate-[shimmer_1.5s_infinite] w-1/3" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Sticky Input / Choice chips */}
                        <div className="border-t border-orange-100 p-4 bg-white">
                            {/* Choices Chips */}
                            {!isTyping && currentStepIndex < STEPS.length && STEPS[currentStepIndex].chips && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {STEPS[currentStepIndex].chips.map((chip) => (
                                        <button
                                            key={chip}
                                            onClick={() => handleSend(chip)}
                                            className="px-3.5 py-1.5 bg-orange-50/60 border border-orange-100/50 text-primary rounded-full text-xs font-semibold hover:bg-primary hover:text-white hover:border-primary transition duration-300 shadow-sm"
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                    {currentStepIndex > 0 && (
                                        <button
                                            onClick={handleUndo}
                                            className="px-3.5 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold hover:bg-gray-200 transition flex items-center gap-1"
                                        >
                                            <RotateCcw size={10} /> Undo
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Text Input Box */}
                            {!isTyping && currentStepIndex < STEPS.length && (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder={STEPS[currentStepIndex].placeholder || "Type your answer..."}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        className="flex-1 border border-orange-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition text-textDark bg-orange-50/10"
                                    />
                                    <button
                                        onClick={() => handleSend()}
                                        className="bg-primary hover:bg-secondary text-white px-5 rounded-xl transition duration-300 shadow-sm flex items-center justify-center"
                                    >
                                        <CornerDownLeft size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // 2. Preview Panel / Custom Refinement Mode
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Recipe Preview (Left) */}
                        <div className="lg:col-span-8 space-y-6">
                            {!successCreated ? (
                                <div className="bg-white rounded-3xl p-6 shadow-xl border border-orange-100 space-y-6">
                                    <div className="flex justify-between items-start border-b pb-4">
                                        <div>
                                            <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                                                {generatedRecipe.difficulty} • {recipeDraft.foodType || "Veg"}
                                            </span>
                                            <h2 className="text-3xl font-extrabold text-textDark mt-2">
                                                {generatedRecipe.title}
                                            </h2>
                                            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                                {generatedRecipe.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-3 text-center">
                                        <div className="bg-bgLight p-3 rounded-2xl border border-orange-100/50">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Cook Time</p>
                                            <p className="font-extrabold text-sm text-textDark">{generatedRecipe.cookingTime} Min</p>
                                        </div>
                                        <div className="bg-bgLight p-3 rounded-2xl border border-orange-100/50">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Servings</p>
                                            <p className="font-extrabold text-sm text-textDark">{generatedRecipe.servings}</p>
                                        </div>
                                        <div className="bg-bgLight p-3 rounded-2xl border border-orange-100/50">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Calories</p>
                                            <p className="font-extrabold text-sm text-textDark">{generatedRecipe.estimatedCalories || "—"}</p>
                                        </div>
                                        <div className="bg-bgLight p-3 rounded-2xl border border-orange-100/50">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Category</p>
                                            <p className="font-extrabold text-sm text-textDark capitalize">{recipeDraft.category || "Dinner"}</p>
                                        </div>
                                    </div>

                                    {/* Ingredients */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-lg text-textDark flex items-center gap-2">
                                                🥕 Ingredients
                                            </h4>
                                            <button
                                                onClick={() => handleRegenerateField("ingredients")}
                                                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                                            >
                                                <RefreshCw size={10} /> Regenerate
                                            </button>
                                        </div>
                                        <ul className="grid md:grid-cols-2 gap-2">
                                            {generatedRecipe.ingredients?.map((ing, i) => (
                                                <li key={i} className="bg-bgLight px-4 py-2.5 rounded-xl border border-orange-100/30 text-sm text-gray-700">
                                                    • {ing}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Instructions */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-lg text-textDark flex items-center gap-2">
                                                👨‍🍳 Step-by-Step Instructions
                                            </h4>
                                            <button
                                                onClick={() => handleRegenerateField("instructions")}
                                                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                                            >
                                                <RefreshCw size={10} /> Regenerate
                                            </button>
                                        </div>
                                        <ol className="space-y-3">
                                            {generatedRecipe.instructions?.map((inst, i) => (
                                                <li key={i} className="flex gap-3 items-start">
                                                    <span className="w-6 h-6 bg-primary/10 text-primary font-extrabold rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                                        {i + 1}
                                                    </span>
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        {inst}
                                                    </p>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>

                                    {/* Chef Tips */}
                                    {generatedRecipe.tips?.length > 0 && (
                                        <div>
                                            <h4 className="font-bold text-lg text-textDark mb-2 flex items-center gap-2">
                                                💡 Chef Tips & Suggestions
                                            </h4>
                                            <ul className="space-y-1.5 list-disc pl-5 text-sm text-gray-600">
                                                {generatedRecipe.tips.map((t, idx) => (
                                                    <li key={idx}>{t}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Nutrition Summary */}
                                    {generatedRecipe.nutrition && (
                                        <div>
                                            <h4 className="font-bold text-lg text-textDark mb-3">
                                                📊 Nutrition Facts
                                            </h4>
                                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                                <div className="border border-orange-100 p-2.5 rounded-xl bg-bgLight">
                                                    <p className="text-gray-400">Protein</p>
                                                    <p className="font-bold text-textDark mt-0.5">{generatedRecipe.nutrition.protein || "—"}</p>
                                                </div>
                                                <div className="border border-orange-100 p-2.5 rounded-xl bg-bgLight">
                                                    <p className="text-gray-400">Carbs</p>
                                                    <p className="font-bold text-textDark mt-0.5">{generatedRecipe.nutrition.carbs || "—"}</p>
                                                </div>
                                                <div className="border border-orange-100 p-2.5 rounded-xl bg-bgLight">
                                                    <p className="text-gray-400">Fat</p>
                                                    <p className="font-bold text-textDark mt-0.5">{generatedRecipe.nutrition.fat || "—"}</p>
                                                </div>
                                                <div className="border border-orange-100 p-2.5 rounded-xl bg-bgLight">
                                                    <p className="text-gray-400">Fiber</p>
                                                    <p className="font-bold text-textDark mt-0.5">{generatedRecipe.nutrition.fiber || "—"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recipe Tags */}
                                    {generatedRecipe.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-orange-50">
                                            {generatedRecipe.tags.map((t) => (
                                                <span key={t} className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-500">
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Save Recipe Button */}
                                    <div className="pt-4 border-t border-orange-50">
                                        <button
                                            onClick={handleSaveRecipe}
                                            disabled={isCreatingRecipe}
                                            className="w-full bg-primary hover:bg-secondary disabled:bg-gray-300 text-white py-3.5 rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-md"
                                        >
                                            <Save size={18} /> {isCreatingRecipe ? "Saving Recipe..." : "Save Recipe to My Account"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Creation Success Panel
                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100 text-center flex flex-col justify-center items-center h-[55vh]">
                                    <div className="bg-green-50 text-green-500 w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
                                        <Check size={32} />
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-textDark mb-2">
                                        Recipe Created Successfully! 🎉
                                    </h2>
                                    <p className="text-gray-400 max-w-sm text-sm mb-8 leading-relaxed">
                                        Your custom AI-generated recipe is now stored in your cookbook. You can view it or head back home.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                                        <button
                                            onClick={() => navigate(`/recipe/${createdRecipeId}`)}
                                            className="w-full sm:flex-1 py-3.5 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-sm transition"
                                        >
                                            View Recipe
                                        </button>
                                        <button
                                            onClick={() => navigate("/")}
                                            className="w-full sm:flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl shadow-sm transition"
                                        >
                                            Back Home
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interactive Editor panel (Right) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Variations Panel */}
                            {!successCreated && (
                                <div className="bg-white rounded-3xl p-5 shadow-xl border border-orange-100 space-y-4">
                                    <h4 className="font-extrabold text-sm text-textDark uppercase tracking-wider flex items-center gap-1.5">
                                        🎨 Instant Variations
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {["Restaurant Style", "Dhaba Style", "Healthy", "Low Oil", "High Protein", "Jain Version"].map((v) => (
                                            <button
                                                key={v}
                                                onClick={() => handleVariation(v)}
                                                disabled={isTyping}
                                                className="py-2.5 border border-gray-200 hover:border-primary text-gray-700 rounded-xl transition duration-300 font-semibold hover:bg-orange-50/30"
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Chat Refiner / Editor */}
                            {!successCreated && (
                                <div className="bg-white rounded-3xl p-5 shadow-xl border border-orange-100 space-y-4">
                                    <h4 className="font-extrabold text-sm text-textDark uppercase tracking-wider flex items-center gap-1.5">
                                        💬 Conversational Editor
                                    </h4>
                                    <p className="text-xs text-gray-400">
                                        Type instructions like "Make it spicy", "Substitute cream with milk", or "Reduce sugar".
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editPrompt}
                                            onChange={(e) => setEditPrompt(e.target.value)}
                                            placeholder="Ask to adjust anything..."
                                            disabled={isTyping}
                                            onKeyDown={(e) => e.key === "Enter" && handleConversationalEdit()}
                                            className="flex-1 border border-orange-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary transition bg-orange-50/10 text-textDark"
                                        />
                                        <button
                                            onClick={handleConversationalEdit}
                                            disabled={isTyping || !editPrompt.trim()}
                                            className="bg-primary hover:bg-secondary text-white px-3.5 rounded-xl transition shadow-sm flex items-center justify-center disabled:bg-gray-300"
                                        >
                                            <CornerDownLeft size={14} />
                                        </button>
                                    </div>
                                    
                                    {/* Mini status indicator */}
                                    {isTyping && (
                                        <div className="flex items-center gap-2 text-xs text-primary font-bold animate-pulse justify-center">
                                            <RefreshCw size={12} className="animate-spin" /> Adjusting recipe...
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Chat history logs */}
                            <div className="bg-white rounded-3xl p-5 shadow-xl border border-orange-100 max-h-[30vh] overflow-y-auto space-y-2">
                                <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">
                                    📜 Chat Log
                                </h4>
                                <div className="space-y-2">
                                    {messages.map((m, idx) => (
                                        <div key={idx} className="text-xs leading-relaxed text-gray-500 border-b border-orange-50/30 pb-2 last:border-b-0">
                                            <strong className="capitalize">{m.sender}: </strong> {m.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AIRecipeStudio;

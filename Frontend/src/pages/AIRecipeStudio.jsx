import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Bot, User, CornerDownLeft, RotateCcw, Save, Play, Check, RefreshCw, Upload } from "lucide-react";
import API from "../api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const STEPS = [
    { key: "title", question: "What is the name of the recipe you want to create?", placeholder: "e.g., Paneer Butter Masala", chips: ["Butter Chicken", "Masala Dosa", "Veg Biryani", "Pasta Carbonara"] },
    { key: "description", question: "Describe this recipe, or let me generate a description for you:", placeholder: "Enter a brief description...", chips: ["Generate Description"] },
    { key: "category", question: "Select the Category for your recipe:", chips: ['Breakfast','Brunch','Lunch','Snacks','Dinner','Dessert','Beverages','Salad','Soup','Vegetarian','Non-Vegetarian','Vegan','Healthy','High-Protein','Quick Meals','Jain'] },
    { key: "cookingTime", question: "What is the estimated cooking time (in minutes)?", placeholder: "e.g., 30", chips: ["15", "30", "45", "60"] },
    { key: "servings", question: "How many servings?", placeholder: "e.g., 2", chips: ["1", "2", "4", "6"] },
    { key: "difficulty", question: "Select the difficulty level:", chips: ["Easy", "Medium", "Hard"] },
    { key: "ingredients", question: "Provide the list of ingredients (separated by commas), or let me generate them:", placeholder: "e.g., 200g Paneer, 2 tomatoes, 1 onion...", chips: ["Generate Ingredients"] },
    { key: "instructions", question: "Provide step-by-step instructions (separated by commas or dots), or let me generate them:", placeholder: "e.g., Cut paneer, Saute tomatoes, Add spices...", chips: ["Generate Instructions"] },
    { key: "image", question: "Please upload an image for your recipe:", chips: [] } // Image upload step
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
            title: "", description: "", category: "", cookingTime: "", servings: "", difficulty: "", ingredients: "", instructions: ""
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

    // Image file state
    const [selectedImage, setSelectedImage] = useState(null);
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
    const [successCreated, setSuccessCreated] = useState(false);

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

    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const handleStart = () => {
        setStarted(true);
    };

    const handleSend = async (val) => {
        const text = val || inputText;
        if (!text.trim()) return;

        let userMessageText = text;
        let valueToSave = text;

        const currentStep = STEPS[currentStepIndex];

        if (text === "Generate Description") {
            userMessageText = "Please generate the description for me.";
            valueToSave = "__generate__";
        } else if (text === "Generate Ingredients") {
            userMessageText = "Please generate the ingredients for me.";
            valueToSave = "__generate__";
        } else if (text === "Generate Instructions") {
            userMessageText = "Please generate the instructions for me.";
            valueToSave = "__generate__";
        }

        const updatedMessages = [...messages, { sender: "user", text: userMessageText }];
        setMessages(updatedMessages);
        setInputText("");

        const nextDraft = { ...recipeDraft, [currentStep.key]: valueToSave };
        setRecipeDraft(nextDraft);

        if (currentStepIndex < STEPS.length - 1) {
            const nextStepIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextStepIndex);
            setMessages((prev) => [
                ...prev,
                { sender: "ai", text: STEPS[nextStepIndex].question }
            ]);
        }
    };

    // Special Image selection handler
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedImage(file);
        const updatedMessages = [...messages, { sender: "user", text: `📸 Uploaded image: ${file.name}` }];
        setMessages(updatedMessages);

        // Move to generation stage
        const nextStepIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextStepIndex);
        triggerGeneration(recipeDraft);
    };

    const triggerGeneration = async (draft) => {
        setIsTyping(true);
        try {
            const response = await API.post("/ai/chat", {
                action: "generate",
                recipeDraft: draft
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
            const errMsg = error.response?.data?.message || error.message || "Failed to generate recipe.";
            toast.error(`Generation Error: ${errMsg}`);
            setCurrentStepIndex(STEPS.length - 2); // Go back to instructions step to allow retry
        } finally {
            setIsTyping(false);
        }
    };

    const handleUndo = () => {
        if (currentStepIndex === 0) return;
        const targetStepIndex = currentStepIndex - 1;
        setCurrentStepIndex(targetStepIndex);
        
        const newMessages = [...messages];
        while (newMessages.length > 0 && newMessages[newMessages.length - 1].sender !== "user") {
            newMessages.pop();
        }
        if (newMessages.length > 0) newMessages.pop();
        
        setMessages([
            ...newMessages,
            { sender: "ai", text: STEPS[targetStepIndex].question }
        ]);
        if (targetStepIndex === STEPS.length - 1) {
            setSelectedImage(null);
        }
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
                title: "", description: "", category: "", cookingTime: "", servings: "", difficulty: "", ingredients: "", instructions: ""
            });
            setSelectedImage(null);
            setMessages([
                { sender: "ai", text: "🤖 Welcome to AI Recipe Studio! I will guide you step-by-step to create a premium recipe. Let's start! What is the name of your dish?" }
            ]);
            setGeneratedRecipe(null);
            setSuccessCreated(false);
        }
    };

    // Conversational edits
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
            console.error(error);
            const errMsg = error.response?.data?.message || error.message || "Failed to edit recipe.";
            toast.error(`Edit Error: ${errMsg}`);
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
            console.error(error);
            const errMsg = error.response?.data?.message || error.message || "Failed to apply variation.";
            toast.error(`Variation Error: ${errMsg}`);
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
            console.error(error);
            const errMsg = error.response?.data?.message || error.message || "Failed to regenerate.";
            toast.error(`Regenerate Error: ${errMsg}`);
        } finally {
            setIsTyping(false);
        }
    };

    // Save recipe to DB using FormData
    const handleSaveRecipe = async () => {
        if (isCreatingRecipe) return;
        setIsCreatingRecipe(true);

        try {
            const formData = new FormData();
            formData.append("title", generatedRecipe.title);
            formData.append("description", generatedRecipe.description || "Delightful AI generated recipe.");
            formData.append("category", generatedRecipe.category || recipeDraft.category || "Dinner");
            formData.append("difficulty", generatedRecipe.difficulty || recipeDraft.difficulty || "Medium");
            
            let time = parseInt(generatedRecipe.cookingTime);
            if (isNaN(time)) time = 30;
            formData.append("cookingTime", time);

            let serv = parseInt(generatedRecipe.servings);
            if (isNaN(serv)) serv = 2;
            formData.append("servings", serv);

            formData.append("ingredients", JSON.stringify(generatedRecipe.ingredients));
            formData.append("instructions", JSON.stringify(generatedRecipe.instructions));
            
            if (selectedImage) {
                formData.append("image", selectedImage);
            }

            const response = await API.post("/recipes", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (response.data?._id) {
                setSuccessCreated(true);
                toast.success("Recipe Saved Successfully! 🎉");
                
                // Clear local storage
                localStorage.removeItem("ai_studio_started");
                localStorage.removeItem("ai_studio_step");
                localStorage.removeItem("ai_studio_draft");
                localStorage.removeItem("ai_studio_messages");
                localStorage.removeItem("ai_studio_recipe");

                // Auto redirect to Home Page to show the new recipe
                setTimeout(() => {
                    navigate("/");
                }, 1500);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save recipe to database.");
        } finally {
            setIsCreatingRecipe(false);
        }
    };

    const imagePreviewUrl = selectedImage ? URL.createObjectURL(selectedImage) : null;

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
                            
                            {/* Image Upload box if it is the image step */}
                            {!isTyping && currentStepIndex < STEPS.length && STEPS[currentStepIndex].key === "image" ? (
                                <div className="flex flex-col gap-2 items-center justify-center py-4 border-2 border-dashed border-orange-200 rounded-2xl bg-orange-50/5">
                                    <label className="cursor-pointer bg-primary hover:bg-secondary text-white font-bold px-6 py-3 rounded-xl transition duration-300 shadow-sm flex items-center gap-2">
                                        <Upload size={16} /> Upload Recipe Image File
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageSelect}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-400">Supported formats: JPG, PNG, WEBP (Max 5MB)</p>
                                </div>
                            ) : (
                                <>
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
                                </>
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
                                                {generatedRecipe.difficulty} • {recipeDraft.category || "Dinner"}
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

                                    {/* Recipe Image Preview */}
                                    {imagePreviewUrl && (
                                        <div>
                                            <h4 className="font-bold text-lg text-textDark mb-2">📸 Selected Recipe Image</h4>
                                            <img
                                                src={imagePreviewUrl}
                                                alt="Uploaded preview"
                                                className="w-full h-64 object-cover rounded-2xl border border-orange-100"
                                            />
                                        </div>
                                    )}

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
                                        Recipe Saved Successfully! 🎉
                                    </h2>
                                    <p className="text-gray-400 max-w-sm text-sm mb-8 leading-relaxed">
                                        Redirecting to the homepage so you can see your recipe listed...
                                    </p>
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

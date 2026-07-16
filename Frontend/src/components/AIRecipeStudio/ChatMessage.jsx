import { Bot, User, UploadCloud, Loader2 } from "lucide-react";

const ChatMessage = ({
    message,
    isLatest,
    categories,
    difficulties,
    handleCreateRecipe,
    isCreating,
    setSelectedImage,
    handleCategorySelect,
    handleDifficultySelect,
}) => {
    const isAI = message.sender === "ai";

    // Action buttons only show on the LATEST AI message to prevent re-clicking old ones
    const showActions = isAI && isLatest;

    return (
        <div className={`flex gap-3 mb-5 ${isAI ? "" : "justify-end"}`}>
            {isAI && (
                <div className="bg-primary text-white h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center">
                    <Bot size={18} />
                </div>
            )}

            <div
                className={`max-w-md rounded-2xl px-4 py-3 ${
                    isAI ? "bg-gray-100 text-gray-800" : "bg-primary text-white"
                }`}
            >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>

                {/* Category selection — only on latest message */}
                {showActions && message.action === "ask_category" && categories && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {categories.map((c) => (
                            <button
                                key={c._id}
                                onClick={() => handleCategorySelect(c.name)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:border-primary hover:text-primary shadow-sm transition"
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Difficulty selection — only on latest message */}
                {showActions && message.action === "ask_difficulty" && difficulties && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {difficulties.map((d) => (
                            <button
                                key={d._id}
                                onClick={() => handleDifficultySelect(d.name)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-primary hover:text-primary shadow-sm transition"
                            >
                                {d.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Image upload — only on latest message */}
                {showActions && message.action === "ask_image" && (
                    <div className="mt-4">
                        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition group">
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files[0]) setSelectedImage(e.target.files[0]);
                                }}
                            />
                            <div className="flex flex-col items-center">
                                <UploadCloud className="text-gray-400 group-hover:text-primary mb-2" size={24} />
                                <span className="text-sm font-medium text-gray-600">
                                    Click to upload image
                                </span>
                            </div>
                        </label>
                    </div>
                )}

                {/* Create Recipe button — only on latest message */}
                {showActions && message.action === "ready" && (
                    <div className="mt-4">
                        <button
                            onClick={handleCreateRecipe}
                            disabled={isCreating}
                            className={`w-full py-2.5 rounded-xl font-bold shadow-md transition flex justify-center items-center gap-2 ${
                                isCreating
                                    ? "bg-gray-400 cursor-not-allowed text-white"
                                    : "bg-primary text-white hover:bg-[#a61545]"
                            }`}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "🍽 Create Recipe"
                            )}
                        </button>
                    </div>
                )}
            </div>

            {!isAI && (
                <div className="bg-gray-300 h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center">
                    <User size={18} />
                </div>
            )}
        </div>
    );
};

export default ChatMessage;
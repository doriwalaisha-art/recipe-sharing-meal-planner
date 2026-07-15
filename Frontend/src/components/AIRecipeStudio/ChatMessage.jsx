import {Bot, User, UploadCloud} from "lucide-react";

const ChatMessage = ({ message, categories, handleCreateRecipe, setSelectedImage, handleCategorySelect }) => {
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
                <p className="whitespace-pre-wrap">{message.text}</p>
                
                {isAI && message.action === 'ask_category' && categories && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {categories.map(c => (
                            <button
                                key={c._id}
                                onClick={() => handleCategorySelect(c.name)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-primary hover:text-primary shadow-sm transition"
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}

                {isAI && message.action === 'ask_image' && (
                    <div className="mt-4">
                        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition group">
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                    if(e.target.files[0]) setSelectedImage(e.target.files[0]);
                                }}
                            />
                            <div className="flex flex-col items-center">
                                <UploadCloud className="text-gray-400 group-hover:text-primary mb-2" size={24} />
                                <span className="text-sm font-medium text-gray-600">Click to upload image</span>
                            </div>
                        </label>
                    </div>
                )}

                {isAI && message.action === 'ready' && (
                    <div className="mt-4">
                        <button
                            onClick={handleCreateRecipe}
                            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-[#a61545] transition flex justify-center items-center gap-2"
                        >
                            🍽 Create Recipe
                        </button>
                    </div>
                )}
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
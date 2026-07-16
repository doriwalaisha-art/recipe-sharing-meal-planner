import { ChefHat, Users, Clock, BarChart3, Loader2 } from "lucide-react";

const RecipePreview = ({
    recipe,
    onCreateRecipe,
    isCreating,
    selectedImage,
    setSelectedImage,
    categories,
    selectedCategory,
    setSelectedCategory,
}) => {
    if (!recipe) {
        return (
            <div className="bg-white rounded-3xl shadow-xl h-[78vh] flex items-center justify-center">
                <div className="text-center px-8">
                    <ChefHat className="mx-auto mb-4 text-primary opacity-40" size={60} />
                    <h2 className="text-2xl font-bold mb-2 text-gray-700">Live Recipe Preview</h2>
                    <p className="text-gray-400">
                        Start chatting with the AI and your recipe will appear here automatically.
                    </p>
                </div>
            </div>
        );
    }

    const imagePreviewUrl = selectedImage ? URL.createObjectURL(selectedImage) : null;
    const isReadyToCreate = recipe.category && selectedImage;

    return (
        <div className="bg-white rounded-3xl shadow-xl h-[78vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b p-5 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold">🍽 Live Recipe Preview</h2>
                <p className="text-gray-500 text-sm">AI updates this automatically as you chat.</p>
            </div>

            <div className="p-6 space-y-5">
                {/* Title & Description */}
                <div>
                    <h3 className="text-2xl font-bold text-textDark">
                        {recipe.title || <span className="text-gray-300 italic">Untitled Recipe</span>}
                    </h3>
                    {recipe.description && (
                        <p className="text-gray-500 mt-2 text-sm leading-relaxed">{recipe.description}</p>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-bgLight rounded-xl p-3 flex items-center gap-2">
                        <ChefHat className="text-primary flex-shrink-0" size={18} />
                        <div>
                            <p className="text-xs text-gray-500">Difficulty</p>
                            <p className="font-semibold text-sm">{recipe.difficulty || "—"}</p>
                        </div>
                    </div>
                    <div className="bg-bgLight rounded-xl p-3 flex items-center gap-2">
                        <Users className="text-primary flex-shrink-0" size={18} />
                        <div>
                            <p className="text-xs text-gray-500">Servings</p>
                            <p className="font-semibold text-sm">{recipe.servings || "—"}</p>
                        </div>
                    </div>
                    <div className="bg-bgLight rounded-xl p-3 flex items-center gap-2">
                        <Clock className="text-primary flex-shrink-0" size={18} />
                        <div>
                            <p className="text-xs text-gray-500">Cook Time</p>
                            <p className="font-semibold text-sm">
                                {recipe.cookingTime ? `${recipe.cookingTime} min` : "—"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Category selector */}
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Category *</label>
                    <select
                        value={selectedCategory || recipe.category || ""}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                        <option value="">Select Category</option>
                        {categories?.map((category) => (
                            <option key={category._id} value={category.name}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Image upload */}
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Recipe Image *</label>
                    <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition group">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files[0]) setSelectedImage(e.target.files[0]);
                            }}
                        />
                        <span className="text-sm text-gray-500 group-hover:text-primary transition">
                            {selectedImage ? "Change image" : "Click to upload image"}
                        </span>
                    </label>
                    {imagePreviewUrl && (
                        <img
                            src={imagePreviewUrl}
                            alt="Recipe preview"
                            className="w-full h-48 object-cover rounded-2xl border mt-2"
                        />
                    )}
                </div>

                {/* Ingredients */}
                {recipe.ingredients?.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold mb-2">🥕 Ingredients</h3>
                        <ul className="space-y-1">
                            {recipe.ingredients.map((ingredient, index) => (
                                <li key={index} className="bg-bgLight rounded-lg px-4 py-2 text-sm">
                                    • {ingredient}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Instructions */}
                {recipe.instructions?.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold mb-2">👨‍🍳 Instructions</h3>
                        <ol className="space-y-2">
                            {recipe.instructions.map((step, index) => (
                                <li key={index} className="flex gap-3">
                                    <div className="bg-primary text-white w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <p className="flex-1 bg-bgLight rounded-lg px-4 py-2 text-sm">
                                        {step}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Create button */}
                <button
                    onClick={onCreateRecipe}
                    disabled={!isReadyToCreate || isCreating}
                    className={`w-full py-3 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2 ${
                        !isReadyToCreate || isCreating
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-primary hover:bg-secondary"
                    }`}
                >
                    {isCreating ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Creating Recipe...
                        </>
                    ) : (
                        "🍽 Create Recipe"
                    )}
                </button>

                {!isReadyToCreate && (
                    <p className="text-xs text-center text-gray-400">
                        {!recipe.category && !selectedImage
                            ? "Select a category and upload an image to create."
                            : !recipe.category
                            ? "Select a category to create."
                            : "Upload an image to create."}
                    </p>
                )}
            </div>
        </div>
    );
};

export default RecipePreview;
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import {
    Clock, Users, BarChart, Trash2, Edit3, ArrowLeft,
    Scale, Droplet, Coffee, Soup, Sparkles, Package, Utensils
} from 'lucide-react';
import { useSelector } from 'react-redux';

const RecipeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state) => state.auth);
    const [recipe, setRecipe] = useState(null);
    const [isTitleExpanded, setIsTitleExpanded] = useState(false);

    useEffect(() => {
        const getRecipe = async () => {
            try {
                const { data } = await API.get(`/recipes/${id}`);
                setRecipe(data);
            } catch (err) {
                alert('Recipe not found', err)
            }
        };
        getRecipe();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this recipe ? ")) {
            try {
                await API.delete(`/recipes/${recipe._id}`);
                alert("Deleted Successfully");
                navigate('/');
            } catch (err) {
                alert(err.response?.data?.message || "Error deleting recipe");
            }
        }
    };

    if (!recipe) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const SpoonIcon = ({ className }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18.5 5.5a3.5 3.5 0 1 0-5 5l-8.5 8.5a1.5 1.5 0 1 0 2 2l8.5-8.5a3.5 3.5 0 0 0 3-7z" />
            <path d="M12 9.5l2.5 2.5" />
        </svg>
    );

    const MeasuringCupIcon = ({ className }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 3h12v15a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V3z" />
            <path d="M18 7h3v8h-3" />
            <path d="M10 7h4" />
            <path d="M6 13h12" />
            <path d="M10 11h4" />
            <path d="M10 15h4" />
        </svg>
    );

    const WeightScaleIcon = ({ className }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 20h14" />
            <path d="M7 20v-5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5" />
            <path d="M4 8h16l-2 3H6L4 8z" />
            <path d="M12 13v-3" />
            <circle cx="12" cy="16" r="2.5" />
        </svg>
    );

    const getUnitIcon = (unit) => {
        const u = (unit || '').toLowerCase().replace(/[^a-z]/g, '');
        if (['g', 'gm', 'grm', 'grms', 'gms', 'gram', 'grams', 'kg', 'kgs', 'oz', 'ounce', 'ounces'].includes(u)) {
            return <WeightScaleIcon className="w-5 h-5 text-orange-600 flex-shrink-0" />;
        }
        if (['ml', 'l', 'dl', 'liter', 'liters', 'litre', 'litres', 'glass', 'glasses'].includes(u)) {
            return <MeasuringCupIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />;
        }
        if (u.startsWith('cup')) {
            return <Coffee className="w-5 h-5 text-amber-600 flex-shrink-0" />;
        }
        if (u.startsWith('tsp') || u.startsWith('tbsp') || u.includes('spoon')) {
            return <SpoonIcon className="w-5 h-5 text-red-500 flex-shrink-0" />;
        }
        if (u.startsWith('pinch')) {
            return <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
        }
        if (['can', 'cans', 'bottle', 'bottles', 'pack', 'packs', 'packet', 'packets', 'box', 'boxes'].includes(u)) {
            return <Package className="w-5 h-5 text-indigo-500 flex-shrink-0" />;
        }
        return <Utensils className="w-5 h-5 text-gray-500 flex-shrink-0" />;
    };

    const parseIngredient = (ing) => {
        if (!ing) return { quantity: '', unit: '', name: '' };
        const regex = /^([\d\/\.\-\s½⅓¼¾]+)?\s*(tsp\.?|tbsp\.?|teaspoons?|tablespoons?|g|gm|grm|grms|gms|grams?|kg|kgs|ml|l|liters?|litres?|cup|cups|glass|glasses|pinch|pinches|pieces?|slices?|cloves?|cans?|bottles?|packs?|packets?|oz|ounces?)?\b\s*(.*)$/i;
        const match = ing.trim().match(regex);
        if (match) {
            const qty = (match[1] || '').trim();
            const unit = (match[2] || '').trim();
            const name = (match[3] || '').trim();
            if (qty || unit) {
                return { quantity: qty, unit: unit, name: name };
            }
        }
        return { quantity: '', unit: '', name: ing };
    };

    const authorName = recipe.author?.name || 'Chef';
    const authorImage = recipe.author?.profileImage || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 pb-20">
            {/* Top Navigation / Bar */}
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium bg-white px-4 py-2 rounded-full shadow-sm hover:shadow border border-gray-100"
                >
                    <ArrowLeft size={18} /> Back to recipes
                </button>

                {currentUser?._id?.toString() === (recipe.author?._id || recipe.author)?.toString() && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate(`/recipe/edit/${recipe._id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all text-sm font-semibold"
                        >
                            <Edit3 size={16} /> Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-all text-sm font-semibold"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-orange-100/30 border border-gray-100 overflow-hidden">
                    {/* Hero Image Section */}
                    <div className="relative h-[300px] sm:h-[400px] md:h-[480px] w-full overflow-hidden">
                        <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                        {/* Recipe Title & Category Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
                            <span className="px-4 py-1.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-lg">
                                {recipe.category}
                            </span>
                            <h1 
                                onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                                className={`font-black mt-4 leading-tight drop-shadow-md cursor-pointer select-none transition-all duration-300 hover:text-orange-200 ${
                                    isTitleExpanded ? 'text-3xl md:text-5xl' : 'text-xl md:text-2xl'
                                }`}
                                title="Click to resize title"
                            >
                                {recipe.title}
                            </h1>

                            {/* Author Info */}
                            <div className="flex items-center gap-3 mt-6">
                                <img
                                    src={authorImage}
                                    alt={authorName}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                                    onError={(e) => {
                                        e.src = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop';
                                    }}
                                />
                                <div className="text-sm">
                                    <p className="font-semibold text-white/95">Created by</p>
                                    <p className="font-bold text-white">{authorName}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 md:p-12">
                        {/* Description */}
                        {recipe.description && (
                            <p className="text-gray-600 text-lg leading-relaxed mb-8 italic border-l-4 border-orange-200 pl-4">
                                "{recipe.description}"
                            </p>
                        )}

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 md:gap-6 bg-gradient-to-r from-orange-50/50 to-orange-100/30 rounded-3xl p-6 mb-10 border border-orange-100/50">
                            <div className="flex flex-col items-center justify-center text-center p-2">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-primary mb-2 ">
                                    <Clock size={24} />
                                </div>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Cooking Time</span>
                                <span className="text-base md:text-lg font-black text-gray-800 mt-0.5">{recipe.cookingTime} mins</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center p-2 border-x border-orange-200/40">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-primary mb-2">
                                    <Users size={24} />
                                </div>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Servings</span>
                                <span className="text-base md:text-lg font-black text-gray-800 mt-0.5">{recipe.servings} servings</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center p-2">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-primary mb-2">
                                    <BarChart size={24} />
                                </div>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Difficulty</span>
                                <span className="text-base md:text-lg font-black text-gray-800 mt-0.5">{recipe.difficulty}</span>
                            </div>
                        </div>

                        {/* Ingredients & Steps Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Ingredients Column */}
                            <div className="lg:col-span-5 bg-gray-50/60 rounded-3xl p-6 md:p-8 border border-gray-100">
                                <h3 className="text-2xl font-black text-textDark mb-6 flex items-center gap-2">
                                    Ingredients
                                    <span className="text-sm font-bold px-2.5 py-0.5 bg-orange-100 text-primary rounded-full animate-pulse">
                                        {recipe.ingredients?.length || 0}
                                    </span>
                                </h3>
                                <div className="space-y-3.5">
                                    {(recipe.ingredients || []).map((ing, i) => {
                                        const { quantity, unit, name } = parseIngredient(ing);
                                        const hasRatio = quantity || unit;
                                        return (
                                            <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-xs border border-gray-100 hover:shadow-md hover:border-orange-100 hover:scale-[1.02] transition-all duration-300">
                                                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50/80 text-primary font-bold rounded-xl text-sm border border-orange-100/50 whitespace-nowrap min-w-[110px] justify-center">
                                                    {getUnitIcon(unit)}
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {hasRatio ? `${quantity}${unit ? ` ${unit}` : ''}` : 'As needed'}
                                                    </span>
                                                </div>
                                                <span className="text-gray-700 font-semibold text-base capitalize leading-tight">
                                                    {hasRatio ? name : ing}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {recipe.ingredients?.length === 0 && (
                                        <p className="text-gray-400 text-sm italic">No ingredients listed.</p>
                                    )}
                                </div>
                            </div>

                            {/* Preparation Steps Column */}
                            <div className="lg:col-span-7">
                                <h3 className="text-2xl font-black text-textDark mb-6">Preparation Steps</h3>
                                <div className="space-y-6">
                                    {(recipe.instructions || []).map((step, i) => (
                                        <div key={i} className="flex gap-5 p-5 bg-white rounded-3xl border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                                            <span className="flex-shrink-0 flex items-center justify-center font-black text-white bg-primary shadow-md shadow-primary/20 text-lg w-10 h-10 rounded-2xl">
                                                {i + 1}
                                            </span>
                                            <p className="text-gray-700 text-base leading-relaxed pt-1.5 font-medium">{step}</p>
                                        </div>
                                    ))}
                                    {recipe.instructions?.length === 0 && (
                                        <p className="text-gray-400 text-sm italic">No steps provided.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeDetail;
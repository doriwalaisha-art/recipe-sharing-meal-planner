import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecipes } from '../redux/slices/recipeSlice';
import RecipeCard from '../components/RecipeCard';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';

const RecipeList = () => {
    const dispatch = useDispatch();
    const { items, loading, error } = useSelector((state) => state.recipes);

    useEffect(() => {
        console.log("Step 1: Component Mounted. Dispatching fetchRecipes...");
        dispatch(fetchRecipes());
    }, [dispatch]);

    return (
        <div className="min-h-screen bg-bgLight p-6">
            {/* DEBUG BANNER: Shows the current state of Redux */}
            <div className="fixed top-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
                <div className="bg-black text-white p-2 rounded-lg text-xs font-mono opacity-70">
                    DEBUG: items={items?.length || 0} | loading={loading} | error={error ? 'YES' : 'NO'}
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-textDark">Explore Recipes</h1>
                    <Link to="/recipe/create" className="flex items-center gap-2 py-3 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-secondary transition-all shadow-lg">
                        <Plus size={20} /> Create Recipe
                    </Link>
                </div>

                {/* ERROR STATE */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-2xl flex items-center gap-3 border border-red-200">
                        <AlertTriangle size={20} />
                        <span><strong>Error:</strong> {error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading recipes from server...</p>
                    </div>
                ) : (
                    <>
                        {items && items.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {items.map(recipe => (
                                    <RecipeCard key={recipe._id} recipe={recipe} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 text-lg">No recipes found. Try creating one!</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RecipeList;

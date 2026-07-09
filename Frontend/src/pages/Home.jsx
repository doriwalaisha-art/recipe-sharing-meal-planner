import { useEffect , useState} from 'react';
import { useDispatch , useSelector} from 'react-redux';
import { fetchRecipes } from '../redux/Slices/recipeSlice';
import RecipeCard from '../components/RecipeCard';
import RecipeFilters from '../components/RecipeFilters';
import { Link } from 'react-router-dom';
import { Plus, UtensilsCrossed} from 'lucide-react';

const Home = () => {
    const dispatch = useDispatch();
    const { items, loading } = useSelector((state) => state.recipes);

    const [filters, setFilters] = useState({
        search : '',
        category : 'All',
        sort: 'latest'
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchRecipes(filters));
        },300);

        return () => clearTimeout(delayDebounceFn);
    }, [filters,dispatch]);


 return (
        <div className="min-h-screen bg-bgLight p-6">
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-12 pt-10">
                    <div className="flex justify-center mb-4 text-primary">
                        <UtensilsCrossed size={48} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-textDark mb-4">
                        Find Your Next <span className="text-primary">Favorite Meal</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Discover thousands of curated recipes from chefs and food lovers around the world. 
                        Plan your meals, save your favorites, and cook something amazing today.
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-8 gap-4">
                    <Link to="/recipe/create" className="flex items-center justify-center gap-2 py-3 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-secondary transition-all shadow-lg hover:-translate-y-1 w-full sm:w-auto text-center">
                        <Plus size={20} /> Create Recipe
                    </Link>
                    <div className="hidden sm:block text-gray-400 text-sm">
                        Showing {items.length} delicious recipes
                    </div>
                </div>

                <RecipeFilters filters={filters} setFilters={setFilters} />

                {/* Recipe Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium">Fetching recipes...</p>
                    </div>
                ) : (
                    <>
                        {items.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                                {items.map(recipe => <RecipeCard key={recipe._id} recipe={recipe} />)}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                                <p className="text-gray-500 text-lg">No recipes found matching your criteria. 🥘</p>
                                <button 
                                    onClick={() => setFilters({ search: '', category: 'All', sort: 'latest' })}
                                    className="mt-4 text-primary font-bold hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;

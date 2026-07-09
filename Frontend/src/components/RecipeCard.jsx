import { Link } from "react-router-dom";
import { Clock , Users , BarChart} from 'lucide-react'; 
import LikeButton from "./LikeButton";

const RecipeCard = ({ recipe }) => {
    console.log("Recipe:", recipe.title, recipe.likes, recipe.isLiked);
    return (
         <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-orange-50">
            <div className="relative">
                <img src={recipe.image} alt={recipe.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3">
                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm">
                        <LikeButton recipeId={recipe._id} initialLikes={recipe.likes} isLiked={recipe.isLiked} />
                    </div>
                </div>  
            </div>
            
            <div className="p-5">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{recipe.category}</span>
                <h3 className="text-xl font-bold text-textDark mt-1 mb-3">{recipe.title}</h3>

                <div className="flex items-center justify-between text-gray-500 text-sm mb-4">
                    <div className="flex items-center gap-1">
                        <Clock size={16} /> {recipe.cookingTime} mins
                    </div>
                    <div className="flex items-center gap-1">
                        <Users size={16} /> {recipe.servings} servings
                    </div>
                    <div className="flex items-center gap-1">
                        <BarChart size={16} /> {recipe.difficulty}
                    </div>
                </div>

                <Link to={`/recipe/${recipe._id}`} className="block text-center w-full py-2 bg-primary text-white rounded-xl font-medium hover:bg-secondary transition-colors">
                    View Recipe
                </Link>
            </div>
        </div>
    );
};

export default RecipeCard;
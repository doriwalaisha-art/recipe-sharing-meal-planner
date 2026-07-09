import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useDispatch } from 'react-redux';
// import { useSelector } from 'react-redux';
import { toggleLikeRecipe } from '../redux/Slices/recipeSlice';

const LikeButton = ({ recipeId , initialLikes , isLiked }) => {
    const [ liked , setLiked ] = useState(isLiked);
    const [ likesCount , setLikesCount ] = useState(initialLikes);
    const [ isLoading , setIsLoading] = useState(false);
    // const { isAuthenticated } = useSelector((state) => state.auth );
    const dispatch = useDispatch();

    useEffect(() => {
        setLiked(isLiked);
    }, [isLiked]);

    useEffect(() => {
        setLikesCount(initialLikes);
    }, [initialLikes]);

  

    const handleLike = async () => {
        if(isLoading) return;
        setIsLoading(true);

        const initialLiked = liked;
        const initialLikesCount = likesCount;

        const willBeLiked = !liked;
        setLiked(willBeLiked);
        setLikesCount(prev => willBeLiked ? prev + 1 : prev - 1);

        try {
            await dispatch(toggleLikeRecipe({ recipeId })).unwrap();
        }catch(err) {
            setLiked(initialLiked);
            setLikesCount(initialLikesCount);
            console.error("Failed to like recipe:", err);
        }finally{
            setIsLoading(false);
        }
    };

    return(
        <button
            onClick = {handleLike}
            disabled={isLoading}
            className="flex items-center gap-2 group transition-all duration-300"
        >
            <div className="relative">
                <Heart
                    size={24}
                    className={`transition-all duration-300 transform group-hover:scale-125 ${
                        liked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-400'
                    }`} 
                />
            </div>
             <span className={`text-sm font-bold transition-colors ${liked ? 'text-red-500' : 'text-gray-500'}`}>
                {likesCount}
            </span>
        </button>
    );

};

export default LikeButton;
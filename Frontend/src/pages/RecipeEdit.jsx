import {useEffect,useState} from 'react';
import {useForm,useFieldArray} from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import { Plus ,Trash2, Save} from 'lucide-react';

const RecipeEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const {register, control, handleSubmit, setValue, formState : { errors } } = useForm();
    const { fields: ingFields, append: appendIng, remove: removeIng } = useFieldArray({ control, name: "ingredients" });
    const { fields: insFields, append: appendIns, remove: removeIns } = useFieldArray({ control, name: "instructions" });

    useEffect(() => {
        const loadRecipe = async () => {
            try {
                const { data } = await API.get(`/recipes/${id}`);
                setValue('title',data.title);
                setValue('description',data.description);
                setValue('category',data.category);
                setValue('cookingTime',data.cookingTime);
                setValue('servings',data.servings);
                setValue('difficulty',data.difficulty);

                if(data.ingredients) setValue('ingredients',data.ingredients);
                if(data.instructions) setValue('instructions', data.instructions);

                setLoading(false);

            }catch(err) {
                alert("Error Loading recipe",err);
            }
        };
        loadRecipe();
    },[id, setValue]);

       const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('category', data.category);
            formData.append('cookingTime', data.cookingTime);
            formData.append('servings', data.servings);
            formData.append('difficulty', data.difficulty);
            formData.append('ingredients', JSON.stringify(data.ingredients));
            formData.append('instructions', JSON.stringify(data.instructions));
            
            if (data.image && data.image[0]) {
                formData.append('image', data.image[0]);
            }

            const response = await API.put(`/recipes/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 200) {
                alert("Recipe updated successfully!");
                navigate(`/recipe/${id}`); 
            }
        } catch (err) {
            console.error("Update error:", err);
            alert(err.response?.data?.message || "Error updating recipe");
        }
    };

    if (loading) return <div className="text-center py-20">Loading Recipe...</div>;

    return (
        <div className="min-h-screen bg-bgLight p-4 sm:p-6 flex justify-center">
            <form 
    onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log(" FORM VALIDATION ERRORS:", errors);
        alert("Please fill in all required fields!");
    })} 
    className="max-w-3xl w-full bg-white p-5 sm:p-8 rounded-3xl shadow-lg space-y-6">
                <h2 className="text-3xl font-bold text-center text-textDark mb-8">Edit Recipe</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Recipe Title</label>
                        <input {...register('title', { required: true })} className={`w-full p-3 rounded-xl border outline-none transition-all ${
                                errors.title ? 'border-red-500 focus:ring-red-500' : 'focus:ring-primary'
                            }`} 
                            placeholder="e.g. Creamy Pasta"
                        />
                        {errors.title && (
                            <span className="text-red-500 text-xs mt-1 block">{errors.title.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select {...register('category', { required: true })} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none">
                            <option value="Breakfast">Breakfast</option>
                            <option value="Brunch">Brunch</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Snacks">Snacks</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Dessert">Dessert</option>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Non-Vegetarian">Non-Vegetarian</option>
                            <option value="Vegan">Vegan</option>
                            <option value="Beverages">Beverages</option>
                            <option value="Salad">Salad</option>
                            <option value="Soup">Soup</option>
                            <option value="Healthy">Healthy</option>
                            <option value="High-Protein">High-Protein</option>
                            <option value="Quick Meals">Quick Meals</option>
                            <option value="Jain">Jain</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea {...register('description', { required: true })} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none" rows="3" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Time (mins)</label>
                        <input type="number" {...register('cookingTime', { required: true })} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Servings</label>
                        <input type="number" {...register('servings', { required: true })} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Difficulty</label>
                        <select {...register('difficulty', { required: true })} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none">
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Recipe Image</label>
                    <input type="file" {...register('image', { required: true })} className="w-full p-2 text-sm" />
                </div>

              
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Ingredients</label>
                        <button type="button" onClick={() => appendIng("")} className="p-1 bg-primary text-white rounded-full hover:bg-secondary"><Plus size={16} /></button>
                    </div>
                    {ingFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 mb-2">
                            <input {...register(`ingredients.${index}`, { required: true })} className="flex-1 p-2 rounded-lg border outline-none" placeholder="1 cup Flour" />
                            <button type="button" onClick={() => removeIng(index)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                        </div>
                    ))}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Step-by-Step Instructions</label>
                        <button type="button" onClick={() => appendIns("")} className="p-1 bg-primary text-white rounded-full hover:bg-secondary"><Plus size={16} /></button>
                    </div>
                    {insFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 mb-2">
                            <input {...register(`instructions.${index}`, { required: true })} className="flex-1 p-2 rounded-lg border outline-none" placeholder="Boil water..." />
                            <button type="button" onClick={() => removeIns(index)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                        </div>
                    ))}
                </div>

                    <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-secondary transition-colors flex items-center justify-center gap-2 shadow-lg">
                    <Save size={20} /> Save Changes
                </button>
            </form>
        </div>
    );
};

export default RecipeEdit;
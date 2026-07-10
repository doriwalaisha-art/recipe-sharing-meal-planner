import { useState } from "react";
import {useForm,useFieldArray} from 'react-hook-form';
import { toast } from "react-toastify";
import {useNavigate} from 'react-router-dom';
import API from '../api/axios';
import { Plus , Trash2} from 'lucide-react';

const RecipeCreate  = () => {
    const { register, control , handleSubmit, watch, formState : { errors } } = useForm();
    const { fields: ingFields, append: appendIng, remove: removeIng, replace: replaceIng } = useFieldArray({ control, name: "ingredients" });
    const { fields: insFields, append: appendIns, remove: removeIns, replace: replaceIns } = useFieldArray({ control, name: "instructions" });
    const navigate = useNavigate();
    const [loadingAI, setLoadingAI] = useState(false);

    const handleGenerateAI = async () => {
        const title = watch('title');
        const description = watch('description');

        if (!title) {
            alert("Please enter recipe title first.");
            return;
        }

        try {
            setLoadingAI(true);
            const response = await API.post('/ai/generate',{
                title,
                description
            });

            replaceIng(response.data.ingredients);
            replaceIns(response.data.instructions);
            toast.success("Ingredients and instructions generated successfully!");
        }catch (error) {
        toast.error(
            error.response?.data?.message || "Failed to generate recipe.Please Enter valid Recipe Title & Description"
        );

        }finally {
            setLoadingAI(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('category',data.category);
            formData.append('cookingTime',data.cookingTime),
            formData.append('servings',data.servings),
            formData.append('difficulty',data.difficulty);
            formData.append('collaboratorEmail',data.collaboratorEmail || "");
            formData.append('ingredients', JSON.stringify(data.ingredients));
            formData.append('instructions',JSON.stringify(data.instructions));
            formData.append('image',data.image[0]);

            await API.post('/recipes',formData, {
                headers : {'Content-Type' : 'multipart/form-data'}
            });
            navigate('/recipes');

        }catch (error) {
            alert(error.response?.data?.message || 'Error Creating Recipes');
        }
    };

    return (
        <div className="min-h-screen bg-bgLight p-4 sm:p-6 flex justify-center">
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl w-full bg-white p-5 sm:p-8 rounded-3xl shadow-lg space-y-6">
                <h2 className="text-3xl font-bold text-center text-textDark mb-8">Share Your Recipe</h2>

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

                <div className="flex justify-end">
                    <button
                        type="button" onClick={handleGenerateAI} disabled={loadingAI}
                        className="w-full sm:w-auto px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium transition-all text-center flex justify-center items-center"
                    > {loadingAI ? "Generating..." : "✨ Generate Ingredients & Instructions"}
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Collaborate With (Optional)
                    </label>

                    <input
                        type="email"
                        placeholder="Enter collaborator's email (optional)"
                        {...register("collaboratorEmail", {
                            pattern: {
                                value: /^\S+@\S+\.\S+$/,
                                message: "Please enter a valid email"
                            }
                        })}
                        className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                    />

                    {errors.collaboratorEmail && (
                        <span className="text-red-500 text-xs">
                            {errors.collaboratorEmail.message}
                        </span>
                    )}
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

                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-secondary transition-colors shadow-lg">
                    Publish Recipe
                </button>
            </form>
        </div>
    );
};

export default RecipeCreate;


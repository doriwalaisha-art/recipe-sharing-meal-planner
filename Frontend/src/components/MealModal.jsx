import {useState} from 'react';
import {X , Save} from 'lucide-react';
import API from '../api/axios';

const MealModal = ({ isOpen , onClose, selectedDate, recipes, onMealAdded}) => {

    const [formData , setFormData] = useState({
        recipeId : '',
        mealType : 'Lunch'
    });
    if(!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            await API.post('/meals', {
                date : selectedDate,
                mealType : formData.mealType,
                recipeId : formData.recipeId
            });
            onMealAdded();
            onClose();
        }catch(err) {
            console.error(err);
            alert('Error adding meal plan');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 sm:p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-textDark mb-4">Plan Meal for {new Date(selectedDate).toDateString()}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Select Recipe</label>
                        <select 
                            className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                            value={formData.recipeId}
                            onChange={(e) => setFormData({...formData, recipeId: e.target.value})}
                            required
                        >
                            <option value="">-- Choose a Recipe --</option>
                            {recipes.map(r => <option key={r._id} value={r._id}>{r.title}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Meal Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Breakfast', 'Lunch', 'Dinner', 'Snack','Dessert'].map(type => (
                                <button 
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({...formData, mealType: type})}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                                        formData.mealType === type ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-600 hover:border-primary'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary transition-all shadow-lg">
                        <Save size={20} /> Add to Calendar
                    </button>
                </form>

            </div>
        </div>
    );

};

export default MealModal;
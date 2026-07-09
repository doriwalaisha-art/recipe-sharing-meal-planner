import { Search, ChevronDown } from "lucide-react";

const RecipeFilters = ({ filters,setFilters }) => {
    const categories = ['All','Breakfast','Brunch','Lunch','Snacks','Dinner','Dessert','Beverages','Salad','Soup','Vegetarian','Non-Vegetarian','Vegan','Healthy','High-Protein','Quick Meals','Jain'];

    return(
        <div className="space-y-6 mb-10">
            <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                <input 
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search recipes or ingredients..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none shadow-md focus:ring-2 focus:ring-primary outline-none transition-all text-lg"
                />
                
            </div>

            <div className="flex overflow-x-auto pb-3 gap-3 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center scrollbar-thin">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilters({ ...filters, category: cat})}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border flex-shrink-0 ${
                            filters.category === cat
                            ? 'bg-primary text-white border-primary shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex justify-end items-center gap-3">
                <span className="text-sm text-gray-500 font-medium">Sort by:</span>
                <div className="relative">
                    <select
                        value={filters.sort}
                        onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                        className="appearance-none pl-4 pr-10 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none cursor-pointer shadow-sm"
                    >
                        <option value="latest">Newest First</option>
                        <option value="oldest">oldest First</option>
                        <option value="popular">Most Liked</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>
        </div>
    );
};

export default RecipeFilters;
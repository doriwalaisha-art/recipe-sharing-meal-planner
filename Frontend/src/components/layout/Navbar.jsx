import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { LogOut, User, UtensilsCrossed, Menu, X, CircleUserRound} from 'lucide-react';

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [isOpen , setIsOpen ] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-orange-100 px-6 py-4 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 text-primary font-bold text-2xl">
                    <UtensilsCrossed size={28} /> 
                    <span>RecipeFlow</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <Link to="/" className="text-gray-600 hover:text-primary font-medium transition-colors">Home</Link>
                    <Link to="/recipe/create" className="text-gray-600 hover:text-primary font-medium transition-colors">Create Recipe</Link>
                    <Link to="/mealplanner" className="text-gray-600 hover:text-primary font-medium transition-colors">Meal Planner</Link>

                    {isAuthenticated && (
                        <div className="flex items-center gap-6 ml-4 pl-6 border-l border-gray-200">
                            <div className="flex items-center gap-2 text-textDark font-semibold">
                                <User size={20} className="text-primary" />
                                <span>Welcome {user?.email}</span>
                            </div>

                            <button 
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all text-sm font-bold"
                            >
                                <LogOut size={16} /> Logout
                            </button>

                            <div>
                            <Link to="/profile" className="flex items-center gap-2 text-gray-600 hover:text-primary font-medium">
                                <CircleUserRound size={40} /> {user?.name}
                            </Link>
                            </div>
                        </div>
                    )}
                </div>
                <div className="md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-orange-100 p-6 flex flex-col gap-4 shadow-xl z-50">
                    <Link to="/" onClick={() => setIsOpen(false)} className="text-gray-600 font-semibold text-lg hover:text-primary transition-colors py-1">Home</Link>
                    <Link to="/recipe/create" onClick={() => setIsOpen(false)} className="text-gray-600 font-semibold text-lg hover:text-primary transition-colors py-1">Create Recipe</Link>
                    <Link to="/mealplanner" onClick={() => setIsOpen(false)} className="text-gray-600 font-semibold text-lg hover:text-primary transition-colors py-1">Meal Planner</Link>
                    {isAuthenticated && (
                        <>
                            <Link 
                                to="/profile" 
                                onClick={() => setIsOpen(false)} 
                                className="flex items-center gap-2 text-gray-600 font-semibold text-lg hover:text-primary transition-colors py-2 border-t pt-4"
                            >
                                <CircleUserRound size={24} className="text-primary" /> {user?.name || user?.email}
                            </Link>
                            <button 
                                onClick={() => {
                                    setIsOpen(false);
                                    handleLogout();
                                }}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-all"
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;

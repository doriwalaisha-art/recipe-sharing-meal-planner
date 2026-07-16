import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
// import RecipeList from './pages/RecipeList';
import RecipeCreate from './pages/RecipeCreate';
import RecipeDetail from './pages/RecipeDetail';
import RecipeEdit from './pages/RecipeEdit';
import Profile from './pages/profile';
import EditProfile from './pages/EditProfile';
import MealPlanner from './pages/MealPlanner';
import AIRecipeStudio from './pages/AIRecipeStudio';

import { useSelector } from 'react-redux';

function App() {
    const { isAuthenticated } = useSelector((state) => state.auth);

    return (
        <>
            {isAuthenticated && <Navbar />}
        
            <Routes>
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />


                {/* <Route path="/" element={isAuthenticated ? <RecipeList /> : <Navigate to="/login" />} />
                <Route path="/recipes" element={isAuthenticated ? <RecipeList /> : <Navigate to="/login" />} /> */}

                <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
                <Route path="/recipe/create" element={isAuthenticated ? <RecipeCreate /> : <Navigate to="/login" />} />
                <Route path="/recipe/:id" element={isAuthenticated ? <RecipeDetail /> : <Navigate to="/login" />} />
                <Route path="/recipe/edit/:id" element={isAuthenticated ? <RecipeEdit /> : <Navigate to="/login" />} />
                <Route path="/profile" element={isAuthenticated ? <Profile/> : <Navigate to="/login" />} />
                <Route path="/profile/:id" element={isAuthenticated ? <Profile/> : <Navigate to="/login" />} />
                <Route path="/profile/edit" element={isAuthenticated ? <EditProfile/> : <Navigate to="/login"/>}/>
                <Route path="/mealplanner" element={isAuthenticated ? <MealPlanner/> : <Navigate to = "/login"/>}/>
                <Route path="/ai-recipe-studio" element={isAuthenticated ? <AIRecipeStudio /> : <Navigate to="/login"/>}/>
                
                <Route path="*" element={<Navigate to="/" />} />

            </Routes>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="colored"
            />

        </>
        
    );
}

export default App;
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useSelector } from 'react-redux';
import RecipeCard from '../components/RecipeCard';
import { Edit3, Calendar, Award, Heart } from 'lucide-react';

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser } = useSelector((state) => state.auth);
    const[profileData, setProfileData] = useState(null);
    const [loading,setLoading] = useState(true);
    
    useEffect(() => {
        const fetchProfile = async () => {
            try{
                const targetId = id || 'me';
                const { data } = await API.get(`/users/profile/${targetId}`);
                setProfileData(data);
            }catch (err) {
                console.log(err);
                alert('profile not found');
            }finally {
                setLoading(false);
            }
        };
        fetchProfile();
    },[id]);

    if (loading) return <div className="text-center py-20">Loading Profile...</div>;
    if (!profileData) return <div className="text-center py-20">User not found</div>;

    const { user, recipes, stats } = profileData;
    const isOwnProfile = currentUser?._id === user._id;

    return (
         <div className="min-h-screen bg-bgLight p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-orange-50">
                    <div className="h-32 bg-gradient-to-r from-primary to-secondary"></div>

                     <div className="px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row items-center gap-6 -mt-16">
                            <img 
                                src={user.profileImage}
                                alt={user.name}
                                onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF8A00"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6.1 0-8 4-8 4v2h16v-2s-1.9-4-8-4z"/></svg>`;
                                }}
                                className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white" 
                            />

                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-3xl font-bold text-textDark">{user.name}</h1><br />
                                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 text-md mt-1">
                                    <Calendar size={14}/>
                                    joined {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                                <p className="text-gray-600 mt-3 max-w-xl">
                                    {user.bio || "No bio added yet. Start sharing your culinary journey!"}
                                </p>
                            </div>
                             {isOwnProfile && (
                                <Link to="/profile/edit" className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-secondary transition-all shadow-md w-full md:w-auto mt-4 md:mt-0">
                                    <Edit3 size={18} /> Edit Profile
                                </Link>
                             )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-10 border-t pt-8">
                            <div className="text-center p-4 rounded-2xl bg-orange-50 border border-orange-100">
                                <div className="flex justify-center text-primary mb-2"><Award size={24} /></div>
                                <div className="text-2xl font-bold text-textDark">{stats.totalRecipes}</div>
                                <div className="text-xs text-gray-500 uppercase font-bold">Recipes</div>
                            </div>

                            <div className="text-center p-4 rounded-2xl bg-orange-50 border border-orange-100">
                                <div className="flex justify-center text-red-500 mb-2"><Heart size={24} /></div>
                                <div className="text-2xl font-bold text-textDark">{stats.totalLikes}</div>
                                <div className="text-xs text-gray-500 uppercase font-bold">Likes Received</div>
                            </div>
                        </div>

                        </div>
                    </div>

                     <div className="mt-12">
                    <h2 className="text-2xl font-bold text-textDark mb-8 flex items-center gap-3">
                        My Creations 
                        <span className="text-sm font-normal bg-gray-200 px-3 py-1 rounded-full">{recipes.length}</span>
                    </h2>

                     
                    {recipes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {recipes.map(recipe => <RecipeCard key={recipe._id} recipe={recipe} />)}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400">This chef hasn't posted any recipes yet.</p>
                        </div>
                    )}

                    </div>
                </div>
            </div>
    );
};

export default Profile;
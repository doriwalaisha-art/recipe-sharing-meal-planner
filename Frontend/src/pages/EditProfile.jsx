import {useForm} from "react-hook-form";
import {useNavigate} from "react-router-dom";
import API from "../api/axios";
import {useSelector} from "react-redux";
import {Save, ArrowLeft} from "lucide-react";

const EditProfile = () => {
    const {register, handleSubmit,formState: {errors}} = useForm();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("bio", data.bio);

            if(data.image[0]) {
                formData.append("image",data.image[0]);
            }
            await API.put("/users/profile", formData, {
                headers: {
                    "Content-Type" : "multipart/form-data"
                }
            });
            navigate("/profile/me");
        }catch(error) {
            console.error(error);
            alert("Failed to update profile");
        }

    };

    return (
        <div className="min-h-screen bg-bgLight p-4 sm:p-6 flex justify-center">
            <div className="max-w-2xl w-full bg-white p-5 sm:p-8 rounded-3xl shadow-lg">
                <button
                    type="button"
                    onClick={() => navigate('/profile/me')}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm font-semibold transition-colors"
                >
                    <ArrowLeft size = {20} />Back to profile
                </button>
                <h2 className="text-3xl font-bold text-textDark mb-8">Edit Your Profile</h2>

                <form onSubmit={handleSubmit(onSubmit)} className = "space-y-6">
                    <div>
                        <label className="block text-sm font medium mb-1">Full Name</label>
                        <input  
                            {...register("name", {required : "Name is required"})}
                            defaultValue={user?.name}
                            className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none" 
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font medium mb-1">Bio</label>
                        <textarea
                            {...register("bio")}
                            defaultValue = {user?.bio}
                            className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none" 
                            rows="4"
                            placeholder="Tell the world about your passion for food..."
                        />

                        <div>
                            <label className="block text-sm font-medium mb-1">Profile Picture</label>
                            <input type="file" {...register('image')} className="w-full p-2 text-sm" />
                        </div>

                        <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary transition-all shadow-lg shadow-orange-200">
                            <Save size={20} />Save Changes
                        </button>
                    </div>
                </form>

            </div>
        </div>
    )
}

export default EditProfile;
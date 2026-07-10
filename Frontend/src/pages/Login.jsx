import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/Slices/authSlice';
import { Mail, Lock } from 'lucide-react';
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onSubmit = async (data) => {
        try {
            const { data : user} = await API.post('/auth/login',data);
            dispatch(setCredentials(user));
            navigate('/');
        }catch (err) {
            toast.error(err.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bgLight p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-orange-100">
                 <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-textDark">Welcome Back</h2>
                    <p className="text-gray-500 mt-2">Login to continue your meal planning</p>
                </div>

                <form onSubmit = {handleSubmit(onSubmit)} className="space-y-5">
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            {...register('email', { required: 'Email is required' })}
                             className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder='Email Address'
                        />
                        {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type = "password"
                            {...register('password', { required: 'password is required' })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder='Password'
                        />
                        {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
                    </div>

                    <button type='submit' className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-secondary transition-colors shadow-lg shadow-orange-200">
                        Login
                    </button>

                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>

                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-3 text-gray-500">
                                OR
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                          useOneTap={false}
                          onSuccess={async (credentialResponse) => {
                            try {
                              const { data: user } = await API.post('/auth/google', {
                                token: credentialResponse.credential
                              });
                              dispatch(setCredentials(user));
                              toast.success("Logged in successfully with Google!");
                              navigate('/');
                            } catch (err) {
                              toast.error(err.response?.data?.message || "Google Login failed");
                            }
                          }}
                          onError={() => {
                            console.log("ERROR");
                            toast.error("Google Login Failed");
                          }}
                        />
                    </div>

                </form>

                <p  className="text-center mt-6 text-gray-600" >Don't Have An Account ? <Link to="/register" className="text-primary font-bold hover:underline">Register Here</Link>
                
                </p>
            </div>

        </div>
    );
};

export default Login;


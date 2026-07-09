import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    user : JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated : !!localStorage.getItem('token'),
    loading : false,
    error : null,
};

const authSlice = createSlice({
    name : 'auth',
    initialState,
    reducers : {
        setCredentials : (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(action.payload));
            localStorage.setItem("token", action.payload.token);
        },
        
        logout : (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('user');
            localStorage.removeItem("token");
        },

        setLoading : (state, action) => {
            state.loading = action.payload;
        },
        setError : (state, action) => {
            state.error = action.payload;
        }
    },
});

export const { 
    setCredentials,
    logout,
    setLoading,
    setError
} = authSlice.actions;

export default authSlice.reducer;
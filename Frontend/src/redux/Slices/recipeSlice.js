import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

export const toggleLikeRecipe = createAsyncThunk(
    'recipes/toggleLike',
    async ({ recipeId },{ rejectWithValue }) => {
        try {
            console.log("TOKEN:", localStorage.getItem("token"));
            console.log("RECIPE ID:", recipeId);

            const response = await API.put(`/social/like/${recipeId}`);
            return { recipeId, liked : response.data.liked };
        }catch(error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const fetchRecipes = createAsyncThunk(
    'recipes/fetchRecipes', 
    async ({ search = '', category = 'All', sort = 'latest'} = {}, { rejectWithValue }) => {
        try {
            const response = await API.get(`/recipes?search=${search}&category=${category}&sort=${sort}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Error");
        }
    }
);

const recipeSlice = createSlice({
    name: 'recipes',
    initialState: { items: [], loading: false, error: null },
    reducers: {
        updateLikeCount: (state, action) => {
            const { recipeId, liked } = action.payload;
            const recipe = state.items.find(r => r._id === recipeId);

            if(recipe) {
                recipe.likes = liked ? recipe.likes + 1 : recipe.likes - 1;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRecipes.pending, (state) => { 
                state.loading = true; 
            })
            .addCase(fetchRecipes.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchRecipes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder.addCase(toggleLikeRecipe.fulfilled, (state,action) => { 
            const { recipeId,liked } = action.payload;
            const recipe = state.items.find(r => r._id === recipeId);

            if(recipe) {
                recipe.likes = liked ? recipe.likes + 1 : recipe.likes - 1 ;
                recipe.isLiked = liked;
            }
        });
    }
});


export const { updateLikeCount } = recipeSlice.actions;
export default recipeSlice.reducer;

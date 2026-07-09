import {createSlice,createAsyncThunk} from '@reduxjs/toolkit';
import API from '../../api/axios';

export const fetchMealPlans = createAsyncThunk('mealPlans/fetchmealPlans', async (_, { rejectWithValue}) => {
    try{
        const response = await API.get('/meals');
        return response.data;
    }catch (error) {
        return rejectWithValue(error.response.data);
    }
});

const mealPlanSlice = createSlice({
    name : 'mealPlans',
    initialState : { items: [], loading: false, error: null},
    reducers : {},
    extraReducers : (builder) => {
        builder
            .addCase(fetchMealPlans.pending, (state) => {
                state.loading = true; 
            })
            
            .addCase(fetchMealPlans.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
           
            .addCase(fetchMealPlans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default mealPlanSlice.reducer;
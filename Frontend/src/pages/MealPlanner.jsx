import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMealPlans } from '../redux/slices/mealPlanSlice';
import { fetchRecipes } from '../redux/slices/recipeSlice';
import MealModal from '../components/MealModal';
import API from '../api/axios';
import { Calendar as CalIcon } from 'lucide-react';


const MealPlanner = () => {
    const dispatch = useDispatch();
    const { items : mealPlans } = useSelector((state) => state.mealPlans);
    const { items : recipes} = useSelector((state) => state.recipes);

    const[isModalOpen,setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'dayGridWeek' : 'dayGridMonth');

    useEffect(() => {
        dispatch(fetchMealPlans());
        dispatch(fetchRecipes({}));

        const handleResize = () => {
            setViewMode(window.innerWidth < 768 ? 'dayGridWeek' : 'dayGridMonth');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [dispatch]);

    const handleDateClick = (arg) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clickedDate = new Date(arg.dateStr);

        if (clickedDate < today) {
            alert("You can't add meals to past dates.");
            return;
        }

            setSelectedDate(arg.dateStr);
            setIsModalOpen(true);
        };   

    const handleEventClick = async(info) => {
        if(window.confirm(`Remove ${info.event.title}from your plan?`)) {
            try {
                await API.delete(`/meals/${info.event.id}`);
                dispatch(fetchMealPlans());
            }catch(err) {
                console.error(err);
                alert('Error deleting Meal')
            }
        }
    };

      const events = [...mealPlans]
        .sort((a, b) => {
            const mealOrder = {
                'Breakfast': 1,
                'Lunch': 2,
                'Dinner': 3,
                'Snack': 4,
                'Dessert': 5
            };
        const dateDiff = new Date(a.date) - new Date(b.date);

        if (dateDiff !== 0) return dateDiff;
        return mealOrder[a.mealType] - mealOrder[b.mealType];
        }).map(plan => ({
        id: plan._id,
        title: `${plan.mealType}: ${plan.recipeId?.title} (${plan.userId?.name})`,
        
        extendedProps: {
         owner: plan.userId
        },
        start: plan.date,
        allDay: true,
        backgroundColor: plan.mealType === 'Breakfast' ? '#d9d689ec' : 
                       plan.mealType === 'Lunch' ? '#de7c58c1' : 
                       plan.mealType === 'Dinner' ? '#8eb0dec6' :
                       plan.mealType === 'Snack' ? '#f5d3a5' : 
                       plan.mealType === 'Dessert' ? '#eb83e4c6' : '#edc6e7e4',
        borderColor: 'transparent',
        textColor: '#000000'
    }));


    return (
         <div className="min-h-screen bg-bgLight p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary text-white rounded-2xl shadow-lg">
                        <CalIcon size={32} />
                    </div>
                     <div>
                        <h1 className="text-3xl font-bold text-textDark">Meal Planner</h1>
                        <p className="text-gray-500">Organize your week and stay healthy</p>
                     </div>
                </div>
                <div className="bg-white p-3 sm:p-6 rounded-3xl shadow-xl border border-orange-50 overflow-x-auto">
                    <FullCalendar
                        key={viewMode}
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView={viewMode}
                        events={events}
                        displayEventTime={false}
                        eventOrder="extendedProps.order"
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        height="auto"
                        headerToolbar={{
                            left: "prev,next",
                            center: "title",
                            right: "today"
                        }}
                        buttonText={{
                            today: "Today"
                        }}
                        fixedWeekCount={false}
                        dayMaxEvents={true}
                        
                    />
                </div>

                <MealModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    selectedDate={selectedDate} 
                    recipes={recipes} 
                    onMealAdded={() => dispatch(fetchMealPlans())} 
                />
            </div>
        </div>
    );
};

export default MealPlanner;
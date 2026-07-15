import {ChefHat, Clock3, Users, BarChart3} from "lucide-react";

const RecipePreview = ({ recipe }) => {

  if (!recipe) {
    return (
      <div className="bg-white rounded-3xl shadow-xl h-[78vh] flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="mx-auto mb-4 text-primary" size={60} />
          <h2 className="text-2xl font-bold mb-2">
            Live Recipe Preview
          </h2>
          <p className="text-gray-500">
            Your AI generated recipe will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl h-[78vh] overflow-y-auto">

      <div className="border-b p-5">
        <h2 className="text-2xl font-bold">
          🍽 Live Recipe Preview
        </h2>

        <p className="text-gray-500">
          AI updates this recipe automatically.
        </p>
      </div>

      <div className="p-6 space-y-6">

        <div>
          <h2 className="text-3xl font-bold text-textDark">
            {recipe.title}
          </h2>

          <p className="text-gray-500 mt-2">
            {recipe.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="bg-bgLight rounded-xl p-4 flex items-center gap-3">
            <Clock3 className="text-primary" />

            <div>
              <p className="text-sm text-gray-500">
                Prep Time
              </p>

              <p className="font-semibold">
                {recipe.prepTime}
              </p>
            </div>
          </div>

          <div className="bg-bgLight rounded-xl p-4 flex items-center gap-3">
            <ChefHat className="text-primary" />

            <div>
              <p className="text-sm text-gray-500">
                Difficulty
              </p>

              <p className="font-semibold">
                {recipe.difficulty}
              </p>
            </div>
          </div>

          <div className="bg-bgLight rounded-xl p-4 flex items-center gap-3">
            <Users className="text-primary" />

            <div>
              <p className="text-sm text-gray-500">
                Servings
              </p>

              <p className="font-semibold">
                {recipe.servings}
              </p>
            </div>
          </div>

          <div className="bg-bgLight rounded-xl p-4 flex items-center gap-3">
            <BarChart3 className="text-primary" />

            <div>
              <p className="text-sm text-gray-500">
                Cook Time
              </p>

              <p className="font-semibold">
                {recipe.cookTime}
              </p>
            </div>
          </div>

        </div>

       

        <div>

          <h3 className="text-xl font-bold mb-3">
            🥕 Ingredients
          </h3>

          <ul className="space-y-2">

            {recipe.ingredients?.map((ingredient, index) => (

              <li
                key={index}
                className="bg-bgLight rounded-lg px-4 py-2"
              >
                • {ingredient}
              </li>

            ))}

          </ul>

        </div>
        <div>

          <h3 className="text-xl font-bold mb-3">
            👨‍🍳 Instructions
          </h3>

          <ol className="space-y-3">

            {recipe.instructions?.map((step, index) => (

              <li
                key={index}
                className="flex gap-3"
              >

                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                <p className="flex-1 bg-bgLight rounded-lg px-4 py-3">
                  {step}
                </p>

              </li>

            ))}

          </ol>

        </div>

        <button
          className="w-full bg-primary hover:bg-secondary text-white py-3 rounded-xl transition"
        >
          Create Recipe
        </button>

      </div>

    </div>
  );
};

export default RecipePreview;
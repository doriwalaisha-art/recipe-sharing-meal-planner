
const buildPromptForChat = (body) => {
    const { action, recipeDraft, currentRecipe, instruction, variation, fieldToRegenerate } = body;

    if (action === "generate") {
        const userDescription = (recipeDraft.description && recipeDraft.description !== "Let AI Generate") 
            ? `Use this description: "${recipeDraft.description}"` 
            : "Generate an appetizing description.";

        const userIngredients = (recipeDraft.ingredients && recipeDraft.ingredients !== "Let AI Generate")
            ? `Use these specific ingredients: ${recipeDraft.ingredients}`
            : "Generate realistic ingredients with exact quantities.";

        const userInstructions = (recipeDraft.instructions && recipeDraft.instructions !== "Let AI Generate")
            ? `Use these specific instructions/steps as a base: ${recipeDraft.instructions}`
            : "Generate step-by-step instructions.";

        return `
        
        - Title: ${recipeDraft.title}
        - Category: ${recipeDraft.category || "Dinner"}
        - Cooking Time: ${recipeDraft.cookingTime || "30"} minutes
        - Servings: ${recipeDraft.servings || "2"}
        - Difficulty: ${recipeDraft.difficulty || "Medium"}
        Requirements:
        1. Description: ${userDescription}
        2. Ingredients: ${userIngredients}
        3. Instructions: ${userInstructions}
        Strictly return ONLY valid JSON matching this schema:
        {
            "title": "${recipeDraft.title}",
            "description": "Appetizing description.",
            "cookingTime": ${recipeDraft.cookingTime ? parseInt(recipeDraft.cookingTime) : 30},
            "servings": ${recipeDraft.servings ? parseInt(recipeDraft.servings) : 2},
            "difficulty": "${recipeDraft.difficulty || "Medium"}",
            "estimatedCalories": "350 kcal",
            "ingredients": ["2 cups Basmati Rice"],
            "instructions": ["Step 1"],
            "tips": ["Chef tip 1"],
            You are a Professional Chef. Generate a recipe JSON matching the details below.Recipe Details:
            "nutrition": {"protein": "15g", "carbs": "45g", "fat": "10g", "fiber": "4g"},

            "tags": ["Tag1"]
            }
            `;


            if (action === "edit") {
            
                return `
                You are a Professional Chef. Modify the existing recipe based on the user's instruction. Preserve all other parts.

                }
                Current Recipe:
                ${JSON.stringify(currentRecipe, null, 2)}

                User Instruction:
                "${instruction}"

                Strictly return ONLY a valid JSON object matching the schema.
                `;
            }

    if (action === "variation") {
        return `
            You are a Professional Chef. Convert the following recipe into a "${variation}" variation.

            Current Recipe:
            ${JSON.stringify(currentRecipe, null, 2)}

            Strictly return ONLY a valid JSON object matching the schema.
            `;
        }

    if (action === "regenerate_field") {
        return `
        You are a Professional Chef. Regenerate ONLY the field "${fieldToRegenerate}" (ingredients, instructions, or entire) for the current recipe.

        Current Recipe:
        ${JSON.stringify(currentRecipe, null, 2)}

        Strictly return ONLY a valid JSON object matching the schema.
        `;
    }
}

    throw new Error("Invalid action type.");
};

const buildPromptForStudio = (recipeDraft) => {
    const generateDescription = recipeDraft.description === "__AUTO__";
    const generateIngredients = recipeDraft.ingredients === "__AUTO__";
    const generateInstructions = recipeDraft.instructions === "__AUTO__";

    let instructionsList = [];
    if (!generateInstructions) {
        instructionsList = recipeDraft.instructions.split(/\r?\n/).map(i => i.trim()).filter(Boolean);
    }

    let ingredientsList = [];
    if (!generateIngredients) {
        ingredientsList = recipeDraft.ingredients.split(/,/).map(i => i.trim()).filter(Boolean);
    }

    return {
        prompt: `
You are a Professional Chef and AI Recipe Generator.
Generate or complete a high-quality recipe matching the details below.

Recipe Details:
- Title: ${recipeDraft.title}
- Category: ${recipeDraft.category}
- Cooking Time: ${recipeDraft.cookingTime} minutes
- Servings: ${recipeDraft.servings}
- Difficulty: ${recipeDraft.difficulty}

Your generation instructions:
1. Description: ${generateDescription ? "Generate an appetizing description." : `MUST USE this exact description: "${recipeDraft.description}"`}
2. Ingredients: ${generateIngredients ? "Generate a realistic list of ingredients with exact quantities." : `MUST USE these exact ingredients: ${JSON.stringify(ingredientsList)}`}
3. Instructions: ${generateInstructions ? "Generate clear step-by-step instructions." : `MUST USE these exact instructions: ${JSON.stringify(instructionsList)}`}

Strictly return ONLY a valid JSON object matching this schema:
{
  "title": "${recipeDraft.title}",
  "description": "Appetizing description.",
  "cookingTime": ${parseInt(recipeDraft.cookingTime) || 30},
  "servings": ${parseInt(recipeDraft.servings) || 2},
  "difficulty": "${recipeDraft.difficulty}",
  "estimatedCalories": "350 kcal",
  "ingredients": ["exact quantity and ingredient (e.g. 2 cups Basmati Rice)"],
  "instructions": ["Step 1"],
  "tips": ["Chef tip 1"],
  "nutrition": {"protein": "15g", "carbs": "45g", "fat": "10g", "fiber": "4g"},
  "tags": ["${recipeDraft.category}", "${recipeDraft.difficulty}"]
}
`,
        generateDescription,
        generateIngredients,
        generateInstructions,
        ingredientsList,
        instructionsList
    };
};

module.exports = { buildPromptForChat, buildPromptForStudio };

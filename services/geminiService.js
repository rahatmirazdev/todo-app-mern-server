import { GoogleGenAI } from "@google/genai";

// Load API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDs9y1cgJQdBEQQR39DqfWxrLjCBPrR2yU";

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generate subtask suggestions based on a task description
 * @param {string} taskDescription - The description of the main task
 * @param {string} taskTitle - The title of the main task
 * @returns {Promise<Array<Object>>} - A list of suggested subtasks
 */
export const generateSubtaskSuggestions = async (taskDescription, taskTitle) => {
    try {
        // If no description is provided, we can't suggest subtasks
        if (!taskDescription || taskDescription.trim() === '') {
            return [];
        }

        // Create a prompt that helps the model understand what we want
        const prompt = `
        Task: "${taskTitle}"
        Description: "${taskDescription}"
        
        Based on this task description, suggest 3-5 actionable subtasks that would help complete this task.
        Return your response as a JSON array of objects, where each object has a "title" field for the subtask.
        Example format: 
        [
          {"title": "Research options"},
          {"title": "Create draft"}, 
          {"title": "Review with team"}
        ]
        Only return the JSON array, no other text.
        `;

        // Generate content using the correct API method
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        // Extract the response text
        const responseText = response.text;

        // Parse the JSON response
        // The response might contain markdown code blocks or additional text, so we need to extract just the JSON
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn("Couldn't extract JSON from Gemini response");
            return [];
        }

        const jsonStr = jsonMatch[0];
        const subtasks = JSON.parse(jsonStr);

        // Validate and transform the response
        return subtasks.map(item => ({
            title: item.title || "Subtask",
            completed: false,
            completedAt: null
        }));
    } catch (error) {
        console.error("Error generating subtask suggestions:", error);
        return [];
    }
};

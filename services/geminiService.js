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

/**
 * Parse a natural language task description into structured task data
 * @param {string} taskDescription - The natural language task description
 * @returns {Promise<Object>} - Structured task data
 */
export const parseNaturalLanguageTask = async (taskDescription) => {
    try {
        // If no description is provided, we can't parse it
        if (!taskDescription || taskDescription.trim() === '') {
            return null;
        }

        // Get current date to pass to the AI for reference
        const today = new Date();
        const currentDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Create a prompt that helps the model understand what we want
        const prompt = `
        Today's date is: ${currentDateString}
        
        Parse the following natural language task description into a structured task format.
        Task description: "${taskDescription}"
        
        Extract the following properties:
        - title: A concise title for the task (maximum 5-7 words)
        - description: Any additional details about the task (exclude date/time information that belongs elsewhere)
        - dueDate: Any mention of when the task is due (in YYYY-MM-DD format). For relative dates like "tomorrow" or "next Monday", convert to the appropriate date based on today's date above.
        - priority: The priority level (high, medium, or low)
        - category: The task category (work, personal, health, etc.)
        - tags: Any relevant tags as an array
        - estimatedDuration: Estimated time to complete in minutes
        - scheduledTime: If a specific time is mentioned (in ISO format with the date)
        
        Return your response as a JSON object with these fields.
        If a field is not mentioned, use null for that field (except for priority which should default to "medium" and category which should default to "general").
        Make educated guesses about fields that might be implied but not explicitly stated.
        
        IMPORTANT: If a date is mentioned (like "tomorrow", "next week", etc.), always convert it to the actual future date based on today being ${currentDateString}.
        `;

        // Generate content using Gemini
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        // Extract the response text
        const responseText = response.text;

        // Add debugging for the API response
        console.log("Raw response from Gemini:", responseText);

        // Parse the JSON response
        // The response might contain markdown code blocks or additional text, so we need to extract just the JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn("Couldn't extract JSON from Gemini response:", responseText);
            return null;
        }

        const jsonStr = jsonMatch[0];
        const parsedTask = JSON.parse(jsonStr);

        // Post-process dates to ensure they're in the future if they should be
        if (parsedTask.dueDate) {
            const dueDate = new Date(parsedTask.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

            // If the parsed date is in the past, assume it's meant to be for the next occurrence
            if (dueDate < today) {
                console.log("Detected past date, adjusting to future:", parsedTask.dueDate);

                // If it's just slightly in the past (yesterday or today), add a day
                const dayDiff = Math.round((today - dueDate) / (1000 * 60 * 60 * 24));

                if (dayDiff <= 1) {
                    dueDate.setDate(dueDate.getDate() + 1);
                } else {
                    // For dates further in the past, try to adjust to next occurrence
                    // (e.g., if "Monday" was mentioned and today is Wednesday, use next Monday)
                    dueDate.setDate(dueDate.getDate() + 7);
                }

                parsedTask.dueDate = dueDate.toISOString().split('T')[0];
            }
        }

        // Do the same for scheduledTime
        if (parsedTask.scheduledTime) {
            const scheduledTime = new Date(parsedTask.scheduledTime);
            const now = new Date();

            if (scheduledTime < now) {
                console.log("Detected past scheduled time, adjusting to future:", parsedTask.scheduledTime);

                // If it's today but earlier hour, move to tomorrow same time
                if (scheduledTime.toDateString() === now.toDateString()) {
                    scheduledTime.setDate(scheduledTime.getDate() + 1);
                } else {
                    // If it's a different day in the past, add appropriate days
                    const dayDiff = Math.round((now - scheduledTime) / (1000 * 60 * 60 * 24));
                    scheduledTime.setDate(scheduledTime.getDate() + (dayDiff + 1));
                }

                parsedTask.scheduledTime = scheduledTime.toISOString();
            }
        }

        // Clean up the response for consistency with our data model
        return {
            title: parsedTask.title || taskDescription.substring(0, 50), // Use part of the input as fallback title
            description: parsedTask.description || '',
            dueDate: parsedTask.dueDate || null,
            priority: parsedTask.priority || 'medium',
            category: parsedTask.category || 'general',
            tags: Array.isArray(parsedTask.tags) ? parsedTask.tags : [],
            estimatedDuration: parsedTask.estimatedDuration || 30,
            scheduledTime: parsedTask.scheduledTime || null
        };
    } catch (error) {
        console.error("Error parsing natural language task:", error);
        // More detailed error information
        if (error.response) {
            console.error("Gemini API error:", error.response.data);
        }
        return null;
    }
};

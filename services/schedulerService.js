import ProductivityRecord from '../models/productivityModel.js';
import UserPreferences from '../models/userPreferencesModel.js';

class SchedulerService {
    /**
     * Determine the time of day based on hour
     * @param {Number} hour - Hour of the day (0-23)
     * @returns {String} Time of day classification
     */
    getTimeOfDay(hour) {
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        return 'evening';
    }

    /**
     * Record a completed task's productivity metrics
     * @param {Object} task - The completed task
     * @param {Object} user - The user who completed the task
     */
    async recordProductivity(task, user) {
        if (!task.startedAt || !task.completedAt) {
            console.log('Missing time data for productivity tracking');
            return null;
        }

        const startTime = new Date(task.startedAt);
        const endTime = new Date(task.completedAt);
        const actualDuration = Math.round((endTime - startTime) / (1000 * 60)); // in minutes

        if (actualDuration <= 0 || actualDuration > 24 * 60) {
            console.log('Invalid duration detected:', actualDuration);
            return null;
        }

        // Calculate efficiency (closer to 1.0 is better)
        const estimatedDuration = task.estimatedDuration || 30;
        let efficiency;

        if (actualDuration <= estimatedDuration) {
            // Completed faster than or on time: 1.0 is perfect
            efficiency = actualDuration / estimatedDuration;
        } else {
            // Took longer than estimated: less than 1.0
            efficiency = estimatedDuration / actualDuration;
        }

        // Create productivity record
        const record = new ProductivityRecord({
            user: user._id,
            todo: task._id,
            timeOfDay: this.getTimeOfDay(startTime.getHours()),
            estimatedDuration,
            actualDuration,
            efficiency,
            taskType: task.taskType || 'general',
            category: task.category || 'general',
            dayOfWeek: startTime.getDay(),
            date: startTime
        });

        return await record.save();
    }

    /**
     * Get optimal time recommendations for a task
     * @param {Object} task - The task to schedule
     * @param {String} userId - The user's ID
     * @returns {Object} Recommended times and scheduling info
     */
    async getRecommendedTimes(task, userId) {
        // Get user's productivity data
        const productivityData = await this.analyzeUserProductivity(userId);

        // Get user preferences
        const userPrefs = await UserPreferences.findOne({ user: userId });

        // Determine task characteristics
        const taskType = task.taskType || 'general';
        const category = task.category || 'general';
        const priority = task.priority || 'medium';
        const duration = task.estimatedDuration || 30;

        // Calculate best time of day based on past efficiency
        let bestTimeOfDay = 'any';
        let highestEfficiency = 0;

        for (const timeOfDay of ['morning', 'afternoon', 'evening']) {
            const efficiencyForTimeOfDay = productivityData.timeOfDay[timeOfDay]?.efficiency || 0;
            if (efficiencyForTimeOfDay > highestEfficiency) {
                highestEfficiency = efficiencyForTimeOfDay;
                bestTimeOfDay = timeOfDay;
            }
        }

        // If we have task type specific data, use that
        const taskTypeEfficiency = productivityData.taskType[taskType]?.timeOfDay || {};
        for (const [timeOfDay, data] of Object.entries(taskTypeEfficiency)) {
            if (data.efficiency > highestEfficiency) {
                highestEfficiency = data.efficiency;
                bestTimeOfDay = timeOfDay;
            }
        }

        // Translate time of day to hours
        const timeRanges = {
            morning: { start: 8, end: 11 },
            afternoon: { start: 12, end: 16 },
            evening: { start: 17, end: 21 },
            any: { start: 9, end: 17 }
        };

        // Adjust based on user work hours if available
        if (userPrefs?.workHours) {
            const { startHour, endHour } = userPrefs.workHours;

            // Adjust time ranges based on user work hours
            for (const period in timeRanges) {
                if (timeRanges[period].start < startHour) {
                    timeRanges[period].start = startHour;
                }
                if (timeRanges[period].end > endHour) {
                    timeRanges[period].end = endHour;
                }
            }
        }

        // Find best day of week
        const bestDayOfWeek = this.findBestDayOfWeek(productivityData);

        // Calculate today's date and the best upcoming date
        const today = new Date();
        const todayDayOfWeek = today.getDay();
        const daysUntilBestDay = (bestDayOfWeek - todayDayOfWeek + 7) % 7;

        // Get recommended date and create time slots
        const recommendedDate = new Date(today);
        recommendedDate.setDate(today.getDate() + (daysUntilBestDay === 0 ? 7 : daysUntilBestDay));

        const { start, end } = timeRanges[bestTimeOfDay];

        // Create recommended time slots
        const timeSlots = [];
        for (let hour = start; hour <= end - Math.ceil(duration / 60); hour++) {
            const slot = new Date(recommendedDate);
            slot.setHours(hour, 0, 0, 0);

            timeSlots.push({
                start: new Date(slot),
                end: new Date(new Date(slot).setMinutes(duration))
            });
        }

        return {
            bestTimeOfDay,
            bestDayOfWeek,
            nextBestDate: recommendedDate,
            recommendedTimeSlots: timeSlots,
            efficiency: highestEfficiency,
            confidence: this.calculateConfidence(productivityData)
        };
    }

    /**
     * Find the best day of week based on user's productivity
     * @param {Object} productivityData - User's productivity data
     * @returns {Number} Best day of week (0-6)
     */
    findBestDayOfWeek(productivityData) {
        let bestDay = 1; // Monday default
        let highestEfficiency = 0;

        for (let day = 0; day < 7; day++) {
            const dayData = productivityData.dayOfWeek[day];
            if (dayData && dayData.efficiency > highestEfficiency) {
                highestEfficiency = dayData.efficiency;
                bestDay = day;
            }
        }

        return bestDay;
    }

    /**
     * Calculate confidence level of recommendations
     * @param {Object} productivityData - User's productivity data
     * @returns {Number} Confidence level (0-1)
     */
    calculateConfidence(productivityData) {
        // Base confidence on amount of data we have
        const totalRecords = productivityData.totalRecords || 0;

        if (totalRecords === 0) return 0;
        if (totalRecords < 5) return 0.3;
        if (totalRecords < 15) return 0.6;
        if (totalRecords < 30) return 0.8;
        return 0.95;
    }

    /**
     * Analyze user's productivity patterns
     * @param {String} userId - The user's ID
     * @returns {Object} Analyzed productivity data
     */
    async analyzeUserProductivity(userId) {
        // Get last 90 days of productivity records
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const records = await ProductivityRecord.find({
            user: userId,
            date: { $gte: ninetyDaysAgo }
        });

        // Group and analyze the data
        const result = {
            totalRecords: records.length,
            timeOfDay: { morning: {}, afternoon: {}, evening: {} },
            taskType: {},
            dayOfWeek: {}
        };

        if (records.length === 0) {
            return result;
        }

        // Group by time of day
        for (const timeOfDay of ['morning', 'afternoon', 'evening']) {
            const timeRecords = records.filter(r => r.timeOfDay === timeOfDay);

            if (timeRecords.length > 0) {
                const avgEfficiency = timeRecords.reduce((sum, r) => sum + r.efficiency, 0) / timeRecords.length;

                result.timeOfDay[timeOfDay] = {
                    count: timeRecords.length,
                    efficiency: avgEfficiency,
                    avgDuration: timeRecords.reduce((sum, r) => sum + r.actualDuration, 0) / timeRecords.length
                };
            }
        }

        // Group by task type
        const taskTypes = [...new Set(records.map(r => r.taskType))];
        for (const type of taskTypes) {
            const typeRecords = records.filter(r => r.taskType === type);

            result.taskType[type] = {
                count: typeRecords.length,
                efficiency: typeRecords.reduce((sum, r) => sum + r.efficiency, 0) / typeRecords.length,
                timeOfDay: {}
            };

            // Further group by time of day within each task type
            for (const timeOfDay of ['morning', 'afternoon', 'evening']) {
                const filteredRecords = typeRecords.filter(r => r.timeOfDay === timeOfDay);

                if (filteredRecords.length > 0) {
                    result.taskType[type].timeOfDay[timeOfDay] = {
                        count: filteredRecords.length,
                        efficiency: filteredRecords.reduce((sum, r) => sum + r.efficiency, 0) / filteredRecords.length
                    };
                }
            }
        }

        // Group by day of week
        for (let day = 0; day < 7; day++) {
            const dayRecords = records.filter(r => r.dayOfWeek === day);

            if (dayRecords.length > 0) {
                result.dayOfWeek[day] = {
                    count: dayRecords.length,
                    efficiency: dayRecords.reduce((sum, r) => sum + r.efficiency, 0) / dayRecords.length
                };
            }
        }

        return result;
    }
}

export default new SchedulerService();

import notifier from 'node-notifier';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (needed for ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NotificationService {
    constructor() {
        this.iconPath = path.join(__dirname, '../public/notification-icon.png');
    }

    /**
     * Send a desktop notification via node-notifier
     * @param {Object} options Notification options
     * @returns {Promise} Promise that resolves with notification result
     */
    async sendNotification(options) {
        return new Promise((resolve, reject) => {
            notifier.notify(
                {
                    title: options.title || 'Todo Notification',
                    message: options.message,
                    icon: this.iconPath,
                    sound: true,
                    wait: true
                },
                (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                }
            );

            // Handle notification click
            notifier.on('click', () => {
                resolve({ clicked: true });
            });
        });
    }

    /**
     * Send a task reminder notification
     * @param {Object} task The task object
     */
    async sendTaskReminder(task) {
        return this.sendNotification({
            title: 'Task Reminder',
            message: `Task "${task.title}" is due today!`
        });
    }

    /**
     * Send a task update notification
     * @param {string} message The notification message
     */
    async sendTaskUpdate(message) {
        return this.sendNotification({
            title: 'Task Update',
            message: message
        });
    }

    /**
     * Send a test notification
     */
    async sendTestNotification() {
        return this.sendNotification({
            title: 'Test Notification',
            message: 'This is a test notification from your Todo app!'
        });
    }
}

export default new NotificationService();

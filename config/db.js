import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        console.log('MongoDB URI value:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');

        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        return false;
    }
};

export default connectDB;

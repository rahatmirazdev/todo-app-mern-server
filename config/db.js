import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // console.log('MongoDB URI value:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');

        const conn = await mongoose.connect(process.env.MONGODB_URI);
        // console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;

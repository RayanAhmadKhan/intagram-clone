const mongoose = require('mongoose');
require('dotenv').config();

const connectToDB = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI).then(()=>{
        console.log('Connected to the database');
      })
    }catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    }
};

module.exports = connectToDB;
const mongoose=require('mongoose');
require('dotenv').config();



const dbConnect = () => {
  mongoose.connect(process.env.MONGO_URL);
  const db = mongoose.connection;
  db.once('connected', () => {
      console.log('Connected to MongoDB');
  });
  db.on('error', (err) => {
      console.log(err);
  });
};

module.exports = { dbConnect };


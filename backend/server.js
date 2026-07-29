const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const { server } = require('./app');
const connectToDB = require('./config/db');
const { startStoryExpiryJob } = require('./jobs/storyExpiryJob');

const PORT = process.env.PORT || 5000;

connectToDB();
startStoryExpiryJob();

// Boot up the server that has Socket.io initialized
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
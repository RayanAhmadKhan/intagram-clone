const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const app = require('./app');
const connectToDB = require('./config/db');

const PORT = process.env.PORT || 5000;

connectToDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

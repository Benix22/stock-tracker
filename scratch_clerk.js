const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const secretKey = env.split('\n').find(line => line.startsWith('CLERK_SECRET_KEY=')).split('=')[1].replace(/\"/g, '').trim();

fetch('https://api.clerk.com/v1/users/user_3CyxmSnkNxrh0nL4Sgkl0eFTR03', {
  headers: {
    'Authorization': 'Bearer ' + secretKey
  }
}).then(res => res.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
}).catch(err => console.error(err));

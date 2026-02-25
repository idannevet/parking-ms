const fs = require('fs');
const https = require('https');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, 'fix_ai_function.sql'), 'utf8');
const body = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/pqyueeqaugtrktatchqm/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sbp_5806cf5116b4ae00fa8986061bdbe268351e766c',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log('Status:', res.statusCode); console.log(data); });
});
req.on('error', (e) => console.error(e));
req.write(body);
req.end();

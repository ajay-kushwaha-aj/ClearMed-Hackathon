const fetch = require('node-fetch');

async function test() {
    const url = 'http://localhost:4000/api/auth';

    console.log('--- REGISTER ---');
    let res = await fetch(`${url}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Phone User', phone: '9876543211', password: 'password123' })
    });
    console.log('REGISTER STATUS:', res.status);
    console.log('REGISTER BODY:', await res.text());

    console.log('--- LOGIN ---');
    res = await fetch(`${url}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: '9876543211', password: 'password123' })
    });
    console.log('LOGIN STATUS:', res.status);
    console.log('LOGIN BODY:', await res.text());
}
test();

const http = require('http');

const PORTS = [
    { name: 'Express Backend', port: 3000, path: '/system-health' },
    { name: 'Hyper Core (Python)', port: 8000, path: '/' },
    { name: 'Vite Frontend', port: 3333, path: '/' }
];

async function checkPort({ name, port, path }) {
    return new Promise((resolve) => {
        const req = http.get({
            hostname: 'localhost',
            port: port,
            path: path,
            timeout: 2000
        }, (res) => {
            if (res.statusCode === 200) {
                console.log(`✅ ${name} (Port ${port}): ONLINE`);
                resolve(true);
            } else {
                console.log(`⚠️  ${name} (Port ${port}): Status ${res.statusCode}`);
                resolve(false);
            }
        });

        req.on('error', (err) => {
            console.log(`❌ ${name} (Port ${port}): OFFLINE (${err.code})`);
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`❌ ${name} (Port ${port}): TIMEOUT`);
            resolve(false);
        });
    });
}

async function run() {
    console.log('--- AIM3 LOCAL CONNECTIVITY CHECK ---');
    let allOk = true;
    for (const p of PORTS) {
        const ok = await checkPort(p);
        if (!ok) allOk = false;
    }
    console.log('--------------------------------------');
    if (allOk) {
        console.log('🎉 ALL SYSTEMS GO: Unified local environment is ready.');
    } else {
        console.log('💡 TIP: Run "npm run dev:united" or "start_dev.bat" to start all services.');
    }
}

run();

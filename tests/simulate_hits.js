const io = require('socket.io-client');

const URL = 'http://localhost:3000';

function makeClient(name) {
  const s = io(URL);
  s.on('connect', () => console.log(`${name} connected: ${s.id}`));
  s.on('matchFound', (data) => console.log(`${name} matchFound`, data));
  s.on('matchReady', (data) => console.log(`${name} matchReady`, data));
  s.on('gameStart', () => console.log(`${name} gameStart`));
  s.on('matchReady', (d) => console.log(name, 'ready', d));
  // log any event for debugging
  if (typeof s.onAny === 'function') {
    s.onAny((ev, ...args) => console.log(`${name} event:`, ev, args));
  }
  return s;
}

(async () => {
  const a = makeClient('A');
  const b = makeClient('B');

  // wait for both clients to connect
  await new Promise((resolve) => {
    let connected = 0;
    a.on('connect', () => { connected++; if (connected === 2) resolve(); });
    b.on('connect', () => { connected++; if (connected === 2) resolve(); });
  });

  a.emit('joinMatchmaking', { gameMode: 'ffa', maxPlayers: 2, playerName: 'A' });
  b.emit('joinMatchmaking', { gameMode: 'ffa', maxPlayers: 2, playerName: 'B' });

  // use B's socket id directly once connected
  const targetId = b.id;
  // after short delay (allow server to create room), emit rapid playerDamaged from A to B
  setTimeout(() => {
    console.log('Simulating rapid hits from A to', targetId);
    let sent = 0;
    const t = setInterval(() => {
      if (sent >= 9) { clearInterval(t); return; }
      a.emit('playerDamaged', { socketId: targetId, damageTaken: 120, damageDealer: 'A', attackerSocketId: a.id });
      sent++;
    }, 30);
  }, 1500);

  // cleanup after 5s
  setTimeout(() => { a.close(); b.close(); process.exit(0); }, 5000);
})();

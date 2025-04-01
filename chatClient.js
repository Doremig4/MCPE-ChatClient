/* ____ _           _    ____ _ _            _   
  / ___| |__   __ _| |_ / ___| (_) ___ _ __ | |_ 
 | |   | '_ \ / _` | __| |   | | |/ _ \ '_ \| __|
 | |___| | | | (_| | |_| |___| | |  __/ | | | |_ 
  \____|_| |_|\__,_|\__|\____|_|_|\___|_| |_|\__|
    written by @yeondu1062.
*/

const { Server } = require('socket.io');
const { exec } = require('child_process');
const address = require('./serverAddr.json');
const bedrock = require('bedrock-protocol');
const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const client = bedrock.createClient(address);
const io = new Server(server);

function getInternalIp() {
  return Object.values(os.networkInterfaces())
    .flat()
    .find(iface => iface.family === 'IPv4' && !iface.internal)?.address;
}

server.listen(3000, () => {
  const url = `http://${getInternalIp()}:3000`;
  console.log(`웹 서버가 ${url}에서 실행 중입니다.`);
  if(process.platform === 'win32') exec('start ' + url);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'html', 'index.html')));

client.on('text', packet => {
  if (packet.source_name == client.username) return;
  switch (packet.type) {
    case 'chat':
      io.emit('chat_message', `<${packet.source_name}> ${packet.message}`); break;
    case 'whisper':
      io.emit('whisper_message', `<${packet.source_name}> ${packet.message}`); break;
    case 'translation':
      if(packet.message == '§e%multiplayer.player.joined') io.emit('system_message', packet.parameters[0] + '이(가) 게임에 참여했습니다.');
      if(packet.message == '§e%multiplayer.player.left') io.emit('system_message', packet.parameters[0] + '이(가) 게임을 떠났습니다.');
      break;
    default:
      break;
  }
});

io.on('connection', socket => {
  console.log('새로운 세션 연결됨' + socket.handshake.address);
  socket.on('send_chat_message', message => {
    io.emit('chat_message', `<${client.username}> ${message}`);
    client.queue('text', {
      type: 'chat',
      needs_translation: false,
      source_name: client.username,
      xuid: '',
      platform_chat_id: '',
      filtered_message: '',
      message: message
    });
  });
});

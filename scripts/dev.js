const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const children = [
  spawn(process.execPath, ['server.js'], {
    cwd: path.join(root, 'backend'),
    stdio: 'inherit',
    shell: false
  }),
  spawn(process.execPath, [
    path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js'),
    'serve',
    '--proxy-config',
    'proxy.conf.json'
  ], {
    cwd: root,
    stdio: 'inherit',
    shell: false
  })
];

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(exitCode);
}

for (const child of children) {
  child.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

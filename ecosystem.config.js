module.exports = {
  apps: [
    {
      name: 'baristaos-nextjs',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/ubuntu/blfs-cafe',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/ubuntu/blfs-cafe/logs/nextjs-error.log',
      out_file: '/home/ubuntu/blfs-cafe/logs/nextjs-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'baristaos-socket',
      script: 'socket-server.js',
      cwd: '/home/ubuntu/blfs-cafe',
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 3001
      },
      error_file: '/home/ubuntu/blfs-cafe/logs/socket-error.log',
      out_file: '/home/ubuntu/blfs-cafe/logs/socket-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};

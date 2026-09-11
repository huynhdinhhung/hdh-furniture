import pg from 'pg';
const required = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
if (required.some(key => !process.env[key]) || process.env.PGPASSWORD === 'REPLACE_WITH_YOUR_PASSWORD') {
  console.error('Hãy nhập đầy đủ PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD trong .env.');
  process.exit(1);
}
const port = Number(process.env.PGPORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PGPORT không hợp lệ.'); process.exit(1);
}
const client = new pg.Client({ connectionTimeoutMillis: 5000, query_timeout: 5000 });
try {
  await client.connect();
  const { rows } = await client.query('SELECT current_database() AS database, current_user AS username, NOW() AS server_time');
  console.log('Kết nối PostgreSQL thành công.');
  console.table(rows);
} catch (error) {
  const hints = {
    '28P01': 'Sai tài khoản hoặc mật khẩu.',
    '3D000': 'Database chưa tồn tại hoặc sai tên.',
    '42501': 'Tài khoản thiếu quyền.',
    'ECONNREFUSED': 'Không truy cập được server. Kiểm tra PostgreSQL service, host và port.',
    'ENOTFOUND': 'Không tìm thấy host.'
  };
  console.error(hints[error.code] ?? 'Kết nối thất bại. Kiểm tra host, port, quyền truy cập và dịch vụ PostgreSQL.');
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

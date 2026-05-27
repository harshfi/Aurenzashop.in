const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/aurenza').then(async () => {
  const db = mongoose.connection.db;
  const hash = await bcrypt.hash('admin123', 10);
  await db.collection('admins').updateOne({ email: 'admin@aurenzashop.in' }, { $set: { password: hash } });
  console.log('Password updated to admin123');
  process.exit(0);
});

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// 환경 변수 설정
const env = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: env });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'src')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
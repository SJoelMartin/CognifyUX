import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mock endpoint for CLA events
app.post('/ingest-events', (req, res) => {
  console.log('[MOCK CLA SERVER] Received events:', JSON.stringify(req.body, null, 2));
  res.json({ success: true, message: 'Events received (mock)' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock CLA server running' });
});

app.listen(PORT, () => {
  console.log(`Mock CLA server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

import express from 'express';
import { json, urlencoded } from 'body-parser';
import cors from 'cors';
import apiRoutes from './routes/api';
import adminRoutes from './routes/admin';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());
app.use(json());
app.use(urlencoded({ extended: false }));

app.use(cors({
  optionsSuccessStatus: 200,
  credentials: true,
  origin: process.env.ORIGIN.split(',')
}));

// initialize passport

app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server run on port ${port}`);
});

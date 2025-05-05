import type { NextApiRequest, NextApiResponse } from 'next';

type HealthResponse = {
  status: string;
  message: string;
  container: string;
  environment: string;
  timestamp: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  res.status(200).json({
    status: 'ok',
    message: 'UI container is working properly',
    container: 'ui',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}
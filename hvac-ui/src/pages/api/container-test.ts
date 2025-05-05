import type { NextApiRequest, NextApiResponse } from 'next';

type ContainerTestResponse = {
  status: string;
  message: string;
  container: string;
  environment: string;
  timestamp: string;
  nextVersion?: string;
  nodeVersion?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContainerTestResponse>
) {
  res.status(200).json({
    status: 'ok',
    message: 'UI container is working properly',
    container: 'ui',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    nextVersion: process.env.NEXT_PUBLIC_VERSION || 'unknown',
    nodeVersion: process.version,
  });
}
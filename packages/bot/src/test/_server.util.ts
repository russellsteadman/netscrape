import express, { type Request } from 'express';
import { type Server } from 'http';

let currentPort = 3000;
const getPort = () => currentPort++;

export function createServer(robotsTxt: string) {
  const app = express();
  const requests: Request[] = [];
  app.get('/', (req, res) => {
    requests.push(req);
    res.send('Home');
  });
  app.get('/a', (req, res) => {
    requests.push(req);
    res.send('A');
  });
  app.get('/a/b', (req, res) => {
    requests.push(req);
    res.send('B');
  });
  app.get('/a/b/c', (req, res) => {
    requests.push(req);
    res.send('C');
  });
  app.get('/robots.txt', (req, res) => {
    requests.push(req);
    res.send(robotsTxt);
  });
  return { app, requests };
}

export async function startServer(robotsTxt: string) {
  const { app, requests } = createServer(robotsTxt);
  const port = getPort();
  const server = await new Promise<Server>((res) => {
    const s = app.listen(port, () => {
      res(s);
    });
  });

  return { server, requests, port };
}

export async function stopServer(server: Server) {
  await new Promise((res) => {
    server.close(() => {
      res(undefined);
    });
  });
}

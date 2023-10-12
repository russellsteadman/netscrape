import express, { type Request } from 'express';
import { type Server } from 'http';

let currentPort = 3000;
const getPort = () => currentPort++;

export function createServer(
  robotsTxt: string,
  options?: { robots400?: boolean; robots500?: boolean },
) {
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

    if (options?.robots400) return res.status(404).send('Not Found');
    if (options?.robots500)
      return res.status(500).send('Internal Server Error');

    res.set('cache-control', 'public, max-age=86400');
    res.send(robotsTxt);
  });
  return { app, requests };
}

export async function startServer(
  robotsTxt: string,
  options?: Parameters<typeof createServer>[1],
) {
  const { app, requests } = createServer(robotsTxt, options);
  const port = getPort();
  const server = await new Promise<Server>((res) => {
    const s = app.listen(port, () => {
      res(s);
    });
  });

  server.setMaxListeners(0);

  return { server, requests, port };
}

export async function stopServer(server: Server) {
  await new Promise((res) => {
    server.close(() => {
      res(undefined);
    });
  });
}

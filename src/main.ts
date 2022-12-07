import routes from "./handlers/routes";
import server from "./infra/server";
import { serverPort } from "./infra/config";

server
  .register(routes)
  .listen({ host: "0.0.0.0", port: serverPort }, (error, address) => {
    if (error) {
      server.log.error({ error }, "Cannot start server");
      process.exit(1);
    }
    server.log.info({ address, serverPort }, "Server listening");
    server.ready().then(() => {
      server.log.info({}, "Swagger is ready");
    });
  });

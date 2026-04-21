import { app } from "./app";
import { env } from "./config/env";
import cluster from "node:cluster";
import os from "node:os";

const startServer = () => {
  app.listen(env.port, () => {
    console.log(`Backend is running on http://localhost:${env.port} (pid: ${process.pid})`);
  });
};

if (env.enableClusterMode && cluster.isPrimary) {
  const cpuCount = os.availableParallelism?.() ?? os.cpus().length;
  const workers = env.clusterWorkers > 0 ? env.clusterWorkers : cpuCount;

  console.log(`Cluster mode enabled with ${workers} workers`);
  for (let index = 0; index < workers; index += 1) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.error(`Worker ${worker.process.pid} exited, restarting...`);
    cluster.fork();
  });
} else {
  // Entry point: khởi chạy HTTP server từ app đã cấu hình sẵn.
  startServer();
}

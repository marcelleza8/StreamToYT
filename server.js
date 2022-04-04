const child_process = require("child_process");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const colors = require("./utils/terminal-colors");

const PORT = 8080;

const app = express();

const httpServer = createServer(app);

const ws = new Server(httpServer, {
  transports: ["websocket"],
  path: "/ws",
});

ws.on("connection", (socket) => {
  console.log(
    `${colors.fg.green}${colors.bg.black}%s${colors.reset}`,
    " INICIADO COMUNICAÇÃO "
  );
  ffmpeg = null;
  streamLink = null;

  socket.on("stream", (buff) => {
    if (!ffmpeg) {
      console.log(`${colors.fg.red}%s${colors.reset}`, "FFMPEG INICIADO");
      ffmpeg = child_process.spawn("ffmpeg", [
        "-re",
        "-i",
        "-",
        "-vcodec",
        "libx264",
        "-ab",
        "128k",
        "-ac",
        "2",
        "-ar",
        "44100",
        "-r",
        "25",
        "-s",
        "1280x720",
        "-vb",
        "660k",
        "-f",
        "flv",
        streamLink,
      ]);

      ffmpeg.on("close", (code, signal) => {
        console.log(
          `FFmpeg child process closed, code ${code}, signal ${signal}`
        );
      });

      ffmpeg.stdin.on("error", (e) => {
        console.log("FFmpeg STDIN Error", e);
      });

      ffmpeg.stderr.on("data", (data) => {
        // console.log("FFmpeg STDERR:", data.toString());
      });

      console.log(ffmpeg.spawnargs.join(" "));
    }
    ffmpeg.stdin.write(buff);
  });

  socket.on("streamout", (data) => {
    console.log(`${colors.fg.red}%s${colors.reset}`, "FFMPEG FINALIZADO");
    ffmpeg.kill("SIGINT");
    ffmpeg = null;
  });

  socket.on("streamLink", ({ link }) => {
    streamLink = link;
    ws.emit("message", { msg: `Destino: ${streamLink}` });
  });

  ws.emit("message", {
    msg: "🛰️🛸 Conectado 🛸🛰️",
  });
});

app.use((req, res, next) => {
  console.log("HTTP Request: " + req.method + " " + req.originalUrl);
  return next();
});

app.use(express.static(__dirname + "/www"));

httpServer.listen(PORT);

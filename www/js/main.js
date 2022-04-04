(() => {
  const constraints = {
    video: {
      width: {
        min: 1280,
        ideal: 1920,
        max: 2560,
      },
      height: {
        min: 720,
        ideal: 1080,
        max: 1440,
      },
    },
  };

  let videoStream = null;
  let mediaRecorder = null;

  document.addEventListener("DOMContentLoaded", (e) => {
    const iniciarCaptura = document.querySelector("#iniciarCaptura");
    const terminarCaptura = document.querySelector("#terminarCaptura");
    const iniciarTransmissao = document.querySelector("#iniciarTransmissao");
    const terminarTransmissao = document.querySelector("#terminarTransmissao");
    const video = document.querySelector("#video");
    const streamLink = document.querySelector("#streamLink");
    const streamKey = document.querySelector("#streamKey");
    const logsList = document.querySelector("#logs");
    const sendStreamLink = document.querySelector("#send-stream-link");

    const local = window.location;
    const protocol = local.protocol.replace(/^http(s)?/, "ws$1");

    const socket = io(`${protocol}//${local.host}`, {
      transports: ["websocket"],
      path: "/ws/",
    });

    socket.on("message", ({ msg }) => {
      const newLi = Object.assign(document.createElement("li"), {
        className: "log-item",
        innerText: msg,
      });
      logsList.appendChild(newLi);
    });

    socket.on("close", function () {
      alert("FIM");
    });

    socket.on("disconnect", function () {
      document.querySelector("#msg-status").innerText =
        "❌ Conexão perdida ❌";
      socket.close();
    });

    iniciarCaptura.addEventListener("click", e => {
      capture(true, video);
    });

    sendStreamLink.addEventListener("click", e => {
      socket.emit("streamLink", {
        link: `${streamLink.value.replace(/\/*$/, '')}/${streamKey.value}`,
      });
    });

    terminarCaptura.addEventListener("click", e => {
      capture(socket, false, video);
    });

    iniciarTransmissao.addEventListener("click", e => {
      stream(socket, true);
    });

    terminarTransmissao.addEventListener("click", e => {
      socket.emit("streamout");
      stream(socket, false);
    });
  });

  async function capture(status, video) {
    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (!status) {
      videoStream.getTracks().forEach((track) => {
        track.stop();
      });
      video.srcObject = null;
    } else {
      video.srcObject = videoStream;
    }
  }

  function stream(ws, status) {
    if (!mediaRecorder) {
      mediaRecorder = new MediaRecorder(videoStream, {
        mimeType: "video/webm;codecs=opus,vp8"
      });

      mediaRecorder.addEventListener("dataavailable", (e) => {
        ws.emit("stream", e.data);
      });
    }

    if (status) {
      mediaRecorder.start(100);
    } else {
      mediaRecorder.stop();
    }
  }
})();
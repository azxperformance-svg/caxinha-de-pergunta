(function () {
  "use strict";

  var CANVAS_W = 1080;
  var CANVAS_H = 1920;

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");

  var els = {
    pergunta: document.getElementById("pergunta"),
    resposta: document.getElementById("resposta"),
    bgColor1: document.getElementById("bgColor1"),
    bgColor2: document.getElementById("bgColor2"),
    bgColor1Field: document.getElementById("bgColor1Field"),
    bgColor2Field: document.getElementById("bgColor2Field"),
    bgImageField: document.getElementById("bgImageField"),
    bgImage: document.getElementById("bgImage"),
    bgOverlay: document.getElementById("bgOverlay"),
    boxColor: document.getElementById("boxColor"),
    boxOpacity: document.getElementById("boxOpacity"),
    boxOpacityVal: document.getElementById("boxOpacityVal"),
    textColor: document.getElementById("textColor"),
    textSize: document.getElementById("textSize"),
    textSizeVal: document.getElementById("textSizeVal"),
    radius: document.getElementById("radius"),
    radiusVal: document.getElementById("radiusVal"),
    downloadBtn: document.getElementById("downloadBtn"),
    bgTypeGroup: document.getElementById("bgTypeGroup"),
    alignGroup: document.getElementById("alignGroup"),
  };

  var state = {
    pergunta: "",
    resposta: "",
    bgType: "solid", // solid | gradient | image
    bgColor1: els.bgColor1.value,
    bgColor2: els.bgColor2.value,
    bgImageEl: null,
    bgOverlay: true,
    boxColor: els.boxColor.value,
    boxOpacity: parseInt(els.boxOpacity.value, 10) / 100,
    textColor: els.textColor.value,
    textSize: parseInt(els.textSize.value, 10),
    align: "center",
    radius: parseInt(els.radius.value, 10),
  };

  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
      : { r: 0, g: 0, b: 0 };
  }

  function rgba(hex, alpha) {
    var c = hexToRgb(hex);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + alpha + ")";
  }

  function wrapText(context, text, maxWidth) {
    var paragraphs = String(text).replace(/\r\n/g, "\n").split("\n");
    var lines = [];
    paragraphs.forEach(function (paragraph) {
      if (paragraph === "") {
        lines.push("");
        return;
      }
      var words = paragraph.split(" ");
      var current = "";
      words.forEach(function (word) {
        var test = current ? current + " " + word : word;
        if (context.measureText(test).width > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      });
      if (current) lines.push(current);
    });
    return lines;
  }

  function roundRectPath(context, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + w, y, x + w, y + h, radius);
    context.arcTo(x + w, y + h, x, y + h, radius);
    context.arcTo(x, y + h, x, y, radius);
    context.arcTo(x, y, x + w, y, radius);
    context.closePath();
  }

  function drawBackground() {
    if (state.bgType === "gradient") {
      var g = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
      g.addColorStop(0, state.bgColor1);
      g.addColorStop(1, state.bgColor2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else if (state.bgType === "image" && state.bgImageEl) {
      var img = state.bgImageEl;
      var imgRatio = img.width / img.height;
      var canvasRatio = CANVAS_W / CANVAS_H;
      var sw, sh, sx, sy;
      if (imgRatio > canvasRatio) {
        sh = img.height;
        sw = sh * canvasRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = sw / canvasRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);
      if (state.bgOverlay) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
    } else {
      ctx.fillStyle = state.bgColor1;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }

  function render() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawBackground();

    var boxWidth = CANVAS_W * 0.86;
    var boxX = (CANVAS_W - boxWidth) / 2;
    var padX = boxWidth * 0.09;
    var padY = boxWidth * 0.08;
    var textMaxWidth = boxWidth - padX * 2;

    var fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    var hasQuestion = state.pergunta.trim().length > 0;
    var hasAnswer = state.resposta.trim().length > 0;
    var both = hasQuestion && hasAnswer;

    // When both fields are present, the question is shown as a smaller
    // label above the (bigger, bold) answer. When only one field is
    // present, it becomes the main text and gets the full size.
    var answerSize = state.textSize;
    var questionSize = both ? Math.round(state.textSize * 0.52) : state.textSize;
    var questionWeight = both ? "600" : "700";
    var questionOpacity = both ? 0.72 : 1;
    var lineGapAnswer = answerSize * 1.32;
    var lineGapQuestion = questionSize * 1.32;

    ctx.font = questionWeight + " " + questionSize + "px " + fontFamily;
    var questionLines = hasQuestion ? wrapText(ctx, state.pergunta.trim(), textMaxWidth) : [];

    ctx.font = "700 " + answerSize + "px " + fontFamily;
    var answerLines = hasAnswer ? wrapText(ctx, state.resposta.trim(), textMaxWidth) : [];

    var contentHeight = 0;
    if (hasQuestion) contentHeight += questionLines.length * lineGapQuestion;
    if (both) contentHeight += boxWidth * 0.05; // divider gap
    if (hasAnswer) contentHeight += answerLines.length * lineGapAnswer;

    var minEmptyHeight = boxWidth * 0.32;
    var boxHeight = (hasQuestion || hasAnswer) ? (padY * 2 + contentHeight) : minEmptyHeight;

    var boxY = (CANVAS_H - boxHeight) / 2;

    // Box with soft shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 46;
    ctx.shadowOffsetY = 18;
    roundRectPath(ctx, boxX, boxY, boxWidth, boxHeight, state.radius);
    ctx.fillStyle = rgba(state.boxColor, state.boxOpacity);
    ctx.fill();
    ctx.restore();

    // Text
    var textAlign = state.align;
    var textX;
    if (textAlign === "left") textX = boxX + padX;
    else if (textAlign === "right") textX = boxX + boxWidth - padX;
    else textX = boxX + boxWidth / 2;

    ctx.textAlign = textAlign;
    ctx.textBaseline = "alphabetic";

    var cursorY = boxY + padY;

    if (hasQuestion) {
      ctx.font = questionWeight + " " + questionSize + "px " + fontFamily;
      ctx.fillStyle = rgba(state.textColor, questionOpacity);
      cursorY += questionSize * 0.92;
      questionLines.forEach(function (line) {
        ctx.fillText(line, textX, cursorY);
        cursorY += lineGapQuestion;
      });
      cursorY += lineGapQuestion * 0.4 - questionSize * 0.92;
    }

    if (both) {
      var dividerY = cursorY + boxWidth * 0.025 - questionSize * 0.2;
      var dividerW = boxWidth * 0.14;
      var dividerX = textAlign === "left" ? boxX + padX
        : textAlign === "right" ? boxX + boxWidth - padX - dividerW
        : boxX + boxWidth / 2 - dividerW / 2;
      ctx.fillStyle = rgba(state.textColor, 0.18);
      ctx.fillRect(dividerX, dividerY, dividerW, 4);
      cursorY += boxWidth * 0.05 - questionSize * 0.2;
    }

    if (hasAnswer) {
      ctx.font = "700 " + answerSize + "px " + fontFamily;
      ctx.fillStyle = rgba(state.textColor, 1);
      cursorY += answerSize * 0.92;
      answerLines.forEach(function (line) {
        ctx.fillText(line, textX, cursorY);
        cursorY += lineGapAnswer;
      });
    }
  }

  function syncStateFromInputs() {
    state.pergunta = els.pergunta.value;
    state.resposta = els.resposta.value;
    state.bgColor1 = els.bgColor1.value;
    state.bgColor2 = els.bgColor2.value;
    state.bgOverlay = els.bgOverlay.checked;
    state.boxColor = els.boxColor.value;
    state.boxOpacity = parseInt(els.boxOpacity.value, 10) / 100;
    state.textColor = els.textColor.value;
    state.textSize = parseInt(els.textSize.value, 10);
    state.radius = parseInt(els.radius.value, 10);

    els.boxOpacityVal.textContent = els.boxOpacity.value + "%";
    els.textSizeVal.textContent = els.textSize.value + "px";
    els.radiusVal.textContent = els.radius.value + "px";
  }

  function scheduleRender() {
    syncStateFromInputs();
    render();
  }

  [
    els.pergunta, els.resposta, els.bgColor1, els.bgColor2, els.bgOverlay,
    els.boxColor, els.boxOpacity, els.textColor, els.textSize, els.radius,
  ].forEach(function (el) {
    el.addEventListener("input", scheduleRender);
  });

  els.bgImage.addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        state.bgImageEl = img;
        render();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  function setActiveSeg(group, attr, value) {
    Array.prototype.forEach.call(group.querySelectorAll(".seg-btn"), function (btn) {
      btn.classList.toggle("active", btn.dataset[attr] === value);
    });
  }

  els.bgTypeGroup.addEventListener("click", function (e) {
    var btn = e.target.closest(".seg-btn");
    if (!btn) return;
    state.bgType = btn.dataset.bgtype;
    setActiveSeg(els.bgTypeGroup, "bgtype", state.bgType);

    els.bgColor1Field.classList.toggle("hidden", state.bgType === "image");
    els.bgColor2Field.classList.toggle("hidden", state.bgType !== "gradient");
    els.bgImageField.classList.toggle("hidden", state.bgType !== "image");

    render();
  });

  els.alignGroup.addEventListener("click", function (e) {
    var btn = e.target.closest(".seg-btn");
    if (!btn) return;
    state.align = btn.dataset.align;
    setActiveSeg(els.alignGroup, "align", state.align);
    render();
  });

  els.downloadBtn.addEventListener("click", function () {
    syncStateFromInputs();
    render();
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      var ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = url;
      a.download = "caixinha-pergunta-" + ts + ".png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }, "image/png", 1.0);
  });

  syncStateFromInputs();
  render();
})();

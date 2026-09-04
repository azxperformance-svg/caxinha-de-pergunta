/*
 * Criador de Perguntas para Stories
 * Gera cards que simulam uma pergunta JÁ RECEBIDA na caixinha do Instagram.
 * Tudo roda no navegador: sem backend, sem dependências.
 */
(function () {
  "use strict";

  var BASE_W = 1080; // largura de referência usada para dimensionar a caixinha
  var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  var FORMATS = {
    story: { w: 1080, h: 1920, label: "1080 × 1920" },
    vertical: { w: 1080, h: 1350, label: "1080 × 1350" },
    square: { w: 1080, h: 1080, label: "1080 × 1080" },
    box: { w: 0, h: 0, label: "Automático" }
  };

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");

  var $ = function (id) { return document.getElementById(id); };

  var state = {
    format: "story",
    question: "Quanto custa o tratamento?",
    card: {
      headerText: "Faça uma pergunta",
      headerColor: "#1C1C1E",
      bodyColor: "#FFFFFF",
      headerTextColor: "#E9E9EB",
      qColor: "#1A1A1A",
      widthFrac: 0.82,
      radius: 44,
      scale: 1,
      shadow: false,
      cx: 0.5,
      cy: 0.5
    },
    q: { size: 52, align: "center", wrap: true },
    answer: {
      text: "",
      size: 54,
      color: "#FFFFFF",
      align: "center",
      pos: "below",
      cx: 0.5,
      cy: 0.75
    },
    bg: {
      type: "solid",
      color1: "#6C4AE6",
      color2: "#FF6EC7",
      angle: "diagonal",
      image: null,
      dim: false
    }
  };

  /* ------------------------------------------------------------------ */
  /* utilidades                                                          */
  /* ------------------------------------------------------------------ */

  function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }

  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    return m
      ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
      : { r: 0, g: 0, b: 0 };
  }

  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }

  function setFont(context, weight, size) {
    context.font = weight + " " + size + "px " + FONT;
  }

  function wrapLines(context, text, maxWidth) {
    var out = [];
    String(text).replace(/\r\n/g, "\n").split("\n").forEach(function (para) {
      if (para.trim() === "") { out.push(""); return; }
      var line = "";

      para.split(/\s+/).forEach(function (word) {
        // Palavra maior que a linha inteira: quebra por caractere.
        while (word && context.measureText(word).width > maxWidth) {
          if (line) { out.push(line); line = ""; continue; }
          var cut = 1;
          while (cut < word.length &&
                 context.measureText(word.slice(0, cut + 1)).width <= maxWidth) cut++;
          out.push(word.slice(0, cut));
          word = word.slice(cut);
        }
        if (!word) return;

        var test = line ? line + " " + word : word;
        if (line && context.measureText(test).width > maxWidth) {
          out.push(line);
          line = word;
        } else {
          line = test;
        }
      });

      if (line) out.push(line);
    });
    while (out.length > 1 && out[out.length - 1] === "") out.pop();
    return out;
  }

  function roundRect(context, x, y, w, h, r) {
    var rad = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + rad, y);
    context.arcTo(x + w, y, x + w, y + h, rad);
    context.arcTo(x + w, y + h, x, y + h, rad);
    context.arcTo(x, y + h, x, y, rad);
    context.arcTo(x, y, x + w, y, rad);
    context.closePath();
  }

  function alignX(align, left, width, pad) {
    if (align === "left") return left + pad;
    if (align === "right") return left + width - pad;
    return left + width / 2;
  }

  /* ------------------------------------------------------------------ */
  /* layout                                                              */
  /* ------------------------------------------------------------------ */

  // Mede a caixinha (largura, altura, linhas já quebradas) para uma fonte específica.
  function measureCardAt(qFont) {
    var c = state.card;
    var S = c.scale;
    // A caixinha nunca pode ultrapassar a largura do criativo.
    var cardW = Math.min(BASE_W, Math.round(BASE_W * c.widthFrac * S));
    var padX = cardW * 0.085;
    var maxTextW = cardW - padX * 2;

    var hFont = Math.max(16, Math.round(qFont * 0.5));
    var headerH = Math.round(hFont * 3.1);

    var text = state.question.trim();
    var lines = [];

    if (text) {
      if (state.q.wrap) {
        setFont(ctx, "600", qFont);
        lines = wrapLines(ctx, text, maxTextW);
      } else {
        // sem quebra: reduz a fonte até caber em uma única linha
        var single = text.replace(/\s*\n\s*/g, " ");
        setFont(ctx, "600", qFont);
        while (qFont > 12 && ctx.measureText(single).width > maxTextW) {
          qFont -= 1;
          setFont(ctx, "600", qFont);
        }
        lines = [single];
      }
    }

    var lineH = qFont * 1.32;
    var bodyPadY = Math.max(qFont * 0.85, cardW * 0.07);
    var bodyH = Math.max(lines.length * lineH + bodyPadY * 2, headerH * 2.4);

    return {
      w: cardW,
      h: headerH + bodyH,
      headerH: headerH,
      headerFont: hFont,
      padX: padX,
      qFont: qFont,
      lineH: lineH,
      lines: lines,
      radius: Math.min(c.radius * S, cardW / 2)
    };
  }

  // Mede a caixinha garantindo que ela caiba na altura do criativo.
  function measureCard(maxH) {
    var base = state.q.size * state.card.scale;
    var m = measureCardAt(base);
    var font = base;
    while (maxH && m.h > maxH && font > 14) {
      font = Math.max(14, font - 2);
      m = measureCardAt(font);
    }
    return m;
  }

  // Monta todo o cenário para um formato. `fmt` opcional sobrescreve o atual.
  function buildLayout(fmt) {
    fmt = fmt || state.format;
    var card = measureCard(fmt === "box" ? 0 : FORMATS[fmt].h);
    var hasCard = state.question.trim().length > 0;
    var hasAnswer = state.answer.text.trim().length > 0;

    var W, H, pixelScale = 1, pad = 0;

    if (fmt === "box") {
      pad = state.card.shadow ? Math.round(card.w * 0.09) : 6;
      W = card.w + pad * 2;
      H = card.h + pad * 2;
      pixelScale = clamp(1400 / W, 1, 4);
    } else {
      W = FORMATS[fmt].w;
      H = FORMATS[fmt].h;
    }

    var layout = {
      fmt: fmt,
      W: W,
      H: H,
      pixelScale: pixelScale,
      card: card,
      hasCard: hasCard,
      hasAnswer: hasAnswer,
      boxOnly: fmt === "box"
    };

    if (fmt === "box") {
      card.x = pad;
      card.y = pad;
      layout.hasAnswer = false;
      layout.hasCard = true; // no modo caixinha sempre mostramos o card
      return layout;
    }

    card.x = Math.round(state.card.cx * W - card.w / 2);
    card.y = Math.round(state.card.cy * H - card.h / 2);

    if (hasAnswer) {
      var a = state.answer;
      var maxW = W * 0.86;
      setFont(ctx, "700", a.size);
      var lines = wrapLines(ctx, a.text.trim(), maxW);
      var lineH = a.size * 1.3;
      var h = lines.length * lineH;
      var gap = Math.round(H * 0.035);
      var cx, top;

      if (a.pos === "below" && hasCard) {
        cx = card.x + card.w / 2;
        top = card.y + card.h + gap;
      } else if (a.pos === "above" && hasCard) {
        cx = card.x + card.w / 2;
        top = card.y - gap - h;
      } else {
        cx = a.cx * W;
        top = a.cy * H - h / 2;
      }

      layout.answer = {
        lines: lines,
        lineH: lineH,
        font: a.size,
        h: h,
        w: maxW,
        x: cx - maxW / 2,
        y: top
      };
    }

    return layout;
  }

  /* ------------------------------------------------------------------ */
  /* desenho                                                             */
  /* ------------------------------------------------------------------ */

  var checkerPattern = null;

  function getChecker(context) {
    if (checkerPattern) return checkerPattern;
    var t = document.createElement("canvas");
    t.width = t.height = 40;
    var c = t.getContext("2d");
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 40, 40);
    c.fillStyle = "#e6e6e8";
    c.fillRect(0, 0, 20, 20);
    c.fillRect(20, 20, 20, 20);
    checkerPattern = context.createPattern(t, "repeat");
    return checkerPattern;
  }

  function drawBackground(context, L, forExport) {
    var bg = state.bg;

    if (L.boxOnly || bg.type === "transparent") {
      if (!forExport) {
        context.fillStyle = getChecker(context);
        context.fillRect(0, 0, L.W, L.H);
      }
      return;
    }

    if (bg.type === "gradient") {
      var g;
      if (bg.angle === "vertical") g = context.createLinearGradient(0, 0, 0, L.H);
      else if (bg.angle === "horizontal") g = context.createLinearGradient(0, 0, L.W, 0);
      else g = context.createLinearGradient(0, 0, L.W, L.H);
      g.addColorStop(0, bg.color1);
      g.addColorStop(1, bg.color2);
      context.fillStyle = g;
      context.fillRect(0, 0, L.W, L.H);
      return;
    }

    if (bg.type === "image" && bg.image) {
      var img = bg.image;
      var ir = img.width / img.height;
      var cr = L.W / L.H;
      var sw, sh, sx, sy;
      if (ir > cr) { sh = img.height; sw = sh * cr; sx = (img.width - sw) / 2; sy = 0; }
      else { sw = img.width; sh = sw / cr; sx = 0; sy = (img.height - sh) / 2; }
      context.drawImage(img, sx, sy, sw, sh, 0, 0, L.W, L.H);
      if (bg.dim) {
        context.fillStyle = "rgba(0,0,0,0.35)";
        context.fillRect(0, 0, L.W, L.H);
      }
      return;
    }

    context.fillStyle = bg.color1;
    context.fillRect(0, 0, L.W, L.H);
  }

  function drawCard(context, L) {
    var c = state.card;
    var card = L.card;
    var x = card.x, y = card.y, w = card.w, h = card.h;

    // corpo (com sombra opcional)
    context.save();
    if (c.shadow) {
      context.shadowColor = "rgba(0,0,0,0.22)";
      context.shadowBlur = w * 0.07;
      context.shadowOffsetY = w * 0.022;
    }
    roundRect(context, x, y, w, h, card.radius);
    context.fillStyle = c.bodyColor;
    context.fill();
    context.restore();

    // cabeçalho escuro, recortado pelo arredondamento do card
    context.save();
    roundRect(context, x, y, w, h, card.radius);
    context.clip();
    context.fillStyle = c.headerColor;
    context.fillRect(x, y, w, card.headerH);
    context.restore();

    // texto do topo
    var headerText = c.headerText.trim();
    if (headerText) {
      context.save();
      setFont(context, "600", card.headerFont);
      context.fillStyle = c.headerTextColor;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(headerText, x + w / 2, y + card.headerH / 2, w - card.padX);
      context.restore();
    }

    // pergunta recebida, centralizada verticalmente no corpo
    if (card.lines.length) {
      context.save();
      setFont(context, "600", card.qFont);
      context.fillStyle = c.qColor;
      context.textAlign = state.q.align;
      context.textBaseline = "middle";

      var bodyTop = y + card.headerH;
      var bodyH = h - card.headerH;
      var textH = card.lines.length * card.lineH;
      var cursor = bodyTop + (bodyH - textH) / 2 + card.lineH / 2;
      var tx = alignX(state.q.align, x, w, card.padX);

      card.lines.forEach(function (line) {
        context.fillText(line, tx, cursor);
        cursor += card.lineH;
      });
      context.restore();
    }
  }

  function drawAnswer(context, L) {
    var a = L.answer;
    context.save();
    setFont(context, "700", a.font);
    context.fillStyle = state.answer.color;
    context.textAlign = state.answer.align;
    context.textBaseline = "middle";
    var tx = alignX(state.answer.align, a.x, a.w, 0);
    var cursor = a.y + a.lineH / 2;
    a.lines.forEach(function (line) {
      context.fillText(line, tx, cursor);
      cursor += a.lineH;
    });
    context.restore();
  }

  function drawPlaceholder(context, L) {
    context.save();
    setFont(context, "500", Math.round(L.W * 0.032));
    context.fillStyle = "rgba(120,120,130,0.75)";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Digite a pergunta recebida", L.W / 2, L.H / 2);
    context.restore();
  }

  function renderTo(context, L, forExport) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.scale(L.pixelScale, L.pixelScale);

    drawBackground(context, L, forExport);
    if (L.hasCard) drawCard(context, L);
    if (L.hasAnswer && L.answer) drawAnswer(context, L);
    if (!forExport && !L.hasCard && !L.hasAnswer) drawPlaceholder(context, L);
  }

  var currentLayout = null;

  function render() {
    var L = buildLayout();
    currentLayout = L;
    var pw = Math.round(L.W * L.pixelScale);
    var ph = Math.round(L.H * L.pixelScale);
    if (canvas.width !== pw) canvas.width = pw;
    if (canvas.height !== ph) canvas.height = ph;
    renderTo(ctx, L, false);

    var f = FORMATS[state.format];
    $("sizeTag").textContent = state.format === "box"
      ? Math.round(L.W * L.pixelScale) + " × " + Math.round(L.H * L.pixelScale) + " (auto)"
      : f.label;
  }

  /* ------------------------------------------------------------------ */
  /* exportação                                                          */
  /* ------------------------------------------------------------------ */

  function exportPNG(fmt, suffix) {
    var L = buildLayout(fmt);
    var off = document.createElement("canvas");
    off.width = Math.round(L.W * L.pixelScale);
    off.height = Math.round(L.H * L.pixelScale);
    var octx = off.getContext("2d");
    renderTo(octx, L, true);

    var finish = function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      var stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
      a.href = url;
      a.download = "caixinha-" + suffix + "-" + stamp + ".png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    };

    if (off.toBlob) off.toBlob(finish, "image/png");
    else {
      var a2 = document.createElement("a");
      a2.href = off.toDataURL("image/png");
      a2.download = "caixinha-" + suffix + ".png";
      a2.click();
    }
  }

  /* ------------------------------------------------------------------ */
  /* arrastar no preview                                                 */
  /* ------------------------------------------------------------------ */

  var drag = null;

  function pointerPos(e) {
    var r = canvas.getBoundingClientRect();
    var L = currentLayout;
    return {
      x: (e.clientX - r.left) / r.width * L.W,
      y: (e.clientY - r.top) / r.height * L.H
    };
  }

  function inRect(p, x, y, w, h) {
    return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
  }

  canvas.addEventListener("pointerdown", function (e) {
    var L = currentLayout;
    if (!L || L.boxOnly) return;
    var p = pointerPos(e);

    if (L.hasAnswer && L.answer && inRect(p, L.answer.x, L.answer.y, L.answer.w, L.answer.h)) {
      drag = { target: "answer", dx: p.x - (L.answer.x + L.answer.w / 2), dy: p.y - (L.answer.y + L.answer.h / 2) };
    } else if (L.hasCard && inRect(p, L.card.x, L.card.y, L.card.w, L.card.h)) {
      drag = { target: "card", dx: p.x - (L.card.x + L.card.w / 2), dy: p.y - (L.card.y + L.card.h / 2) };
    } else {
      return;
    }

    canvas.classList.add("dragging");
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var L = currentLayout;
    var p = pointerPos(e);
    var cx = clamp((p.x - drag.dx) / L.W, 0, 1);
    var cy = clamp((p.y - drag.dy) / L.H, 0, 1);

    if (drag.target === "card") {
      state.card.cx = cx;
      state.card.cy = cy;
    } else {
      state.answer.cx = cx;
      state.answer.cy = cy;
      if (state.answer.pos !== "free") {
        state.answer.pos = "free";
        setSegActive($("aPos"), "pos", "free");
      }
    }
    render();
    e.preventDefault();
  });

  function endDrag(e) {
    if (!drag) return;
    drag = null;
    canvas.classList.remove("dragging");
    if (e && e.pointerId != null && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  /* ------------------------------------------------------------------ */
  /* ligação com os controles                                            */
  /* ------------------------------------------------------------------ */

  function setSegActive(group, attr, value) {
    Array.prototype.forEach.call(group.querySelectorAll(".seg"), function (b) {
      b.classList.toggle("active", b.dataset[attr] === value);
    });
  }

  function onSeg(group, attr, handler) {
    group.addEventListener("click", function (e) {
      var btn = e.target.closest(".seg");
      if (!btn || !group.contains(btn)) return;
      var value = btn.dataset[attr];
      setSegActive(group, attr, value);
      handler(value);
      render();
    });
  }

  function bind(id, event, handler) {
    $(id).addEventListener(event || "input", function (e) {
      handler(e.target);
      render();
    });
  }

  // textos
  bind("pergunta", "input", function (el) { state.question = el.value; });
  bind("resposta", "input", function (el) { state.answer.text = el.value; });
  bind("headerText", "input", function (el) { state.card.headerText = el.value; });

  // caixinha
  bind("headerColor", "input", function (el) { state.card.headerColor = el.value; });
  bind("bodyColor", "input", function (el) { state.card.bodyColor = el.value; });
  bind("headerTextColor", "input", function (el) { state.card.headerTextColor = el.value; });
  bind("qColor", "input", function (el) { state.card.qColor = el.value; });
  bind("shadow", "change", function (el) { state.card.shadow = el.checked; });

  bind("cardWidth", "input", function (el) {
    state.card.widthFrac = +el.value / 100;
    $("cardWidthVal").textContent = el.value + "%";
  });
  bind("radius", "input", function (el) {
    state.card.radius = +el.value;
    $("radiusVal").textContent = el.value;
  });
  bind("scale", "input", function (el) {
    state.card.scale = +el.value / 100;
    $("scaleVal").textContent = el.value + "%";
  });

  // pergunta
  bind("qSize", "input", function (el) {
    state.q.size = +el.value;
    $("qSizeVal").textContent = el.value;
  });
  bind("qWrap", "change", function (el) { state.q.wrap = el.checked; });
  onSeg($("qAlign"), "align", function (v) { state.q.align = v; });

  // resposta
  bind("aSize", "input", function (el) {
    state.answer.size = +el.value;
    $("aSizeVal").textContent = el.value;
  });
  bind("aColor", "input", function (el) { state.answer.color = el.value; });
  onSeg($("aAlign"), "align", function (v) { state.answer.align = v; });
  onSeg($("aPos"), "pos", function (v) { state.answer.pos = v; });

  // fundo
  bind("bgColor1", "input", function (el) { state.bg.color1 = el.value; });
  bind("bgColor2", "input", function (el) { state.bg.color2 = el.value; });
  bind("bgAngle", "change", function (el) { state.bg.angle = el.value; });
  bind("bgDim", "change", function (el) { state.bg.dim = el.checked; });

  onSeg($("bgType"), "bg", function (v) {
    state.bg.type = v;
    $("bg1Field").hidden = !(v === "solid" || v === "gradient");
    $("bg2Field").hidden = v !== "gradient";
    $("bgAngleField").hidden = v !== "gradient";
    $("bgImageField").hidden = v !== "image";
  });

  $("bgImage").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () { state.bg.image = img; render(); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // formato
  onSeg($("formatBar"), "format", function (v) {
    state.format = v;
    $("stageHint").textContent = v === "box"
      ? "Exportação automática com fundo transparente."
      : "Arraste a caixinha no preview para reposicionar.";
  });

  // ações
  $("btnCenter").addEventListener("click", function () {
    state.card.cx = 0.5;
    state.card.cy = 0.5;
    state.answer.cx = 0.5;
    state.answer.cy = 0.75;
    render();
  });

  $("btnClear").addEventListener("click", function () {
    state.question = "";
    state.answer.text = "";
    $("pergunta").value = "";
    $("resposta").value = "";
    state.card.cx = 0.5;
    state.card.cy = 0.5;
    render();
    $("pergunta").focus();
  });

  $("btnDownload").addEventListener("click", function () {
    exportPNG(state.format, state.format);
  });

  $("btnDownloadBox").addEventListener("click", function () {
    exportPNG("box", "transparente");
  });

  /* ------------------------------------------------------------------ */
  /* estado inicial                                                      */
  /* ------------------------------------------------------------------ */

  $("pergunta").value = state.question;
  $("resposta").value = state.answer.text;
  setSegActive($("formatBar"), "format", state.format);
  setSegActive($("qAlign"), "align", state.q.align);
  setSegActive($("aAlign"), "align", state.answer.align);
  setSegActive($("aPos"), "pos", state.answer.pos);
  setSegActive($("bgType"), "bg", state.bg.type);
  $("bg1Field").hidden = false;

  render();
})();

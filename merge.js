function parseSRT(srt) {
  return srt.trim().split(/\n{2,}/).map(block => {
    const lines = block.split("\n");
    return {
      index: lines[0],
      time: lines[1]
    };
  });
}

function getTranslatedTexts(srt) {
  const lines = srt.split("\n").map(l => l.trim()).filter(l => l);
  const result = [];
  let temp = [];

  for (let line of lines) {
    if (/^\d+$/.test(line)) {
      if (temp.length) {
        result.push(temp.join("\n"));
        temp = [];
      }
      continue;
    }

    if (line.includes("-->")) continue;

    temp.push(line);
  }

  if (temp.length) result.push(temp.join("\n"));

  return result;
}

function merge() {
  const original = parseSRT(document.getElementById("original").value);
  const translated = getTranslatedTexts(document.getElementById("translated").value);

  const result = original.map((item, i) => {
    return `${item.index}
${item.time}
${translated[i] || ""}`;
  }).join("\n\n");

  document.getElementById("result").value = result;
}
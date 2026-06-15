function parseSRT(srt) {
    return srt
        .trim()
        .split(/\n{2,}/)
        .map(block => {
            const lines = block.trim().split("\n");

            return {
                index: lines[0],
                time: lines[1]
            };
        });
}

function getTranslatedTexts(srt) {
    const lines = srt
        .split("\n")
        .map(l => l.trim())
        .filter(l => l);

    const result = [];
    let temp = [];

    for (const line of lines) {
        if (/^\d+$/.test(line)) {
            if (temp.length) {
                result.push(temp.join("\n"));
                temp = [];
            }
            continue;
        }

        if (line.includes("-->")) {
            continue;
        }

        temp.push(line);
    }

    if (temp.length) {
        result.push(temp.join("\n"));
    }

    return result;
}

function timeToMs(time) {
    const [h, m, rest] = time.split(":");
    const [s, ms] = rest.split(",");

    return (
        parseInt(h) * 3600000 +
        parseInt(m) * 60000 +
        parseInt(s) * 1000 +
        parseInt(ms)
    );
}

function checkSRT(items) {
    const errors = [];

    for (let i = 0; i < items.length; i++) {
        const [start, end] = items[i].time.split(" --> ");

        const startMs = timeToMs(start);
        const endMs = timeToMs(end);

        const duration = endMs - startMs;

        if (duration < 1000) {
            errors.push(
                `Dòng ${items[i].index}: thời lượng chỉ ${duration}ms`
            );
        }

        if (i < items.length - 1) {
            const nextStart = items[i + 1].time.split(" --> ")[0];
            const nextStartMs = timeToMs(nextStart);

            if (endMs === nextStartMs) {
                errors.push(
                    `Dòng ${items[i].index} và ${items[i + 1].index}: thời gian trùng nhau`
                );
            }

            if (endMs > nextStartMs) {
                errors.push(
                    `Dòng ${items[i].index} và ${items[i + 1].index}: bị chồng thời gian`
                );
            }
        }
    }

    return errors;
}

function merge() {
    const original = parseSRT(
        document.getElementById("original").value
    );

    const translated = getTranslatedTexts(
        document.getElementById("translated").value
    );

    const errors = checkSRT(original);

    if (errors.length) {
        alert(
            "Phát hiện lỗi SRT:\n\n" +
            errors.join("\n")
        );
    }

    const result = original.map((item, i) => {
        return `${item.index}
${item.time}
${translated[i] || ""}`;
    }).join("\n\n");

    document.getElementById("result").value = result;
}

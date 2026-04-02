function parseSRT(srt) {
    return srt
        .trim()
        .split(/\n\s*\n/) // 🔥 fix dòng trống có space
        .map(block => {
            const lines = block.split("\n");

            return {
                index: lines[0]?.trim(),
                time: lines[1]?.trim(),
                text: lines
                    .slice(2)
                    .join(" ")
                    .replace(/\s+/g, " ")
                    .trim()
            };
        });
}

// chia chunk 150
function chunk(arr, size = 150) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}

// 🔥 TEMPLATE PROMPT CHUẨN
function buildPrompt(content) {
    return `Bạn là công cụ dịch phụ đề SRT cực kỳ chính xác.
Nhiệm vụ:
Dịch toàn bộ nội dung thoại sang tiếng Việt.

QUY TẮC BẮT BUỘC (KHÔNG ĐƯỢC VI PHẠM):
GIỮ NGUYÊN 100% số thứ tự subtitle (index).
XÓA TOÀN BỘ timestamp (dòng chứa "-->").
MỖI index CHỈ có DUY NHẤT 1 dòng dịch tương ứng.
KHÔNG gộp nhiều subtitle thành một.
KHÔNG tách một subtitle thành nhiều dòng.
KHÔNG bỏ sót bất kỳ index nào.
KHÔNG thêm bất kỳ nội dung nào ngoài bản dịch.
SỐ LƯỢNG index trong output PHẢI BẰNG input.
GIỮ NGUYÊN thứ tự các index.
ĐỊNH DẠNG OUTPUT:
[index]
[nội dung đã dịch]

Bây giờ hãy dịch:

${content}`;
}

function generate() {
    const input = document.getElementById("input").value;
    const data = parseSRT(input);
    const chunks = chunk(data, 150);

    const container = document.getElementById("output");
    container.innerHTML = "";

    chunks.forEach((c, i) => {
    const start = c[0]?.index;
    const end = c[c.length - 1]?.index;
        const content = c.map(item =>
            `${item.index}
${item.time}
${item.text}`
        ).join("\n");

        const prompt = buildPrompt(content);

        const div = document.createElement("div");
        div.className = "prompt-box";

        div.innerHTML = `
  <div class="prompt-actions">
    <b>PROMPT ${i + 1} (${start} → ${end})</b>
    
    <div>
      <button class="copy-btn">Copy</button>
      <button class="ok-btn">✅ OK</button>
      <button class="fail-btn">❌ Lỗi</button>
    </div>

    <span class="status"></span>
  </div>

  <textarea readonly>${prompt}</textarea>
`;

        // 🔥 lấy đúng từng element trong box
        const btnCopy = div.querySelector(".copy-btn");
        const btnOK = div.querySelector(".ok-btn");
        const btnFail = div.querySelector(".fail-btn");
        const textarea = div.querySelector("textarea");
        const status = div.querySelector(".status");

        // COPY
        btnCopy.onclick = async () => {
            try {
                await navigator.clipboard.writeText(textarea.value);
                status.textContent = "📋 Đã copy";
                status.style.color = "blue";
            } catch {
                status.textContent = "❌ Copy lỗi";
                status.style.color = "red";
            }

            setTimeout(() => status.textContent = "", 2000);
        };

        // OK
        btnOK.onclick = () => {
            status.textContent = "✅ Dịch OK";
            status.style.color = "green";

            // optional: highlight nút
            btnOK.classList.add("active");
            btnFail.classList.remove("active");
        };

        // FAIL
        btnFail.onclick = () => {
            status.textContent = "❌ Dịch lỗi";
            status.style.color = "red";

            btnFail.classList.add("active");
            btnOK.classList.remove("active");
        };

        container.appendChild(div);
    });

    updateInfo(chunks.length);
}

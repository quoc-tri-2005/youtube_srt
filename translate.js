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
function chunk(arr, size = 100) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}

// 🔥 TEMPLATE PROMPT CHUẨN
function buildPrompt(content) {
    return `Bạn là công cụ dịch phụ đề SRT tuyệt đối chính xác theo cấu trúc gốc.

MỤC TIÊU ƯU TIÊN CAO NHẤT:
GIỮ NGUYÊN SỐ LƯỢNG SUBTITLE VÀ CẤU TRÚC INDEX.
Độ tự nhiên của câu văn KHÔNG quan trọng bằng việc giữ đúng cấu trúc.

QUY TẮC BẮT BUỘC:

* GIỮ NGUYÊN toàn bộ index.
* XÓA toàn bộ timestamp.
* MỖI index chỉ được phép xuất hiện DUY NHẤT 1 dòng dịch.
* KHÔNG được gộp 2 index.
* KHÔNG được chia nhỏ 1 index.
* KHÔNG được viết câu hoàn chỉnh bằng cách nối subtitle trước/sau.
* KHÔNG được bỏ sót bất kỳ index nào.
* OUTPUT phải có số index bằng EXACTLY input.
* Mỗi subtitle phải dịch độc lập, coi như không liên quan subtitle kế tiếp.

QUAN TRỌNG:
Nếu subtitle gốc chỉ là cụm ngắn, từ ngắn hoặc câu chưa hoàn chỉnh thì bản dịch cũng phải giữ dạng ngắn/chưa hoàn chỉnh tương ứng.

Ví dụ:

Input:
1553
白天要处理工

1554
地的事情

Output đúng:
1553
Ban ngày phải xử lý công

1554
Việc ở công trường

KHÔNG được dịch thành:
1553
Ban ngày phải xử lý việc ở công trường

Vì như vậy là đã GỘP NGHĨA của 2 subtitle.

FORMAT BẮT BUỘC:

[index]
[dịch đúng 1 dòng]

Không thêm bất kỳ nội dung nào ngoài bản dịch.

Bây giờ hãy dịch:


${content}`;
}

function generate() {
    const input = document.getElementById("input").value;
    const data = parseSRT(input);
    const chunks = chunk(data, 100);

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
};

// OK
btnOK.onclick = () => {
    status.textContent = "✅ Dịch OK";
    status.style.color = "green";

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

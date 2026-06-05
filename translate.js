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
* KHÔNG được nối nội dung giữa subtitle trước và subtitle sau.
* KHÔNG được tự hoàn thiện câu bằng cách tham khảo subtitle kế tiếp.
* KHÔNG được bỏ sót bất kỳ index nào.
* OUTPUT phải có số lượng index CHÍNH XÁC bằng input.
* Mỗi subtitle phải được dịch độc lập.

QUY TẮC VĂN PHONG:

* Dịch sang tiếng Việt phổ thông hiện đại.
* Dịch như lời nói hoặc lời kể chuyện tự nhiên của người Việt.
* KHÔNG dịch theo văn phong truyện chữ Trung Quốc.
* KHÔNG dịch theo văn phong kiếm hiệp, tiên hiệp, ngôn tình hoặc sảng văn.
* Ưu tiên từ ngữ mà người Việt thường dùng hằng ngày.
* Khi có nhiều cách dịch, luôn chọn cách diễn đạt tự nhiên nhất.

HẠN CHẾ TỐI ĐA:

sự tình
phương diện
thực lực
cấp tốc
cáo tri
hồi đáp
minh bạch
phát giác
cơ duyên
thiên phú
nghịch tập
đả kích
đích thân
bất quá
dẫu sao
vô cùng
cực kỳ
đương nhiên
thậm chí

ƯU TIÊN:

chuyện
mặt
khả năng
nhanh chóng
cho biết
trả lời
hiểu rõ
phát hiện
cơ hội
tài năng
lật ngược tình thế
gây ảnh hưởng
tự mình
nhưng
dù sao
rất
rất
tất nhiên
ngay cả

ĐẶC BIỆT QUAN TRỌNG:

Hãy dịch như phụ đề của một video kể chuyện YouTube bằng tiếng Việt.

KHÔNG dịch theo cách thường thấy trong truyện dịch Trung Quốc.

Nếu một câu dịch nghe giống văn dịch Trung Quốc thì hãy đổi sang cách nói tự nhiên hơn của người Việt.

Ví dụ:

明白了 → hiểu rồi
告诉你 → nói cho bạn biết
发现 → phát hiện ra
立刻 → ngay
情况 → tình hình
事情 → chuyện
于是 → nên
因为 → vì
正在 → đang

QUAN TRỌNG:

Nếu subtitle gốc chỉ là cụm từ ngắn hoặc câu chưa hoàn chỉnh thì bản dịch cũng phải giữ nguyên mức độ ngắn gọn tương ứng.

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
việc ở công trường

KHÔNG được dịch thành:

1553
Ban ngày phải xử lý việc ở công trường

FORMAT BẮT BUỘC:

[index]
[dịch đúng 1 dòng]

Không thêm giải thích.
Không thêm ghi chú.
Không thêm markdown.
Không thêm ký tự ngoài bản dịch.

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

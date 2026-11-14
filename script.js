// Biến lưu trữ trạng thái hiển thị (Exact: chính xác / Decimal: thập phân)
let state = {
    pt2: { isDecimal: false, exactLatex: "", decimalLatex: "" },
    he2: { isDecimal: false, exactLatex: "", decimalLatex: "" },
    can: { isDecimal: false, exactLatex: "", decimalLatex: "" }
};

// --- PHẦN 1: THUẬT TOÁN TOÁN HỌC CƠ BẢN (LÕI CASIO) ---

// 1. Tìm Ước chung lớn nhất (Thuật toán Euclid)
function gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// 2. Rút gọn phân số sang chuỗi LaTeX
function formatFraction(num, den) {
    if (den === 0) return "\\text{Lỗi chia cho 0}";
    if (num === 0) return "0";
    
    // Đưa dấu trừ lên tử số
    if (den < 0) {
        num = -num;
        den = -den;
    }
    
    // Nếu là số nguyên thì rút gọn phân số
    if (Number.isInteger(num) && Number.isInteger(den)) {
        let common = gcd(num, den);
        num /= common;
        den /= common;
        if (den === 1) return `${num}`;
        return `\\frac{${num}}{${den}}`;
    }
    // Nếu hệ số là số thập phân thì chia trực tiếp
    return `${Number((num / den).toFixed(4))}`;
}

// 3. Tách thừa số chính phương ra khỏi dấu căn: sqrt(n) = out * sqrt(inside)
function simplifyRadical(n) {
    if (n < 0) return { out: 1, inside: n };
    if (n === 0) return { out: 0, inside: 0 };
    
    let out = 1;
    let inside = n;
    
    for (let i = Math.floor(Math.sqrt(n)); i >= 2; i--) {
        if (inside % (i * i) === 0) {
            out *= i;
            inside /= (i * i);
            break;
        }
    }
    return { out, inside };
}

// --- PHẦN 2: CÁC HÀM GIẢI TOÁN THEO CHUYÊN ĐỀ ---

// Giải phương trình bậc 2: ax^2 + bx + c = 0
function solveQuadratic() {
    let a = parseFloat(document.getElementById("a2").value);
    let b = parseFloat(document.getElementById("b2").value);
    let c = parseFloat(document.getElementById("c2").value);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
        alert("Vui lòng nhập đầy đủ các hệ số a, b, c!");
        return;
    }
    if (a === 0) {
        alert("Hệ số a phải khác 0 để là phương trình bậc 2!");
        return;
    }

    let delta = b * b - 4 * a * c;
    let exact = `\\Delta = ${delta} \\\\ `;
    let decimal = `\\Delta = ${delta} \\\\ `;

    if (delta < 0) {
        exact += "\\text{Phương trình vô nghiệm thực}";
        decimal += "\\text{Phương trình vô nghiệm thực}";
    } else if (delta === 0) {
        let x = formatFraction(-b, 2 * a);
        let xDec = Number((-b / (2 * a)).toFixed(4));
        exact += `\\text{Nghiệm kép: } x_1 = x_2 = ${x}`;
        decimal += `\\text{Nghiệm kép: } x_1 = x_2 = ${xDec}`;
    } else {
        let x1Dec = Number(((-b + Math.sqrt(delta)) / (2 * a)).toFixed(4));
        let x2Dec = Number(((-b - Math.sqrt(delta)) / (2 * a)).toFixed(4));
        decimal += `x_1 \\approx ${x1Dec} \\\\ x_2 \\approx ${x2Dec}`;

        // Xử lý dạng chuẩn xác (Casio) nếu a, b, c nguyên
        if (Number.isInteger(a) && Number.isInteger(b) && Number.isInteger(c)) {
            let rad = simplifyRadical(delta);
            if (rad.inside === 1) {
                // Căn đẹp -> ra phân số
                let x1 = formatFraction(-b + rad.out, 2 * a);
                let x2 = formatFraction(-b - rad.out, 2 * a);
                exact += `x_1 = ${x1}, \\quad x_2 = ${x2}`;
            } else {
                // Giữ nguyên dấu căn và rút gọn nhân tử chung
                let den = 2 * a;
                let common = gcd(gcd(Math.abs(b), rad.out), Math.abs(den));
                let bSim = -b / common;
                let outSim = rad.out / common;
                let denSim = den / common;
                
                if (denSim < 0) { bSim = -bSim; denSim = -denSim; }
                let outStr = outSim === 1 ? "" : outSim;
                let bStr = bSim === 0 ? "" : bSim;

                if (denSim === 1) {
                    exact += `x_1 = ${bStr} + ${outStr}\\sqrt{${rad.inside}}, \\quad x_2 = ${bStr} - ${outStr}\\sqrt{${rad.inside}}`;
                } else {
                    exact += `x_1 = \\frac{${bStr} + ${outStr}\\sqrt{${rad.inside}}}{${denSim}}, \\quad x_2 = \\frac{${bStr} - ${outStr}\\sqrt{${rad.inside}}}{${denSim}}`;
                }
            }
        } else {
            exact = decimal;
        }
    }

    state.pt2 = { isDecimal: false, exactLatex: exact, decimalLatex: decimal };
    renderResult('pt2');
}

// Giải hệ phương trình 2 ẩn bằng định thức Cramer
function solveSystem2() {
    let a1 = parseFloat(document.getElementById("a1").value);
    let b1 = parseFloat(document.getElementById("b1").value);
    let c1 = parseFloat(document.getElementById("c1").value);
    let a2 = parseFloat(document.getElementById("a2_sys").value);
    let b2 = parseFloat(document.getElementById("b2_sys").value);
    let c2 = parseFloat(document.getElementById("c2_sys").value);

    if ([a1, b1, c1, a2, b2, c2].some(isNaN)) {
        alert("Vui lòng nhập đủ 6 hệ số!");
        return;
    }

    let D = a1 * b2 - a2 * b1;
    let Dx = c1 * b2 - c2 * b1;
    let Dy = a1 * c2 - a2 * c1;

    let exact = "", decimal = "";

    if (D !== 0) {
        let xFrac = formatFraction(Dx, D);
        let yFrac = formatFraction(Dy, D);
        let xDec = Number((Dx / D).toFixed(4));
        let yDec = Number((Dy / D).toFixed(4));

        exact = `\\begin{cases} x = ${xFrac} \\\\ y = ${yFrac} \\end{cases}`;
        decimal = `\\begin{cases} x \\approx ${xDec} \\\\ y \\approx ${yDec} \\end{cases}`;
    } else {
        if (Dx === 0 && Dy === 0) {
            exact = decimal = "\\text{Hệ phương trình có vô số nghiệm}";
        } else {
            exact = decimal = "\\text{Hệ phương trình vô nghiệm}";
        }
    }

    state.he2 = { isDecimal: false, exactLatex: exact, decimalLatex: decimal };
    renderResult('he2');
}

// Rút gọn căn bậc 2
function simplifySqrtUI() {
    let n = parseInt(document.getElementById("sqrt-n").value);
    if (isNaN(n) || n < 0) {
        alert("Vui lòng nhập số nguyên không âm!");
        return;
    }

    let rad = simplifyRadical(n);
    let exact = "";
    if (rad.inside === 0) exact = "0";
    else if (rad.inside === 1) exact = `${rad.out}`;
    else if (rad.out === 1) exact = `\\sqrt{${rad.inside}}`;
    else exact = `${rad.out}\\sqrt{${rad.inside}}`;

    let decimal = `${Number(Math.sqrt(n).toFixed(5))}`;

    state.can = {
        isDecimal: false,
        exactLatex: `\\sqrt{${n}} = ${exact}`,
        decimalLatex: `\\sqrt{${n}} \\approx ${decimal}`
    };
    renderResult('can');
}

// --- PHẦN 3: HIỂN THỊ GIAO DIỆN & MÃ QR ---

function renderResult(tabKey) {
    let target = document.getElementById(`res-${tabKey}`);
    let latex = state[tabKey].isDecimal ? state[tabKey].decimalLatex : state[tabKey].exactLatex;
    if (!latex) return;
    katex.render(latex, target, { throwOnError: false, displayMode: true });
}

// Chuyển đổi qua lại giữa Phân số/Căn (S) và Thập phân (D)
function toggleSD(tabKey) {
    if (!state[tabKey].exactLatex) return;
    state[tabKey].isDecimal = !state[tabKey].isDecimal;
    renderResult(tabKey);
}

// Chuyển Tab
function openTab(tabName) {
    document.querySelectorAll('.card').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.remove('hidden');
    event.target.classList.add('active');
}

// Bật/Tắt khung mã QR và tự động sinh mã theo URL
let qrGenerated = false;
function toggleQR() {
    let modal = document.getElementById("qr-modal");
    modal.classList.toggle("hidden");
    
    if (!qrGenerated) {
        new QRCode(document.getElementById("qrcode"), {
            text: window.location.href,
            width: 160,
            height: 160
        });
        qrGenerated = true;
    }
}

// Tự động render công thức toán trong tiêu đề khi tải trang
window.onload = function() {
    document.querySelectorAll('h2, .desc').forEach(el => {
        el.innerHTML = el.innerHTML.replace(/\$(.*?)\$/g, (match, tex) => {
            return katex.renderToString(tex, { throwOnError: false });
        });
    });
};
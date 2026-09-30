/* パスワード付き解答の復号（クライアント側）。
 * hooks/encrypt_solutions.py が AES-256-GCM で暗号化した解答を、
 * Web Crypto API で復号して callout に表示する。
 * 方式: PBKDF2-HMAC-SHA256 → AES-256-GCM、payload = base64(salt16 + iv12 + 暗号文 + tag)。
 */
(function () {
  "use strict";

  async function decryptSolution(payloadB64, iterations, password) {
    const raw = Uint8Array.from(atob(payloadB64), (c) => c.charCodeAt(0));
    const salt = raw.slice(0, 16);
    const iv = raw.slice(16, 28);
    const data = raw.slice(28);
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);
    return new TextDecoder().decode(plain);
  }

  function initOne(box) {
    if (box.dataset.esInit) return;
    box.dataset.esInit = "1";

    const input = box.querySelector(".es-input");
    const btn = box.querySelector(".es-btn");
    const msg = box.querySelector(".es-msg");
    const content = box.querySelector(".es-content");
    const title = box.querySelector(".admonition-title");
    const controls = box.querySelector(".es-controls");
    const payload = box.dataset.payload;
    const iter = parseInt(box.dataset.iter, 10) || 200000;
    if (!input || !btn || !content || !payload) return;

    function setMsg(text, isError) {
      msg.textContent = text;
      msg.classList.toggle("es-error", !!isError);
    }

    async function tryUnlock() {
      const pw = input.value;
      if (!pw) { setMsg("パスワードを入力してください。", true); return; }
      btn.disabled = true;
      setMsg("復号中…", false);
      try {
        const html = await decryptSolution(payload, iter, pw);
        content.innerHTML = html;
        box.classList.add("es-unlocked");
        if (controls) controls.style.display = "none";
        setMsg("", false);
        if (title) title.innerHTML = "解答 ✅";
        if (window.MathJax && MathJax.typesetPromise) {
          MathJax.typesetPromise([content]).catch(function () {});
        }
      } catch (e) {
        setMsg("パスワードが違います。", true);
        btn.disabled = false;
      }
    }

    btn.addEventListener("click", tryUnlock);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); tryUnlock(); }
    });
  }

  function initAll() {
    document.querySelectorAll(".encrypted-solution[data-payload]").forEach(initOne);
  }

  /* Material のページ遷移オブザーバがあれば各遷移で初期化、無ければ DOMContentLoaded。 */
  if (typeof document$ !== "undefined" && document$ && document$.subscribe) {
    document$.subscribe(function () { initAll(); });
  } else {
    document.addEventListener("DOMContentLoaded", initAll);
  }
})();

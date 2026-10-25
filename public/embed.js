/*!
 * Design Studio embed. Add to any website:
 *   <script src="https://YOUR-STUDIO-DOMAIN/embed.js" data-label="Design your sign online" async></script>
 * Options (data-*): label, color, path (e.g. "/design/shop-sign"), position ("right" | "left"), button ("false" to hide
 * the floating button and open it from your own links with class="rp-studio-open" data-path="/design/mugs").
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var origin = new URL(script.src).origin;
  var d = script.dataset;
  var color = d.color || "#e11d74";
  var overlay, frame;

  function open(path) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;padding:0";
      var box = document.createElement("div");
      box.style.cssText = "position:relative;width:100%;height:100%;max-width:1600px;max-height:100%;background:#fff;overflow:hidden";
      frame = document.createElement("iframe");
      frame.title = "Design Studio";
      frame.allow = "clipboard-write";
      frame.style.cssText = "border:0;width:100%;height:100%";
      var close = document.createElement("button");
      close.setAttribute("aria-label", "Close design studio");
      close.innerHTML = "&times;";
      close.style.cssText = "position:absolute;top:8px;right:8px;z-index:2;width:36px;height:36px;border-radius:50%;border:0;background:#0f172a;color:#fff;font-size:22px;line-height:36px;cursor:pointer";
      close.onclick = function () { overlay.style.display = "none"; document.body.style.overflow = ""; };
      box.appendChild(frame);
      box.appendChild(close);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }
    frame.src = origin + (path || d.path || "/");
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function init() {
    if (d.button !== "false") {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "✨ " + (d.label || "Design it online");
      btn.style.cssText = "position:fixed;bottom:20px;" + (d.position === "left" ? "left" : "right") + ":20px;z-index:2147483645;background:" + color +
        ";color:#fff;border:0;border-radius:999px;padding:14px 22px;font:600 15px/1 system-ui,sans-serif;box-shadow:0 10px 30px -8px rgba(0,0,0,.4);cursor:pointer";
      btn.onclick = function () { open(); };
      document.body.appendChild(btn);
    }
    document.addEventListener("click", function (e) {
      var el = e.target && e.target.closest && e.target.closest(".rp-studio-open");
      if (el) { e.preventDefault(); open(el.getAttribute("data-path")); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.RarePrintStudio = { open: open };
})();

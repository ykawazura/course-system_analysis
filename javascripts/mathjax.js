window.MathJax = {
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    ignoreHtmlClass: ".*|",
    processHtmlClass: "arithmatex"
  }
};

document$.subscribe(() => {
  // figcaption 内の数式（$...$）は arithmatex で前処理されず生のまま残るため、
  // arithmatex クラスを付けて MathJax の処理対象に含める（processHtmlClass 経由）。
  document.querySelectorAll("figcaption").forEach((el) => {
    el.classList.add("arithmatex")
  })
  MathJax.typesetPromise()
})

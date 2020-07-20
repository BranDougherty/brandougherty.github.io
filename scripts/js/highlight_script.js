#!/usr/bin/node

const fs = require("fs");
const hljs = require("highlight.js");
const hljsln = require("./highlightjs-line-numbers.js");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const data = fs.readFileSync(0, 'utf-8');
const dom = new JSDOM(data, { runScripts: "dangerously", resources: "usable" });
const document = dom.window.document;
const window = dom.window;

const codes = document.getElementsByTagName("code");
for (var i = 0; i < codes.length; i++) {
    if (codes[i].parentNode.nodeName !== "PRE") {
        codes[i].style.backgroundColor = "#f0f0f0";
        continue;
    }

    const code = codes[i].innerHTML;
    if (codes[i].className.startsWith("language-"))
        codes[i].innerHTML = hljs.highlight(codes[i].className.substring(9, codes[i].className.length), code).value;
    else
        codes[i].innerHTML = hljs.highlightAuto(code).value;

    hljsln.lineNumbersBlock(codes[i]);
}

const pres = document.getElementsByTagName("pre");
for (var i = 0; i < pres.length; i++)
    pres[i].className += " hljs";

console.log(dom.window.document.body.innerHTML);


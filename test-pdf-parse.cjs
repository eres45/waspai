const { createRequire } = require("module");
const path = require("path");

try {
    const requireLocal = createRequire(__filename);
    let pdf = requireLocal("pdf-parse");
    console.log("pdf type:", typeof pdf);
    if (pdf.default) {
        console.log("Found .default, using it");
        pdf = pdf.default;
    }
    console.log("final pdf type:", typeof pdf);
    
    if (typeof pdf === 'function') {
        console.log("SUCCESS: pdf-parse is a function");
    } else {
        console.log("FAILURE: pdf-parse is NOT a function", pdf);
    }
} catch (e) {
    console.error("ERROR loading pdf-parse:", e);
}

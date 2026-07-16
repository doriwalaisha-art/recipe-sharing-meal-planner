// Utility functions to parse and repair JSON strings from AI
const parseAndRepairJSON = (text) => {
    let clean = text.trim();
    
    // Strip markdown wrapper if present
    if (clean.startsWith("```")) {
        clean = clean.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
    }

    // Replace smart quotes with standard quotes
    clean = clean.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

    // Try normal parse
    try {
        return JSON.parse(clean);
    } catch (e) {
        console.warn("[JSON Parser] Initial parsing failed, trying local repairs...");
    }

    // Repair trailing commas
    clean = clean.replace(/,\s*([\]}])/g, "$1");

    // Escape actual newlines inside quotes
    let insideString = false;
    let repaired = "";
    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (char === '"' && clean[i - 1] !== '\\') {
            insideString = !insideString;
            repaired += char;
        } else if ((char === '\n' || char === '\r') && insideString) {
            repaired += (char === '\n' ? '\\n' : '\\r');
        } else {
            repaired += char;
        }
    }
    clean = repaired;

    // Append missing closing braces and brackets
    let openBraces = (clean.match(/{/g) || []).length;
    let closeBraces = (clean.match(/}/g) || []).length;
    let openBrackets = (clean.match(/\[/g) || []).length;
    let closeBrackets = (clean.match(/\]/g) || []).length;

    while (openBrackets > closeBrackets) {
        clean += ']';
        closeBrackets++;
    }
    while (openBraces > closeBraces) {
        clean += '}';
        closeBraces++;
    }

    // Try final parse
    try {
        return JSON.parse(clean);
    } catch (err) {
        console.error("[JSON Parser] Repair failed:\n", clean);
        throw err;
    }
};

module.exports = { parseAndRepairJSON };

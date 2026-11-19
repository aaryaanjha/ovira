import { columns, google } from "../lib/sheets.mjs";
import { defaultContact } from "../lib/content.mjs";
import { initialPosts } from "../lib/store.mjs";

const { sheets = [] } = await google("?fields=sheets(properties(sheetId,title))");
const byName = new Map(sheets.map(sheet => [sheet.properties.title, sheet.properties.sheetId]));
let nextSheetId = Math.max(0, ...byName.values()) + 1;
const requests = [];

function columnName(number) {
  let name = "";
  while (number) {
    number--;
    name = String.fromCharCode(65 + number % 26) + name;
    number = Math.floor(number / 26);
  }
  return name;
}

const seed = {
  Leads: [],
  Posts: initialPosts.map(post => ({ ...post, sections: JSON.stringify(post.sections) })),
  Settings: [defaultContact],
};

for (const [tab, fields] of Object.entries(columns)) {
  let sheetId = byName.get(tab);
  if (sheetId !== undefined) {
    const { values = [] } = await google("/values/" + encodeURIComponent(tab + "!A1:" + columnName(fields.length)));
    if (values.length) {
      const headers = values[0] || [];
      if (headers.length > fields.length || !headers.every((field, index) => field === fields[index])) {
        throw new Error("The " + tab + " tab already contains a different schema. Use a blank workbook or restore its expected headers.");
      }
      if (headers.length < fields.length) {
        const firstColumn = columnName(headers.length + 1);
        const lastColumn = columnName(fields.length);
        await google("/values/" + encodeURIComponent(tab + "!" + firstColumn + "1:" + lastColumn + "1") +
          "?valueInputOption=RAW", "PUT", { values: [fields.slice(headers.length)] });
      }
      continue;
    }
  } else {
    sheetId = nextSheetId++;
    requests.push({ addSheet: { properties: { sheetId, title: tab, gridProperties: { frozenRowCount: 1 } } } });
  }

  const values = [fields, ...seed[tab].map(record => fields.map(field => record[field] ?? ""))];
  requests.push({ updateCells: {
    start: { sheetId, rowIndex: 0, columnIndex: 0 },
    rows: values.map((row, index) => ({
      values: row.map(text => ({
        userEnteredValue: { stringValue: text },
        ...(index === 0 ? { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.94, green: 0.88, blue: 0.90 } } } : {}),
      })),
    })),
    fields: "userEnteredValue,userEnteredFormat",
  } });
}

if (requests.length) await google(":batchUpdate", "POST", { requests });
console.log("OVIRA workbook is ready. Leads, Posts, and Settings have the expected headers.");

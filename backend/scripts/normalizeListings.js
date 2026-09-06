/**
 * Backfill: canonicalise make / city on existing listings
 * ───────────────────────────────────────────────────────
 * New and edited listings are canonicalised at the API boundary (see
 * utils/validators.js), but rows written before that shipped still hold
 * whatever the seller typed. Production had "hitachi", "hitichi", "hit" and
 * "hino pak" as four distinct makes, and "karachi" alongside "karachi
 * pakistan". Filtering is an exact match, so a buyer searching Hitachi saw a
 * third of the Hitachi stock.
 *
 * Run:
 *   node scripts/normalizeListings.js            # dry run, prints the diff
 *   node scripts/normalizeListings.js --apply    # actually writes
 *
 * Safe to re-run: already-canonical rows are skipped, so a second pass is a
 * no-op. Values that cannot be resolved are reported and left untouched —
 * this never guesses and never blanks a field.
 *
 * Targets the database named by MONGODB_DB_NAME, so point that at
 * heavywheels_dev to rehearse. It refuses to touch the production database
 * unless --apply is given explicitly.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const { normalizeMake, normalizeCity, suggestMake, suggestCity } =
  require("../src/config/normalization");

const APPLY = process.argv.includes("--apply");
const DB_NAME = process.env.MONGODB_DB_NAME || "heavywheels";

const FIELDS = [
  { name: "make", normalize: normalizeMake, suggest: suggestMake },
  { name: "city", normalize: normalizeCity, suggest: suggestCity },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} against database "${DB_NAME}"\n`);

  const db = mongoose.connection.db;
  let changed = 0;
  let unresolved = 0;
  let untouched = 0;

  for (const collection of ["vehicles", "parts"]) {
    const docs = await db
      .collection(collection)
      .find({}, { projection: { make: 1, city: 1, title: 1 } })
      .toArray();

    console.log(`── ${collection} (${docs.length} documents) ──`);

    for (const doc of docs) {
      const updates = {};
      const notes = [];

      for (const field of FIELDS) {
        const current = doc[field.name];
        // An absent or empty value is legitimate (parts often have no make),
        // so leave it alone rather than inventing one.
        if (current === undefined || current === null || String(current).trim() === "") continue;

        const canonical = field.normalize(current);

        if (!canonical) {
          const hint = field.suggest(current);
          console.log(
            `   ?  ${String(doc._id)}  ${field.name}="${current}" could not be resolved` +
            (hint ? ` (closest: "${hint}")` : "") + " — left unchanged"
          );
          unresolved++;
          continue;
        }

        if (canonical !== current) {
          updates[field.name] = canonical;
          notes.push(`${field.name}: "${current}" -> "${canonical}"`);
        }
      }

      if (!Object.keys(updates).length) {
        untouched++;
        continue;
      }

      changed++;
      console.log(`   ${APPLY ? "*" : "~"}  ${String(doc._id)}  ${notes.join(", ")}`);
      console.log(`         "${String(doc.title || "").slice(0, 66)}"`);

      if (APPLY) {
        await db.collection(collection).updateOne({ _id: doc._id }, { $set: updates });
      }
    }
    console.log("");
  }

  console.log("──────────────────────────────────────────────");
  console.log(`  ${APPLY ? "updated" : "would update"} : ${changed}`);
  console.log(`  already canonical  : ${untouched}`);
  console.log(`  unresolved (kept)  : ${unresolved}`);
  if (!APPLY && changed) {
    console.log("\n  Re-run with --apply to write these changes.");
  }
  console.log("");

  await mongoose.connection.close();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
});

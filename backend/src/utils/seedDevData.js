/**
 * Seed a scratch development database
 * ───────────────────────────────────
 * Run:  npm run seed:dev   (from the backend/ folder)
 *
 * Creates a small set of synthetic users and listings so local work doesn't
 * need to point at the live database to have anything to look at. Everything
 * it writes is obviously fake (example.test addresses, "DEV" titles) so a
 * stray record can never be mistaken for a real seller's ad.
 *
 * Refuses to run against the production database. That guard is the whole
 * point of the script — seeding is bulk-write plus a wipe of its own data,
 * which is precisely what must never touch real records.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");
const Dealer = require("../models/Dealer");

const PRODUCTION_DB_NAME = "heavywheels";
const DEV_EMAIL_DOMAIN = "example.test";

const DAY_MS = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY_MS);

const PLACEHOLDER_IMAGE = {
  url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  publicId: "dev/sample",
};

const DEV_USERS = [
  { name: "Dev Seller", email: `seller@${DEV_EMAIL_DOMAIN}`, phone: "03001112233", plan: "free" },
  { name: "Dev Buyer", email: `buyer@${DEV_EMAIL_DOMAIN}`, phone: "03004445566", plan: "free" },
  { name: "Dev Dealer", email: `dealer@${DEV_EMAIL_DOMAIN}`, phone: "03007778899", plan: "pro" },
];

const DEV_PASSWORD = "DevPassword123!";

async function seedDevData() {
  const dbName = process.env.MONGODB_DB_NAME || PRODUCTION_DB_NAME;

  if (dbName === PRODUCTION_DB_NAME) {
    console.error(
      `\n❌ Refusing to seed: MONGODB_DB_NAME is "${dbName}", the production database.\n` +
      `   Set MONGODB_DB_NAME to something else (e.g. heavywheels_dev) in backend/.env first.\n`
    );
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName });
  console.log(`📦 Connected to dev database "${dbName}"`);

  try {
    // Clear only what this script created, so a dev database that also holds
    // hand-made test records isn't flattened on every reseed.
    const devUsers = await User.find({ email: new RegExp(`@${DEV_EMAIL_DOMAIN}$`) }).select("_id");
    const devUserIds = devUsers.map((u) => u._id);
    if (devUserIds.length) {
      await Promise.all([
        Vehicle.deleteMany({ sellerId: { $in: devUserIds } }),
        Part.deleteMany({ sellerId: { $in: devUserIds } }),
        Dealer.deleteMany({ userId: { $in: devUserIds } }),
        User.deleteMany({ _id: { $in: devUserIds } }),
      ]);
      console.log(`🧹 Cleared ${devUserIds.length} previous dev user(s) and their listings`);
    }

    const created = [];
    for (const spec of DEV_USERS) {
      created.push(
        await User.create({
          ...spec,
          password: DEV_PASSWORD,
          role: "user",
          isEmailVerified: true,
          isActive: true,
        })
      );
    }
    console.log(`👤 Created ${created.length} dev users (password: ${DEV_PASSWORD})`);

    const seller = created[0];
    const dealer = created[2];

    const vehicles = await Vehicle.create([
      {
        title: "DEV Hino 500 Series Prime Mover 2019",
        description: "Synthetic development listing. Not a real vehicle for sale.",
        type: "prime-mover", make: "Hino", model: "500 Series", year: 2019,
        condition: "used", price: 8500000, city: "Karachi",
        mileage: 120000, mileageUnit: "km", transmission: "manual", fuel: "diesel",
        images: [PLACEHOLDER_IMAGE], sellerId: seller._id,
        seller: { name: seller.name, phone: seller.phone, plan: seller.plan },
        status: "active", expiresAt: daysFromNow(30),
      },
      {
        // Deliberately near expiry so the dashboard's "ads expiring" alert has
        // something real to render against.
        title: "DEV Komatsu PC200 Excavator 2016",
        description: "Synthetic development listing. Not a real vehicle for sale.",
        type: "excavator", make: "Komatsu", model: "PC200", year: 2016,
        condition: "used", price: 15300000, city: "Lahore",
        mileage: 8000, mileageUnit: "hrs", transmission: "hydraulic", fuel: "diesel",
        images: [PLACEHOLDER_IMAGE], sellerId: dealer._id,
        // Verified + warranty so the card/detail trust badges have something
        // to render against without hand-editing records.
        seller: { name: dealer.name, phone: dealer.phone, plan: dealer.plan, verified: true, warranty: true },
        status: "active", expiresAt: daysFromNow(3),
      },
    ]);

    const parts = await Part.create([
      {
        title: "DEV Turbocharger for Hino 500",
        description: "Synthetic development listing. Not a real part for sale.",
        category: "engine", condition: "used", price: 85000, city: "Karachi",
        images: [PLACEHOLDER_IMAGE], sellerId: seller._id,
        seller: { name: seller.name, phone: seller.phone, plan: seller.plan },
        status: "active", expiresAt: daysFromNow(30),
      },
      {
        // Paid plan + verified + warranty: the combination that has to look
        // identical on a part card and a vehicle card.
        title: "DEV Brake Assembly for Komatsu PC200",
        description: "Synthetic development listing. Not a real part for sale.",
        category: "brakes", condition: "new", price: 45000, city: "Lahore",
        images: [PLACEHOLDER_IMAGE], sellerId: dealer._id,
        seller: { name: dealer.name, phone: dealer.phone, plan: dealer.plan, verified: true, warranty: true },
        status: "active", expiresAt: daysFromNow(30),
      },
    ]);

    // An approved dealer so the homepage dealer strip and /dealers aren't
    // empty locally — that section is invisible without one.
    await Dealer.create({
      userId: dealer._id,
      businessName: "DEV Heavy Machinery Traders",
      businessType: "showroom",
      tagline: "Synthetic dev dealer — not a real business.",
      phone: dealer.phone,
      city: "Lahore",
      approvalStatus: "approved",
      isVerified: true,
      isActive: true,
    });

    console.log(`🚛 Created ${vehicles.length} vehicles, ${parts.length} part(s) and 1 approved dealer`);
    console.log(`\n✅ Dev database "${dbName}" seeded.`);
    console.log(`   Log in as ${DEV_USERS[0].email} / ${DEV_PASSWORD}`);
    console.log("   Run `npm run seed:admin` too if you need an admin account here.\n");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

module.exports = { seedDevData };

if (require.main === module) {
  seedDevData();
}

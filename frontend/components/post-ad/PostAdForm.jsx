"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { normalizeApiError, uploadApi, vehicleApi } from "@/lib/api";
import { CITIES, CONDITIONS, FUELS, TRANSMISSIONS, VEHICLE_MAKES, VEHICLE_TYPE_GROUPS } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { TC_VERSION } from "@/lib/pricing";
import SuggestInput from "@/components/ui/SuggestInput";
import PhotoUploader from "@/components/ui/PhotoUploader";
import { onLettersInput, onDigitsInput } from "@/lib/validators";

// Free-text spec fields render from one map; `mode` picks the input filter.
// "free" fields legitimately mix letters and digits (e.g. "Block 5", "6x4").
const SPEC_FIELDS = [
  { name: "engineCC", mode: "digits" },
  { name: "engineType", mode: "free" },
  { name: "axleConfig", mode: "free" },
  { name: "color", mode: "letters" },
  { name: "cabinType", mode: "letters" },
  { name: "lastService", mode: "free" },
];

function Req() {
  return <span className="text-[var(--hw-red)]" aria-hidden="true"> *</span>;
}

function Option({ option }) {
  const value = typeof option === "string" ? option : option.value;
  const labelText = typeof option === "string" ? titleCase(option) : option.label;
  return <option value={value}>{labelText}</option>;
}

// Pass `groups` ([{ category, types }]) to render an <optgroup> per category,
// or a flat `options` list otherwise.
function Select({ name, label, options, groups, required = true }) {
  return (
    <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
      {label}{required ? <Req /> : null}
      <select
        name={name}
        required={required}
        className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-secondary)] outline-none focus:border-[var(--hw-orange)]"
      >
        <option value="">Select {label}</option>
        {groups
          ? groups.map((group) => (
              <optgroup key={group.category.value} label={group.category.label}>
                {group.types.map((option) => (
                  <Option key={option.value} option={option} />
                ))}
              </optgroup>
            ))
          : options.map((option) => (
              <Option key={typeof option === "string" ? option : option.value} option={option} />
            ))}
      </select>
    </label>
  );
}

export default function PostAdForm() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Photos picked for upload, owned here and managed by <PhotoUploader>.
  // Each entry: { id, file, url }. `photosBusy` is true while compression runs.
  const [photos, setPhotos] = useState([]);
  const [photosBusy, setPhotosBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      if (!isAuthenticated) {
        router.push("/auth/login?redirect=/post-ad");
        return;
      }

      if (!photos.length) {
        throw new Error("At least one vehicle image is required.");
      }

      const uploadResponse = await uploadApi.images(photos.map((photo) => photo.file));
      const images = uploadResponse.data.images;

      const payload = {
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        type: String(formData.get("type") || ""),
        make: String(formData.get("make") || ""),
        model: String(formData.get("model") || ""),
        year: Number(formData.get("year")),
        condition: String(formData.get("condition") || ""),
        price: Number(formData.get("price")),
        city: String(formData.get("city") || ""),
        area: String(formData.get("area") || ""),
        province: String(formData.get("province") || ""),
        mileage: Number(formData.get("mileage") || 0),
        mileageUnit: String(formData.get("mileageUnit") || "km"),
        transmission: String(formData.get("transmission") || ""),
        fuel: String(formData.get("fuel") || "diesel"),
        engineCC: String(formData.get("engineCC") || ""),
        engineType: String(formData.get("engineType") || ""),
        axleConfig: String(formData.get("axleConfig") || ""),
        color: String(formData.get("color") || ""),
        cabinType: String(formData.get("cabinType") || ""),
        registeredCity: String(formData.get("registeredCity") || ""),
        lastService: String(formData.get("lastService") || ""),
        negotiable: formData.get("negotiable") === "on",
        commissionConsent: formData.get("commissionConsent") === "on",
        tcVersion: TC_VERSION,
        images,
      };

      const response = await vehicleApi.create(payload);
      toast.success(t("form.publish"));
      router.push(`/vehicles/${response.data._id}`);
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center text-[var(--hw-text-secondary)]">
        {t("form.checkingSession")}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("dash.loginRequired")}</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">{t("form.loginRequiredAd")}</p>
        <Link href="/auth/login?redirect=/post-ad" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">
          {t("form.loginToContinue")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <p className="text-sm text-[var(--hw-text-muted)]">
        Fields marked <Req /> are required.
      </p>
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("form.basicDetails")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-[var(--hw-text-secondary)] sm:col-span-2">
            {t("form.adTitle")}<Req />
            <input name="title" required minLength={10} maxLength={120} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" placeholder="Hino 700 Prime Mover 2022" />
          </label>
          <Select name="type" label={t("form.vehicleType")} groups={VEHICLE_TYPE_GROUPS} />
          <SuggestInput name="make" label={t("form.make")} options={VEHICLE_MAKES} required placeholder="e.g. Hino, Honda, Caterpillar" />
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("form.model")}<Req />
            <input name="model" required className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("form.year")}<Req />
            <input name="year" type="number" required min="1980" max="2027" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
          <Select name="condition" label={t("form.condition")} options={CONDITIONS} />
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("form.pricePkr")}<Req />
            <input name="price" type="number" required min="1" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-[var(--hw-text-secondary)] sm:col-span-2">
            <input name="negotiable" type="checkbox" defaultChecked className="h-4 w-4" />
            {t("form.negotiable")}
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("form.specsLocation")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SuggestInput name="city" label={t("form.city")} options={CITIES} required placeholder="e.g. Karachi, Sahiwal, Abbottabad" />
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("form.area")}
            <input name="area" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("form.province")}
            <input name="province" onChange={onLettersInput} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("form.registeredCity")}
            <input name="registeredCity" onChange={onLettersInput} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("form.mileage")}
            <input name="mileage" type="number" min="0" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
          <Select name="mileageUnit" label="Mileage unit" options={[{ value: "km", label: "Kilometers" }, { value: "hrs", label: "Hours" }]} required={false} />
          <Select name="transmission" label="Transmission" options={TRANSMISSIONS} required={false} />
          <Select name="fuel" label="Fuel" options={FUELS} required={false} />
          {SPEC_FIELDS.map(({ name, mode }) => (
            <label key={name} className="text-sm font-bold text-[var(--hw-text-secondary)]">
              {titleCase(name)}
              <input
                name={name}
                inputMode={mode === "digits" ? "numeric" : undefined}
                onChange={mode === "digits" ? onDigitsInput : mode === "letters" ? onLettersInput : undefined}
                className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("form.descImages")}</h2>
        <div className="mt-5 grid gap-4">
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("form.description")}<Req />
            <textarea name="description" required minLength={30} maxLength={3000} className="mt-2 min-h-36 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
            <span className="mt-1 block text-xs font-normal text-[var(--hw-text-muted)]">🌐 {t("form.translateHint")}</span>
          </label>
          <PhotoUploader
            photos={photos}
            setPhotos={setPhotos}
            onError={setError}
            onBusyChange={setPhotosBusy}
          />
        </div>
      </section>

      <label className="flex items-start gap-3 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 text-sm font-bold text-[var(--hw-text-secondary)]">
        <input name="commissionConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" />
        <span>
          {t("form.commissionConsent")}{" "}
          <Link href="/terms" target="_blank" className="font-black text-[var(--hw-orange)] underline">
            {t("footer.terms")}
          </Link>
          .
        </span>
      </label>

      <button disabled={loading || photosBusy} className="h-12 rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
        {loading ? t("form.publishing") : t("form.publish")}
      </button>
    </form>
  );
}

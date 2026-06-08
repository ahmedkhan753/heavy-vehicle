"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { normalizeApiError, partApi, uploadApi } from "@/lib/api";
import { CITIES, CONDITIONS, VEHICLE_MAKES, VEHICLE_TYPES } from "@/lib/constants";
import { PART_CATEGORIES, PART_SUBCATEGORIES, PART_TYPES, WARRANTY_OPTIONS } from "@/lib/parts";
import { titleCase } from "@/lib/format";
import { TC_VERSION } from "@/lib/pricing";
import SuggestInput from "@/components/ui/SuggestInput";
import PhotoUploader from "@/components/ui/PhotoUploader";
import { onLettersInput } from "@/lib/validators";

function Req() {
  return <span className="text-[var(--hw-red)]" aria-hidden="true"> *</span>;
}

function Select({ name, label, options, required = true, multiple = false, onChange, disabled = false }) {
  return (
    <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
      {label}{required ? <Req /> : null}
      <select
        name={name}
        required={required}
        multiple={multiple}
        onChange={onChange}
        disabled={disabled}
        className={`${multiple ? "min-h-32 py-3" : "h-12"} mt-2 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] disabled:opacity-50`}
      >
        {!multiple ? <option value="">Select {label}</option> : null}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const labelText = typeof option === "string" ? titleCase(option) : option.label;
          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export default function PostPartForm() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Selected category drives which subcategory options show.
  const [category, setCategory] = useState("");
  // Photos picked for upload, managed by <PhotoUploader>. Each entry is
  // { id, file, url }; `photosBusy` is true while compression runs.
  const [photos, setPhotos] = useState([]);
  const [photosBusy, setPhotosBusy] = useState(false);

  const subcategoryOptions = PART_SUBCATEGORIES[category] || [];

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      if (!isAuthenticated) {
        router.push("/auth/login?redirect=/post-part");
        return;
      }

      if (!photos.length) {
        throw new Error("At least one part image is required.");
      }

      const uploadResponse = await uploadApi.images(photos.map((photo) => photo.file));
      const images = uploadResponse.data.images;

      const payload = {
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        category: String(formData.get("category") || ""),
        subcategory: String(formData.get("subcategory") || ""),
        partType: String(formData.get("partType") || ""),
        warranty: String(formData.get("warranty") || ""),
        compatibleTypes: formData.getAll("compatibleTypes").filter(Boolean),
        make: String(formData.get("make") || ""),
        model: String(formData.get("model") || ""),
        condition: String(formData.get("condition") || "used"),
        price: Number(formData.get("price")),
        quantity: Number(formData.get("quantity") || 1),
        city: String(formData.get("city") || ""),
        area: String(formData.get("area") || ""),
        province: String(formData.get("province") || ""),
        negotiable: formData.get("negotiable") === "on",
        commissionConsent: formData.get("commissionConsent") === "on",
        tcVersion: TC_VERSION,
        images,
      };

      const response = await partApi.create(payload);
      toast.success("Part ad created successfully");
      router.push(`/parts/${response.data._id}`);
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
        <p className="mt-2 text-[var(--hw-text-secondary)]">{t("form.loginRequiredPart")}</p>
        <Link
          href="/auth/login?redirect=/post-part"
          className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]"
        >
          Login to Continue
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
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Part details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-[var(--hw-text-secondary)] sm:col-span-2">
            Ad title<Req />
            <input
              name="title"
              required
              minLength={5}
              maxLength={120}
              className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
              placeholder="Hino J08 engine assembly"
            />
          </label>
          <Select name="category" label="Category" options={PART_CATEGORIES} onChange={(e) => setCategory(e.target.value)} />
          {/* key remounts the select when category changes so a stale
              subcategory from another category isn't submitted. */}
          <Select
            key={category}
            name="subcategory"
            label="Subcategory"
            options={subcategoryOptions}
            required={false}
            disabled={!subcategoryOptions.length}
          />
          <Select name="condition" label="Condition" options={CONDITIONS} required={false} />
          <Select name="partType" label="OEM / Aftermarket" options={PART_TYPES} required={false} />
          <Select name="warranty" label="Warranty" options={WARRANTY_OPTIONS} required={false} />
          <SuggestInput name="make" label="Make" options={VEHICLE_MAKES} placeholder="e.g. Hino, Honda, Caterpillar" />
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            Model
            <input name="model" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            Price PKR<Req />
            <input name="price" type="number" required min="1" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            Quantity
            <input name="quantity" type="number" min="0" defaultValue="1" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-[var(--hw-text-secondary)] sm:col-span-2">
            <input name="negotiable" type="checkbox" defaultChecked className="h-4 w-4" />
            Price is negotiable
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Compatibility and location</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Select name="compatibleTypes" label="Compatible vehicle types" options={VEHICLE_TYPES} required={false} multiple />
          <div className="grid gap-4">
            <SuggestInput name="city" label="City" options={CITIES} required placeholder="e.g. Karachi, Sahiwal, Abbottabad" />
            <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
              Area
              <input name="area" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
            </label>
            <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
              Province
              <input name="province" onChange={onLettersInput} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Description and images</h2>
        <div className="mt-5 grid gap-4">
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            Description<Req />
            <textarea
              name="description"
              required
              minLength={20}
              maxLength={2000}
              className="mt-2 min-h-36 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
            />
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
        {loading ? t("form.publishingPart") : t("form.publishPart")}
      </button>
    </form>
  );
}

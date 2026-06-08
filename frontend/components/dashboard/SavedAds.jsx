"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useLanguage } from "@/Context/LanguageContext";
import { userApi } from "@/lib/api";
import VehicleCard from "@/components/vehicles/VehicleCard";

export default function SavedAds() {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    userApi.saved().then((res) => setSaved(res.data.saved || [])).catch(() => setSaved([]));
  }, [isAuthenticated]);

  if (loading) return <p className="text-[var(--hw-text-secondary)]">{t("common.loading")}</p>;
  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("dash.loginRequired")}</h2>
        <Link href="/auth/login?redirect=/dashboard/saved" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("nav.login")}</Link>
      </div>
    );
  }

  if (!saved.length) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("dash.noSaved")}</h2>
        <Link href="/vehicles" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("home.browseVehicles")}</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {saved.map((vehicle) => <VehicleCard key={vehicle._id} vehicle={vehicle} />)}
    </div>
  );
}

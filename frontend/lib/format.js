export function titleCase(value = "") {
  return String(value)
    .split("-")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatPrice(price, display) {
  if (display) return `PKR ${display}`;
  const numeric = Number(price);
  if (!numeric) return "Price on call";
  if (numeric >= 10000000) {
    return `PKR ${(numeric / 10000000).toFixed(2).replace(/\.?0+$/, "")} Crore`;
  }
  if (numeric >= 100000) {
    return `PKR ${(numeric / 100000).toFixed(1).replace(/\.?0+$/, "")} Lakh`;
  }
  return `PKR ${numeric.toLocaleString("en-PK")}`;
}

export function vehicleImage(vehicle) {
  return vehicle?.coverImage || vehicle?.images?.[0]?.url || "";
}

export function formatMileage(vehicle) {
  const mileage = Number(vehicle?.mileage || 0);
  if (!mileage) return "Mileage not listed";
  return `${mileage.toLocaleString("en-PK")} ${vehicle?.mileageUnit || "km"}`;
}

export function dateLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PK", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

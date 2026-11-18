"use client";

import { useState } from "react";

export default function ResilientImage({ src, alt = "", loading = "lazy", fetchPriority = "auto" }) {
  const [failedSrc, setFailedSrc] = useState("");
  if (!src || failedSrc === src) return null;
  return <img src={src} alt={alt} loading={loading} decoding="async" fetchPriority={fetchPriority} onError={() => setFailedSrc(src)} />;
}

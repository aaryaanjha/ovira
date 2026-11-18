"use client";

import { useState } from "react";

export default function ResilientImage({ src, alt = "" }) {
  const [failedSrc, setFailedSrc] = useState("");
  if (!src || failedSrc === src) return null;
  return <img src={src} alt={alt} onError={() => setFailedSrc(src)} />;
}

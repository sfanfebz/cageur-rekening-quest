"use client";

import { useEffect, useState } from "react";

/** Fisher-Yates acak urutan array tanpa mengubah array aslinya. */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Acak urutan tampilan `items` sekali setiap quest dibuka. Sengaja BUKAN
 * `useMemo(() => shuffle(items), [items])` -- Math.random() beda hasil
 * antara render server (SSR) dan render client pertama saat hidrasi,
 * jadi React akan menganggapnya hydration mismatch. Render awal (server
 * + client pertama) selalu urutan ASLI dari `items`, baru diacak lewat
 * effect SETELAH hidrasi selesai -- konsisten, tanpa mismatch, dan tetap
 * "acak tiap dibuka" karena tiap mount baru effect-nya jalan lagi.
 *
 * `items` wajib berupa referensi stabil antar render (langsung dari
 * props, atau sudah dibungkus `useMemo` sendiri oleh caller) -- kalau
 * tidak, effect ini akan mengacak ulang tiap render dan urutan kartu
 * akan berubah-ubah saat pemain lagi main.
 */
export function useShuffled<T>(items: T[]): T[] {
  const [order, setOrder] = useState(items);
  useEffect(() => {
    setOrder(shuffle(items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  return order;
}

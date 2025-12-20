"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function CsButton() {
  const [user, setUser] = useState(null);
  const [cs, setCs] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase.from("settings").select("value").eq("key","cs_whatsapp").single()
      .then(({ data }) => setCs(data?.value || ""));
  }, []);

  if (!user) return null;

  return (
    <a href={`https://wa.me/${cs}`} target="_blank" style={btn}>
      💬 CS WhatsApp
    </a>
  );
}

const btn = {
  position:"fixed", bottom:20, right:20,
  background:"#25D366", color:"white",
  padding:"12px 16px", borderRadius:30,
  textDecoration:"none"
};

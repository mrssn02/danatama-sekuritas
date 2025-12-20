"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
        fetchProfile(data.user.id);
      }
    });
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (data) setUsername(data.username);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>Dashboard</h1>

      <div style={card}>
        <p><b>Username:</b> {username}</p>
        <p><b>Email:</b> {user?.email}</p>
        <p><b>Status:</b> Login aktif</p>
      </div>
    </div>
  );
}

const card = {
  marginTop: 20,
  padding: 20,
  background: "white",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
};

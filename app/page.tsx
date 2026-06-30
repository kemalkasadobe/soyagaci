"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Person = {
  id: string;
  full_name: string;
  birth_date: string | null;
  notes: string | null;
  created_at: string;
};

type FormState = {
  fullName: string;
  birthDate: string;
  notes: string;
};

const initialFormState: FormState = {
  fullName: "",
  birthDate: "",
  notes: ""
};

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [form, setForm] = useState<FormState>(initialFormState);

  const userEmail = useMemo(() => session?.user.email ?? "", [session]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setMessage("");
      setError("");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setPeople([]);
      return;
    }

    void loadPeople();
  }, [session]);

  async function loadPeople() {
    if (!session) return;

    setPeopleLoading(true);
    setError("");

    const { data, error: peopleError } = await supabase
      .from("people")
      .select("id, full_name, birth_date, notes, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (peopleError) {
      setError(peopleError.message);
    } else {
      setPeople(data ?? []);
    }

    setPeopleLoading(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured) {
      setError(
        "Supabase ortam degiskenleri eksik. NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanimlayin."
      );
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window === "undefined" ? undefined : window.location.origin
      }
    });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    setMessage("Giris baglantisi email adresinize gonderildi.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function handleAddPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !form.fullName.trim()) return;

    setError("");
    setMessage("");

    const { error: insertError } = await supabase.from("people").insert({
      user_id: session.user.id,
      full_name: form.fullName.trim(),
      birth_date: form.birthDate || null,
      notes: form.notes.trim() || null
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm(initialFormState);
    setMessage("Kisi eklendi.");
    await loadPeople();
  }

  if (loading) {
    return (
      <main className="page-shell">
        <section className="panel">
          <p className="muted">Yukleniyor...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Aile soy agaci</p>
        <h1>Supabase ile kisilerinizi kaydedin.</h1>
        <p className="lead">
          Email ile giris yapin, aile uyelerinizi people tablosunda listeleyin.
        </p>
      </section>

      {!session ? (
        <section className="panel auth-panel" aria-label="Giris">
          <h2>Giris yap</h2>
          <form onSubmit={handleLogin} className="stack">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@email.com"
              required
            />
            <button type="submit">Email ile giris linki gonder</button>
          </form>
          {message ? <p className="success">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </section>
      ) : (
        <section className="workspace" aria-label="Kisiler">
          <div className="toolbar">
            <div>
              <p className="eyebrow">Oturum acik</p>
              <h2>{userEmail}</h2>
            </div>
            <button className="secondary" type="button" onClick={handleLogout}>
              Cikis yap
            </button>
          </div>

          <div className="grid">
            <section className="panel">
              <h2>Kisi ekle</h2>
              <form onSubmit={handleAddPerson} className="stack">
                <label htmlFor="fullName">Ad soyad</label>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullName: event.target.value
                    }))
                  }
                  required
                />

                <label htmlFor="birthDate">Dogum tarihi</label>
                <input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      birthDate: event.target.value
                    }))
                  }
                />

                <label htmlFor="notes">Not</label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value
                    }))
                  }
                  rows={4}
                />

                <button type="submit">Kaydet</button>
              </form>
            </section>

            <section className="panel">
              <div className="list-header">
                <h2>Kisiler</h2>
                <button className="secondary" type="button" onClick={loadPeople}>
                  Yenile
                </button>
              </div>

              {peopleLoading ? <p className="muted">Kisiler yukleniyor...</p> : null}
              {!peopleLoading && people.length === 0 ? (
                <p className="muted">Henuz kisi eklenmedi.</p>
              ) : null}
              <ul className="people-list">
                {people.map((person) => (
                  <li key={person.id}>
                    <strong>{person.full_name}</strong>
                    {person.birth_date ? <span>{person.birth_date}</span> : null}
                    {person.notes ? <p>{person.notes}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {message ? <p className="success">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </section>
      )}
    </main>
  );
}

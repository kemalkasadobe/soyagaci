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

const visitorStorageKey = "soyagaci_visitor_name";
const mainAdminEmail = "kemalkasadobe@gmail.com";

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [visitorName, setVisitorName] = useState("");
  const [visitorInput, setVisitorInput] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  const userEmail = useMemo(() => session?.user.email ?? "", [session]);
  const isMainAdmin = userEmail.toLowerCase() === mainAdminEmail;
  const isVisitorReady = visitorName.trim().length > 0;

  useEffect(() => {
    const storedVisitorName = window.localStorage.getItem(visitorStorageKey);

    if (storedVisitorName) {
      setVisitorName(storedVisitorName);
      setVisitorInput(storedVisitorName);
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (
        data.session?.user.email &&
        data.session.user.email.toLowerCase() !== mainAdminEmail
      ) {
        void supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (
        nextSession?.user.email &&
        nextSession.user.email.toLowerCase() !== mainAdminEmail
      ) {
        void supabase.auth.signOut();
        setSession(null);
        setError("Bu alan sadece ana yonetici icindir.");
        return;
      }

      setSession(nextSession);
      setMessage("");
      setError("");
      if (nextSession) {
        setShowAdmin(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isVisitorReady) return;

    void loadPeople();
  }, [isVisitorReady]);

  useEffect(() => {
    setNoteDrafts(
      people.reduce<Record<string, string>>((drafts, person) => {
        drafts[person.id] = person.notes ?? "";
        return drafts;
      }, {})
    );
  }, [people]);

  async function loadPeople() {
    setPeopleLoading(true);
    setError("");

    const { data, error: peopleError } = await supabase
      .from("people")
      .select("id, full_name, birth_date, notes, created_at")
      .order("created_at", { ascending: true });

    if (peopleError) {
      setError(peopleError.message);
    } else {
      setPeople(data ?? []);
    }

    setPeopleLoading(false);
  }

  function handleVisitorEnter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = visitorInput.trim().replace(/\s+/g, " ");

    if (!cleanName) return;

    window.localStorage.setItem(visitorStorageKey, cleanName);
    setVisitorName(cleanName);
    setMessage("");
    setError("");
  }

  function handleChangeVisitor() {
    window.localStorage.removeItem(visitorStorageKey);
    setVisitorName("");
    setVisitorInput("");
    setPeople([]);
    setShowAdmin(false);
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

    if (email.trim().toLowerCase() !== mainAdminEmail) {
      setError("Bu alan sadece ana yonetici icindir.");
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    setPassword("");
    setMessage("Giris basarili.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function handleAddPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !isMainAdmin || !form.fullName.trim()) return;

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

  async function handleUpdateNote(person: Person) {
    if (!session) return;

    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("people")
      .update({ notes: noteDrafts[person.id]?.trim() || null })
      .eq("id", person.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Not kaydedildi.");
    await loadPeople();
  }

  if (loading) {
    return (
      <main className="page-shell compact-shell">
        <section className="panel">
          <p className="muted">Yukleniyor...</p>
        </section>
      </main>
    );
  }

  if (!isVisitorReady) {
    return (
      <main className="page-shell compact-shell">
        <section className="welcome">
          <p className="eyebrow">Alkas soy agaci</p>
          <h1>SOY AGACI SAYFASINA HOSGELDINIZ</h1>
          <p className="lead">
            Devam etmek icin adinizi ve soyadinizi yazin. Bu bilgi bu telefonda
            hatirlanir.
          </p>
        </section>

        <section className="panel auth-panel" aria-label="Ziyaretci girisi">
          <h2>Ad soyad</h2>
          <form onSubmit={handleVisitorEnter} className="stack">
            <label htmlFor="visitorName">Adiniz ve soyadiniz</label>
            <input
              id="visitorName"
              value={visitorInput}
              onChange={(event) => setVisitorInput(event.target.value)}
              placeholder="Ornek: Kemal Alkas"
              autoComplete="name"
              required
            />
            <button type="submit">Soy agacini gor</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Alkas soy agaci</p>
          <h1>Merhaba, {visitorName}.</h1>
          <p className="lead">
            Aile uyelerini burada gorebilirsiniz. Degisiklik yapmak icin
            yonetici girisi gerekir.
          </p>
        </div>
        <button className="secondary" type="button" onClick={handleChangeVisitor}>
          Ismi degistir
        </button>
      </section>

      <section className="tree-panel" aria-label="Soy agaci">
        <div className="list-header">
          <div>
            <p className="eyebrow">Gorunum</p>
            <h2>Soy agaci</h2>
          </div>
          <button className="secondary" type="button" onClick={loadPeople}>
            Yenile
          </button>
        </div>

        {peopleLoading ? <p className="muted">Soy agaci yukleniyor...</p> : null}
        {!peopleLoading && people.length === 0 ? (
          <div className="empty-state">
            <strong>Henuz kisi eklenmedi.</strong>
            <p>Yonetici girisi yaptiktan sonra aile bireyleri eklenebilir.</p>
          </div>
        ) : null}

        {people.length > 0 ? (
          <div className="tree-grid">
            {people.map((person) => (
              <article className="person-card" key={person.id}>
                <span className="avatar" aria-hidden="true">
                  {person.full_name.trim().charAt(0).toUpperCase()}
                </span>
                <div>
                  <strong>{person.full_name}</strong>
                  {person.birth_date ? <span>{person.birth_date}</span> : null}
                  {person.notes ? <p>{person.notes}</p> : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="admin-shell" aria-label="Yonetici alani">
        <button
          className="secondary admin-toggle"
          type="button"
          onClick={() => setShowAdmin((current) => !current)}
        >
          {showAdmin ? "Yonetici alanini kapat" : "Degisiklik yapmak istiyorum"}
        </button>

        {showAdmin ? (
          <div className="admin-grid">
            {!session ? (
              <section className="panel">
                <h2>Yonetici girisi</h2>
                <form onSubmit={handleLogin} className="stack">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ornek@email.com"
                    autoComplete="email"
                    required
                  />
                  <label htmlFor="password">Sifre</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Supabase kullanici sifresi"
                    autoComplete="current-password"
                    required
                  />
                  <button type="submit">Giris yap</button>
                </form>
              </section>
            ) : (
              <section className="panel">
                <div className="toolbar">
                  <div>
                    <p className="eyebrow">Ana yonetici</p>
                    <h2>{userEmail}</h2>
                  </div>
                  <button className="secondary" type="button" onClick={handleLogout}>
                    Cikis yap
                  </button>
                </div>

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

                  <button type="submit">Kisi ekle</button>
                </form>
              </section>
            )}

            {session && isMainAdmin && people.length > 0 ? (
              <section className="panel">
                <h2>Notlari duzenle</h2>
                <div className="editor-list">
                  {people.map((person) => (
                    <article className="editor-card" key={person.id}>
                      <strong>{person.full_name}</strong>
                      <label htmlFor={`note-${person.id}`}>Not</label>
                      <textarea
                        id={`note-${person.id}`}
                        value={noteDrafts[person.id] ?? ""}
                        onChange={(event) =>
                          setNoteDrafts((current) => ({
                            ...current,
                            [person.id]: event.target.value
                          }))
                        }
                        rows={3}
                      />
                      <button type="button" onClick={() => handleUpdateNote(person)}>
                        Notu kaydet
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </section>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </main>
  );
}

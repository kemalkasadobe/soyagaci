"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Person = {
  id: string;
  full_name: string;
  birth_date: string | null;
  death_date: string | null;
  gender: string | null;
  mother_id: string | null;
  father_id: string | null;
  spouse_id: string | null;
  notes: string | null;
  created_at: string;
};

type FormState = {
  fullName: string;
  birthDate: string;
  deathDate: string;
  gender: string;
  motherId: string;
  fatherId: string;
  spouseId: string;
  notes: string;
};

const initialFormState: FormState = {
  fullName: "",
  birthDate: "",
  deathDate: "",
  gender: "",
  motherId: "",
  fatherId: "",
  spouseId: "",
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
  const [editDrafts, setEditDrafts] = useState<Record<string, FormState>>({});
  const [visitorName, setVisitorName] = useState("");
  const [visitorInput, setVisitorInput] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeView, setActiveView] = useState<"tree" | "list">("tree");
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");

  const userEmail = useMemo(() => session?.user.email ?? "", [session]);
  const isMainAdmin = userEmail.toLowerCase() === mainAdminEmail;
  const isVisitorReady = visitorName.trim().length > 0;
  const peopleById = useMemo(
    () => new Map(people.map((person) => [person.id, person])),
    [people]
  );
  const selectedPerson = useMemo(
    () => peopleById.get(selectedPersonId) ?? people[0] ?? null,
    [people, peopleById, selectedPersonId]
  );
  const allTreeLevels = useMemo(() => {
    const visited = new Set<string>();
    const levels: Person[][] = [];
    let currentLevel = people.filter(
      (person) => !person.mother_id && !person.father_id
    );

    if (currentLevel.length === 0) {
      currentLevel = people;
    }

    while (currentLevel.length > 0) {
      const uniqueLevel = currentLevel.filter((person) => {
        if (visited.has(person.id)) return false;
        visited.add(person.id);
        return true;
      });

      if (uniqueLevel.length > 0) {
        levels.push(uniqueLevel);
      }

      currentLevel = uniqueLevel.flatMap((person) =>
        people.filter(
          (candidate) =>
            candidate.mother_id === person.id || candidate.father_id === person.id
        )
      );
    }

    const remainingPeople = people.filter((person) => !visited.has(person.id));
    if (remainingPeople.length > 0) {
      levels.push(remainingPeople);
    }

    return levels;
  }, [people]);

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
    setEditDrafts(
      people.reduce<Record<string, FormState>>((drafts, person) => {
        drafts[person.id] = personToFormState(person);
        return drafts;
      }, {})
    );
  }, [people]);

  useEffect(() => {
    if (people.length === 0) {
      setSelectedPersonId("");
      return;
    }

    if (!selectedPersonId || !people.some((person) => person.id === selectedPersonId)) {
      setSelectedPersonId(people[0].id);
    }
  }, [people, selectedPersonId]);

  async function loadPeople() {
    setPeopleLoading(true);
    setError("");

    const { data, error: peopleError } = await supabase
      .from("people")
      .select(
        "id, full_name, birth_date, death_date, gender, mother_id, father_id, spouse_id, notes, created_at"
      )
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
      birth_date: yearToDate(form.birthDate),
      death_date: yearToDate(form.deathDate),
      gender: form.gender || null,
      mother_id: form.motherId || null,
      father_id: form.fatherId || null,
      spouse_id: form.spouseId || null,
      notes: form.notes.trim() || null
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm(initialFormState);
    setMessage("Kisi eklendi.");
    setShowAddMember(false);
    await loadPeople();
  }

  function yearToDate(year: string) {
    const cleanYear = year.trim();
    return cleanYear ? `${cleanYear}-01-01` : null;
  }

  function dateToYear(date: string | null) {
    return date ? date.slice(0, 4) : "";
  }

  function formatYears(person: Person) {
    return [dateToYear(person.birth_date), dateToYear(person.death_date)]
      .filter(Boolean)
      .join(" - ");
  }

  function personToFormState(person: Person): FormState {
    return {
      fullName: person.full_name,
      birthDate: dateToYear(person.birth_date),
      deathDate: dateToYear(person.death_date),
      gender: person.gender ?? "",
      motherId: person.mother_id ?? "",
      fatherId: person.father_id ?? "",
      spouseId: person.spouse_id ?? "",
      notes: person.notes ?? ""
    };
  }

  function getPersonName(id: string | null) {
    if (!id) return "";
    return peopleById.get(id)?.full_name ?? "";
  }

  function getChildren(parentId: string) {
    return people.filter(
      (person) => person.mother_id === parentId || person.father_id === parentId
    );
  }

  function getParents(person: Person) {
    return [getPersonName(person.mother_id), getPersonName(person.father_id)]
      .filter(Boolean)
      .join(" / ");
  }

  function getGenderClass(person: Person | null) {
    if (!person?.gender) return "neutral";
    return person.gender.toLowerCase() === "kadin" ? "female" : "male";
  }

  async function handleUpdatePerson(person: Person) {
    if (!session) return;
    const draft = editDrafts[person.id];
    if (!draft || !draft.fullName.trim()) return;

    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("people")
      .update({
        full_name: draft.fullName.trim(),
        birth_date: yearToDate(draft.birthDate),
        death_date: yearToDate(draft.deathDate),
        gender: draft.gender || null,
        mother_id: draft.motherId || null,
        father_id: draft.fatherId || null,
        spouse_id: draft.spouseId || null,
        notes: draft.notes.trim() || null
      })
      .eq("id", person.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Kisi bilgileri kaydedildi.");
    await loadPeople();
  }

  function updateEditDraft(personId: string, values: Partial<FormState>) {
    setEditDrafts((current) => ({
      ...current,
      [personId]: {
        ...(current[personId] ?? initialFormState),
        ...values
      }
    }));
  }

  function handleSiblingPick(siblingId: string) {
    const sibling = peopleById.get(siblingId);
    if (!sibling) return;

    setForm((current) => ({
      ...current,
      motherId: sibling.mother_id ?? "",
      fatherId: sibling.father_id ?? ""
    }));
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
        <div className="tree-topbar">
          <div>
            <p className="eyebrow">Gorunum</p>
            <h2>Soy agaci</h2>
          </div>
          <div className="tree-actions">
            <div className="tabs" aria-label="Gorunum secimi">
              <button
                className={activeView === "tree" ? "tab active" : "tab"}
                type="button"
                onClick={() => setActiveView("tree")}
              >
                Tree
              </button>
              <button
                className={activeView === "list" ? "tab active" : "tab"}
                type="button"
                onClick={() => setActiveView("list")}
              >
                List
              </button>
            </div>
            <button className="secondary" type="button" onClick={loadPeople}>
              Yenile
            </button>
            {session && isMainAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setShowAdmin(true);
                  setShowAddMember(true);
                }}
              >
                Uye ekle
              </button>
            ) : null}
          </div>
        </div>

        {peopleLoading ? <p className="muted">Soy agaci yukleniyor...</p> : null}
        {!peopleLoading && people.length === 0 ? (
          <div className="empty-state">
            <strong>Henuz kisi eklenmedi.</strong>
            <p>Yonetici girisi yaptiktan sonra aile bireyleri eklenebilir.</p>
          </div>
        ) : null}

        {people.length > 0 && activeView === "tree" ? (
          <div className="full-tree-layout" aria-label="Tum soy agaci gorunumu">
            <div className="full-tree-scroll">
              <div className="full-tree-board">
                {allTreeLevels.map((level, levelIndex) => (
                  <section className="full-generation" key={`level-${levelIndex}`}>
                    <span className="generation-label">{levelIndex + 1}. Nesil</span>
                    <div className="full-generation-row">
                      {level.map((person) => (
                        <button
                          className={`pedigree-card ${getGenderClass(person)} ${
                            selectedPerson?.id === person.id ? "selected" : ""
                          }`}
                          key={person.id}
                          type="button"
                          onClick={() => setSelectedPersonId(person.id)}
                        >
                          <span className="pedigree-avatar" aria-hidden="true">
                            {person.full_name.trim().charAt(0).toUpperCase()}
                          </span>
                          <span className="pedigree-name">{person.full_name}</span>
                          {formatYears(person) ? (
                            <span className="pedigree-years">{formatYears(person)}</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <aside className="detail-panel" aria-label="Secili kisi bilgileri">
              {selectedPerson ? (
                <>
                  <div className="detail-head">
                    <span
                      className={`detail-avatar ${getGenderClass(selectedPerson)}`}
                      aria-hidden="true"
                    >
                      {selectedPerson.full_name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <h3>{selectedPerson.full_name}</h3>
                      {formatYears(selectedPerson) ? (
                        <p>{formatYears(selectedPerson)}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="detail-list">
                    {selectedPerson.gender ? (
                      <span>Cinsiyet: {selectedPerson.gender}</span>
                    ) : null}
                    {getParents(selectedPerson) ? (
                      <span>Anne/Baba: {getParents(selectedPerson)}</span>
                    ) : null}
                    {selectedPerson.spouse_id ? (
                      <span>Es: {getPersonName(selectedPerson.spouse_id)}</span>
                    ) : null}
                    {getChildren(selectedPerson.id).length > 0 ? (
                      <span>
                        Cocuklar:{" "}
                        {getChildren(selectedPerson.id)
                          .map((child) => child.full_name)
                          .join(", ")}
                      </span>
                    ) : null}
                    {selectedPerson.notes ? <p>{selectedPerson.notes}</p> : null}
                  </div>

                  <div className="index-panel">
                    <strong>Kisi indeksi</strong>
                    <div className="index-list">
                      {people.map((person) => (
                        <button
                          className={
                            selectedPerson.id === person.id
                              ? "index-button active"
                              : "index-button"
                          }
                          key={person.id}
                          type="button"
                          onClick={() => setSelectedPersonId(person.id)}
                        >
                          <span>{person.full_name}</span>
                          <span>{formatYears(person)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </aside>
          </div>
        ) : null}

        {people.length > 0 && activeView === "list" ? (
          <div className="member-list" aria-label="Kisi listesi">
            {people.map((person) => {
              const children = getChildren(person.id);
              return (
                <article className="member-row" key={person.id}>
                  <div>
                    <strong>{person.full_name}</strong>
                    {formatYears(person) ? <span>{formatYears(person)}</span> : null}
                    {person.gender ? <span>{person.gender}</span> : null}
                  </div>
                  <div>
                    {person.spouse_id ? <span>Es: {getPersonName(person.spouse_id)}</span> : null}
                    {getParents(person) ? <span>Anne/Baba: {getParents(person)}</span> : null}
                    {children.length > 0 ? (
                      <span>Cocuklar: {children.map((child) => child.full_name).join(", ")}</span>
                    ) : null}
                  </div>
                  {person.notes ? <p>{person.notes}</p> : null}
                </article>
              );
            })}
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
                <button
                  type="button"
                  onClick={() => setShowAddMember((current) => !current)}
                >
                  {showAddMember ? "Uye eklemeyi kapat" : "Uye ekle"}
                </button>
              </section>
            )}

            {session && isMainAdmin && people.length > 0 ? (
              <section className="panel">
                <h2>Kisileri duzenle</h2>
                <div className="editor-list">
                  {people.map((person) => {
                    const draft = editDrafts[person.id] ?? personToFormState(person);

                    return (
                      <article className="editor-card" key={person.id}>
                        <strong>{person.full_name}</strong>

                        <label htmlFor={`edit-name-${person.id}`}>Ad soyad</label>
                        <input
                          id={`edit-name-${person.id}`}
                          value={draft.fullName}
                          onChange={(event) =>
                            updateEditDraft(person.id, { fullName: event.target.value })
                          }
                          required
                        />

                        <label htmlFor={`edit-birth-${person.id}`}>Dogum yili</label>
                        <input
                          id={`edit-birth-${person.id}`}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max="2200"
                          value={draft.birthDate}
                          onChange={(event) =>
                            updateEditDraft(person.id, { birthDate: event.target.value })
                          }
                        />

                        <label htmlFor={`edit-death-${person.id}`}>Olum yili</label>
                        <input
                          id={`edit-death-${person.id}`}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max="2200"
                          value={draft.deathDate}
                          onChange={(event) =>
                            updateEditDraft(person.id, { deathDate: event.target.value })
                          }
                        />

                        <label htmlFor={`edit-gender-${person.id}`}>Cinsiyet</label>
                        <select
                          id={`edit-gender-${person.id}`}
                          value={draft.gender}
                          onChange={(event) =>
                            updateEditDraft(person.id, { gender: event.target.value })
                          }
                        >
                          <option value="">Secilmedi</option>
                          <option value="Kadin">Kadin</option>
                          <option value="Erkek">Erkek</option>
                        </select>

                        <label htmlFor={`edit-mother-${person.id}`}>Anne</label>
                        <select
                          id={`edit-mother-${person.id}`}
                          value={draft.motherId}
                          onChange={(event) =>
                            updateEditDraft(person.id, { motherId: event.target.value })
                          }
                        >
                          <option value="">Secilmedi</option>
                          {people
                            .filter((option) => option.id !== person.id)
                            .map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.full_name}
                              </option>
                            ))}
                        </select>

                        <label htmlFor={`edit-father-${person.id}`}>Baba</label>
                        <select
                          id={`edit-father-${person.id}`}
                          value={draft.fatherId}
                          onChange={(event) =>
                            updateEditDraft(person.id, { fatherId: event.target.value })
                          }
                        >
                          <option value="">Secilmedi</option>
                          {people
                            .filter((option) => option.id !== person.id)
                            .map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.full_name}
                              </option>
                            ))}
                        </select>

                        <label htmlFor={`edit-spouse-${person.id}`}>Es</label>
                        <select
                          id={`edit-spouse-${person.id}`}
                          value={draft.spouseId}
                          onChange={(event) =>
                            updateEditDraft(person.id, { spouseId: event.target.value })
                          }
                        >
                          <option value="">Secilmedi</option>
                          {people
                            .filter((option) => option.id !== person.id)
                            .map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.full_name}
                              </option>
                            ))}
                        </select>

                        <label htmlFor={`edit-note-${person.id}`}>Not</label>
                        <textarea
                          id={`edit-note-${person.id}`}
                          value={draft.notes}
                          onChange={(event) =>
                            updateEditDraft(person.id, { notes: event.target.value })
                          }
                          rows={3}
                        />
                        <button type="button" onClick={() => handleUpdatePerson(person)}>
                          Bilgileri kaydet
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </section>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {showAddMember && session && isMainAdmin ? (
        <div className="drawer-backdrop" role="presentation">
          <aside className="member-drawer" aria-label="Aile uyesi ekle">
            <div className="drawer-header">
              <h2>Aile Uyesi Ekle</h2>
              <button
                className="icon-button"
                type="button"
                aria-label="Kapat"
                onClick={() => setShowAddMember(false)}
              >
                x
              </button>
            </div>

            <form onSubmit={handleAddPerson} className="drawer-form">
              <label htmlFor="fullName">Ad Soyad *</label>
              <input
                id="fullName"
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value
                  }))
                }
                placeholder="Tam adinizi girin"
                required
              />

              <label htmlFor="gender">Cinsiyet *</label>
              <select
                id="gender"
                value={form.gender}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gender: event.target.value
                  }))
                }
              >
                <option value="">Secilmedi</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadin">Kadin</option>
              </select>

              <div className="form-split">
                <div>
                  <label htmlFor="birthDate">Dogum Yili</label>
                  <input
                    id="birthDate"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="2200"
                    value={form.birthDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        birthDate: event.target.value
                      }))
                    }
                    placeholder="1990"
                  />
                </div>
                <div>
                  <label htmlFor="deathDate">Olum Yili</label>
                  <input
                    id="deathDate"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="2200"
                    value={form.deathDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deathDate: event.target.value
                      }))
                    }
                    placeholder="Yasiyorsa bos"
                  />
                </div>
              </div>

              <label htmlFor="notes">Biyografi</label>
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
                placeholder="Bu kisi hakkinda kisa bir aciklama..."
              />

              <label htmlFor="motherId">Anne</label>
              <select
                id="motherId"
                value={form.motherId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    motherId: event.target.value
                  }))
                }
              >
                <option value="">Secilmedi</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>

              <label htmlFor="fatherId">Baba</label>
              <select
                id="fatherId"
                value={form.fatherId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fatherId: event.target.value
                  }))
                }
              >
                <option value="">Secilmedi</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>

              <label htmlFor="spouseId">Es</label>
              <select
                id="spouseId"
                value={form.spouseId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    spouseId: event.target.value
                  }))
                }
              >
                <option value="">Secilmedi</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>

              <label htmlFor="siblingId">Kardesi varsa sec</label>
              <select
                id="siblingId"
                onChange={(event) => handleSiblingPick(event.target.value)}
                defaultValue=""
              >
                <option value="">Secilmedi</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>

              <button type="submit">Kaydet</button>
            </form>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

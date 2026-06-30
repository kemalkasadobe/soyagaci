"use client";

import { useMemo, useState } from "react";
import { familyPeople, type FamilyPerson } from "@/data/people";

type TreeLevel = {
  title: string;
  people: FamilyPerson[];
};

export default function HomePage() {
  const [selectedPersonId, setSelectedPersonId] = useState("kemal-alkas-1982");
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<"tree" | "list">("tree");

  const peopleById = useMemo(
    () => new Map(familyPeople.map((person) => [person.id, person])),
    []
  );
  const selectedPerson = peopleById.get(selectedPersonId) ?? familyPeople[0];
  const filteredPeople = useMemo(() => {
    const cleanSearch = search.trim().toLocaleLowerCase("tr-TR");
    if (!cleanSearch) return familyPeople;

    return familyPeople.filter((person) =>
      [
        person.fullName,
        person.relation,
        person.fatherName,
        person.motherName,
        formatYears(person)
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(cleanSearch)
    );
  }, [search]);
  const treeLevels = useMemo<TreeLevel[]>(() => {
    const generationById = new Map(familyPeople.map((person) => [person.id, 0]));

    for (let index = 0; index < familyPeople.length; index += 1) {
      let changed = false;

      familyPeople.forEach((person) => {
        const parentGenerations = [person.fatherId, person.motherId]
          .map((parentId) => (parentId ? generationById.get(parentId) : undefined))
          .filter((value): value is number => typeof value === "number");

        if (parentGenerations.length === 0) return;

        const nextGeneration = Math.max(...parentGenerations) + 1;
        if (nextGeneration > (generationById.get(person.id) ?? 0)) {
          generationById.set(person.id, nextGeneration);
          changed = true;
        }
      });

      if (!changed) break;
    }

    const maxGeneration = Math.max(...generationById.values());
    return Array.from({ length: maxGeneration + 1 }, (_item, index) => ({
      title: `${index + 1}. Kusak`,
      people: sortPeople(
        familyPeople.filter((person) => generationById.get(person.id) === index)
      )
    })).filter((level) => level.people.length > 0);
  }, []);
  const children = useMemo(
    () =>
      familyPeople.filter(
        (person) =>
          person.fatherId === selectedPerson.id || person.motherId === selectedPerson.id
      ),
    [selectedPerson.id]
  );

  return (
    <main className="page-shell">
      <section className="site-header">
        <div>
          <p className="eyebrow">Excel verisinden olusturuldu</p>
          <h1>Alkas Soy Agaci</h1>
          <p className="lead">
            Bu sayfa, yuklediginiz Alt-Ust Soy Bilgisi Excel dosyasindaki
            kisilerden olusturulan sade aile arsividir.
          </p>
        </div>
        <div className="stat-grid" aria-label="Ozet bilgiler">
          <div>
            <strong>{familyPeople.length}</strong>
            <span>Kisi</span>
          </div>
          <div>
            <strong>{treeLevels.length}</strong>
            <span>Kusak</span>
          </div>
          <div>
            <strong>{familyPeople.filter((person) => person.deathYear === null).length}</strong>
            <span>Yasiyor</span>
          </div>
        </div>
      </section>

      <section className="panel source-note">
        <strong>Veri kaynagi</strong>
        <span>C:\Users\kemal\Downloads\Alt-Ust Soy Bilgisi Sorgulama.xlsx</span>
      </section>

      <section className="tree-panel" aria-label="Soy agaci">
        <div className="tree-topbar">
          <div>
            <p className="eyebrow">Gorunum</p>
            <h2>Soy agaci</h2>
          </div>
          <div className="tree-actions">
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Kisi ara..."
              aria-label="Kisi ara"
            />
            <div className="tabs" aria-label="Gorunum secimi">
              <button
                className={activeView === "tree" ? "tab active" : "tab"}
                type="button"
                onClick={() => setActiveView("tree")}
              >
                Kusaklar
              </button>
              <button
                className={activeView === "list" ? "tab active" : "tab"}
                type="button"
                onClick={() => setActiveView("list")}
              >
                Liste
              </button>
            </div>
          </div>
        </div>

        {activeView === "tree" ? (
          <div className="family-layout">
            <div className="generation-board">
              {treeLevels.map((level) => (
                <section className="generation-column" key={level.title}>
                  <span className="generation-title">{level.title}</span>
                  <div className="generation-stack">
                    {level.people.map((person) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        selected={person.id === selectedPerson.id}
                        onSelect={() => setSelectedPersonId(person.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <PersonDetail
              children={children}
              peopleById={peopleById}
              person={selectedPerson}
              onSelect={setSelectedPersonId}
            />
          </div>
        ) : (
          <div className="member-list" aria-label="Kisi listesi">
            {sortPeople(filteredPeople).map((person) => (
              <article className="member-row compact-member" key={person.id}>
                <div>
                  <strong>{person.fullName}</strong>
                  <span>{formatYears(person)}</span>
                  <span>{person.relation}</span>
                </div>
                <div>
                  <span>Baba: {person.fatherName || "Bilinmiyor"}</span>
                  <span>Ana: {person.motherName || "Bilinmiyor"}</span>
                </div>
                <button type="button" onClick={() => setSelectedPersonId(person.id)}>
                  Detay
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function PersonCard({
  onSelect,
  person,
  selected
}: {
  onSelect: () => void;
  person: FamilyPerson;
  selected: boolean;
}) {
  return (
    <button
      className={`person-tile ${person.gender === "Kadin" ? "female" : "male"} ${
        selected ? "selected" : ""
      }`}
      type="button"
      onClick={onSelect}
    >
      <span className="tile-avatar" aria-hidden="true">
        {person.fullName.charAt(0)}
      </span>
      <span>
        <strong>{person.fullName}</strong>
        <small>{formatYears(person)}</small>
      </span>
    </button>
  );
}

function PersonDetail({
  children,
  onSelect,
  peopleById,
  person
}: {
  children: FamilyPerson[];
  onSelect: (personId: string) => void;
  peopleById: Map<string, FamilyPerson>;
  person: FamilyPerson;
}) {
  const father = person.fatherId ? peopleById.get(person.fatherId) : null;
  const mother = person.motherId ? peopleById.get(person.motherId) : null;
  const spouse = person.spouseId ? peopleById.get(person.spouseId) : null;

  return (
    <aside className="person-detail-panel" aria-label="Kisi detayi">
      <div className="detail-head simple">
        <span className={`detail-avatar ${person.gender === "Kadin" ? "female" : ""}`}>
          {person.fullName.charAt(0)}
        </span>
        <div>
          <h3>{person.fullName}</h3>
          <p>{formatYears(person)}</p>
        </div>
      </div>

      <div className="detail-list">
        <span>Yakinlik: {person.relation}</span>
        <span>Cinsiyet: {person.gender}</span>
        <span>Excel baba adi: {person.fatherName || "Bilinmiyor"}</span>
        <span>Excel ana adi: {person.motherName || "Bilinmiyor"}</span>
      </div>

      <div className="relation-grid">
        <RelationButton label="Baba" onSelect={onSelect} person={father} />
        <RelationButton label="Anne" onSelect={onSelect} person={mother} />
        <RelationButton label="Es" onSelect={onSelect} person={spouse} />
      </div>

      <div className="children-panel">
        <strong>Cocuklar</strong>
        {children.length > 0 ? (
          children.map((child) => (
            <button key={child.id} type="button" onClick={() => onSelect(child.id)}>
              {child.fullName}
            </button>
          ))
        ) : (
          <span>Kayitli cocuk yok</span>
        )}
      </div>
    </aside>
  );
}

function RelationButton({
  label,
  onSelect,
  person
}: {
  label: string;
  onSelect: (personId: string) => void;
  person: FamilyPerson | null | undefined;
}) {
  if (!person) {
    return (
      <div className="relation-card">
        <span>{label}</span>
        <strong>Bilinmiyor</strong>
      </div>
    );
  }

  return (
    <button className="relation-card clickable" type="button" onClick={() => onSelect(person.id)}>
      <span>{label}</span>
      <strong>{person.fullName}</strong>
    </button>
  );
}

function formatYears(person: FamilyPerson) {
  if (!person.birthYear && !person.deathYear) return "Tarih yok";
  return [person.birthYear, person.deathYear].filter(Boolean).join(" - ");
}

function sortPeople(people: FamilyPerson[]) {
  return [...people].sort((first, second) => {
    const firstYear = first.birthYear ?? 9999;
    const secondYear = second.birthYear ?? 9999;
    return firstYear - secondYear || first.fullName.localeCompare(second.fullName);
  });
}

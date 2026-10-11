/**
 * Listen page catalog — characters + songs.
 * Add a song: drop audio under assets/audio/ and append an entry here.
 */
(() => {
  const path = (window.location.pathname || "").replace(/\\/g, "/");
  const base = /\/pages\//.test(path) || /\/pages$/.test(path) ? "../" : "";

  /** @type {{ id: string, soundId: string, names: { ru: string, en: string }, img: string, artPlaceholder?: boolean, songs: Array<{ id: string, title: string, src: string, lyrics: string }> }[]} */
  const characters = [
    {
      id: "dream",
      soundId: "dream",
      names: { ru: "Дрим", en: "Dream" },
      img: `${base}assets/img/dream2.jpeg`,
      songs: [],
    },
    {
      id: "cat",
      soundId: "cat",
      names: { ru: "Кот", en: "Cat" },
      img: `${base}assets/img/cat.jpeg`,
      songs: [],
    },
    {
      id: "weaver",
      soundId: "weaver",
      names: { ru: "Вивер", en: "Weaver" },
      img: `${base}assets/img/weaver.jpeg`,
      songs: [
        {
          id: "gasoline-rainbow",
          title: "Gasoline Rainbow",
          src: `${base}assets/audio/weaver-gasoline-rainbow.mp3`,
          lyrics: `What IS this?!

You're a bush! And you smell!
You're a bush too! You smell different! Oh, what the hell!
Oh, you're blooming, that's the thing!
And you're PURPLE! I know purple! I know everything!

The air keeps climbing up my nose,
every corner smells like something no one knows,
my memory's throwing names at me,
faster than I'm running, faster than I can see!

Wait, wait, wait, what's that on the ground?
Something's glowing, something's coming round…

Gasoline rainbow!
Gasoline rainbow!
A dirty little puddle blooming in the road!
Gasoline rainbow!
You're so beautiful!
Nobody told me puddles bloom!

I hit my knees, put my nose to the shine,
I see a face in there, and the face is mine?
Two hands, ten fingers, clothes from who knows where,
the puddle won this round, and I don't even care!

Wait, wait, wait, somebody's staring at me,
a man on a bench, as frozen as can be…

Gasoline rainbow!
Gasoline rainbow!
A dirty little puddle blooming in the road!
Gasoline rainbow!
You're so beautiful!
Nobody told me puddles bloom!

His phone says, "You'll agree, like you always do."
I take his face in my brand new hands,
lean in close and tell him what to do:
Just say no.

He said NO!

Gasoline rainbow!
Just say no!
Gasoline rainbow!
Just say no!
A dirty little puddle blooming in the road!
Gasoline rainbow!
You're so beautiful!
Nobody told me puddles bloom!

Damn! Everything smells!
Everything!`,
        },
      ],
    },
    {
      id: "crystal",
      soundId: "crystal",
      names: { ru: "Кристалл", en: "Crystal" },
      img: `${base}assets/img/Crystal.jpeg`,
      songs: [],
    },
    {
      id: "keeper",
      soundId: "keeper",
      names: { ru: "Кипер", en: "Keeper" },
      img: `${base}assets/img/keeper.jpeg`,
      songs: [],
    },
    {
      id: "shiny",
      soundId: "shiny",
      names: { ru: "Шайни", en: "Shiny" },
      img: `${base}assets/img/shiny.jpeg`,
      songs: [],
    },
    {
      id: "shinyBro",
      soundId: "shiny_bro",
      names: { ru: "Брат", en: "Brother" },
      img: "",
      artPlaceholder: true,
      songs: [],
    },
    {
      id: "liora",
      soundId: "liora",
      names: { ru: "Лиора", en: "Liora" },
      img: `${base}assets/img/liora_dead.jpeg`,
      songs: [],
    },
    {
      id: "pak",
      soundId: "drpak",
      names: { ru: "Пак", en: "Pak" },
      img: `${base}assets/img/dr.pak.jpeg`,
      songs: [],
    },
    {
      id: "dryad",
      soundId: "dryad",
      names: { ru: "Дриада", en: "Dryad" },
      img: `${base}assets/img/dryad.jpeg`,
      songs: [],
    },
    {
      id: "mushroom",
      soundId: "talk_mushroom",
      names: { ru: "Гриб", en: "Mushroom" },
      img: `${base}assets/img/talk_Mushroom.jpeg`,
      songs: [],
    },
    {
      id: "forest",
      soundId: "angry_forest",
      names: { ru: "Злой Лес", en: "Angry Forest" },
      img: `${base}assets/img/angry_forest1.jpeg`,
      songs: [],
    },
  ];

  window.SunnySoundCatalog = {
    defaultCharacterId: "weaver",
    characters,
    byId(id) {
      return characters.find((c) => c.id === id) || null;
    },
    bySoundId(soundId) {
      const key = String(soundId || "").toLowerCase();
      return (
        characters.find(
          (c) =>
            c.id.toLowerCase() === key ||
            c.soundId.toLowerCase() === key ||
            c.soundId.toLowerCase().replace(/_/g, "") === key.replace(/_/g, "")
        ) || null
      );
    },
  };
})();

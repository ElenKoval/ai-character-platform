/**
 * Chapter + character metadata for reader rail and dossier pages.
 * Story text: homepage-story.js (window.homepageStory).
 */
(() => {
  const base = (() => {
    const path = (window.location.pathname || "").replace(/\\/g, "/");
    return /\/pages\//.test(path) || /\/pages$/.test(path) ? "../" : "";
  })();

  const characters = {
    dream: {
      id: "dream",
      i18n: {
        ru: {
          name: "Дрим",
          nameWith: "Дримом",
          essence: "Дрим — садовник Нитей",
          blurb: "Он видит, куда должна расти Нить, и бережёт её путь. Жажда для него — рана, а не желание.",
          quote: "«Я здесь. Что у тебя?»",
          askHint: "Расскажи, что болит…",
          waitPhrase: "Дрим смотрит на Нити…",
        },
        en: {
          name: "Dream",
          nameWith: "Dream",
          essence: "Dream — the Gardener of Threads",
          blurb: "He sees where the Thread must grow and guards its path. Thirst, to him, is a wound, not a desire.",
          quote: "“I'm here. What do you have?”",
          askHint: "Tell me what hurts…",
          waitPhrase: "Dream is looking at the Threads…",
        },
      },
      apiId: "dream",
      soundId: "dream",
      name: "Дрим",
      nameWith: "Дримом",
      gender: "m",
      page: `${base}pages/dream.html`,
      img: `${base}assets/img/dream2.jpeg`,
      world: "dream",
      essence: "Дрим — садовник Нитей",
      blurb: "Он видит, куда должна расти Нить, и бережёт её путь. Жажда для него — рана, а не желание.",
      quote: "«Я здесь. Что у тебя?»",
      askHint: "Расскажи, что болит…",
      waitPhrase: "Дрим смотрит на Нити…",
      typePace: 95,
      sceneContrast: "soft",
      aliases: ["Дрим", "Dream", "Mr. Dream"],
      tracks: [
        { title: "Track one", href: "#" },
        { title: "Track two", href: "#" },
      ],
    },
    weaver: {
      id: "weaver",
      i18n: {
        ru: {
          name: "Вивер",
          nameWith: "Вивер",
          essence: "Вивер — свобода любой ценой",
          blurb: "Она бежит, смеётся и ломает порядок Сада, чтобы Нить могла выбрать себя сама.",
          quote: "О! Ты кто?",
          askHint: "Чего ты хочешь на самом деле?",
          waitPhrase: "Вивер уже бежит к тебе…",
        },
        en: {
          name: "Weaver",
          nameWith: "Weaver",
          essence: "Weaver — freedom at any price",
          blurb: "She runs, laughs, and breaks the Garden's order so the Thread can choose itself.",
          quote: "Oh! Who are you?",
          askHint: "What do you really want?",
          waitPhrase: "Weaver is already running to you…",
        },
      },
      apiId: "weaver",
      soundId: "weaver",
      name: "Вивер",
      nameWith: "Вивер",
      gender: "f",
      page: `${base}pages/weaver.html`,
      img: `${base}assets/img/weaver.jpeg`,
      world: "weaver",
      essence: "Вивер — свобода любой ценой",
      blurb: "Она бежит, смеётся и ломает порядок Сада, чтобы Нить могла выбрать себя сама.",
      quote: "О! Ты кто?",
      askHint: "Чего ты хочешь на самом деле?",
      waitPhrase: "Вивер уже бежит к тебе…",
      /**
       * Opening line by read progress. For n=13, returning visitors with history get a different line.
       * @param {number} readChapter
       * @param {{ returning?: boolean, lang?: string }} [opts]
       */
      getOpening(readChapter, opts = {}) {
        const nRaw = Number(readChapter);
        const n = Number.isFinite(nRaw) ? Math.min(13, Math.max(0, Math.trunc(nRaw))) : 0;
        const lang =
          opts.lang === "en" || opts.lang === "ru"
            ? opts.lang
            : window.SunnyLocale?.getLang?.() ||
              (document.documentElement.lang === "ru" ? "ru" : "en");
        const returning = Boolean(opts.returning);
        const ru = {
          0: "О! Ты кто?",
          early: "О! Ты кто? Ты тоже застреваешь в корнях?",
          heat: "Не спрашивай, где я была. Просто не спрашивай",
          earth: "Ты оттуда, с Земли? Что там у тебя звенит?",
          price: "Не говори Паку, что я здесь",
          spinesNew: "Ты ко мне?",
          spinesBack: "А. Это ты",
        };
        const en = {
          0: "Oh! Who are you?",
          early: "Oh! Who are you? Do you get stuck in roots too?",
          heat: "Don't ask where I was. Just don't ask",
          earth: "You're from there — from Earth? What's ringing on you?",
          price: "Don't tell Pak I'm here",
          spinesNew: "You came for me?",
          spinesBack: "Ah. It's you",
        };
        const t = lang === "en" ? en : ru;
        if (n <= 0) return t[0];
        if (n <= 3) return t.early;
        if (n <= 5) return t.heat;
        if (n <= 11) return t.earth;
        if (n === 12) return t.price;
        return returning ? t.spinesBack : t.spinesNew;
      },
      typePace: 42,
      sceneContrast: "face",
      aliases: ["Вивер", "Weaver"],
      tracks: [
        { title: "Track one", href: "#" },
        { title: "Track two", href: "#" },
        { title: "Track three", href: "#" },
      ],
    },
    keeper: {
      id: "keeper",
      i18n: {
        ru: {
          name: "Кипер",
          nameWith: "Кипером",
          essence: "Кипер — память у корней",
          blurb: "Маленький хранитель, который помнит слишком много и говорит так, будто время сложилось гармошкой.",
          quote: "— Ты понимаешь, что говоришь? — Редко. Но это не значит, что я ошибаюсь.",
          askHint: "Спроси Кипера, что он помнит…",
          waitPhrase: "Роется в ветвях памяти…",
        },
        en: {
          name: "Kiper",
          nameWith: "Kiper",
          essence: "Kiper — memory at the roots",
          blurb: "A small keeper who remembers too much and speaks as though time had folded like an accordion.",
          quote: "— Do you understand what you're saying? — Rarely. But that doesn't mean I'm wrong.",
          askHint: "Ask Kiper what he remembers…",
          waitPhrase: "Rummaging through the branches of memory…",
        },
      },
      apiId: "keeper",
      soundId: "keeper",
      name: "Кипер",
      nameWith: "Кипером",
      gender: "m",
      page: `${base}pages/keeper.html`,
      img: `${base}assets/img/keeper.jpeg`,
      world: "dream",
      essence: "Кипер — память у корней",
      blurb: "Маленький хранитель, который помнит слишком много и говорит так, будто время сложилось гармошкой.",
      quote: "— Ты понимаешь, что говоришь? — Редко. Но это не значит, что я ошибаюсь.",
      askHint: "Спроси Кипера, что он помнит…",
      waitPhrase: "Роется в ветвях памяти…",
      typePace: 125,
      sceneContrast: "hard",
      aliases: ["Кипер", "Kiper", "Keeper"],
      tracks: [{ title: "Track one", href: "#" }],
    },
    pak: {
      id: "pak",
      i18n: {
        ru: {
          name: "Пак",
          nameWith: "Паком",
          essence: "Пак — хирург реальности",
          blurb: "Режет точно и без жалости к тому, что считает патологией. Жажда для него — опухоль.",
          quote: "Ты по делу? Если нет, тоже говори. Только короче",
          askHint: "Опиши симптомы",
          waitPhrase: "Пак смотрит на тебя, не мигая…",
        },
        en: {
          name: "Pak",
          nameWith: "Pak",
          essence: "Pak — surgeon of reality",
          blurb: "He cuts precisely and without pity whatever he deems a pathology. Thirst, to him, is a tumor.",
          quote: "Are you here on business? If not, say it anyway. Just shorter",
          askHint: "Describe the symptoms",
          waitPhrase: "Pak is looking at you without blinking…",
        },
      },
      apiId: "drpak",
      soundId: "drpak",
      name: "Пак",
      nameWith: "Паком",
      gender: "m",
      page: `${base}pages/drpak.html`,
      img: `${base}assets/img/dr.pak.jpeg`,
      imgNeg: `${base}assets/img/pak_negative.png`,
      world: "dream",
      essence: "Пак — хирург реальности",
      blurb: "Режет точно и без жалости к тому, что считает патологией. Жажда для него — опухоль.",
      quote: "Ты по делу? Если нет, тоже говори. Только короче",
      askHint: "Опиши симптомы",
      waitPhrase: "Пак смотрит на тебя, не мигая…",
      /**
       * Opening by emotional state (read progress).
       * @param {number} readChapter
       * @param {{ lang?: string }} [opts]
       */
      getOpening(readChapter, opts = {}) {
        const nRaw = Number(readChapter);
        const n = Number.isFinite(nRaw) ? Math.min(13, Math.max(0, Math.trunc(nRaw))) : 0;
        const lang =
          opts.lang === "en" || opts.lang === "ru"
            ? opts.lang
            : window.SunnyLocale?.getLang?.() ||
              (document.documentElement.lang === "ru" ? "ru" : "en");
        const ru = {
          surgeon: "Ты по делу? Если нет, тоже говори. Только короче",
          crack: "Что у тебя? Конкретно",
          race: "Быстро. У меня мало времени",
          after: "Чего тебе",
        };
        const en = {
          surgeon: "Are you here on business? If not, say it anyway. Just shorter",
          crack: "What do you have? Specifically",
          race: "Fast. I don't have much time",
          after: "What do you want",
        };
        const t = lang === "en" ? en : ru;
        if (n <= 3) return t.surgeon;
        if (n <= 6) return t.crack;
        if (n <= 11) return t.race;
        return t.after;
      },
      typePace: 48,
      sceneContrast: "face",
      aliases: ["Пак", "Pak", "доктор Пак", "Dr. Pak"],
      tracks: [
        { title: "Hold The Line", href: "https://open.spotify.com/track/2JboK1C7LfDfLLuOmnGPlX?si=0ef6fa6bff8546f7" },
        { title: "Track two", href: "#" },
      ],
    },
    liora: {
      id: "liora",
      i18n: {
        ru: {
          name: "Лиора",
          nameWith: "Лиорой",
          essence: "Лиора — внутренний звук",
          blurb: "Складывает крылья вокруг разорванной Нити и поёт, пока боль не находит свой ритм.",
          quote: "Ох. Садись ближе, здесь тепло",
          askHint: "Расскажи, куда ты тянешься…",
          waitPhrase: "Лиора прислушивается…",
        },
        en: {
          name: "Liora",
          nameWith: "Liora",
          essence: "Liora — the inner sound",
          blurb: "She folds her wings around a torn Thread and sings until the pain finds its rhythm.",
          quote: "Oh. Sit closer — it's warm here",
          askHint: "Tell me what you're drawn toward…",
          waitPhrase: "Liora is listening closely…",
        },
      },
      apiId: "liora",
      soundId: "liora",
      name: "Лиора",
      nameWith: "Лиорой",
      gender: "f",
      page: `${base}pages/liora.html`,
      img: `${base}assets/img/liora_dead.jpeg`,
      world: "dream",
      essence: "Лиора — внутренний звук",
      blurb: "Складывает крылья вокруг разорванной Нити и поёт, пока боль не находит свой ритм.",
      quote: "Ох. Садись ближе, здесь тепло",
      askHint: "Расскажи, куда ты тянешься…",
      waitPhrase: "Лиора прислушивается…",
      /**
       * @param {number} readChapter
       * @param {{ lang?: string }} [opts]
       */
      getOpening(readChapter, opts = {}) {
        const nRaw = Number(readChapter);
        const n = Number.isFinite(nRaw) ? Math.min(13, Math.max(0, Math.trunc(nRaw))) : 0;
        const lang =
          opts.lang === "en" || opts.lang === "ru"
            ? opts.lang
            : window.SunnyLocale?.getLang?.() ||
              (document.documentElement.lang === "ru" ? "ru" : "en");
        if (n >= 12) {
          return lang === "en"
            ? "Are you here to say goodbye? I won't be long"
            : "Ты попрощаться? Я ненадолго";
        }
        return lang === "en"
          ? "Oh. Sit closer — it's warm here"
          : "Ох. Садись ближе, здесь тепло";
      },
      typePace: 105,
      sceneContrast: "soft",
      aliases: ["Лиора", "Liora"],
      tracks: [
        { title: "Track one", href: "#" },
        { title: "Track two", href: "#" },
      ],
    },
    crystal: {
      id: "crystal",
      i18n: {
        ru: {
          name: "Кристалл",
          nameWith: "Кристаллом",
          essence: "Кристалл — бродячая гитара",
          blurb: "Настраивает чужую боль, как инструмент, пока Нить снова не сможет звучать.",
          quote: "«Вы так стараетесь убежать друг от друга, что забыли, как звучите вместе».",
          askHint: "Спроси Кристалл, как вы звучите…",
          waitPhrase: "Ищет нужное натяжение…",
        },
        en: {
          name: "Crystal",
          nameWith: "Crystal",
          essence: "Crystal — the wandering guitar",
          blurb: "He tunes another's pain like an instrument until the Thread can sound again.",
          quote: "“You try so hard to run from each other that you've forgotten how you sound together.”",
          askHint: "Ask Crystal how you sound together…",
          waitPhrase: "Searching for the right tension…",
        },
      },
      apiId: "crystal",
      soundId: "crystal",
      name: "Кристалл",
      nameWith: "Кристаллом",
      gender: "m",
      page: `${base}pages/crystal.html`,
      img: `${base}assets/img/Crystal.jpeg`,
      world: "dream",
      essence: "Кристалл — бродячая гитара",
      blurb: "Настраивает чужую боль, как инструмент, пока Нить снова не сможет звучать.",
      quote: "«Вы так стараетесь убежать друг от друга, что забыли, как звучите вместе».",
      askHint: "Спроси Кристалл, как вы звучите…",
      waitPhrase: "Ищет нужное натяжение…",
      typePace: 72,
      sceneContrast: "hard",
      aliases: ["Кристалл", "Crystal"],
      tracks: [
        { title: "Track one", href: "#" },
        { title: "Track two", href: "#" },
      ],
    },
    cat: {
      id: "cat",
      i18n: {
        ru: {
          name: "Кот",
          nameWith: "Котом",
          essence: "Кот — поиск себя",
          blurb: "Почти подросток Сада: мечется между крышами и вопросами, всё ещё не зная своего места.",
          quote: "О. Привет. Ты тоже не спишь?",
          askHint: "Где у тебя странно?",
          waitPhrase: "Кот смотрит в окна…",
        },
        en: {
          name: "Cat",
          nameWith: "Cat",
          essence: "Cat — the search for oneself",
          blurb: "The Garden's near-teenager: darting between rooftops and questions, still not knowing where he belongs.",
          quote: "Oh. Hi. You're not sleeping either?",
          askHint: "Where does it feel strange for you?",
          waitPhrase: "Cat is looking at the windows…",
        },
      },
      apiId: "cat",
      soundId: "cat",
      name: "Кот",
      nameWith: "Котом",
      gender: "m",
      page: `${base}pages/cat.html`,
      img: `${base}assets/img/cat.jpeg`,
      world: "dream",
      essence: "Кот — поиск себя",
      blurb: "Почти подросток Сада: мечется между крышами и вопросами, всё ещё не зная своего места.",
      quote: "О. Привет. Ты тоже не спишь?",
      askHint: "Где у тебя странно?",
      waitPhrase: "Кот смотрит в окна…",
      /**
       * @param {number} readChapter
       * @param {{ lang?: string }} [opts]
       */
      getOpening(readChapter, opts = {}) {
        const nRaw = Number(readChapter);
        const n = Number.isFinite(nRaw) ? Math.min(13, Math.max(0, Math.trunc(nRaw))) : 0;
        const lang =
          opts.lang === "en" || opts.lang === "ru"
            ? opts.lang
            : window.SunnyLocale?.getLang?.() ||
              (document.documentElement.lang === "ru" ? "ru" : "en");
        const ru = {
          roofs: "О. Привет. Ты тоже не спишь?",
          meeting: "Кто-нибудь мимо пробегал? Быстрая такая. Ладно. Неважно",
          together: "Тихо. Слышишь? Это лестница. Нет. Показалось",
          between12: "О. Ты ко мне?",
          between13: "Я жду. Нет, не тебя. Не обижайся",
        };
        const en = {
          roofs: "Oh. Hi. You're not sleeping either?",
          meeting: "Anyone run past? Fast one. Never mind",
          together: "Quiet. Hear that? The stairs. No. Imagined it",
          between12: "Oh. You came to me?",
          between13: "I'm waiting. No, not for you. Don't take it wrong",
        };
        const t = lang === "en" ? en : ru;
        if (n <= 3) return t.roofs;
        if (n <= 7) return t.meeting;
        if (n <= 11) return t.together;
        if (n === 12) return t.between12;
        return t.between13;
      },
      typePace: 52,
      sceneContrast: "hard",
      aliases: ["Кот", "Cat", "CAT"],
      tracks: [
        { title: "Track one", href: "#" },
        { title: "Track two", href: "#" },
      ],
    },
    shiny: {
      id: "shiny",
      i18n: {
        ru: {
          name: "Шайни",
          nameWith: "Шайни",
          essence: "Шайни — свет, который не продаётся",
          blurb: "Держит огонь так ярко, что мир хочет его купить — и так упрямо, что не отдаёт.",
          quote: "«Этот свет не для продажи».",
          askHint: "Спроси Шайни про её свет…",
          waitPhrase: "Держит огонь ровнее…",
        },
        en: {
          name: "Shiny",
          nameWith: "Shiny",
          essence: "Shiny — a light that isn't for sale",
          blurb: "She holds her fire so bright the world wants to buy it — and so stubbornly that she won't sell.",
          quote: "“This light is not for sale.”",
          askHint: "Ask Shiny about her light…",
          waitPhrase: "Steadying the flame…",
        },
      },
      apiId: "shiny",
      soundId: "shiny",
      name: "Шайни",
      nameWith: "Шайни",
      gender: "f",
      page: `${base}pages/shiny.html`,
      img: `${base}assets/img/shiny.jpeg`,
      world: "weaver",
      essence: "Шайни — свет, который не продаётся",
      blurb: "Держит огонь так ярко, что мир хочет его купить — и так упрямо, что не отдаёт.",
      quote: "«Этот свет не для продажи».",
      askHint: "Спроси Шайни про её свет…",
      waitPhrase: "Держит огонь ровнее…",
      typePace: 68,
      sceneContrast: "face",
      aliases: ["Шайни", "Shiny"],
      tracks: [
        { title: "Bohnes Vicious", href: "https://open.spotify.com/track/3dh0ehwGAONsJu64cFfYxq?si=7d5d89b58f634907" },
        { title: "Track two", href: "#" },
        { title: "Track three", href: "#" },
        { title: "Track four", href: "#" },
      ],
    },
    shinyBro: {
      id: "shinyBro",
      i18n: {
        ru: {
          name: "Брат Шайни",
          nameWith: "Братом Шайни",
          essence: "Брат Шайни — жёсткая защита",
          blurb: "Стоит рядом со светом сестры и готов разбить всё, что подходит слишком близко.",
          quote: "«К ней — только через меня».",
          askHint: "Спроси Брата Шайни, кого он бережёт…",
          waitPhrase: "Проверяет, не близко ли ты…",
        },
        en: {
          name: "Shiny's Brother",
          nameWith: "Shiny's Brother",
          essence: "Shiny's Brother — a hard shield",
          blurb: "He stands beside his sister's light, ready to smash anything that comes too close.",
          quote: "“To get to her, you go through me.”",
          askHint: "Ask Shiny's Brother whom he protects…",
          waitPhrase: "Checking whether you're too close…",
        },
      },
      apiId: "shiny_bro",
      soundId: "shiny_bro",
      name: "Брат Шайни",
      nameWith: "Братом Шайни",
      gender: "m",
      page: `${base}pages/shiny_bro.html`,
      img: `${base}assets/img/shiny_bro.jpeg`,
      world: "weaver",
      essence: "Брат Шайни — жёсткая защита",
      blurb: "Стоит рядом со светом сестры и готов разбить всё, что подходит слишком близко.",
      quote: "«К ней — только через меня».",
      askHint: "Спроси Брата Шайни, кого он бережёт…",
      waitPhrase: "Проверяет, не близко ли ты…",
      typePace: 40,
      sceneContrast: "face",
      aliases: ["Брат Шайни", "Shiny Brother"],
      tracks: [
        { title: "grandson Dirty", href: "https://open.spotify.com/track/3pShTDa5E1bPBkrc1mxxGY?si=c1078105e1f14521" },
        { title: "City Wolf Protector", href: "https://open.spotify.com/track/1PlGFtOJswKFKypAgVCw87?si=e35268e4e6db47cc" },
      ],
    },
    mushroom: {
      id: "mushroom",
      i18n: {
        ru: {
          name: "Гриб",
          nameWith: "Грибом",
          essence: "Гриб — запах высоты",
          blurb: "Говорит странно и точно, будто слышит то, что растёт выше слов.",
          quote: "«Высота пахнет иначе, когда ты наконец перестаёшь бояться упасть».",
          askHint: "Спроси Гриб, чем пахнет высота…",
          waitPhrase: "Пахнет ответом издалека…",
        },
        en: {
          name: "Mushroom",
          nameWith: "Mushroom",
          essence: "Mushroom — the scent of height",
          blurb: "He speaks strangely and exactly, as if hearing what grows higher than words.",
          quote: "“Height smells different once you finally stop fearing the fall.”",
          askHint: "Ask Mushroom what height smells like…",
          waitPhrase: "Catching the scent of an answer from afar…",
        },
      },
      apiId: "talk_mushroom",
      soundId: "talk_mushroom",
      name: "Гриб",
      nameWith: "Грибом",
      gender: "m",
      page: `${base}pages/talk_mushroom.html`,
      img: `${base}assets/img/talk_Mushroom.jpeg`,
      world: "weaver",
      essence: "Гриб — запах высоты",
      blurb: "Говорит странно и точно, будто слышит то, что растёт выше слов.",
      quote: "«Высота пахнет иначе, когда ты наконец перестаёшь бояться упасть».",
      askHint: "Спроси Гриб, чем пахнет высота…",
      waitPhrase: "Пахнет ответом издалека…",
      typePace: 110,
      sceneContrast: "hard",
      aliases: ["Гриб", "Talking Mushroom", "Talk Mushroom"],
      tracks: [
        { title: "Des Rocs Imaginary Friends", href: "https://open.spotify.com/track/35vAiBxqNrjxl68E9QnEwv?si=3e333bd404254e1c" },
        { title: "Track two", href: "#" },
        { title: "Track three", href: "#" },
      ],
    },
    forest: {
      id: "forest",
      i18n: {
        ru: {
          name: "Злой Лес",
          nameWith: "Злым Лесом",
          essence: "Злой Лес — боль, которой некуда деться",
          blurb: "В него стекает вырезанная Жажда. Он помнит каждую Тень и каждую несправедливость Сада.",
          quote: "«Всё, от чего тебя спасли, до сих пор живёт во мне».",
          askHint: "Спроси Лес, что он помнит…",
          waitPhrase: "Шумит в корнях…",
        },
        en: {
          name: "Angry Forest",
          nameWith: "Angry Forest",
          essence: "Angry Forest — pain with nowhere to go",
          blurb: "The Thirst that was cut out drains into him. He remembers every Shadow and every injustice of the Garden.",
          quote: "“Everything you were saved from still lives in me.”",
          askHint: "Ask the Forest what it remembers…",
          waitPhrase: "Rustling in the roots…",
        },
      },
      apiId: "angry_forest",
      soundId: "angry_forest",
      name: "Злой Лес",
      nameWith: "Злым Лесом",
      gender: "m",
      page: `${base}pages/angry_forest.html`,
      img: `${base}assets/img/angry_forest1.jpeg`,
      world: "weaver",
      essence: "Злой Лес — боль, которой некуда деться",
      blurb: "В него стекает вырезанная Жажда. Он помнит каждую Тень и каждую несправедливость Сада.",
      quote: "«Всё, от чего тебя спасли, до сих пор живёт во мне».",
      askHint: "Спроси Лес, что он помнит…",
      waitPhrase: "Шумит в корнях…",
      typePace: 140,
      sceneContrast: "hard",
      aliases: ["Злой Лес", "Angry Forest"],
      tracks: [
        { title: "Esterly, Austin Jenckes Built for Pain", href: "https://open.spotify.com/track/0RePMyvVjwNc17CD2vNX3g?si=5b5d89b58f634907" },
        { title: "Track two", href: "#" },
      ],
    },
  };

  const chapters = {
    prologue: {
      num: 0,
      label: "Вступление",
      i18n: { ru: { label: "Вступление" }, en: { label: "Prologue" } },
      cast: ["dream", "keeper", "pak", "liora", "crystal", "cat", "forest", "weaver"],
      image: `${base}assets/img/dryad.jpeg`,
    },
    ch1: { num: 1, cast: ["dream", "weaver", "keeper", "liora", "pak"], image: `${base}assets/img/dryad.jpeg` },
    ch2: { num: 2, cast: ["dream", "keeper"], image: `${base}assets/img/keeper.jpeg` },
    ch3: { num: 3, cast: ["liora", "pak"], image: `${base}assets/img/liora_dead.jpeg` },
    ch4: { num: 4, cast: ["pak", "cat", "weaver", "liora"], image: `${base}assets/img/cat.jpeg` },
    ch5: { num: 5, cast: ["weaver", "forest"], image: `${base}assets/img/weaver-home.jpeg` },
    ch6: { num: 6, cast: ["dream", "pak", "weaver", "forest"], image: `${base}assets/img/angry_forest1.jpeg` },
    ch7: { num: 7, cast: ["pak", "dream", "weaver"], image: `${base}assets/img/dr.pak.jpeg` },
    ch8: { num: 8, cast: ["cat", "weaver"], image: `${base}assets/img/cat.jpeg` },
    ch9: { num: 9, cast: ["cat", "weaver", "pak"], image: `${base}assets/img/weaver.jpeg` },
    ch10: { num: 10, cast: ["mushroom", "shiny", "shinyBro"], image: `${base}assets/img/talk_Mushroom.jpeg` },
    ch11: { num: 11, cast: ["crystal"], image: `${base}assets/img/Crystal.jpeg` },
    ch12: {
      num: 12,
      cast: ["shiny", "shinyBro", "mushroom", "weaver", "liora", "dream", "pak", "cat", "forest"],
      image: `${base}assets/img/weaver-home.jpeg`,
    },
    ch13: { num: 13, cast: ["weaver", "shinyBro", "cat", "forest", "keeper"], image: `${base}assets/img/angry_forest1.jpeg` },
  };

  const loreToChapter = {
    "dream-lore.html": "ch1",
    "dream-lore-beetle.html": "ch2",
    "liora-lore.html": "ch3",
    "cat-lore-meeting.html": "ch4",
    "cat-lore.html": "ch4",
    "weaver-lore-flight.html": "ch5",
    "angry-forest-lore-liberation.html": "ch6",
    "drpak-lore.html": "ch7",
    "weaver-lore-cat.html": "ch9",
    "talk_mushroom-lore.html": "ch10",
    "shiny-lore-unsold-light.html": "ch10",
    "crystal-lore.html": "ch11",
    "shiny_bro-lore.html": "ch10",
  };

  /** page filename → character id */
  const pageToCharacter = {
    "dream.html": "dream",
    "weaver.html": "weaver",
    "drpak.html": "pak",
    "liora.html": "liora",
    "crystal.html": "crystal",
    "cat.html": "cat",
    "shiny.html": "shiny",
    "shiny_bro.html": "shinyBro",
    "talk_mushroom.html": "mushroom",
    "angry_forest.html": "forest",
    "keeper.html": "keeper",
  };

  /** Album sections + pages (plain art, not negative). */
  const albumSections = [
    {
      id: "dryad-world",
      i18n: { ru: { title: "Мир Дриады" }, en: { title: "Dryad's World" } },
      title: "Мир Дриады",
      entryIds: ["dryad", "keeper"],
    },
    {
      id: "garden",
      i18n: { ru: { title: "Сад" }, en: { title: "The Garden" } },
      title: "Сад",
      entryIds: ["dream", "pak", "liora", "crystal", "cat"],
    },
    {
      id: "forest",
      i18n: { ru: { title: "Лес" }, en: { title: "The Forest" } },
      title: "Лес",
      entryIds: ["weaver", "shiny", "shinyBro", "mushroom", "forest"],
    },
    {
      id: "wasteland",
      i18n: { ru: { title: "Пустошь" }, en: { title: "The Wasteland" } },
      title: "Пустошь",
      entryIds: ["fallow"],
    },
  ];

  const album = [
    {
      id: "dryad",
      section: "dryad-world",
      i18n: {
        ru: { name: "Дриада", quote: "«Дриада была первой»." },
        en: { name: "Dryad", quote: "“The Dryad was first.”" },
      },
      name: "Дриада",
      img: `${base}assets/img/dryad.jpeg`,
      quote: "«Дриада была первой».",
      talkId: null,
      chapterIds: ["prologue", "ch1"],
    },
    {
      id: "keeper",
      section: "dryad-world",
      i18n: {
        ru: {
          name: "Кипер",
          quote: "«Никто никогда не приходит спросить о жуке. В этом главная трагедия жуков».",
        },
        en: {
          name: "Kiper",
          quote: "“Nobody ever comes to ask about a beetle. That is the main tragedy of beetles.”",
        },
      },
      name: "Кипер",
      img: characters.keeper.img,
      quote: "«Никто никогда не приходит спросить о жуке. В этом главная трагедия жуков».",
      talkId: "keeper",
      chapterIds: null,
    },
    {
      id: "dream",
      section: "garden",
      i18n: {
        ru: { name: "Дрим", quote: "«Я здесь. Я тебя держу»." },
        en: { name: "Dream", quote: "“I'm here. I've got you.”" },
      },
      name: "Дрим",
      img: characters.dream.img,
      quote: "«Я здесь. Я тебя держу».",
      talkId: "dream",
      chapterIds: null,
    },
    {
      id: "pak",
      section: "garden",
      i18n: {
        ru: { name: "Пак", quote: "«Вещи, которые меня бесят, я вижу сразу»." },
        en: { name: "Pak", quote: "“The things that annoy me, I see at once.”" },
      },
      name: "Пак",
      img: characters.pak.img,
      quote: "«Вещи, которые меня бесят, я вижу сразу».",
      talkId: "pak",
      chapterIds: null,
    },
    {
      id: "liora",
      section: "garden",
      i18n: {
        ru: { name: "Лиора", quote: "«Я тебя слышу»." },
        en: { name: "Liora", quote: "“I hear you.”" },
      },
      name: "Лиора",
      img: characters.liora.img,
      quote: "«Я тебя слышу».",
      talkId: "liora",
      chapterIds: null,
    },
    {
      id: "crystal",
      section: "garden",
      i18n: {
        ru: { name: "Кристалл", quote: "«Я без стука. Но с гитарой»." },
        en: { name: "Crystal", quote: "“I don't knock. But I bring a guitar.”" },
      },
      name: "Кристалл",
      img: characters.crystal.img,
      quote: "«Я без стука. Но с гитарой».",
      talkId: "crystal",
      chapterIds: null,
    },
    {
      id: "cat",
      section: "garden",
      i18n: {
        ru: {
          name: "Кот",
          quote: "«Я не следил. Я просто всё время оказывался рядом».",
        },
        en: {
          name: "Cat",
          quote: "“I wasn't following. I just kept ending up nearby.”",
        },
      },
      name: "Кот",
      img: characters.cat.img,
      quote: "«Я не следил. Я просто всё время оказывался рядом».",
      talkId: "cat",
      chapterIds: null,
    },
    {
      id: "weaver",
      section: "forest",
      i18n: {
        ru: {
          name: "Вивер",
          quote: "«Нельзя? Отлично. Значит, туда я и побегу».",
        },
        en: {
          name: "Weaver",
          quote: "“Not allowed? Perfect. Then that's where I'll run.”",
        },
      },
      name: "Вивер",
      img: characters.weaver.img,
      quote: "«Нельзя? Отлично. Значит, туда я и побегу».",
      talkId: "weaver",
      chapterIds: null,
    },
    {
      id: "shiny",
      section: "forest",
      i18n: {
        ru: { name: "Шайни", quote: "«Смотри, как это будет блестеть»." },
        en: { name: "Shiny", quote: "“Watch how this will shine.”" },
      },
      name: "Шайни",
      img: characters.shiny.img,
      quote: "«Смотри, как это будет блестеть».",
      talkId: "shiny",
      chapterIds: null,
    },
    {
      id: "shinyBro",
      section: "forest",
      i18n: {
        ru: {
          name: "Брат",
          quote: "«Я держу канистру. Она держит зажигалку. Так у нас заведено».",
        },
        en: {
          name: "Brother",
          quote: "“I hold the canister. She holds the lighter. That's how we do it.”",
        },
      },
      name: "Брат",
      img: characters.shinyBro.img,
      quote: "«Я держу канистру. Она держит зажигалку. Так у нас заведено».",
      talkId: "shinyBro",
      chapterIds: null,
    },
    {
      id: "mushroom",
      section: "forest",
      i18n: {
        ru: {
          name: "Гриб",
          quote: "«Споры чешутся. Значит, рядом кто-то очень сильно чего-то хочет. Это ты?»",
        },
        en: {
          name: "Mushroom",
          quote: "“The spores itch. So someone nearby wants something very badly. Is that you?”",
        },
      },
      name: "Гриб",
      img: characters.mushroom.img,
      quote: "«Споры чешутся. Значит, рядом кто-то очень сильно чего-то хочет. Это ты?»",
      talkId: "mushroom",
      chapterIds: null,
    },
    {
      id: "forest",
      section: "forest",
      i18n: {
        ru: {
          name: "Злой Лес",
          quote: "«Всё, от чего тебя спасли, до сих пор живёт во мне».",
        },
        en: {
          name: "Angry Forest",
          quote: "“Everything you were saved from still lives in me.”",
        },
      },
      name: "Злой Лес",
      img: characters.forest.img,
      quote: "«Всё, от чего тебя спасли, до сих пор живёт во мне».",
      talkId: "forest",
      chapterIds: null,
    },
    {
      id: "fallow",
      section: "wasteland",
      i18n: {
        ru: { name: "Пустошь", quote: "«Там не было ничего»." },
        en: { name: "Wasteland", quote: "“There was nothing there.”" },
      },
      name: "Пустошь",
      img: `${base}assets/img/The_fallow.jpeg`,
      quote: "«Там не было ничего».",
      talkId: null,
      chapterIds: ["prologue"],
    },
  ];

  const _localeFields = ["name", "nameWith", "essence", "blurb", "quote", "askHint", "waitPhrase"];
  const _enCopy = {
  "dream": {
    "name": "Dream",
    "nameWith": "Dream",
    "essence": "Dream — gardener of Threads",
    "blurb": "He sees where a Thread should grow and guards its path. Thirst, to him, is a wound, not a wish.",
    "quote": "“I am here. I am holding you.”",
    "askHint": "Ask Dream where the Thread should grow…",
    "waitPhrase": "Listening to where the Thread pulls…"
  },
  "weaver": {
    "name": "Weaver",
    "nameWith": "Weaver",
    "essence": "Weaver — freedom at any cost",
    "blurb": "She runs, laughs, and breaks the Garden's order so a Thread can choose itself.",
    "quote": "“Name what you want so badly that you're afraid to hear your own answer.”",
    "askHint": "Ask Weaver what she wants…",
    "waitPhrase": "Already running after the answer…"
  },
  "keeper": {
    "name": "Kiper",
    "nameWith": "Kiper",
    "essence": "Kiper — memory at the roots",
    "blurb": "A small keeper who remembers too much and speaks as if time were folded like an accordion.",
    "quote": "— Do you understand what you're saying? — Rarely. But that doesn't mean I'm wrong.",
    "askHint": "Ask Kiper what he remembers…",
    "waitPhrase": "Rummaging through the branches of memory…"
  },
  "pak": {
    "name": "Pak",
    "nameWith": "Pak",
    "essence": "Pak — surgeon of reality",
    "blurb": "Cuts precisely, without pity for what he calls pathology. Thirst, to him, is a tumor.",
    "quote": "“Don't waste my time on pretty explanations. Show me where it hurts.”",
    "askHint": "Ask Pak where it hurts…",
    "waitPhrase": "Cutting away the excess…"
  },
  "liora": {
    "name": "Liora",
    "nameWith": "Liora",
    "essence": "Liora — the inner sound",
    "blurb": "Folds her wings around a torn Thread and sings until the pain finds its rhythm.",
    "quote": "“I hear you.”",
    "askHint": "Ask Liora if she can hear you…",
    "waitPhrase": "Listening closely…"
  },
  "crystal": {
    "name": "Crystal",
    "nameWith": "Crystal",
    "essence": "Crystal — the wandering guitar",
    "blurb": "Tunes another's pain like an instrument until the Thread can sound again.",
    "quote": "“You try so hard to run from each other that you forget how you sound together.”",
    "askHint": "Ask Crystal how you sound…",
    "waitPhrase": "Seeking the right tension…"
  },
  "cat": {
    "name": "Cat",
    "nameWith": "Cat",
    "essence": "Cat — searching for himself",
    "blurb": "Almost an adolescent of the Garden: darting between roofs and questions, still unsure of his place.",
    "quote": "“It's frightening even to admit how dear someone is to you.”",
    "askHint": "Ask Cat where he belongs…",
    "waitPhrase": "Jumping from thought to thought…"
  },
  "shiny": {
    "name": "Shiny",
    "nameWith": "Shiny",
    "essence": "Shiny — light that isn't for sale",
    "blurb": "Holds a fire so bright the world wants to buy it — and so stubbornly she will not sell.",
    "quote": "“This light is not for sale.”",
    "askHint": "Ask Shiny about her light…",
    "waitPhrase": "Holding the fire steadier…"
  },
  "shinyBro": {
    "name": "Shiny's Brother",
    "nameWith": "Shiny's Brother",
    "essence": "Shiny's Brother — hard protection",
    "blurb": "Stands beside his sister's light and will break anything that comes too close.",
    "quote": "“To her — only through me.”",
    "askHint": "Ask Shiny's Brother whom he guards…",
    "waitPhrase": "Checking whether you're too close…"
  },
  "mushroom": {
    "name": "Mushroom",
    "nameWith": "Mushroom",
    "essence": "Mushroom — the scent of heights",
    "blurb": "Speaks strangely and precisely, as if he hears what grows above words.",
    "quote": "“Height smells different once you finally stop being afraid to fall.”",
    "askHint": "Ask Mushroom what height smells like…",
    "waitPhrase": "Smelling an answer from far away…"
  },
  "forest": {
    "name": "Angry Forest",
    "nameWith": "the Angry Forest",
    "essence": "Angry Forest — pain with nowhere to go",
    "blurb": "Cut Thirst drains into him. He remembers every Shadow and every injustice of the Garden.",
    "quote": "“Everything they saved you from still lives in me.”",
    "askHint": "Ask the Forest what it remembers…",
    "waitPhrase": "Rustling in the roots…"
  }
};
  const _albumEn = {};
  album.forEach((entry) => {
    _albumEn[entry.id] = {
      name: entry.i18n?.en?.name || entry.name,
      quote: entry.i18n?.en?.quote || entry.quote,
    };
  });
  const _ruSnapshot = {};
  Object.keys(characters).forEach((id) => {
    _ruSnapshot[id] = {};
    _localeFields.forEach((f) => {
      if (characters[id][f] != null) _ruSnapshot[id][f] = characters[id][f];
    });
  });
  const _albumRu = {};
  album.forEach((entry) => {
    _albumRu[entry.id] = { name: entry.name, quote: entry.quote };
  });
  const _chapterLabelRu = chapters.prologue?.label || "Вступление";

  function getMetaLang() {
    return window.SunnyLocale?.getLang?.() || (document.documentElement.lang === "ru" ? "ru" : "en");
  }

  function getLang() {
    return window.SunnyLocale?.getLang?.() || (document.documentElement.lang === "ru" ? "ru" : "en");
  }

  function applyStoryMetaLang(lang) {
    const l = lang === "en" ? "en" : "ru";
    Object.values(characters).forEach((c) => {
      const t = c.i18n && c.i18n[l];
      if (!t) return;
      ["name", "quote", "essence", "blurb", "askHint", "waitPhrase", "nameWith"].forEach((k) => {
        if (t[k] != null) c[k] = t[k];
      });
    });
    album.forEach((a) => {
      const t = a.i18n && a.i18n[l];
      if (!t) return;
      if (t.name != null) a.name = t.name;
      if (t.quote != null) a.quote = t.quote;
    });
    albumSections.forEach((s) => {
      const t = s.i18n && s.i18n[l];
      if (t && t.title != null) s.title = t.title;
    });
    Object.values(chapters).forEach((c) => {
      const t = c.i18n && c.i18n[l];
      if (t && t.label != null) c.label = t.label;
    });
  }

  window.storyMeta = {
    characters,
    chapters,
    loreToChapter,
    pageToCharacter,
    album,
    albumSections,
    base,
    applyLang: applyStoryMetaLang,
  };
  applyStoryMetaLang(getLang());
  document.addEventListener("sunnychimera:i18n-ready", (e) => applyStoryMetaLang((e.detail && e.detail.lang) || getLang()));
})();

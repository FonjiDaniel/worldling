# Worldling: Step 7 voice and tone

Worldling sounds like a thoughtful host welcoming you into a small, living universe.

**Wonder in the invitation. Clarity in the action.**

## Five voice principles

- **Make wonder feel close.** Use details people can picture: a cloud, a moon, a light switching on. Let the world feel small enough to hold. Example: “Your world has a new moon.”
- **Be clear when it matters.** Name what happened and give one useful next step. Keep errors, settings and account messages direct. Example: “We couldn’t save your changes. Try again.”
- **Invite at their pace.** Offer something to make, explore or share. Leave room to come and go. Avoid guilt, streak pressure and invented urgency. Example: “Choose a landscape and make it your own.”
- **Celebrate care and connection.** Notice a world taking shape or a kind message arriving. Let visits feel like company. Avoid ranking people or making popularity the reward. Example: “Your first comet has arrived.”
- **Use warm, everyday language.** Write short sentences with natural English contractions and clear verbs. Keep the same warmth in French. Use familiar words and let the artwork carry much of the magic. Example: “Your world is here. Make yourself at home.”

## Tone by moment

| Moment | Tone | Writing direction |
| --- | --- | --- |
| Discovery | Curious and lightly wondrous | Invite someone to notice or explore one thing. |
| Creation | Encouraging and practical | Give a clear choice or a small next step. |
| Error | Calm and direct | State the problem, then the available action. |
| Celebration | Warm and specific | Name the real change or kind gesture. |
| Notification | Brief and useful | Report a real event without demanding attention. |

## Words we use and avoid

| Use in English | Use in French | Meaning | Avoid |
| --- | --- | --- | --- |
| world | monde | The personal place someone creates and tends. | realm, metaverse, digital asset |
| planet | planète | The round, visible 3D object. | orb, celestial body |
| comet | comète | A short, kind message left on a world. Explain this at first use. | ping, engagement drop |
| grow, bloom | grandir, s’épanouir; floraison | Gradual changes and new details. Use Bloom level / Niveau de floraison for the level label. | grind, dominate, rank up |
| visit, explore | visiter, explorer | Moving through the shared universe and entering worlds. | raid, invade, drive traffic |
| tend | prendre soin de | Caring for a world over time. | farm, optimize your assets |
| people, friends, visitors | personnes, amis, visiteurs | People in community copy. Use account for account settings. | users, audience, followers as a measure of worth |
| new, ready, arrived | nouveau, prêt, arrivé | A specific, confirmed change. | epic, revolutionary, must-see |
| save, send, try again | enregistrer, envoyer, réessayer | Plain action labels and recovery steps. | execute, transmission, invalid operation |

These preferences apply to product and community copy. Plain technical language still belongs where it helps someone, such as account settings.

## Writing rules

- Use sentence case for interface copy. Keep buttons short and start with a verb.
- Use periods for complete sentences. Skip punctuation on short button labels. Do not use em dashes.
- Use cosmic language sparingly. Avoid space jokes when an action fails.
- Do not call a world lonely, neglected or disappointed. Coming back should feel welcome.
- Do not promise that a draft is safe, an action succeeded or a feature exists unless the app confirms it.
- Avoid all-caps excitement, repeated exclamation marks and slang that depends on one region. Emoji are optional decoration, never the only meaning.

## Three error rewrites

### 1. errors.save_failed

**When:** A save attempt has failed; success has not been reported.

**Before:** Something went wrong.

| Field | English | French |
| --- | --- | --- |
| Message | We couldn’t save your changes. Try again. | Nous n’avons pas pu enregistrer tes modifications. Réessaie. |
| Action | Try again | Réessayer |

**Usage:** Do not add a promise about draft recovery unless it is supported.

### 2. errors.comet_failed

**When:** The app has confirmed that the comet was not sent.

**Before:** Transmission failed.

| Field | English | French |
| --- | --- | --- |
| Message | Your comet wasn’t sent. Try again. | Ta comète n’a pas été envoyée. Réessaie. |
| Action | Try again | Réessayer |

**Usage:** Use this wording only when delivery failure is known.

### 3. errors.world_unavailable

**When:** A requested world is unavailable.

**Before:** Resource unavailable.

| Field | English | French |
| --- | --- | --- |
| Message | This world isn’t available. You can explore another. | Ce monde n’est pas disponible. Tu peux en explorer un autre. |
| Action | Explore worlds | Explorer des mondes |

**Usage:** Give an available route back into the universe.


## Three empty-state rewrites

### 1. empty.no_world

**When:** A person has not created their own world yet.

**Before:** No world found.

| Field | English | French |
| --- | --- | --- |
| Title | Your world starts here. | Ton monde commence ici. |
| Body | Choose a landscape and make it your own. | Choisis un paysage et crée un monde à ton image. |
| Action | Create my world | Créer mon monde |

**Usage:** An invitation to begin, with one clear action.

### 2. empty.no_comets

**When:** The owner’s world has no received comets.

**Before:** No messages.

| Field | English | French |
| --- | --- | --- |
| Title | No comets yet. | Pas encore de comètes. |
| Body | Visitors can leave a comet: a short, kind message. | Les visiteurs peuvent laisser une comète : un petit message bienveillant. |
| Action | Share my world | Partager mon monde |

**Usage:** Explain the feature without treating a quiet world as a failure.

### 3. empty.comet_composer

**When:** A visitor opens the comet composer before writing a message.

**Before:** Enter text.

| Field | English | French |
| --- | --- | --- |
| Title | Leave a little kindness. | Quelques mots pour faire plaisir. |
| Body | Tell them what you enjoyed about their world. | Dis à cette personne ce que tu as aimé dans son monde. |
| Field label | Your message | Ton message |
| Action | Send a comet | Envoyer une comète |

**Usage:** Keep the field label visible. Enable sending once the message is valid.


## Three celebration rewrites

### 1. celebrations.world_created

**When:** The first world has been created and saved successfully.

**Before:** World created successfully.

| Field | English | French |
| --- | --- | --- |
| Message | Your world is here. Make yourself at home. | Ton monde est là. Installe-toi. |
| Action | View my world | Voir mon monde |

**Usage:** Celebrate the beginning without adding a list of tasks.

### 2. celebrations.first_comet

**When:** The world has received its first comet.

**Before:** First message received.

| Field | English | French |
| --- | --- | --- |
| Message | Your first comet has arrived. Someone left you a kind message. | Ta première comète est arrivée. Quelqu’un t’a laissé un message bienveillant. |
| Action | Read comet | Lire la comète |

**Usage:** Celebrate the gesture, not a popularity score.

### 3. celebrations.new_moon

**When:** A bloom event has actually added a moon to the world.

**Before:** Bloom level increased.

| Field | English | French |
| --- | --- | --- |
| Message | Your world has a new moon. Take a look. | Une nouvelle lune accompagne ton monde. Viens la découvrir. |
| Action | View my world | Voir mon monde |

**Usage:** Name the visible change. Do not imply that every bloom adds a moon.


## Three push or email subject rewrites

### 1. notifications.welcome

**When:** Welcome email after signup.

**Before:** Welcome to Worldling

| Field | English | French |
| --- | --- | --- |
| Subject | Your little corner of the universe | Ton petit coin d’univers |

**Usage:** A welcoming subject with no demand to finish onboarding.

### 2. notifications.comet_arrived

**When:** Push title after a comet has arrived on the recipient’s world.

**Before:** New notification

| Field | English | French |
| --- | --- | --- |
| Subject | A comet landed on your world | Une comète a rejoint ton monde |

**Usage:** Send only after the event. The subject does not quote the visitor’s message.

### 3. notifications.new_moon

**When:** Email subject or push title after a moon has been added.

**Before:** Bloom update

| Field | English | French |
| --- | --- | --- |
| Subject | Your world has a new moon | Ton monde a une nouvelle lune |

**Usage:** The event provides the reason to return. Do not add false urgency.

## Ten alternative taglines

These are options for review. The current primary tagline remains the default. French lines are natural adaptations.

| # | English | French adaptation | Emphasis |
| --- | --- | --- | --- |
| 1 | A little world. A lot of you. | Un petit monde qui te ressemble. | Personal expression |
| 2 | Small worlds. Shared wonder. | De petits mondes. Des découvertes à partager. | Community |
| 3 | A little planet to call home. | Une petite planète où te sentir chez toi. | Belonging |
| 4 | Your corner of the cosmos. | Ton coin de cosmos. | A personal place |
| 5 | Let your world bloom. | Laisse ton monde s’épanouir. | Growth |
| 6 | Make yourself a world. | Crée-toi un monde. | Creation |
| 7 | A world shaped by you. | À toi de façonner ton monde. | Craft |
| 8 | Where small worlds bring us together. | De petits mondes pour se retrouver. | Connection |
| 9 | Space to make something yours. | Un espace pour créer à ta façon. | Creative freedom |
| 10 | A world to tend. A universe to explore. | Un monde à faire grandir. Un univers à explorer. | The whole experience |

**Recommendation:** Keep the current primary tagline. It says what people do and what makes the experience personal. For a different direction, choose “A little world. A lot of you.” For community campaigns, use “Small worlds. Shared wonder.”

## English and French

**Current English lines**

- Primary: Grow a world of your own.
- Secondary: Visit everyone else's.

**Proposed French adaptations**

- Primary: Fais grandir un monde à ton image.
- Secondary: Découvre les mondes des autres.

### French writing rules

- Use tu, ton and tes consistently in product and campaign copy. Use nous when the service needs to speak.
- Keep Worldling unchanged. Translate comet as comète and explain its message meaning at first use.
- Use floraison for the named growth system and Niveau de floraison for its level. Prefer grandir or s’épanouir in natural sentences.
- Use infinitives for interface actions: Enregistrer, Explorer, Envoyer une comète. Campaign invitations can use the imperative.
- Use mon monde for actions the owner takes and ton monde in copy addressing them. Use ce monde for a visited world.
- Preserve accents, apostrophes and French punctuation spacing. Let longer French labels wrap or gain width.
- Adapt the meaning naturally. Avoid regional slang, gender assumptions and word-for-word English structures.

### Copy-file use

The two locale JSON files use the same keys. The context file records the event and usage condition for each message. Tagline alternatives are review options, not additional default taglines.

This kit contains copy, not notification automation or application behavior. Step 8 will cover the design-token handoff.

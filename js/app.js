/**
 * ====================================================================
 * Project:  Climate Journey - Sustainable Mobility Game (CLEA - FHSTP)
 * File:     app.js
 * Author:   Victor-Adriel de-Jesus-Oliveira
 * Created:  2025-08-10
 * Version:  1.0
 * ====================================================================
 *
 * Description:
 *   Main client-side logic for the Climate Journey companion web app.
 *   Provides the interactive dice-rolling interface, identity and 
 *   challenge card flows, language switching, score tracking, 
 *   emissions chart rendering, and CSV export.
 *
 * Purpose:
 *   To replace and augment physical board game components 
 *   (dice, points, tokens, identity/challenge cards) with an 
 *   accessible, responsive, and multilingual web application.
 *
 * Key Features:
 *   - Internationalization (English/German) with persistent language preference.
 *   - Identity cards and challenge cards with randomized selection.
 *   - Animated 3D dice rolling with audio feedback.
 *   - Real-time tracking of points, emissions, steps, and challenges.
 *   - Emissions line chart rendering on a <canvas> element.
 *   - CSV export of game rounds data.
 *   - LocalStorage-based state persistence between sessions.
 *
 * Inputs:
 *   - User interactions via clicks/touches on dice, buttons, and modals.
 *   - Optional game state from LocalStorage (if resuming a session).
 *
 * Outputs:
 *   - Updated UI elements reflecting current game state.
 *   - Downloadable CSV file with gameplay statistics.
 *   - Audio-visual feedback for dice rolls and game events.
 *
 * Dependencies:
 *   - Standard DOM APIs (querySelector, CanvasRenderingContext2D, etc.)
 *   - HTML5 <dialog> elements for modal interactions.
 *   - CSS variables for dice color mapping.
 *   - Audio assets in ./assets/audio/
 *
 * Notes:
 *   - This script must run after DOM content is fully loaded.
 *   - Requires specific HTML structure with IDs/data attributes used in queries.
 *   - Designed to work in modern browsers with ES6+ support.
 *
 * =====================================================
 */

(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const StorageKeys = {
    lang: 'mg.lang',
    state: 'mg.state',
  };

  const audioMap = {
      0: new Audio('./assets/audio/1roller.mp3'),
      1: new Audio('./assets/audio/1skate.mp3'),
      2: new Audio('./assets/audio/1bike.mp3'),
      3: new Audio('./assets/audio/2train.mp3'),
      4: new Audio('./assets/audio/2tram.mp3'),
      5: new Audio('./assets/audio/2bus.mp3'),
      6: new Audio('./assets/audio/3moto.mp3'),
      7: new Audio('./assets/audio/3car.mp3'),
      8: new Audio('./assets/audio/3truck.mp3'),
      9: new Audio('./assets/audio/4plane.mp3'),
      10: new Audio('./assets/audio/4helicopter.mp3'),
      11: new Audio('./assets/audio/4ship.mp3'),
      12: new Audio('./assets/audio/dice.mp3')
    };

  const defaultState = {
    currentLanguage: 'en',
    useIdentity: false,
    activeIdentity: null, // { id, name }
    points: 0,
    challengeCount: 0,
    emissions: 0,
    steps: 0,
    rounds: [], // { turn, diceId, diceColor, diceName, diceType, steps, emissions, pointsAfter }
  };

  const translations = {
    en: {
      'nav.project': 'The Project',
      'landing.title': 'Sustainable Mobility Game',
      'landing.subtitle': 'Learn and play about sustainable mobility choices.',
      'landing.cta': 'Start Game',
      'game.home': 'Home',
      'game.identity': 'Identity cards',
      'game.help': 'Help',
      'identity.title': 'Play with identity cards?',
      'identity.desc': 'Identity cards let you role-play (e.g., young, elderly, person with disabilities) to reflect diverse mobility needs.',
      'info.title': 'About us',
      'info.desc': 'This app is to be used with the board game Climate Journey. The board game was design and developed by researchers at the FH St. Pölten with Austrian schools with the goal to reflect on the topic of sustainable mobility.',
      'help.title': 'How to play',
      'help.desc': 'Choose a die, roll it, then follow the board steps and note emissions. Use points/challenge if you land on those spaces.',
      'help.descDie': 'Some dice let you move far in a single turn but produce a lot of emissions. You may choose any die, unless your identity card forbids it or a challenge card restricts your choice.',
      'indexhelp.desc': 'Start by reading the game instructions. Next, print the board game map and use different objects to represent the players. Finally, use the CLEA companion app to replace game materials such as dice, points, tokens, and cards.',
      'indexhelp.maplink': 'Game Map (DE, PNG, 38.3 MB) 🔗',
      'indexhelp.manuallink': 'Game Manual (DE, PDF, 2.6 MB) 🔗',
      'dice.small': 'Roll to see your mobility action!',
      'dice.cta': '...',
      'dice.diceText': 'Rolling die...', 
      'dice.actionMove': 'Move', 
      'dice.actionTake': 'Take',
      'dice.actionField': 'fields', 
      'landingOptions.title': 'Did you land on a special field?',
      'landingOptions.points': 'Points',
      'landingOptions.challenge': 'Challenge',
      'points.title': 'Add points',
      'points.hint': 'How many points?',
      'final.title': 'Final Points',
      'final.hint': 'For each 3 emissions, you lose a point.',
      'emissions.title': 'Edit emissions',
      'emissions.hint': 'Add or remove emissions:',
      'steps.title': 'Edit steps',
      'steps.hint': 'How many steps have you moved?',
      'challenge.title': 'Challenge',
      'challenge.points': 'Points',
      'stats.points': 'Points',
      'stats.challenges': 'Challenges',
      'stats.emissions': 'Emissions',
      'stats.steps': 'Steps',
      'stats.reset': 'Reset',
      'stats.final': 'Final Points',
      'stats.download': 'Download CSV',
      'chart.rounds': 'Rounds',
      'chart.emissions': 'Emissions',
      'common.no': 'No',
      'common.yes': 'Yes',
      'common.next': 'Next',
      'common.done': 'Done',
      'common.cancel': 'Cancel',
      'common.dismiss': 'Dismiss',
      'href.gamemap': 'https://phaidra.fhstp.ac.at/api/object/o:7341/preview',
      'href.gamemanual': 'https://phaidra.fhstp.ac.at/api/object/o:7343/preview',
      'href.project': 'https://research.fhstp.ac.at/en/projects/clea-check-and-leave-for-environmental-action',
    },
    de: {
      'nav.project': 'Das Projekt',
      'landing.title': 'Spiel zur nachhaltigen Mobilität',
      'landing.subtitle': 'Lerne und spiele über nachhaltige Mobilitätsentscheidungen.',
      'landing.cta': 'Spiel starten',
      'game.home': 'Homepage',
      'game.identity': 'Identitätskarten',
      'game.help': 'Hilfe',
      'identity.title': 'Mit Identitätskarten spielen?',
      'identity.desc': 'Identitätskarten ermöglichen Rollenspiel (z. B. jung, älter, mit Behinderungen), um unterschiedliche Mobilitätsbedürfnisse zu berücksichtigen.',
      'info.title': 'Über uns',
      'info.desc': 'Diese App ist zur Verwendung mit dem Brettspiel Climate Journey vorgesehen. Das Brettspiel wurde von Forscher:innen der FH St. Pölten in Zusammenarbeit mit österreichischen Schulen entworfen und entwickelt, mit dem Ziel, zum Nachdenken über das Thema nachhaltige Mobilität anzuregen.',
      'help.title': 'So funktioniert es',
      'help.desc': 'Wähle einen Würfel, würfle, folge den Feldern und notiere Emissionen. Nutze Punkte/Herausforderung bei entsprechenden Feldern.',
      'help.descDie': 'Manche Würfel bringen dich in einem Zug weit voran, verursachen aber viele Emissionen. Du darfst jeden Würfel wählen, außer deine Identitätskarte verbietet es oder eine Herausforderungskarte schränkt deine Wahl ein.',
      'indexhelp.desc': 'Beginne damit, die Spielanleitung zu lesen. Drucke anschließend den Spielplan aus und verwende verschiedene Gegenstände, um die Spieler:innen darzustellen. Zum Schluss nutze die CLEA-Companion-App, um Spielmaterialien wie Würfel, Punkte, Spielsteine und Karten zu ersetzen.',
      'indexhelp.maplink': 'Spielplan (PNG, 38.3 MB) 🔗',
      'indexhelp.manuallink': 'Spielhandbuch (PDF, 2.6 MB) 🔗',
      'dice.small': 'Würfle für deine Mobilitätsaktion!',
      'dice.cta': '...',
      'dice.diceText': 'Würfeln...', 
      'dice.actionMove': 'Zieh', 
      'dice.actionTake': 'Nimm',
      'dice.actionField': 'Felder',
      'landingOptions.title': 'Bist du auf einem Sonderfeld gelandet?',
      'landingOptions.points': 'Punkte',
      'landingOptions.challenge': 'Herausforderung',
      'points.title': 'Punkte hinzufügen',
      'points.hint': 'Wie viele Punkte?',
      'final.title': 'Schlusspunkte',
      'final.hint': 'Für jeweils 3 Emissionen verlierst du einen Punkt.',
      'emissions.title': 'Emissionen bearbeiten',
      'emissions.hint': 'Emissionen hinzufügen oder entfernen:',
      'steps.title': 'Felder bearbeiten',
      'steps.hint': 'Wie viele Felder bist du umgezogen?',
      'challenge.title': 'Herausforderung',
      'challenge.points': 'Punkte',
      'stats.points': 'Punkte',
      'stats.challenges': 'Herausforderungen',
      'stats.emissions': 'Emissionen',
      'stats.steps': 'Felder',
      'stats.reset': 'Zurücksetzen',
      'stats.final': 'Schlusspunkte',
      'stats.download': 'CSV herunterladen',
      'chart.rounds': 'Runden',
      'chart.emissions': 'Emissionen',
      'common.no': 'Nein',
      'common.yes': 'Ja',
      'common.next': 'Weiter',
      'common.done': 'Fertig',
      'common.cancel': 'Abbrechen',
      'common.dismiss': 'Schließen',
      'href.gamemap': 'https://phaidra.fhstp.ac.at/api/object/o:7340/preview',
      'href.gamemanual': 'https://phaidra.fhstp.ac.at/api/object/o:7342/preview',
      'href.project': 'https://research.fhstp.ac.at/projekte/clea-check-and-leave-for-environmental-action',
    }
  };

  const identities = [
    { id: '1', name: { en: 'You are 10 years old. You get 2 pocket money (2 points at the start of the game). You have a walking disability. You cannot ride a bike (No white dice).', de: 'Du bist 10 Jahre alt. Du bekommst 2 Taschen-Geld (2 Punkte zu Beginn des Spiels). Du hast eine Geh-Behinderung. Du kannst nicht Fahrrad fahren (Keine weißen Würfel). ' } },
    { id: '2', name: { en: 'You are 11 years old. You get 3 pocket money (3 points at the start of the game). You cannot ride a bike because you have a visual impairment (No white dice).', de: 'Du bist 11 Jahre alt. Du bekommst 3 Taschen-Geld (3 Punkte zu Beginn des Spiels). Du kannst nicht Radfahren, weil Du eine Seh-Behinderung hast (Keine weißen Würfel). ' } },
    { id: '3', name: { en: 'You are 12 years old. You get 2 pocket money (2 points at the start of the game). You live in a big city. That’s why it doesn’t make sense for your parents to drive a car. You do not use the car die (No grey dice).', de: 'Du bist 12 Jahre alt. Du bekommst 2 Taschen-Geld (2 Punkte zu Beginn des Spiels). Du lebst in einer Groß-Stadt. Deswegen ist es für deine Eltern nicht sinnvoll Auto zu fahren. Du benutzt den Auto-Würfel nicht (Keine grauen Würfel).' } },
    { id: '4', name: { en: 'You are 14 years old. You get 5 pocket money (5 points at the start of the game).', de: 'Du bist 14 Jahre alt. Du bekommst 5 Taschen-Geld (5 Punkte zu Beginn des Spiels). ' } },
    { id: '5', name: { en: 'You are 13 years old. Your parents have little money and cannot always give you pocket money. You only get points on the points fields every other time.', de: 'Du bist 13 Jahre alt. Deine Eltern haben wenig Geld und können nicht immer Taschen-Geld bezahlen. Du bekommst auf den Punkte-Feldern nur jedes zweite Mal Punkte.' } },
    { id: '6', name: { en: 'You are 12 years old. You have fled from another country. Your parents cannot give you pocket money.', de: 'Du bist 12 Jahre alt. Du bist aus einem anderen Land geflüchtet. Deine Eltern können kein Taschen-Geld zahlen. ' } },
    { id: '7', name: { en: 'You are 10 years old. You get 2 pocket money (2 points at the start of the game). Your parents do not have a driver’s license and cannot drive you by car (No grey dice).', de: 'Du bist 10 Jahre alt. Du bekommst 2 Taschen-Geld (2 Punkte zu Beginn des Spiels). Deine Eltern haben keinen Führerschein und können dich nicht mit dem Auto führen (Keine grauen Würfel).' } },
    { id: '8', name: { en: 'You are 14 years old. You get 3 pocket money (3 points at the start of the game). You are very committed to protecting the environment. That’s why you do not want to travel by car OR plane (No grey dice and no red dice).', de: 'Du bist 14 Jahre alt. Du bekommst 3 Taschen-Geld (3 Punkte zu Beginn des Spiels). Du setzt dich sehr für die Umwelt ein. Deswegen möchtest du nicht mit dem Auto ODER Flugzeug reisen (keine grauen Würfel und keine roten Würfel). ' } },
    { id: '9', name: { en: 'You are 13 years old. You get 2 pocket money (2 points at the start of the game). You love fast cars and motorcycles. Use the grey die at least 3 times or lose 3 points.', de: 'Du bist 13 Jahre alt. Du bekommst 2 Taschen-Geld (2 Punkte zu Beginn des Spiels). Du liebst schnelle Autos und Motorräder. Verwende den grauen Würfel mindestens 3 Mal, oder verliere 3 Punkte. ' } },
    { id: '10', name: { en: 'You are 11 years old. You get 5 pocket money (5 points at the start of the game). Your parents are rich and own a private plane. Use the red die at least once or lose 3 points.', de: 'Du bist 11 Jahre alt. Du bekommst 5 Taschen-Geld (5 Punkte zu Beginn des Spiels). Deine Eltern sind reich und haben ein eigenes Flugzeug. Verwende den roten Würfel mindestens 1 Mal oder verliere 3 Punkte.' } },
    { id: '11', name: { en: 'You are 16 years old. You get 3 pocket money (3 points at the start of the game).', de: 'Du bist 16 Jahre alt. Du bekommst 3 Taschen-Geld (3 Punkte zu Beginn des Spiels).' } },
    { id: '12', name: { en: 'You are 10 years old. You cannot travel alone if the bus or train is very full. You may use the orange die if someone else in the round is using it.', de: 'Du bist 10 Jahre alt. Du kannst nicht alleine fahren, wenn der Bus oder Zug sehr voll ist. Du darfst den orangenen Würfel verwenden, wenn ihn noch jemand in der Runde benutzt.' } },
    { id: '13', name: { en: 'You are 15 years old. You get 2 pocket money (2 points at the start of the game). You care about the environment and therefore only use public transport (orange die).', de: 'Du bist 15 Jahre alt. Du bekommst 2 Taschen-Geld (2 Punkte zu Beginn des Spiels). Du bist besorgt um die Umwelt und benutzt deswegen nur öffentliche Verkehrs-Mittel (orangener Würfel). ' } },
    { id: '14', name: { en: 'You are 12 years old. You get 1 pocket money (1 point at the start of the game). You live on a mountain and can only ride a bike in good weather. Use the white die a maximum of 3 times in the game!', de: 'Du bist 12 Jahre alt. Du bekommst 1 Taschen-Geld (1 Punkt zu Beginn des Spiels). Du wohnst auf einem Berg und kannst nur bei gutem Wetter Fahrrad fahren. Benutze den weißen Würfel maximal 3 Mal im Spiel!' } },
    { id: '15', name: { en: 'You are 8 years old. You do not get pocket money yet. You travel mostly by school bus. Use the orange die at least every other round.', de: 'Du bist 8 Jahre alt. Du bekommst noch kein Taschen-Geld. Du fährst am meisten mit dem Schul-Bus. Benutze den orangenen Würfel mindestens jede zweite Runde.' } },
    { id: '16', name: { en: 'You are 14 years old. You get 2 pocket money (2 points at the start of the game). You have an anxiety disorder and cannot travel on a full bus or train (No orange die).', de: 'Du bist 14 Jahre alt. Du bekommst 2 Taschen-Geld (2 Punkte zu Beginn des Spiels). Du hast eine Angst-Störung und du kannst nicht in einem vollen Bus oder Zug fahren (kein orangener Würfel). ' } },
    { id: '17', name: { en: 'You are 15 years old. You get 2 pocket money (2 points at the start of the game). You only use public transport (orange die).', de: 'Du bist 15 Jahre alt. Du bekommst 2 Taschen-Geld (2 Punkte zu Beginn des Spiels). Du benutzt nur öffentliche Verkehrsmittel (orangener Würfel). ' } },
    { id: '18', name: { en: 'You are 12 years old. You never fly and prefer to travel by skateboard or bicycle.', de: 'Du bist 12 Jahre alt. Du fliegst nie und fährst am liebsten mit dem Skate-Board oder Fahrrad. ' } },
    { id: '19', name: { en: 'You have superpowers. You may fly as far as a plane once in the game without taking any CO₂ stones.', de: 'Du hast Superkräfte. Du darfst 1 Mal im Spiel so viele Felder fliegen, wie ein Flugzeug, ohne CO-2 Steine zu nehmen.' } },
    { id: '20', name: { en: 'You are the president. You have a private plane. You can use the plane whenever you want, but you must take 5 CO₂ stones each time.', de: 'Du bist Präsident oder Präsidentin. Du hast ein Privat-Flugzeug. Du kannst das Flugzeug verwenden, wann du willst. Du musst dafür jedes Mal 5 CO-2 Steine nehmen.' } },
    { id: '21', name: { en: 'You are a Christmas elf helping Santa Claus. You have a sleigh with reindeer as a vehicle. You can travel with the grey die without emissions.', de: 'Du bist ein Weihnachts-Elf und hilfst dem Weihnachtsmann. Du hast einen Schlitten mit Rentieren als Fahrzeug. Du kannst mit dem grauen Würfel ohne Emissionen reisen.' } },
    { id: '22', name: { en: 'You are the Minister of the Environment. Once per round you can decide that someone must take a different vehicle. The vehicle must produce at least 1 less CO₂.', de: 'Du bist die Umwelt-Ministerin oder Umwelt-Minister. Du kannst einmal in jeder Runde entscheiden, dass jemand ein anderes Fahrzeug nehmen muss. Das Fahrzeug muss mindestens 1 weniger CO-2 produzieren.' } },
    { id: '23', name: { en: 'You are a billionaire. You have a helicopter and many large, expensive cars. They consume a lot of petrol and diesel. The vehicle must produce 1 more CO₂.', de: 'Du bist ein Milliardär oder eine Milliardärin. Du hast einen Helikopter und viele große, teure Autos. Die verbrauchen viel Benzin und Diesel. Das Fahrzeug muss 1 mehr CO-2 produzieren.' } },
    { id: '24', name: { en: 'You are an environmental activist. This means you are committed to a healthy environment. Therefore, you always choose means of transport that produce little CO₂.', de: 'Du bist eine Umwelt-Aktivistin oder Umwelt-Aktivist. Das heißt du setzt dich für eine gesunde Umwelt ein. Deswegen wählst du immer Verkehrs-Mittel, die wenig CO-2 produzieren.' } },
    { id: '25', name: { en: 'You are a famous singer. You are currently touring all over Europe. Therefore, you must travel to many different countries. You always take the grey or orange die.', de: 'Du bist ein berühmter Sänger oder eine berühmte Sängerin. Du spielst gerade in ganz Europa Konzerte. Deswegen musst du in viele verschiedene Länder reisen. Du nimmst immer den grauen oder orangenen Würfel.' } },
    { id: '26', name: { en: 'Your job is mountain climbing. You cannot always choose your vehicle. You must take the helicopter at least once, otherwise you will not reach all the mountains.', de: 'Dein Beruf ist Berg-Steigen. Du kannst dir dein Fahrzeug nicht immer aussuchen. Du musst mindestens 1 Mal den Hubschrauber nehmen. Sonst kommst du nicht zu allen Bergen.' } },
    { id: '27', name: { en: 'Your job is skiing. The ski races cannot be reached by public transport. That means you cannot take the train or bus (No orange dice).', de: 'Dein Beruf ist Schi-Fahren. Die Schi-Rennen sind nicht mit öffentlichen Verkehrs-Mitteln erreichbar. Das heißt du kannst nicht den Zug oder Bus nehmen (Keine orangen Würfel).' } },
    { id: '28', name: { en: 'You are a good fairy. Once per round you can magically remove 2 CO₂ or magically create 2 points.', de: 'Du bist eine gute Fee. Du kannst 1 Mal in jeder Runde 2 CO2 weg zaubern oder 2 Punkte herzaubern.' } },
    { id: '29', name: { en: 'You are an evil wizard. Once per round you can magically remove 1 point and magically create 1 CO₂.', de: 'Du bist ein böser Zauberer. Du kannst 1 Mal in jeder Runde 1 Punkt wegzaubern und 1 CO2 herzaubern.' } },
    { id: '30', name: { en: 'You are the richest person in the world. You build train tracks to your favourite places. You can always travel by train. You may use the white dice multiple times.', de: 'Du bist die reichste Person der Welt. Du baust dir Bahn-Strecken zu deinen Lieblings-Orten. Du kannst immer Zug fahren. Du darfst die weißen Würfel mehrmals verwenden.' } },
  ];

  const challenges = [
    { id: 'c1', text: { en: 'You may take the electric car instead of the regular car once. You may move four spaces, like with the car, but only take 1 CO₂ stone. Keep this card until you want to use it. Once used, discard it.', de: 'Du darfst 1 Mal das Elektro-Auto statt dem Auto nehmen. Du darfst vier Felder fahren, wie mit dem Auto. Dafür musst du nur 1 CO-2 Stein nehmen. Behalte diese Karte, bis du sie verwenden möchtest. Sobald du sie verwendet hast, lege sie weg.' } },
    { id: 'c2', text: { en: 'You may take the electric scooter instead of the kick scooter once. You may move two spaces, one more than with the kick scooter. Keep this card until you want to use it. Once used, discard it.', de: 'Du darfst 1 Mal den Elektro-Roller statt dem Tret-Roller verwenden. Du darfst zwei Felder fahren, ein Feld mehr als mit dem Tret-Roller. Behalte diese Karte, bis du sie verwenden möchtest. Sobald du sie verwendet hast, lege sie weg.' } },
    { id: 'c3', text: { en: 'You know a lot about trains and technology. You are invited to give a talk about it. You get 5 points and may not roll the dice next round. You must use this card immediately. When finished, discard it.', de: 'Du weißt ganz viel über Züge und Technik. Du bist eingeladen einen Vortrag darüber zu halten. Du bekommst 5 Punkte und darfst nächste Runde nicht würfeln. Du musst diese Karte sofort verwenden. Wenn du fertig bist, lege sie weg.' } },
    { id: 'c4', text: { en: 'The organization Green Forest protects the forest. They ensure fewer trees are cut down. You may donate 1 point to Green Forest and return 3 CO₂ stones. Decide immediately whether to do this. If you do, discard the card. If you do not want to use it, put it back.', de: 'Die Organisation Grüner-Wald beschützt den Wald. Sie schaut, dass weniger Bäume weggeschnitten werden. Du darfst 1 Punkt an Grüner-Wald spenden und 3 CO-2 Steine zurückgeben. Entscheide dich gleich, ob du das machen möchtest. Wenn du es machst, lege die Karte weg. Wenn du sie nicht verwenden möchtest, lege sie zurück.' } },
    { id: 'c5', text: { en: 'You find out that all the others are evading taxes! That means they are not paying enough money. You may report one person, and that person must pay 5 points. You may not roll the dice for one round. If you want to do this, use this card immediately and discard it.', de: 'Du erfährst, dass alle anderen Steuern hinterziehen! Das bedeutet sie zahlen nicht genug Geld. Du darfst eine Person anzeigen und diese Person muss 5 Punkte zahlen. Du darfst dafür eine Runde nicht würfeln. Falls du das machen möchtest, löse diese Karte sofort ein und lege sie weg.' } },
    { id: 'c6', text: { en: 'The Minister of the Environment is a good friend of yours. She is responsible for climate protection. You can choose: Either the person with the most CO₂ stones may not roll the dice next round, OR the person with the fewest CO₂ stones gets 2 points. Use this card now and discard it afterwards.', de: 'Die Umwelt-Ministerin ist eine gute Freundin von dir. Sie ist zuständig für Klima-Schutz. Du kannst dir aussuchen: Die Person mit den meisten CO-2 Steinen darf nächste Runde nicht würfeln. ODER die Person mit den wenigsten CO2-Steinen bekommt 2 Punkte. Löse diese Karte jetzt ein und lege sie danach weg.' } },
    { id: 'c7', text: { en: 'You can insulate your house in an eco-friendly way. This means you need less heating, which uses less CO₂ in the long run. It costs 2 points. If you do not do it, take 2 CO₂ stones. You must use this card, but you can decide when until the end of the game.', de: 'Du kannst dein Haus umweltfreundlich dämmen. Das heißt du musst weniger heizen und das verbraucht langfristig weniger CO-2. Das kostet 2 Punkte. Wenn du das nicht machst, nimmst du 2 CO-2 Steine. Du musst diese Karte einlösen, aber du darfst bis zum Ende des Spiels selbst entscheiden, wann.' } },
    { id: 'c8', text: { en: 'You have the chance to work with your fellow players on a few environmental projects. If all players agree to pay a total of 10 points, each may return 2 CO₂ stones. Decide now and then discard the card.', de: 'Du hast die Möglichkeit, mit deinen Mitspieler:innen ein paar Projekte für die Umwelt umzusetzen. Entscheiden sich alle Spieler:innen dazu, insgesamt 10 Punkte zu zahlen, darf jede:r 2 CO-2 Steine zurücklegen. Entscheidet euch jetzt und legt die Karte anschließend weg.' } },
    { id: 'c9', text: { en: 'A severe storm is approaching. Each player must take one CO₂ stone. Use this card now and discard it afterwards.', de: 'Ein heftiger Sturm zieht auf. Jede:r Spieler:in muss einen CO2-Stein nehmen. Löse diese Karte jetzt ein und lege sie danach weg.' } },
    { id: 'c10', text: { en: 'You broke your foot while skiing. The next time you roll, you may not choose the white die. Keep this card until it’s your next turn. Then discard it.', de: 'Du hast dir beim Skifahren den Fuß gebrochen. Beim nächsten Mal würfeln, darfst du nicht den weißen Würfel wählen. Behalte diese Karte, bis du das nächste Mal dran bist. Danach lege sie weg.' } },
    { id: 'c11', text: { en: 'If you use the grey die in the next round, you can take another player with you. That player may move the same number of spaces, and you may return 2 CO₂ stones. Use this card next round or put it back.', de: 'Wenn du in der nächsten Runde den Grauen-Würfel verwendest, kannst du eine:n Mitspieler:in mitnehmen. Die Person darf die gleiche Anzahl an Felder fahren und du darfst dafür 2 CO-2 Steine zurücklegen. Löse die Karte nächste Runde ein, oder lege sie zurück.' } },
    { id: 'c12', text: { en: 'A friend of yours gives you a ride in their car. Move forward 2 spaces. Use this card now and discard it afterwards.', de: 'Ein Freund von dir nimmt dich ein Stückchen in seinem Auto mit. Ziehe 2 Felder vor. Löse diese Karte jetzt ein und lege sie danach weg.' } },
    { id: 'c13', text: { en: 'You forgot your key at home. Move back 2 spaces. Use this card now and discard it afterwards.', de: 'Du hast deinen Schlüssel zu Hause vergessen. Geh 2 Felder zurück. Löse diese Karte jetzt ein und lege sie danach weg.' } },
    { id: 'c14', text: { en: 'You may choose which 2 players swap places. Use this card now and discard it afterwards.', de: 'Du darfst entscheiden, welche 2 Spieler:innen Plätze tauschen. Löse diese Karte jetzt ein und lege sie danach weg.' } },
    { id: 'c15', text: { en: 'You get 1 point. Use this card now and discard it afterwards.', de: 'Du bekommst einen Punkt. Löse diese Karte jetzt ein und lege sie danach weg.' } },
    { id: 'c16', text: { en: 'You may each return 2 CO₂ stones by forming a carpool. In the next round, everyone moves the same number of spaces that you roll with the white die. Then discard this card.', de: 'Ihr habt die Möglichkeit jeweils 2 CO-2 Steine zurückzulegen, indem ihr zusammen eine Fahr-Gemeinschaft gründet. Für die nächste Runde fahren alle die gleiche Felder-Anzahl, die du mit dem weißen Würfel würfelst. Legt diese Karte danach weg.' } },
    { id: 'c17', text: { en: 'You get 1 point. Use this card now and discard it afterwards.', de: 'Du bekommst einen Punkt. Löse diese Karte jetzt ein und lege sie danach weg.' } },
    { id: 'c18', text: { en: 'You may choose: Either you get 2 points OR you return 1 CO₂ stone. Use this card now and discard it afterwards.', de: 'Du darfst wählen: Entweder bekommst du 2 Punkte ODER du legst 1 CO₂-Stein zurück. Löse diese Karte gleich ein und lege sie danach weg.' } },
    { id: 'c19', text: { en: 'You may choose: Either you get 1 point OR you return 1 CO₂ stone. Use this card now and discard it afterwards.', de: 'Du darfst wählen: Entweder bekommst du 1 Punkt ODER du legst 1 CO₂-Stein zurück. Löse diese Karte gleich ein und lege sie danach weg.' } },
    { id: 'c20', text: { en: 'You get 1 point. Use this card now and discard it afterwards.', de: 'Du bekommst einen Punkt. Löse diese Karte jetzt ein und lege sie danach weg.' } },
    { id: 'c21', text: { en: 'You may choose which 2 players swap places. Use this card now and discard it afterwards.', de: 'Du darfst entscheiden, welche 2 Spieler:innen Plätze tauschen. Löse diese Karte jetzt ein und lege sie danach weg.' } },
    { id: 'c22', text: { en: 'You forgot your key at home. Move back 2 spaces. Use this card now and discard it afterwards.', de: 'Du hast deinen Schlüssel zu Hause vergessen. Geh 2 Felder zurück. Löse diese Karte jetzt ein und lege sie danach weg.' } },
    { id: 'c23', text: { en: 'Someone in your group is causing too much CO₂ while driving! This round you may decide up to two times that another person must take a different die. Then discard this card.', de: 'Jemand in eurer Gruppe verursacht zu viel CO₂ beim Fahren! Du darfst in dieser Runde bis zu zwei Mal bestimmen, dass eine andere Person einen anderen Würfel nehmen muss. Danach legst du die Karte ab.' } },
    { id: 'c24', text: { en: 'The person with the fewest CO₂ stones gets 5 points. If you are the person with the fewest CO₂ stones, you get 7 points! Discard this card.', de: 'Die Person mit den wenigsten CO-2 Steinen bekommt 5 Punkte. Bist du die Person mit den wenigsten CO-2 Steinen? Dann bekommst du 7 Punkte! Lege die Karte weg.' } },
    { id: 'c25', text: { en: 'You get a bonus for repairing your bicycle and car instead of buying a new one. You get 1 point. Use this card now and discard it afterwards.', de: 'Du bekommst einen Bonus, weil du dein Fahrrad und Auto repariert hast, anstatt dir ein neues zu kaufen. Du bekommst 1 Punkt. Löse die Karte gleich ein und lege sie dann weg.' } },
    { id: 'c26', text: { en: 'Decide together whether you want to invest in a new train route. It costs a total of 6 points. In return, each person may return 2 CO₂ stones. Decide now and then discard the card.', de: 'Entscheidet gemeinsam, ob ihr in eine neue Zugstrecke investieren wollt. Das kostet insgesamt 6 Punkte. Dafür kann jede Person 2 CO-2 Steine zurücklegen. Entscheidet euch jetzt und legt dann die Karte weg.' } },
    { id: 'c27', text: { en: 'Each player gets 1 point because you jointly held a workshop on environmental protection and sustainability. Use this card now and discard it afterwards.', de: 'Jede:r Spieler:in bekommt 1 Punkt, weil ihr gemeinsam einen Workshop zum Thema Umwelt-Schutz und Nachhaltigkeit gehalten habt. Löse die Karte gleich ein und lege sie dann weg. ' } },
    { id: 'c28', text: { en: 'You forgot your key at home. Move back 3 spaces. Then discard the card.', de: 'Du hast deinen Schlüssel zu Hause vergessen. Geh 3 Felder zurück. Lege die Karte anschließend weg. ' } },
    { id: 'c29', text: { en: 'You may choose which 2 players swap places. Use this card now and then discard it.', de: 'Du darfst entscheiden, welche 2 Spieler:innen Plätze tauschen. Löse die Karte gleich ein und lege sie anschließend weg.' } },
    { id: 'c30', text: { en: 'Move back to the last points field. Use this card immediately and discard it afterwards.', de: 'Du fährst zum letzten Punktefeld zurück. Löse die Karte sofort ein und leg sie danach weg.' } },
    { id: 'c31', text: { en: 'You may each return 2 CO₂ stones by forming a carpool. In the next round, everyone moves the same number of spaces that you roll with the white die. Then discard this card.', de: 'Ihr habt die Möglichkeit jeweils 2 CO-2 Steine zurückzulegen, indem ihr zusammen eine Fahr-Gemeinschaft gründet. Für die nächste Runde fahren alle die gleiche Felder-Anzahl, die du mit dem weißen Würfel würfelst. Legt diese Karte danach weg.' } },
    { id: 'c32', text: { en: 'You get 1 point. Use this card whenever you want and discard it afterwards.', de: 'Du bekommst einen Punkt. Löse diese Karte ein, wann du willst, und leg sie danach weg.' } },
    { id: 'c33', text: { en: 'You may choose: Either you get 2 points OR you return 1 CO₂ stone. Use this card now and discard it afterwards.', de: 'Du darfst wählen: Entweder bekommst du 2 Punkte ODER du legst 1 CO₂-Stein zurück. Löse diese Karte gleich ein und lege sie danach weg.' } },
    { id: 'c34', text: { en: 'You get 1 point. Use this card whenever you want and discard it afterwards.', de: 'Du bekommst einen Punkt. Löse diese Karte ein, wann du willst, und leg sie danach weg.' } },
    { id: 'c35', text: { en: 'Move back to the last points field. Use this card immediately and discard it afterwards.', de: 'Du fährst zum letzten Punktefeld zurück. Löse die Karte sofort ein und leg sie danach weg.' } },
    { id: 'c36', text: { en: 'Someone in your group is causing too much CO₂ while driving! This round you may decide up to two times that another person must take a different die. Then discard this card.', de: 'Jemand in eurer Gruppe verursacht zu viel CO₂ beim Fahren! Du darfst in dieser Runde bis zu zwei Mal bestimmen, dass eine andere Person einen anderen Würfel nehmen muss. Danach legst du die Karte ab.' } },
  ];

  // Also provide color for chart
  const diceDefs = [
  	{ 
    	id: 'White', 
    	color: getCss('--dice-a'), 
    	name: { en: 'Human-Powered', de: 'Muskelbetrieb' },
    	description: { en: 'White Die', de: 'Weißer Würfel' }, 
    	action: { en: 'Move 1-2 / 0 emissions', de: 'Zieh 1–2 / 0 Emissionen' }, 
    	heroIndexBase: 0, 
    	outcomes: [
    	 { face: 1, steps: 1, emissions: 0, spriteIndex: 0, type: 'Scooter', name: { en: 'Rollers make no smoke, they are as clean as walking.', de: 'Roller machen keinen Rauch, so sauber wie zu Fuß gehen.' } },
			 { face: 2, steps: 1, emissions: 0, spriteIndex: 1, type: 'Skate', name: { en: 'Skates are planet-friendly. They use no fuel, just your legs.', de: 'Skates sind umweltfreundlich, sie brauchen keinen Treibstoff, nur deine Beine.' } },
			 { face: 3, steps: 2, emissions: 0, spriteIndex: 2, type: 'Bike', name: { en: 'Bikes make no pollution, just stronger legs.', de: 'Radfahren verursacht keine Abgase, nur stärkere Muskeln.' } }
      ] 
    }, 
    { 
    	id: 'Orange', 
    	color: getCss('--dice-b'), 
    	name: { en: 'Shared Low-Emission', de: 'Gemeinschaft Grün' }, 
    	description: { en: 'Orange Die', de: 'Oranger Würfel' }, 
    	action: { en: 'Move 2-3 / 1-2 emissions', de: 'Zieh 2–3 / 1–2 Emissionen' }, 
    	heroIndexBase: 3, 
    	outcomes: [
			 { face: 1, steps: 3, emissions: 1, spriteIndex: 3, type: 'Train', name: { en: 'Trains share one engine for many people resulting in less smoke per person.', de: 'Züge teilen sich einen Motor für viele Menschen, dadurch entsteht pro Person weniger Rauch.' } },
			 { face: 2, steps: 2, emissions: 1, spriteIndex: 4, type: 'Tram', name: { en: 'Trams run on electricity. It can take as many people as 50 cars but without the fumes.', de: 'Die S-Bahn fährt mit Strom. Sie kann so viele Menschen mitnehmen wie 50 Autos, aber ohne Abgase.' } },
			 { face: 3, steps: 3, emissions: 2, spriteIndex: 5, type: 'Bus', name: { en: 'One bus ride per person is cleaner than each person driving their own car.', de: 'Eine Busfahrt pro Person ist sauberer, als wenn jede Person mit dem eigenen Auto fährt.' } }
    	] 
    }, 
    { 
    	id: 'Gray', 
      color: getCss('--dice-c'), 
      name: { en: 'Motor-Driven', de: 'Motorbetrieb' }, 
      description: { en: 'Gray Die', de: 'Grauer Würfel' },
      action: { en: 'Move 3-4 / 2-4 emissions', de: 'Zieh 3–4 / 2–4 Emissionen' }, 
      heroIndexBase: 6, 
      outcomes: [
      	{ face: 1, steps: 3, emissions: 2, spriteIndex: 6, type: 'Motorbike', name: { en: 'Motorbikes make less smoke than cars but more than buses per person.', de: 'Motorräder machen weniger Abgase als Autos, aber mehr als Busse pro Person.' } },
      	{ face: 2, steps: 4, emissions: 3, spriteIndex: 7, type: 'Car', name: { en: 'Cars make a lot of smoke. Like burning a big bag of charcoal for each trip.', de: 'Autos verursachen viele Abgase, wie wenn man für jede Fahrt einen großen Sack Kohle verbrennt.' } },
      	{ face: 3, steps: 4, emissions: 4, spriteIndex: 8, type: 'Truck', name: { en: 'Trucks carry heavy stuff but one truck can pollute as much as dozens of cars in one day.', de: 'Ein einziger LKW kann so viele Abgase ausstoßen wie dutzende Autos an einem Tag.' } }
      ] 
    },
    { 
    	id: 'Red', 
    	color: getCss('--dice-d'), 
    	name: { en: 'Shared High-Emission', de: 'Gemeinschaft Turbo' }, 
    	description: { en: 'Red Die', de: 'Roter Würfel' },
    	action: { en: 'Move 5-6 / 5-6 emissions', de: 'Zieh 5–6 / 5–6 Emissionen' }, 
    	heroIndexBase: 9, 
    	outcomes: [
			 { face: 1, steps: 5, emissions: 4, spriteIndex: 9, type: 'Airplane', name: { en: 'One plane trip can make as much smoke as hundreds of cars driving all week.', de: 'Ein Flug kann so viele Abgase verursachen wie hunderte Autos, die eine ganze Woche lang fahren.' } },
			 { face: 2, steps: 5, emissions: 5, spriteIndex: 10, type: 'Helicopter', name: { en: 'A short helicopter trip makes more smoke than 100 bus rides.', de: 'Ein kurzer Helikopterflug verursacht mehr Abgase als 100 Busfahrten.' } },
			 { face: 3, steps: 6, emissions: 6, spriteIndex: 11, type: 'Ship', name: { en: 'Big ships make huge clouds of smoke, even bigger than planes sometimes.', de: 'Große Schiffe erzeugen riesige Rauchwolken, manchmal sogar mehr als Flugzeuge.' } }
		  ] 
    }
  ];

  function getCss(varName){
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  function loadState(){
    const raw = localStorage.getItem(StorageKeys.state);
    if(!raw){
      const pref = localStorage.getItem(StorageKeys.lang);
      const lang = pref ? pref : (navigator.language?.startsWith('de') ? 'de' : 'en');
      const init = { ...defaultState, currentLanguage: lang };
      saveState(init);
      return init;
    }
    try{
      const data = JSON.parse(raw);
      return { ...defaultState, ...data };
    }catch{
      return { ...defaultState };
    }
  }

  function saveState(state){
    localStorage.setItem(StorageKeys.state, JSON.stringify(state));
  }

  function setLanguage(lang){
    const state = loadState();
    state.currentLanguage = lang;
    localStorage.setItem(StorageKeys.lang, lang);
    saveState(state);
    applyI18n(lang);
    updateUIFromState();
  }

  function t(key){
    const st = loadState();
    return translations[st.currentLanguage]?.[key] ?? translations.en[key] ?? key;
  }

  function applyI18n(lang){
    $$('[data-i18n]').forEach(el => { el.textContent = translations[lang]?.[el.dataset.i18n] ?? el.textContent; });
    $$('[data-i18n-title]').forEach(el => { el.title = translations[lang]?.[el.dataset.i18nTitle] ?? el.title; });
    $$('[data-i18n-href]').forEach(el => { el.href = translations[lang]?.[el.dataset.i18nHref] ?? el.href; });
  }

  // Rendering helpers
  function renderDiceList(){
    const container = $('#dice-list');
    if(!container) return;
    container.innerHTML = '';
    const st = loadState();
    diceDefs.forEach((die, idx) => {
      const btn = document.createElement('button');
      btn.className = 'dice-btn';
      btn.dataset.diceId = die.id;
      btn.innerHTML = `
        <div class="thumb" style="background-position-y: -${(die.heroIndexBase)*64}px"></div>
        <div class="name">
        	${die.name[st.currentLanguage] || die.name.en}<br/>
        	<span>
        		${die.action[st.currentLanguage] || die.action.en}<br/>
        		${die.description[st.currentLanguage] || die.description.en}
    		</span>
        </div>
        <div><button class="help" aria-label="help">?</button></div>
      `;
      btn.addEventListener('click', (ev) => {
        if(ev.target.closest('.help')){
          showHelpForDie(die);
        } else {
          openDiceModal(die);
        }
      });
      container.appendChild(btn);
    });
  }

  function showHelpForDie(die){
    const help = $('#modal-help');
    if(!help) return;
    help.showModal();
    help.focus();
  }

  // Dice modal state
  let currentDie = null;
  let lastRoll = null; // { outcome, faceRotation }
  let hasRolled = false;

  function openDiceModal(die){
    currentDie = die;
    lastRoll = null;
    hasRolled = false;
    const dlg = $('#modal-dice');
    const hero = $('#dice-hero-image');
    const cube = $('#dice-cube');
    const cta = $('#dice-cta');
    const step = $('#dice-step');
    const diceText = $('#dice-small-text');

    step.hidden = true;
    cta.textContent = t('dice.cta');
    diceText.textContent = t('dice.diceText');
    hero.style.backgroundPositionY = `-${1068}px`;
    dlg.showModal();
    dlg.focus();
    // Wait a frame so layout is available before measuring
    requestAnimationFrame(() => {
      setCubeFacesForDie(cube, die);
      // Auto-roll shortly after opening to ensure transitions apply
      setTimeout(() => rollDie(), 60);
    });
  }

  function setCubeFacesForDie(cube, die){
    const rect = cube.getBoundingClientRect();
    const sizeY = parseFloat(getCss('--dice-size'));
    const faces = $$('.face', cube);
    const mapping = [
      { cls: 'front', idx: 0 }, { cls: 'back', idx: 0 },
      { cls: 'right', idx: 1 }, { cls: 'left', idx: 1 },
      { cls: 'top', idx: 2 }, { cls: 'bottom', idx: 2 },
    ];
    mapping.forEach((m) => {
      const el = cube.querySelector('.' + m.cls);
      const outcome = die.outcomes[m.idx];
      if(el){
        const y = Math.round(outcome.spriteIndex * sizeY);
        el.style.backgroundPosition = `0px -${y}px`;
      }
    });
    cube.style.transform = 'rotateX(0deg) rotateY(0deg)';
  }

  function rollDie(){
    if(!currentDie) return;
    audioMap[12]?.play();
    const cube = $('#dice-cube');
    const duration = 1500 + Math.floor(Math.random()*500);  // 1.5s-2s
    const targetIdx = Math.floor(Math.random()*3);          // 0..2 (three outcomes)
    const rotations = [
      { x: 0, y: 0 },   // front
      { x: 0, y: -90 }, // right
      { x: -90, y: 0 }, // top
    ];
    const faceTarget = rotations[targetIdx];
    // spin random and settle to faceTarget
    const randX = 360* (2 + Math.floor(Math.random()*2));
    const randY = 360* (2 + Math.floor(Math.random()*2));
    //lateral view of dice to generate the figures:
    //cube.style.transitionDuration = '0ms';
    //cube.style.transform = 'rotateX(-30deg) rotateY(45deg)';
    cube.style.transitionDuration = duration + 'ms';
    cube.style.transform = `rotateX(${randX + faceTarget.x}deg) rotateY(${randY + faceTarget.y}deg)`;
    hasRolled = true;
    
    // when done
    setTimeout(() => {
      const outcome = currentDie.outcomes[targetIdx];
      audioMap[outcome.spriteIndex]?.play();
      lastRoll = { outcome, faceRotation: faceTarget };
      logRound(currentDie, outcome);
      updateDiceHeroAfterRoll(currentDie, outcome);
      $('#dice-cta').textContent = `${t('dice.actionMove')} ${outcome.steps} ${t('dice.actionField')} / ${t('dice.actionTake')} ${outcome.emissions} CO₂`;
    }, duration + 20);
  }

  function updateDiceHeroAfterRoll(die, outcome){
    const hero = $('#dice-hero-image');
    hero.style.backgroundPositionY = `-${outcome.spriteIndex*89}px`;

    const st = loadState();
    const diceText = $('#dice-small-text');
    diceText.innerHTML = `${outcome.name[st.currentLanguage] || outcome.name.en}`;
  }

  function logRound(die, outcome){
    const st = loadState();
    st.emissions += outcome.emissions;
    st.steps += outcome.steps;
    const turn = st.rounds.length + 1;    
    const entry = {
      turn,
      diceId: die.id,
      diceColor: die.color,
      diceName: die.name[st.currentLanguage],
      diceFace: outcome.type,
      steps: outcome.steps,
      emissions: outcome.emissions,
      pointsAfter: st.points,
    };
    st.rounds.push(entry);
    saveState(st);
    refreshStats();
    drawEmissionsChart();
  }

  function openLandingOptions(){
    const dlg = $('#modal-landing');
    dlg.showModal();
    dlg.focus();
  }

  function openPointsModal(presetDoneCallback){
    const dlg = $('#modal-points');
    const input = $('#points-input');
    input.value = '';
    dlg.returnValue = '';
    dlg.showModal();
    dlg.focus();
    $('#points-done').onclick = () => {
      const add = parseInt(input.value || '0', 10) || 0;
      const st = loadState();
      st.points += add;
      saveState(st);
      refreshStats();
      dlg.close('done');
      if(typeof presetDoneCallback === 'function') presetDoneCallback();
    };
    $('#points-cancel').onclick = () => {
      dlg.close('cancel');
      if(typeof presetDoneCallback === 'function') presetDoneCallback();
    };
  }

  function openEmissionsModal(presetDoneCallback){
    const dlg = $('#modal-emissions');
    const input = $('#emissions-input');
    input.value = '';
    dlg.returnValue = '';
    dlg.showModal();
    dlg.focus();
    $('#emissions-done').onclick = () => {
      const add = parseInt(input.value || '0', 10) || 0;
      const st = loadState();
      st.emissions += add;
      saveState(st);
      refreshStats();
      dlg.close('done');
      if(typeof presetDoneCallback === 'function') presetDoneCallback();
    };
    $('#emissions-cancel').onclick = () => {
      dlg.close('cancel');
      if(typeof presetDoneCallback === 'function') presetDoneCallback();
    };
  }

  function openStepsModal(presetDoneCallback){
    const dlg = $('#modal-steps');
    const input = $('#steps-input');
    input.value = '';
    dlg.returnValue = '';
    dlg.showModal();
    dlg.focus();
    $('#steps-done').onclick = () => {
      const add = parseInt(input.value || '0', 10) || 0;
      const st = loadState();
      st.steps += add;
      saveState(st);
      refreshStats();
      dlg.close('done');
      if(typeof presetDoneCallback === 'function') presetDoneCallback();
    };
    $('#steps-cancel').onclick = () => {
      dlg.close('cancel');
      if(typeof presetDoneCallback === 'function') presetDoneCallback();
    };
  }

  function openFinalModal(presetDoneCallback){
    const st = loadState();
    const dlg = $('#modal-final');
    dlg.returnValue = '';
    dlg.showModal();
    dlg.focus();
    $('#final-points').textContent = String(st.points);
    $('#final-emissions').textContent = String(st.emissions);
    $('#final-final').textContent = `${(st.points-(st.emissions/3)).toFixed(1)} ${t('stats.points')}`;
    $('#final-cancel').onclick = () => {
      dlg.close('cancel');
      if(typeof presetDoneCallback === 'function') presetDoneCallback();
    };
  }

  function openIndexModal(presetDoneCallback){
    const st = loadState();
    const dlg = $('#modal-indexhelp');
    dlg.returnValue = '';
    dlg.showModal();
    dlg.focus();
    $('#indexhelp-cancel').onclick = () => {
      dlg.close('cancel');
      if(typeof presetDoneCallback === 'function') presetDoneCallback();
    };
  }

  function openChallengeModal(afterFlow){
    const st = loadState();
    const lang = st.currentLanguage;
    const pick = challenges[Math.floor(Math.random()*challenges.length)];
    const dlg = $('#modal-challenge');
    $('#challenge-text').textContent = pick.text[lang] || pick.text.en;
    dlg.showModal();
    dlg.focus();
    $('#challenge-points').onclick = () => {
      dlg.close('points');
      openPointsModal(() => { resetDiceModalState(); if(afterFlow) afterFlow(); });
    };
    $('#challenge-emissions').onclick = () => {
      dlg.close('emissions');
      openEmissionsModal(() => { resetDiceModalState(); if(afterFlow) afterFlow(); });
    };
    $('#challenge-steps').onclick = () => {
      dlg.close('steps');
      openStepsModal(() => { resetDiceModalState(); if(afterFlow) afterFlow(); });
    };
    $('#challenge-done').onclick = () => {
      const s = loadState();
      s.challengeCount += 1;
      saveState(s);
      refreshStats();
      resetDiceModalState();
      dlg.close('done');
      if(afterFlow) afterFlow();
    };
  }

  function resetDiceModalState(){
    currentDie = null; lastRoll = null; hasRolled = false;
    $('#modal-dice')?.close?.();
  }

  function refreshStats(){
    const st = loadState();
    $('#stat-points-value').textContent = String(st.points);
    $('#stat-challenges-value').textContent = String(st.challengeCount);
    $('#stat-emissions-value').textContent = String(st.emissions);
    $('#stat-steps-value').textContent = String(st.steps);
  }

  function updateUIFromState(){
    const st = loadState();
    applyI18n(st.currentLanguage);
    // active identity pill
    const pill = $('#active-identity');
    if(pill){
      if(st.useIdentity && st.activeIdentity){
        const label = st.activeIdentity.name[st.currentLanguage] || st.activeIdentity.name.en;
        pill.textContent = label;
        pill.hidden = false;
      } else {
        pill.hidden = true;
      }
    }
    refreshStats();
    renderDiceList();
    drawEmissionsChart();
  }

  // Emissions chart (simple canvas line chart)
  function drawEmissionsChart(){
    const canvas = $('#emissions-chart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const st = loadState();
    const rounds = st.rounds;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w = rect.width; const h = rect.height;
    ctx.clearRect(0,0,w,h);

    // Layout
    const marginLeft = 44, marginRight = 12, marginTop = 16, marginBottom = 32;
    const plotW = Math.max(1, w - marginLeft - marginRight);
    const plotH = Math.max(1, h - marginTop - marginBottom);

    // Axes
    ctx.strokeStyle = '#2a2f3a'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, marginTop + plotH);
    ctx.lineTo(marginLeft + plotW, marginTop + plotH);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#313131';
    ctx.font = '12px Inter, system-ui, sans-serif';
    // Y label rotated
    ctx.save();
    ctx.translate(14, marginTop + plotH/2);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = 'center';
    ctx.fillText(t('chart.emissions'), 0, 0);
    ctx.restore();
    // X label
    ctx.textAlign = 'center';
    ctx.fillText(t('chart.rounds'), marginLeft + plotW/2, h - 8);

    // Scale
    const maxY = Math.max(5, ...rounds.map(r=>r.emissions));
    const stepX = plotW / Math.max(1, rounds.length);

    // Points
    rounds.forEach((r, i) => {
      const x = marginLeft + (i+1)*stepX;
      const y = marginTop + plotH - (r.emissions / maxY) * plotH;
      ctx.fillStyle = r.diceColor || '#888';
      ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
    });
    // Line
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.beginPath();
    rounds.forEach((r, i) => {
      const x = marginLeft + (i+1)*stepX;
      const y = marginTop + plotH - (r.emissions / maxY) * plotH;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }

  // CSV export
  function downloadCsv(){
    const st = loadState();
    const rows = [['turn','dice','type','transport','steps','emissions','points']];
    let sumSteps = 0, sumEm = 0, sumPts = 0;
    st.rounds.forEach(r => {
      rows.push([r.turn, r.diceId, r.diceName, r.diceFace, r.steps, r.emissions, r.pointsAfter]);
      sumSteps += r.steps; sumEm += r.emissions; sumPts = r.pointsAfter; // pointsAfter reflects cumulative
    });
    rows.push(['SUM','', '', '', sumSteps, sumEm, sumPts]);
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mobility_game_round.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // Bottom sheet interactions
  function setupBottomSheet(){
    const sheet = $('#bottom-sheet');
    const handle = $('#sheet-handle');
    let startY = 0; let startOpen = false; let dragging = false; let dragged = false; let usedEndEvent = "";

    const onStart = (y) => { startY = y; startOpen = sheet.getAttribute('aria-expanded') === 'true'; dragging = true; document.body.style.userSelect = 'none'; };
    const onMove = (y) => {
      if(!dragging) return;
      const dy = y - startY;
      if(dy < -10){ sheet.setAttribute('aria-expanded','true'); dragged = true; } 
      if(dy > 10){ sheet.setAttribute('aria-expanded','false'); dragged = true; } 
    };
    const onEnd = (event, y) => { 
    	dragging = false;
    	if (usedEndEvent == ""){ usedEndEvent = event; }
    	
    	if(dragged){ dragged = false; document.body.style.userSelect = ''; }
    	else if (usedEndEvent == event && y == startY){ sheet.setAttribute('aria-expanded', sheet.getAttribute('aria-expanded')==='true'?'false':'true'); } 
    };

    handle.addEventListener('pointerdown', (e)=>{ handle.setPointerCapture(e.pointerId); onStart(e.clientY); });
    handle.addEventListener('touchstart', (e)=>{ handle.setPointerCapture(e.changedTouches[0].identifier); onStart(e.changedTouches[0].clientY); });
    handle.addEventListener('pointermove', (e)=> onMove(e.clientY));
    handle.addEventListener('touchmove', (e)=> onMove(e.changedTouches[0].clientY));
    handle.addEventListener('pointerup', (e)=> onEnd('pointerup', e.clientY));
    handle.addEventListener('touchend', (e)=> onEnd('touchend', e.changedTouches[0].clientY));
    handle.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); sheet.setAttribute('aria-expanded', sheet.getAttribute('aria-expanded')==='true'?'false':'true'); }
    });
  }

  // Identity modal flow
  function setupIdentity(){
    const btn = $('#btn-identity');
    const dlg = $('#modal-identity');
    if(!btn || !dlg) return;
    btn.addEventListener('click', () => {
      dlg.returnValue = '';
      dlg.showModal();
      dlg.focus();
    });
    dlg.addEventListener('close', () => {
      const st = loadState();
      if(dlg.returnValue === 'yes'){
        const pick = identities[Math.floor(Math.random()*identities.length)];
        st.useIdentity = true;
        st.activeIdentity = pick;
      } else if(dlg.returnValue === 'no'){
        st.useIdentity = false;
        st.activeIdentity = null;
      } 
      saveState(st);
      updateUIFromState();
    });
  }

  // Language switch on landing
  function setupLanguageSwitch(){
    $$('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
    const st = loadState();
    applyI18n(st.currentLanguage);
  }

  function setupHelp(){
    $('#btn-info')?.addEventListener('click', ()=> {
      $('#modal-info').showModal();
      $('#modal-info').focus();
    });
  }

  function setupDiceModal(){
    const cube = $('#dice-cube');
    const next = $('#dice-next');
    cube?.addEventListener('click', () => rollDie());
    next?.addEventListener('click', (e) => {
      e.preventDefault();
      if(!hasRolled){ rollDie(); return; }
      $('#modal-dice')?.close?.('next');
      openLandingOptions();
    });
  }

  function setupLandingFlow(){
    const dlg = $('#modal-landing');
    $('#landing-points')?.addEventListener('click', (e)=>{ e.preventDefault(); dlg.close('points'); openPointsModal(()=>{ resetDiceModalState(); }); });
    $('#landing-challenge')?.addEventListener('click', (e)=>{ e.preventDefault(); dlg.close('challenge'); openChallengeModal(()=>{}); });
    dlg?.addEventListener('close', ()=>{
      if(dlg.returnValue === 'no'){ resetDiceModalState(); }
    });
  }

  function setupStatsActions(){
    $('#btn-reset')?.addEventListener('click', ()=>{
      const lang = loadState().currentLanguage;
      // Clear saved state and set known baseline
      saveState({ ...defaultState, currentLanguage: lang });
      // Reset transient runtime bits
      currentDie = null; lastRoll = null; hasRolled = false;
      // Close any open modals
      try{ $('#modal-dice')?.close?.(); }catch{}
      try{ $('#modal-landing')?.close?.(); }catch{}
      try{ $('#modal-points')?.close?.(); }catch{}
      try{ $('#modal-challenge')?.close?.(); }catch{}
      // Collapse sheet
      $('#bottom-sheet')?.setAttribute('aria-expanded','false');
      // Refresh UI and redraw empty chart
      updateUIFromState();
      drawEmissionsChart();
    });
    $('#btn-download')?.addEventListener('click', downloadCsv);
    $('#stat-points')?.addEventListener('click', ()=> openPointsModal(()=>{}));
    $('#stat-emissions')?.addEventListener('click', ()=> openEmissionsModal(()=>{}));
    $('#stat-steps')?.addEventListener('click', ()=> openStepsModal(()=>{}));
    $('#btn-final')?.addEventListener('click', ()=> openFinalModal(()=>{}));
    
  }
  
  function setupIndexHelpModal(){
    $('#index-help')?.addEventListener('click', ()=> openIndexModal(()=>{}));
  }

  function init(){
    // ensure assets path placeholders exist even if images missing
    const page = document.body.dataset.page;
    if(page === 'landing'){
      setupLanguageSwitch();
      setupIndexHelpModal();
    }
    if(page === 'game'){
      setupHelp();
      setupIdentity();
      setupDiceModal();
      setupLandingFlow();
      setupBottomSheet();
      setupStatsActions();
      updateUIFromState();
      window.addEventListener('resize', drawEmissionsChart);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();



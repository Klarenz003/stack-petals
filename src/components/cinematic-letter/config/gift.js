// Edit this file to personalize the entire keepsake.
// All occasions, the six notes, photo memories and 360 product settings are here.
export const GIFT = {
      occasion: 'romance', // romance, sympathy, birthday, family, friendship, other
      showOccasionPicker: true, // Set false before sending a single-occasion letter.
      otherOccasionName: 'Just Because',
      // Optional per-occasion overrides: e.g. sympathy: { paragraphs: ['...', '...', '...'], lastNote: '...' }
      custom: {},
      recipient: 'favorite person',
      sender: 'your favorite person',
      paragraphs: [
        'Some people enter our lives and make the ordinary feel a little more beautiful. You have a way of doing that without even trying.',
        'I love the little things: our silly conversations, the way you make me smile, and how the simplest moments become memories when they’re shared with you.',
        'So I made you this tiny corner of the universe, just to remind you how much you mean to me. Whatever comes next, I hope we keep collecting lovely little moments together.'
      ],
      signoff: 'With all my heart,',
      reasons: [
        'It has a way of turning an ordinary day into a favorite memory.',
        'The thoughtful little things you do stay with me longer than you know.',
        'You make every moment a little brighter simply by showing up as yourself.',
        'The warmth in your heart makes everyone around you feel safe, seen, and cared for.',
        'Your smile has a way of softening even the hardest days and turning them into something gentle.',
        'The way you care so deeply is one of the quiet reasons you mean so much to me.'
      ],
      // Add 3 or more memories here. You can use local paths (e.g. assets/memory-1.jpg) or hosted image URLs.
      photoMemories: [
        { src: '', caption: 'A moment worth keeping.' },
        { src: '', caption: 'A memory to revisit.' },
        { src: '', caption: 'Another page in our story.' }
      ],
      lastNote: 'No grand occasion needed. Just a little reminder that having you in my life is a gift all on its own.',
      product360: {
        // 'demo' = 240 illustrated sample frames, 'folder' = actual product photos hosted with your HTML.
        mode: 'demo',
        folder: 'assets/product360/',
        prefix: 'frame_',
        extension: 'webp',
        frameCount: 240,
        firstFrame: 1,
        digits: 3
      },
      giftTitle: 'A little gift for you.',
      giftCaption: "A little box with something lovely inside. Lift the lid, then spin the gift through every frame.",
      brandName: 'Stack Petals',
      brandTagline: 'Engineered with Precision, Crafted with Love.'
    };

// Canonical contributor roles. Location credits may only use these keys
// (enforced by the zod schema in ./lib). To credit a new kind of role, add it
// here first, and prefer an existing role when one fits.

/** Roles credited on the song itself. */
export const SONG_ROLES = {
  // Writing
  composer: "Composer",
  lyricist: "Lyricist",
  englishLyricist: "English Lyricist",
  rapLyricist: "Rap Lyricist",
  // Production
  producer: "Producer",
  arranger: "Arranger",
  vocalProducer: "Vocal Producer",
  backingVocalArranger: "Backing Vocal Arranger",
  stringArranger: "String Arranger",
  brassArranger: "Brass Arranger",
  scorePreparation: "Score Preparation",
  programming: "Programming",
  // Performance
  vocals: "Vocals",
  backingVocals: "Backing Vocals",
  guitar: "Guitar",
  bass: "Bass",
  drums: "Drums",
  keyboards: "Keyboards",
  piano: "Piano",
  strings: "Strings",
  saxophone: "Saxophone",
  allInstruments: "All Instruments",
  // Engineering
  recordingEngineer: "Recording Engineer",
  vocalEditor: "Vocal Editor",
  mixingEngineer: "Mixing Engineer",
  masteringEngineer: "Mastering Engineer",
  immersiveMixingEngineer: "Immersive Mixing Engineer",
  immersiveMasteringEngineer: "Immersive Mastering Engineer",
  // Business
  aAndR: "A&R",
  productionCompany: "Production Company",
  recordingStudio: "Recording Studio",
} as const;

/** Roles credited on the music video. */
export const MUSIC_VIDEO_ROLES = {
  // Direction
  director: "Director",
  coDirector: "Co-Director",
  creativeDirector: "Creative Director",
  creative: "Creative",
  assistantDirector: "Assistant Director",
  screenwriter: "Screenwriter",
  choreographer: "Choreographer",
  choreographyAssistant: "Choreography Assistant",
  // Production
  executiveProducer: "Executive Producer",
  producer: "Producer",
  associateProducer: "Associate Producer",
  lineProducer: "Line Producer",
  productionManager: "Production Manager",
  productionCoordinator: "Production Coordinator",
  productionAssistant: "Production Assistant",
  productionCrew: "Production Crew",
  productionCompany: "Production Company",
  locationManager: "Location Manager",
  castingDirector: "Casting Director",
  translator: "Translator",
  transportation: "Transportation",
  catering: "Catering",
  setMedic: "Set Medic",
  consultant: "Consultant",
  // Camera
  directorOfPhotography: "Director of Photography",
  cameraOperator: "Camera Operator",
  focusPuller: "Focus Puller",
  firstAssistantCamera: "First Assistant Camera",
  secondAssistantCamera: "Second Assistant Camera",
  cameraAssistant: "Camera Assistant",
  cameraCrew: "Camera Crew",
  dit: "DIT",
  steadicamOperator: "Steadicam Operator",
  droneOperator: "Drone Operator",
  craneOperator: "Crane Operator",
  filmLab: "Film Lab",
  // Lighting & grip
  gaffer: "Gaffer",
  bestBoy: "Best Boy",
  electrician: "Electrician",
  grip: "Grip",
  lightingTechnician: "Lighting Technician",
  equipment: "Equipment",
  // Art department
  productionDesigner: "Production Designer",
  artDirector: "Art Director",
  assistantArtDirector: "Assistant Art Director",
  artAssistant: "Art Assistant",
  artTeam: "Art Team",
  setDesigner: "Set Designer",
  setBuilder: "Set Builder",
  setDecorator: "Set Decorator",
  props: "Props",
  foodStylist: "Food Stylist",
  // Styling & beauty
  imageDirector: "Image Director",
  stylist: "Stylist",
  stylingAssistant: "Styling Assistant",
  costumeDesigner: "Costume Designer",
  costumeAssistant: "Costume Assistant",
  wardrobe: "Wardrobe",
  wardrobeAssistant: "Wardrobe Assistant",
  hairStylist: "Hair Stylist",
  hairStylistAssistant: "Hair Stylist Assistant",
  makeupArtist: "Makeup Artist",
  makeupAssistant: "Makeup Assistant",
  hairAndMakeup: "Hair & Makeup",
  hairAndMakeupAssistant: "Hair & Makeup Assistant",
  specialEffectsMakeup: "Special Effects Makeup",
  nailArtist: "Nail Artist",
  tattooArtist: "Tattoo Artist",
  // Cast & performance
  cast: "Cast",
  specialAppearance: "Special Appearance",
  extras: "Extras",
  dancer: "Dancer",
  standIn: "Stand-in",
  stuntCoordinator: "Stunt Coordinator",
  stuntPerformer: "Stunt Performer",
  puppeteer: "Puppeteer",
  // Post-production
  editor: "Editor",
  assistantEditor: "Assistant Editor",
  onlineEditor: "Online Editor",
  colourist: "Colourist",
  colourHouse: "Colour House",
  colourProducer: "Colour Producer",
  vfxArtist: "VFX Artist",
  vfxSupervisor: "VFX Supervisor",
  vfxStudio: "VFX Studio",
  vfxProducer: "VFX Producer",
  cgArtist: "CG Artist",
  animator: "Animator",
  illustrator: "Illustrator",
  retoucher: "Retoucher",
  postProductionProducer: "Post-production Producer",
  soundDesigner: "Sound Designer",
  soundMixer: "Sound Mixer",
  subtitles: "Subtitles",
  // Design & titles
  titleDesigner: "Title Designer",
  typographer: "Typographer",
  calligrapher: "Calligrapher",
  graphicDesigner: "Graphic Designer",
  creditsDesigner: "Credits Designer",
  coverDesigner: "Cover Designer",
  // Photography
  stillPhotographer: "Still Photographer",
  photographyAssistant: "Photography Assistant",
  coverPhotographer: "Cover Photographer",
  btsPhotographer: "BTS Photographer",
  btsVideographer: "BTS Videographer",
  // Label & management
  aAndR: "A&R",
  label: "Label",
  artistManagement: "Artist Management",
  projectManager: "Project Manager",
  promotion: "Promotion",
  // Locations & thanks
  location: "Location",
  sponsor: "Sponsor",
  footageCourtesy: "Footage Courtesy",
  specialThanks: "Special Thanks",
} as const;

export type SongRoleKey = keyof typeof SONG_ROLES;
export type MusicVideoRoleKey = keyof typeof MUSIC_VIDEO_ROLES;
export type RoleKey = SongRoleKey | MusicVideoRoleKey;

export const SONG_ROLE_KEYS = Object.keys(SONG_ROLES) as [
  SongRoleKey,
  ...SongRoleKey[],
];
export const MUSIC_VIDEO_ROLE_KEYS = Object.keys(MUSIC_VIDEO_ROLES) as [
  MusicVideoRoleKey,
  ...MusicVideoRoleKey[],
];

export const ROLE_LABELS: Record<RoleKey, string> = {
  ...SONG_ROLES,
  ...MUSIC_VIDEO_ROLES,
};

import { z } from "zod";

// Zod schema for raw items as written in the data file
const RawLocationSchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]), // [lat, lng] as authored
  artist: z.string(),
  address: z.string(),
  name: z.string(),
  url: z.string().url(),
  image: z.string().url(),
  streetView: z.string().url().optional(),
});

// Normalized item with guaranteed lng/lat ordering, and a stable id
export const LocationItemSchema = RawLocationSchema.transform((raw) => {
  const [lat, lng] = raw.coordinates;
  const id = `${raw.artist}-${raw.name}-${lat.toFixed(6)}-${lng.toFixed(6)}`;
  return {
    id,
    artist: raw.artist,
    address: raw.address,
    name: raw.name,
    url: raw.url,
    image: raw.image,
    lat,
    lng,
    streetView: raw.streetView ?? null,
  };
});

export type LocationItem = z.infer<typeof LocationItemSchema>;

const RAW_LOCATIONS = [
  {
    coordinates: [22.321142053555345, 114.16485142381293],
    artist: "MC 張天賦",
    address: "EASY JOE's",
    name: "懷疑人生 In Doubt",
    url: "https://www.youtube.com/watch?v=Lmm6dfPiJDM",
    image: "https://i.ytimg.com/vi/Lmm6dfPiJDM/hq720.jpg",
  },
  {
    coordinates: [22.368659777303858, 114.11300064743985],
    artist: "MC 張天賦",
    address: "Nina Hotel Tsuen Wan West",
    name: "記憶棉 Pillow Talk",
    url: "https://www.youtube.com/watch?v=YZPFbnk_RS0",
    image: "https://i.ytimg.com/vi/YZPFbnk_RS0/hq720.jpg",
  },
  {
    coordinates: [22.286483244707423, 114.22412123018327],
    artist: "林家謙 Terence Lam",
    address: "Sai Wan Ho Ferry Pier",
    name: "《四月物語》April Whispers",
    url: "https://www.youtube.com/watch?v=325j6LVzpYI",
    image: "https://i.ytimg.com/vi/325j6LVzpYI/hq720.jpg",
  },
  {
    coordinates: [22.285186191915162, 114.14823550450804],
    artist: "Edan 呂爵安 ",
    address: "Tai Ping Shan",
    name: "《E先生連環不幸事件》",
    url: "https://www.youtube.com/watch?v=7FPL4DRizgk",
    image: "https://i.ytimg.com/vi/7FPL4DRizgk/hq720.jpg",
  },
  {
    coordinates: [22.334387844185283, 114.12895972674531],
    artist: "Yan Ting 周殷廷 ",
    address: "Container Port Road",
    name: "意外現場 METANOIA",
    url: "https://www.youtube.com/watch?v=YZTdYEJvVBU",
    image: "https://i.ytimg.com/vi/YZTdYEJvVBU/hqdefault.jpg",
  },
  {
    coordinates: [22.29904788270136, 114.15558672262901],
    artist: "Zpecial",
    address: "West Kowloon Art Park",
    name: "《深夜告別練習》",
    url: "https://www.youtube.com/watch?v=dVgmEuwMPxo",
    image: "https://i.ytimg.com/vi/dVgmEuwMPxo/maxresdefault.jpg",
  },
  {
    coordinates: [22.397007979454223, 114.19462980063042],
    artist: "DAY 許軼",
    address: "Au Pui Wan St, Sha Tin (Estimation)",
    name: "《Wait A Second》",
    url: "https://www.youtube.com/watch?v=4ZRo4BrJdU4",
    image: "https://i.ytimg.com/vi/4ZRo4BrJdU4/maxresdefault.jpg",
  },
  {
    coordinates: [22.294262905901675, 114.17187443107473],
    artist: "MC 張天賦",
    address: "HK Space Museum",
    name: "世一 The One For U",
    url: "https://www.youtube.com/watch?v=ESmaELNy8GE",
    image: "https://i.ytimg.com/vi/ESmaELNy8GE/hq720.jpg",
  },
  {
    coordinates: [22.375363303213085, 114.11323532131911],
    artist: "moon tang",
    address: "IKEA",
    name: "房屋供應問題",
    url: "https://www.youtube.com/watch?v=O96-8g_6NII",
    image: "https://i.ytimg.com/vi/O96-8g_6NII/hq720.jpg",
  },
  {
    coordinates: [22.286156071954025, 114.14081848365555],
    artist: "Dear Jane",
    address: "Second Street",
    name: "銀河修理員 Galactic Repairman",
    url: "https://www.youtube.com/watch?v=sg8V5BLMEhE",
    image: "https://i.ytimg.com/vi/bM-3drXQ4TI/maxresdefault.jpg",
  },
  {
    coordinates: [22.276876218375246, 114.1230363750542],
    artist: "陳奕迅 Eason Chan ",
    address: "Mt. Davis Battery",
    name: "陀飛輪",
    url: "https://www.youtube.com/watch?v=URUIcYDq3_I",
    image: "https://i.ytimg.com/vi/URUIcYDq3_I/hqdefault.jpg",
  },
  {
    coordinates: [22.268444112797834, 114.18686345380075],
    artist: "Kiri T, Gareth T, Gordon Flanders & moon tang",
    address: "Coffeelin",
    name: "Christmas Playlist",
    url: "https://www.youtube.com/watch?v=SHFZkBPub5c",
    image: "https://i.ytimg.com/vi/SHFZkBPub5c/maxresdefault.jpg",
  },
  {
    coordinates: [34.70259615177415, 135.49608298379817],
    artist: "Cloud 雲浩影",
    address: "Osaka (Estimation)",
    name: "回憶半分鐘 Memento",
    url: "https://www.youtube.com/watch?v=oSeRj1sW3To",
    image: "https://i.ytimg.com/vi/oSeRj1sW3To/hq720.jpg",
  },
  {
    coordinates: [35.66997711629859, 139.7061296885545],
    artist: "陳蕾 Panther Chan",
    address: "Shibuya Restaurants",
    name: "相信一切是最好的安排 (In Good Hands)",
    url: "https://www.youtube.com/watch?v=RJFcyoDhzKU",
    image: "https://i.ytimg.com/vi/RJFcyoDhzKU/hq720.jpg",
  },
  {
    coordinates: [25.08684077657262, 121.48108208383434],
    artist: "MC張天賦",
    address: "Tainan (Estimation)",
    name: "抽 Inhale",
    url: "https://www.youtube.com/watch?v=JmjKVtw6BrQ",
    image: "https://i.ytimg.com/vi/JmjKVtw6BrQ/hq720.jpg",
  },
  {
    coordinates: [35.71418744329801, 139.77755003071206],
    artist: "洪嘉豪 Hung Kaho",
    address: "Ueno Station (Estimation)",
    name: "黑玻璃 Tinted Windows",
    url: "https://www.youtube.com/watch?v=Rp4iHpTvBY8",
    image: "https://i.ytimg.com/vi/Rp4iHpTvBY8/hq720.jpg",
  },
  {
    coordinates: [22.27703996311955, 114.16131794662428],
    artist: "Faye Wong 王菲",
    address: "Olympic Square (Estimation)",
    name: "無奈那天",
    url: "https://www.youtube.com/watch?v=_zomc3Nz_-s",
    image: "https://i.ytimg.com/vi/_zomc3Nz_-s/maxresdefault.jpg",
  },
  {
    coordinates: [22.361638356138272, 114.1073902050347],
    artist: "Kiri T",
    address: "North Tsing Yi (Estimation)",
    name: "哀傷和愛上算不算同音字 (Is love enough)",
    url: "https://www.youtube.com/watch?v=8Pvj_lEapJ4",
    image: "https://i.ytimg.com/vi/8Pvj_lEapJ4/maxresdefault.jpg",
  },
  {
    coordinates: [22.221232130006396, 114.19814778230364],
    artist: "Marf",
    address: "Near South Bay Beach (?)",
    name: "I'm Marf-elous",
    url: "https://www.youtube.com/watch?v=oAgXQwQtoHE",
    image: "https://i.ytimg.com/vi/oAgXQwQtoHE/maxresdefault.jpg",
  },
  {
    coordinates: [22.305281524932298, 114.16992231540047],
    artist: "moon tang",
    address: "Jordan Street",
    name: "霓虹黯色 - 《傾城》選曲 (cover)",
    url: "https://www.youtube.com/watch?v=jQHM-dB4NXg",
    image: "https://i.ytimg.com/vi/t-ZQ4iT9mVY/sddefault.jpg",
  },
  {
    coordinates: [25.053851659626282, 121.52030632579022],
    artist: "Nancy Kwai",
    address: "Vacanza Accessory Cafe",
    name: "歸綽嶢 - Let go",
    url: "https://www.youtube.com/watch?v=CbpX1RgSOl8",
    image: "https://i.ytimg.com/vi/CbpX1RgSOl8/maxresdefault.jpg",
  },
  {
    coordinates: [22.287147009589365, 114.1592487574377],
    artist: "Kiri T",
    address: "Central Ferry Pier (?)",
    name: "傷心的時候別説話 Beyond Words",
    url: "https://www.youtube.com/watch?v=CjGGpzZN2P0",
    image: "https://i.ytimg.com/vi/CjGGpzZN2P0/sddefault.jpg",
  },
  {
    coordinates: [22.246342882117737, 114.1761378888844],
    artist: "moon tang",
    address: "Sea Life",
    name: "戀人絮語",
    url: "https://www.youtube.com/watch?v=SmlOWWRJZcc",
    image: "https://i.ytimg.com/vi/SmlOWWRJZcc/maxresdefault.jpg",
  },
  {
    coordinates: [22.280477738664846, 114.1857419378452],
    artist: "Kiri T",
    address: "Great George Street",
    streetView:
      "https://www.google.com/maps/@22.2804309,114.1855097,3a,75y,75.41h,79.06t/data=!3m7!1e1!3m5!1sg375DufGdUJujemIJNByEA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D10.937259800306904%26panoid%3Dg375DufGdUJujemIJNByEA%26yaw%3D75.40512162212868!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D",
    name: "中暑傷風加失戀x2 Arctic Summer",
    url: "https://youtu.be/NL0bqEs9Izs?t=8",
    image: "https://i.ytimg.com/vi/NL0bqEs9Izs/hq720.jpg",
  },
  {
    coordinates: [22.243714192525864, 114.22165535643198],
    artist: "Kiri T",
    streetView:
      "https://www.google.com/maps/@22.2447515,114.2211254,3a,75y,336.32h,81.11t/data=!3m7!1e1!3m5!1s3pJUCqvY23a8I70qY_bMjg!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D8.893341064367647%26panoid%3D3pJUCqvY23a8I70qY_bMjg%26yaw%3D336.32179936240084!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI1MDgxNy4wIKXMDSoASAFQAw%3D%3D",
    address: "Tai Tam Tuk",
    name: "至少做一件離譜的事 You Gotta Screw Up At Least Once",
    url: "https://youtu.be/RPoNXvSFHE4?t=205",
    image: "https://i.ytimg.com/vi/RPoNXvSFHE4/maxresdefault.jpg",
  },
  {
    coordinates: [22.338096905356913, 114.18373215318775],
    artist: "Cloud 雲浩影",
    address: "Junction Road Park Tennis Courts",
    name: "別畏高 Acrophobia",
    url: "https://www.youtube.com/watch?v=JTsi1Bc8zuk",
    image: "https://i.ytimg.com/vi/JTsi1Bc8zuk/maxresdefault.jpg",
  },
  {
    coordinates: [22.372380870346085, 113.98814799363147],
    streetView:
      "https://www.google.com/maps/@22.372946,113.9885462,3a,75y,276.89h,89.15t/data=!3m7!1e1!3m5!1sCGSk_CAhmTSznEYci6zFaQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0.8542203553719503%26panoid%3DCGSk_CAhmTSznEYci6zFaQ%26yaw%3D276.8895835171635!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI1MDgxNy4wIKXMDSoASAFQAw%3D%3D",
    artist: "Gordon Flanders",
    address: "Golden Beach",
    name: "冬天一個遊",
    url: "https://youtu.be/oVpmZoj9mOM?t=37",
    image: "https://i.ytimg.com/vi/oVpmZoj9mOM/maxresdefault.jpg",
  },
  {
    coordinates: [22.246050823338784, 114.14459785038378],
    artist: "Gareth T",
    address: "Aberdeen Fishing Village",
    name: "勁浪漫 超溫馨",
    url: "https://www.youtube.com/watch?v=YPJljJJzKFo",
    image: "https://i.ytimg.com/vi/YPJljJJzKFo/maxresdefault.jpg",
  },
  {
    coordinates: [22.997512585996827, 120.21257852590679],
    artist: "Cloud雲浩影",
    address: "Tainan Train Station Front Station",
    name: "你的損失 your loss , not mine",
    url: "https://www.youtube.com/watch?v=N_bghNhUpkA",
    image: "https://i.ytimg.com/vi/N_bghNhUpkA/maxresdefault.jpg",
  },
  {
    coordinates: [43.30424161106344, 5.39431220992521],
    artist: "moon tang",
    address: "Longchamp",
    name: "趁你旅行時搬走",
    url: "https://www.youtube.com/watch?v=OqZqJ6yaeOw",
    image: "https://i.ytimg.com/vi/OqZqJ6yaeOw/maxresdefault.jpg",
  },
];

// Validate and normalize at module load; throws early if data is invalid
export const LOCATIONS: LocationItem[] = z
  .array(LocationItemSchema)
  .parse(RAW_LOCATIONS);

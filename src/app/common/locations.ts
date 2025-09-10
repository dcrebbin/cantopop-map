import { z } from "zod";
import { streetViewIcon } from "~/lib/icons/streetViewIcon";

// Zod schema for raw items as written in the data file
const ContributorsSchema = z
  .object({
    song: z.record(z.array(z.string())).optional(),
    musicVideo: z.record(z.array(z.string())).optional(),
  })
  .optional();

const RawLocationSchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]), // [lat, lng] as authored
  artists: z.array(z.string()),
  address: z.string(),
  name: z.string(),
  url: z.string().url(),
  image: z.string().url(),
  streetView: z.string().url().optional(),
  isCustom: z.boolean().optional(),
  contributors: ContributorsSchema,
});

// Normalized item with guaranteed lng/lat ordering, and a stable id
export const LocationItemSchema = RawLocationSchema.transform((raw) => {
  const [lat, lng] = raw.coordinates;
  const id = `${raw.artists.join(", ")}-${raw.name}-${lat.toFixed(6)}-${lng.toFixed(6)}`;
  return {
    id,
    artists: raw.artists,
    address: raw.address,
    name: raw.name,
    url: raw.url,
    image: raw.image,
    lat,
    lng,
    streetView: raw.streetView ?? null,
    isCustom: raw.isCustom ?? false,
    contributors: raw.contributors ?? null,
  };
});

export type LocationItem = z.infer<typeof LocationItemSchema>;

const RAW_LOCATIONS = [
  {
    coordinates: [22.321142053555345, 114.16485142381293],
    artists: ["MC 張天賦"],
    address: "EASY JOE's",
    name: "懷疑人生 In Doubt",
    url: "https://www.youtube.com/watch?v=Lmm6dfPiJDM",
    image: "https://i.ytimg.com/vi/Lmm6dfPiJDM/hq720.jpg",
    contributors: {
      song: {
        composer: ["Wilson Chow"],
        lyricist: ["林若寧"],
        arranger: ["Nic Tsui", "Larry Wong"],
        producer: ["Wilson Chow", "Larry Wong"],
      },
      musicVideo: {
        director: ["Liknifena"],
        creative: ["Liknifena", "Wing Chan"],
        producer: ["Terron Chan"],
        assistantDirector: ["Jason Kwan"],
        productionManager: ["Ng Long Fung"],
        productionAssistant: ["Wong Kwok Sing", "Siu Siu Chung Devil"],
        intern: ["Yeung Sik Yu"],
        directorOfPhotography: ["Ho Shun"],
        firstAssistantCamera: ["Kaiyo Cheng"],
        secondAssistantCamera: ["Kuen Chung"],
        gaffer: ["Bun Shan"],
        bestBoy: ["So Hei Ping"],
        soundMixer: ["TSC"],
        artDirector: ["Ann Ngai"],
        artAssistant: ["Andrew Tse"],
        stylist: ["Hubert Tsui"],
        stylistAssistant: ["Chiaki S."],
        hairStylist: ["Cliff Chan"],
        makeUpArtist: ["Tammy Au"],
        stillPhotographer: ["Mo Yu Wan Yee"],
        editor: ["Liknifena"],
        colorist: ["Wing Chan"],
        titleDesigner: ["Hailee Chan"],
      },
    },
  },
  {
    coordinates: [22.447133466533547, 113.99309961351902],
    artists: ["MC 張天賦"],
    address: "Tang Ancestral Hall, Ha Tsuen",
    name: "老派約會之必要 (A Gentleman's Guide to Old-Fashioned Dating)",
    url: "https://youtu.be/u14rrcxENDw?t=134",
    streetView: "https://maps.app.goo.gl/BvQZ3PEo2iVUVAq18",
    image: "https://i.ytimg.com/vi/u14rrcxENDw/hq720.jpg",
  },
  {
    coordinates: [22.9884936, 120.2209808],
    artists: ["Marf 邱彥筒"],
    address: "Tainan, Taiwan",
    name: "Love me down",
    url: "https://youtu.be/AgEkYyeu3Jg?t=115",
    streetView: "https://maps.app.goo.gl/qXgnNfKoZHzybtRp6",
    image: "https://i.ytimg.com/vi/AgEkYyeu3Jg/hq720.jpg",
  },
  {
    coordinates: [22.200515988665213, 113.54521352526373],
    artists: ["林靜翬 winifai"],
    address: "愛星屋",
    name: "可有甚麼 (Before I'm Gone)",
    streetView:
      "https://www.google.com/maps/place/%E6%84%9B%E6%98%9F%E5%B1%8B/@22.2005237,113.5450258,3a,17.4y,47.79h,85.52t/data=!3m7!1e1!3m5!1sxjEQ9tdsJi9D7YiFVWRPtA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D4.479524584813959%26panoid%3DxjEQ9tdsJi9D7YiFVWRPtA%26yaw%3D47.79128069709897!7i13312!8i6656!4m6!3m5!1s0x34017bc549f6edef:0x58865e9c1eeff8d3!8m2!3d22.2005169!4d113.5452015!16s%2Fg%2F11y74n1nz0?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D",
    url: "https://www.youtube.com/watch?v=fAc4ZSVYOJU",
    image: "https://i.ytimg.com/vi/fAc4ZSVYOJU/maxresdefault.jpg",
  },
  {
    coordinates: [22.471754454186954, 114.02208959807898],
    artists: ["Gordon Flanders"],
    address: "Fung Lok Wai Fish Ponds (estimation)",
    name: "全世界停電 第二年 The Blackout, Year 2 ",
    streetView:
      "https://www.google.com/maps/@22.473348,114.024313,3a,57.3y,184.14h,81.96t/data=!3m8!1e1!3m6!1sCIHM0ogKEICAgIDq3LDU3gE!2e10!3e11!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FAB8u6HbpwtC1DNElZZ30HhUjsS7deGl2Ny68igkVQYF3jY-7VNiFntK3khg8fwzqu6Mqvr3QDQ9b6DzbpQm99IrDU6aYWGRdL1s0CqvHRQNzBpWk8cF21BV_5HeI-63NSGfWyTNB0ZBJ%3Dw900-h600-k-no-pi8.043024207959391-ya171.64525490982788-ro0-fo100!7i10000!8i5000?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D",
    url: "https://youtu.be/MIhQlIlxAbk?t=162",
    image: "https://i.ytimg.com/vi/MIhQlIlxAbk/maxresdefault.jpg",
  },
  {
    coordinates: [22.265923840469792, 114.24243828964133],
    artists: ["張蔓姿 Gigi"],
    address: "Chai Wan",
    name: "緊張大師 (Overthinker)",
    streetView: "https://maps.app.goo.gl/FY5WayGRF7jtGEc19",
    url: "https://youtu.be/cM_L276Vhvc?t=20",
    image: "https://i.ytimg.com/vi/cM_L276Vhvc/maxresdefault.jpg",
    contributors: {
      song: {
        composer: ["JUDE"],
        lyricist: ["小克"],
        arranger: ["Ariel Lai"],
        producer: ["李一丁"],
      },
      musicVideo: {
        directors: ["Kelly Cheuk", "Kwokin"],
        producers: ["Kelly Cheuk", "Kwokin"],
        makeUpArtists: ["Chi Chi Li", "Tsz Yan"],
        titleDesign: ["Hailee Chan"],
        props: ["Superking"],
        actors: ["Gigi Cheung", "Shadow Yueng", "Hanna Wong Puiying"],
        stillPhotographers: ["禮行"],
        hairStylists: ["Lupus_C_Hair"],
        directorOfPhotographys: ["Silas Chow"],
        stylists: ["Cherry Mui"],
        gaffers: ["Li Hok Fun"],
        focusPullers: ["Kaka Chu"],
        electricians: ["Jana Pang"],
        editors: ["Jasper Chan"],
        colorists: ["Wing Chan"],
        assistantProducers: ["Kwan Yui Hang", "Jess"],
        assistantDirectors: ["Anson Chow", "Jasper Chan"],
        artDirector: ["Maisy Ho"],
        artAssistant: ["Suetyi Lai"],
        wardrobe: ["The World Is Your Oyster", "Maje", "Pedro"],
        productionCoordinator: ["Avery Wang"],
        productionManager: ["Li Minghua Sosad", "Heyman Chan"],
        productionAssistant: ["Siu Cheuk Kwan"],
        postProductionProducer: ["Kelly Cheuk"],
        stylingAssistant: ["Natalie Lin"],
      },
    },
  },
  {
    coordinates: [25.05590865962602, 121.52047332658746],
    artists: ["張蔓姿 Gigi"],
    address: "Coffee Dumbo",
    name: "過電 (Connected)",
    streetView: "https://maps.app.goo.gl/WKDK9JtNDwx5B5m59",
    url: "https://youtu.be/JEOhR2zApI4?t=7",
    image: "https://i.ytimg.com/vi/JEOhR2zApI4/maxresdefault.jpg",
  },
  {
    coordinates: [22.309840668354344, 114.17015110041449],
    artists: ["Gareth T"],
    address: "Yau Ma Tei Community Rest Garden",
    name: "let me know (en)",
    streetView: "https://maps.app.goo.gl/Pcfdfp4vxtmVSjYz8",
    url: "https://youtu.be/FNtirnQzweQ?t=94",
    image: "https://i.ytimg.com/vi/FNtirnQzweQ/maxresdefault.jpg",
  },
  {
    coordinates: [22.3392477451512, 114.1702242800071],
    artists: ["張蔓姿 Gigi"],
    address: "Shek Kip Mei Park",
    name: "不眠遊戲 (SLEEPLESS GAME)",
    streetView: "https://maps.app.goo.gl/2xAZxAwLAEUB6hNU7",
    url: "https://youtu.be/Pv-v5502KxU?t=15",
    image: "https://i.ytimg.com/vi/Pv-v5502KxU/maxresdefault.jpg",
    contributors: {
      song: {
        composer: ["張蔓姿 Gigi"],
        lyricist: ["張蔓姿 Gigi"],
        arranger: ["Lee Yat Ding", "rosemances"],
        producer: ["Lee Yat Ding"],
        drums: ["Lee Yat Ding"],
        mixers: ["Jay Tse"],
      },
      musicVideo: {
        directors: ["Terry To"],
        producers: ["Kelly Lui"],
        makeUpArtists: ["Chi Chi Li"],
        titleDesign: ["Lauonin"],
        props: ["Gin Chan", "Michelle Yuen", "Venus Chan"],
        actors: ["Gigi Cheung", "Shadow Yueng"],
        stillPhotographers: ["Sunny Liu", "Shadow Yueng"],
        hairStylists: ["Ziu Yueng", "MYCS.Hair"],
        directorOfPhotographys: ["Deshawn Leung"],
        stylists: ["Gigi Cheung", "Samantha Lai"],
        productionTeam: ["Lewis Wong", "Kwok Ho Hin", "Pui Yu"],
        gaffers: ["Fung Ho Ning"],
        focusPullers: ["Sonj Ng"],
        electricians: ["Ng Tsz Wai", "Cheung hing Yueng"],
        editors: ["Terry To"],
        colorists: [],
      },
    },
  },
  {
    coordinates: [22.325305480711116, 114.16367494918416],
    artists: ["張蔓姿 Gigi"],
    address: "Tai Kok Tsui",
    name: "不言自明 (Frequency)",
    streetView: "https://maps.app.goo.gl/Gzs1krr2H9XknBZa7",
    url: "https://youtu.be/2RPuyWSUJP0?t=14",
    image: "https://i.ytimg.com/vi/2RPuyWSUJP0/maxresdefault.jpg",
  },
  {
    coordinates: [22.308195267462157, 114.17169792196543],
    artists: ["張蔓姿 Gigi"],
    address: "Eaton HK, Yau Ma Tei",
    name: "深夜浪漫 (Midnight Romance)",
    streetView: "https://maps.app.goo.gl/2qYVjwWaEjazJ8YTA",
    url: "https://youtu.be/EMPUP9Ph8q0?t=96",
    image: "https://i.ytimg.com/vi/EMPUP9Ph8q0/maxresdefault.jpg",
    contributors: {
      musicVideo: {
        directors: ["Halftalk"],
        producers: ["Anson Ng", "Alvin Chu"],
        makeUpArtists: ["Chi Chi Li"],
        actors: ["Edwin Tay", "Gigi Cheung"],
        stillPhotographers: ["Cow10"],
        hairStylists: ["ZIVYEUNGHAIR"],
        directorOfPhotographys: ["Dun Lamb"],
        gaffers: ["Malo Ma"],
        editors: ["Edwardo Chan"],
        colorists: ["Eric Chan"],
        artDirector: ["Kaeja", "Effy Leung"],
        assistantCamera: ["Jim Chow"],
        bestBoy: ["Hero Pun"],
        artTeam: ["Mia Ling", "Shimeyes"],
        behindTheScenes: ["Adrian Law"],
        wardrobe: ["ITeSHOP"],
      },
    },
  },
  {
    coordinates: [26.213946263905513, 127.68680782679441],
    artists: ["Nancy Kwai"],
    address: "Naha, Japan",
    name: "You took my breath away",
    streetView:
      "https://www.google.com/maps/place/%E5%9B%BD%E9%9A%9B%E3%82%BF%E3%82%A6%E3%83%B3%E3%82%BA%E3%82%A4%E3%83%B3/@26.2141087,127.6867703,3a,75y,214.71h,92.32t/data=!3m7!1e1!3m5!1shpdFKr7pHNmotf_ktdOMyg!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-2.324460523223493%26panoid%3DhpdFKr7pHNmotf_ktdOMyg%26yaw%3D214.7148547149733!7i16384!8i8192!4m9!3m8!1s0x34e56970cc742a63:0xbe9e97f7d882e967!5m2!4m1!1i2!8m2!3d26.2139367!4d127.6868028!16s%2Fg%2F1vm_vn1f?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D",
    url: "https://youtu.be/e5TplXPYKt8?t=75",
    image: "https://i.ytimg.com/vi/e5TplXPYKt8/maxresdefault.jpg",
  },
  {
    coordinates: [-37.81971104480582, 144.96839465665767],
    artists: ["馮允謙 Jay Fung"],
    address: "Melbourne, Australia",
    name: " 會再見的 (See You Soon, It's Not A Goodbye)",
    streetView: "https://maps.app.goo.gl/ZTLN5CkXJrvo5Z4j8",
    url: "https://youtu.be/SRG29U7Fw_o?t=166",
    image: "https://i.ytimg.com/vi/SRG29U7Fw_o/maxresdefault.jpg",
  },
  {
    coordinates: [22.329886487567233, 114.18847680470455],
    artists: ["Gareth T"],
    address: "Kowloon",
    name: "偶像已死 (idole sind tot)",
    streetView: "https://maps.app.goo.gl/Z7qQELhGgLZLJY5h8",
    url: "https://youtu.be/-24iWWT9hj4?t=42",
    image: "https://i.ytimg.com/vi/-24iWWT9hj4/maxresdefault.jpg",
  },
  {
    coordinates: [25.122005390322126, 121.86668051886002],
    artists: ["Gareth T"],
    address: "Lianxin Village, Taiwan",
    name: "你都不知道 自己有多好",
    streetView: "https://maps.app.goo.gl/3AR2FiQ8ZAZuK7TM7",
    url: "https://youtu.be/7jXqxjPfRjw?t=38",
    image: "https://i.ytimg.com/vi/7jXqxjPfRjw/maxresdefault.jpg",
  },
  {
    coordinates: [22.221167497754198, 113.88650243288781],
    artists: ["Cloud 雲浩影"],
    address: "Tai Long Wan Beach",
    name: "慢性分手 (Breaking Up Slowly)",
    streetView: "https://maps.app.goo.gl/9TV5ZWJRWq2GYgu19",
    url: "https://youtu.be/VHt8upfvSQ8?t=85",
    image: "https://i.ytimg.com/vi/VHt8upfvSQ8/maxresdefault.jpg",
  },
  {
    coordinates: [24.936166454393945, 121.88634390077614],
    artists: ["moon tang"],
    address: "Yilan County, Taiwan",
    name: "外星人接我回去 (take me home)",
    streetView: "https://maps.app.goo.gl/fFp7RaqAN75h56ZPA",
    url: "https://youtu.be/HIGEklrsMnQ?t=28",
    image: "https://i.ytimg.com/vi/HIGEklrsMnQ/maxresdefault.jpg",
  },
  {
    coordinates: [22.233327554455837, 114.17248136072266],
    artists: ["Gordon Flanders"],
    address: "Ocean Park",
    name: "歌頓花園 (Gordon's Garden)",
    streetView: "https://maps.app.goo.gl/WDr19mxqC4zdQ1uz7",
    url: "https://youtu.be/iYAtwuZXEC8?t=94",
    image: "https://i.ytimg.com/vi/iYAtwuZXEC8/maxresdefault.jpg",
  },
  {
    coordinates: [22.3382397656572, 114.17155355139583],
    artists: ["moon tang"],
    address: "Shek Kip Mei Park",
    name: "i hate u (en)",
    streetView: "https://maps.app.goo.gl/FHpCdhHoTprpERm48",
    url: "https://youtu.be/Fw4m0jQsoug?t=42",
    image: "https://i.ytimg.com/vi/Fw4m0jQsoug/maxresdefault.jpg",
  },
  {
    coordinates: [13.693665356188005, 100.74896215331042],
    artists: ["moon tang"],
    address: "Bangkok Airport, Thailand (estimation)",
    name: "二十五圓舞曲",
    streetView: "https://maps.app.goo.gl/au5kud7843H3C8T77",
    url: "https://youtu.be/vqlzYiT5_aQ?t=10",
    image: "https://i.ytimg.com/vi/vqlzYiT5_aQ/maxresdefault.jpg",
  },
  {
    coordinates: [22.326956446741637, 114.16372901966172],
    artists: ["Dear Jane"],
    address: "Around Kowloon",
    name: "不消失戀愛連續 (I Don't Wanna Be Your IG Story)",
    streetView:
      "https://www.google.com/maps/place/Loong+Jun+Enterprises+Ltd/@22.3268597,114.1637183,3a,75y,22.3h,91.5t/data=!3m7!1e1!3m5!1s-3Jda4lLwiQrjvug-CA7kA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-1.4987673664758887%26panoid%3D-3Jda4lLwiQrjvug-CA7kA%26yaw%3D22.29617937600097!7i16384!8i8192!4m6!3m5!1s0x340400b42691e4d1:0xdc3fe8132f680566!8m2!3d22.326932!4d114.163766!16s%2Fg%2F12m9k28vc?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D",
    url: "https://youtu.be/4-85jDmMQNo?t=409",
    image: "https://i.ytimg.com/vi/4-85jDmMQNo/maxresdefault.jpg",
  },
  {
    coordinates: [22.3067739577149, 114.18289026614131],
    artists: ["林家謙 Terence Lam"],
    address: "Ho Man Tin & various locations",
    name: " 《普渡眾生》 - 電影",
    streetView:
      "https://www.google.com/maps/place/Ho+Man+Tin/@22.3068186,114.1828286,3a,37.5y,129.55h,87.5t/data=!3m7!1e1!3m5!1slorJ8mtOeOzhO4XZXb2dcA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D2.504974932997399%26panoid%3DlorJ8mtOeOzhO4XZXb2dcA%26yaw%3D129.55358498814783!7i16384!8i8192!4m6!3m5!1s0x340400dd0e16ed7d:0x34039828f896379b!8m2!3d22.3093594!4d114.1827294!16zL20vMDR5dGgz?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D",
    url: "https://youtu.be/GUCoNfRmchM?t=159",
    image: "https://i.ytimg.com/vi/GUCoNfRmchM/maxresdefault.jpg",
  },
  {
    coordinates: [22.282396863718144, 114.1524964001634],
    artists: ["Dear Jane"],
    address: "Around Central",
    name: "未開始已經結束 (Ended Before We Even Started)",
    streetView:
      "https://www.google.com/maps/place/Soho+Corner/@22.2823981,114.1523301,3a,75y,76.18h,76.05t/data=!3m7!1e1!3m5!1sivBCw7hfXtykxpxIIgRZDA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D13.94533764092887%26panoid%3DivBCw7hfXtykxpxIIgRZDA%26yaw%3D76.18336602604404!7i16384!8i8192!4m6!3m5!1s0x3404007ba1c6bab5:0xf07c3974d8c252e1!8m2!3d22.2823924!4d114.1524921!16s%2Fg%2F1tgjhx6l?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D",
    url: "https://youtu.be/HwlYipX78Qo?t=154",
    image: "https://i.ytimg.com/vi/HwlYipX78Qo/maxresdefault.jpg",
  },
  {
    coordinates: [22.3118286, 114.186127],
    streetView:
      "https://www.google.com/maps/place/Boston+restaurant/@22.3118286,114.186127,3a,20.7y,112.21h,74.13t/data=!3m7!1e1!3m5!1sHxri6Bk3IK0N7CEqYmAtZg!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D15.867936901216908%26panoid%3DHxri6Bk3IK0N7CEqYmAtZg%26yaw%3D112.20733141427111!7i16384!8i8192!4m6!3m5!1s0x340400deb2a3fff1:0xbc804a6339445298!8m2!3d22.3118659!4d114.1863231!16s%2Fg%2F1tffx2x5?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D",
    artists: ["moon tang", "Kiri T"],
    address: "Boston Restaurant",
    name: "i hate u owe me $$$ (en)",
    url: "https://youtu.be/4hRZudEMff8?t=13",
    image: "https://i.ytimg.com/vi/4hRZudEMff8/maxresdefault.jpg",
  },
  {
    coordinates: [22.368659777303858, 114.11300064743985],
    artists: ["MC 張天賦"],
    address: "Nina Hotel Tsuen Wan West",
    name: "記憶棉 Pillow Talk",
    url: "https://www.youtube.com/watch?v=YZPFbnk_RS0",
    image: "https://i.ytimg.com/vi/YZPFbnk_RS0/hq720.jpg",
  },
  {
    coordinates: [22.286483244707423, 114.22412123018327],
    artists: ["林家謙 Terence Lam"],
    address: "Sai Wan Ho Ferry Pier",
    name: "《四月物語》April Whispers",
    url: "https://www.youtube.com/watch?v=325j6LVzpYI",
    image: "https://i.ytimg.com/vi/325j6LVzpYI/hq720.jpg",
  },
  {
    coordinates: [22.285186191915162, 114.14823550450804],
    artists: ["Edan 呂爵安"],
    address: "Tai Ping Shan",
    name: "《E先生連環不幸事件》",
    url: "https://youtu.be/7FPL4DRizgk?t=163",
    streetView:
      "https://www.google.com/maps/place/22%C2%B017'06.7%22N+114%C2%B008'53.7%22E/@22.2851263,114.1482969,3a,75y,311.6h,75.07t/data=!3m7!1e1!3m5!1su31CYnduqRoYhPYEkj2pKQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D14.932997962100217%26panoid%3Du31CYnduqRoYhPYEkj2pKQ%26yaw%3D311.59964401687176!7i16384!8i8192!4m4!3m3!8m2!3d22.2851862!4d114.1482355?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D",
    image: "https://i.ytimg.com/vi/7FPL4DRizgk/hq720.jpg",
  },
  {
    coordinates: [22.334387844185283, 114.12895972674531],
    artists: ["Yan Ting 周殷廷"],
    address: "Container Port Road",
    name: "意外現場 METANOIA",
    url: "https://www.youtube.com/watch?v=YZTdYEJvVBU",
    image: "https://i.ytimg.com/vi/YZTdYEJvVBU/hqdefault.jpg",
  },
  {
    coordinates: [22.29904788270136, 114.15558672262901],
    artists: ["Zpecial"],
    address: "West Kowloon Art Park",
    name: "《深夜告別練習》",
    url: "https://www.youtube.com/watch?v=dVgmEuwMPxo",
    image: "https://i.ytimg.com/vi/dVgmEuwMPxo/maxresdefault.jpg",
  },
  {
    coordinates: [22.4085224, 114.2204968],
    artists: ["DAY 許軼"],
    address: "Tai Shui Hang",
    name: "《Wait A Second》",
    url: "https://youtu.be/4ZRo4BrJdU4?t=22",
    streetView: "https://maps.app.goo.gl/3RCbYx1fUvaLZ7ot6",
    image: "https://i.ytimg.com/vi/4ZRo4BrJdU4/maxresdefault.jpg",
  },
  {
    coordinates: [22.294262905901675, 114.17187443107473],
    artists: ["MC 張天賦"],
    address: "HK Space Museum",
    name: "世一 The One For U",
    url: "https://www.youtube.com/watch?v=ESmaELNy8GE",
    image: "https://i.ytimg.com/vi/ESmaELNy8GE/hq720.jpg",
  },
  {
    coordinates: [22.375363303213085, 114.11323532131911],
    artists: ["moon tang"],
    address: "IKEA",
    name: "房屋供應問題",
    url: "https://www.youtube.com/watch?v=O96-8g_6NII",
    image: "https://i.ytimg.com/vi/O96-8g_6NII/hq720.jpg",
  },
  {
    coordinates: [-8.65321318543236, 115.13240595625565],
    artists: ["moon tang"],
    address: "Bottega Italiana",
    name: "一口一 (zh)",
    contributors: {
      song: {
        producers: ["Daniel Toh"],
        composers: ["Chintung Tse", "moon tang", "Daniel Toh"],
        lyricists: ["moon tang"],
        arrangers: ["Daniel Toh"],
        mastering: ["Jay Tse"],
        mixers: ["Jay Tse"],
      },
      musicVideo: {
        directors: ["ZAIN"],
        producers: ["ZAIN", "moon tang"],
        directorOfPhotographys: ["ZAIN"],
        stylists: ["Cherie Kong"],
        productionAssistants: ["Thomae Brenners", "Elsie C"],
        editors: ["kidney"],
        colorists: ["kidney"],
      },
    },
    streetView:
      "https://www.google.com/maps/place/Gaia+canggu/@-8.653257,115.1325177,3a,68.8y,276.27h,82.55t/data=!3m7!1e1!3m5!1s2J69iBDPQeY7q183ElG1Aw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D7.453946092601328%26panoid%3D2J69iBDPQeY7q183ElG1Aw%26yaw%3D276.26852114313795!7i16384!8i8192!4m9!1m2!2m1!1sBottega+Italiana!3m5!1s0x2dd239005655ac51:0x386b833f6c91daeb!8m2!3d-8.6524302!4d115.133087!16s%2Fg%2F11w7jf7wmn?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D",
    url: "https://www.youtube.com/watch?v=tWPQSKm5WyQ",
    image: "https://i.ytimg.com/vi/tWPQSKm5WyQ/maxresdefault.jpg",
  },
  {
    coordinates: [22.480945015645847, 114.15602924346081],
    artists: ["moon tang", "Marf 邱彥筒"],
    address: "near Yuk Hing Temple",
    name: "grwm",
    url: "https://youtu.be/aqDDCiZoJIY?t=44",
    streetView:
      "https://www.google.com/maps/place/22%C2%B028'51.3%22N+114%C2%B009'21.7%22E/@22.481028,114.1560802,3a,28.6y,310.18h,91.34t/data=!3m8!1e1!3m6!1sCIHM0ogKEICAgIDmh_-gkwE!2e10!3e11!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FAB8u6HZ2XLcqKzEMGYqKBzis-T2veI6s-SxJsnI9tuN-0rD-OL862eRkh3Bth49G08kFHIFv0013vFdgs6uwGRYsDEil5yVFEXsVw8TaLo6FYbXKQubLQLA7QzUBrlA26ESQq1-37uc6%3Dw900-h600-k-no-pi-1.3402438159201182-ya252.3987914797783-ro0-fo100!7i5760!8i2880!4m4!3m3!8m2!3d22.4809167!4d114.1560278?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D",
    image: "https://i.ytimg.com/vi/aqDDCiZoJIY/maxresdefault.jpg",
  },
  {
    coordinates: [22.286156071954025, 114.14081848365555],
    artists: ["Dear Jane"],
    address: "Second Street",
    name: "銀河修理員 Galactic Repairman",
    url: "https://youtu.be/sg8V5BLMEhE?t=138",
    image: "https://i.ytimg.com/vi/bM-3drXQ4TI/maxresdefault.jpg",
    streetView:
      "https://www.google.com/maps/place/22%C2%B017'10.2%22N+114%C2%B008'27.0%22E/@22.2861574,114.1407242,3a,75y,102.58h,78.05t/data=!3m7!1e1!3m5!1s-i8wnvyBBU0VwuItG00iVQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D11.949899332072064%26panoid%3D-i8wnvyBBU0VwuItG00iVQ%26yaw%3D102.575493856485!7i16384!8i8192!4m4!3m3!8m2!3d22.2861561!4d114.1408185?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    coordinates: [22.276876218375246, 114.1230363750542],
    artists: ["陳奕迅 Eason Chan"],
    address: "Mt. Davis Battery",
    name: "陀飛輪",
    url: "https://www.youtube.com/watch?v=URUIcYDq3_I",
    image: "https://i.ytimg.com/vi/URUIcYDq3_I/hqdefault.jpg",
  },
  {
    coordinates: [22.268444112797834, 114.18686345380075],
    artists: ["Kiri T", "Gareth T", "Gordon Flanders", "moon tang"],
    address: "Coffeelin",
    name: "Christmas Playlist (en)",
    streetView:
      "https://www.google.com/maps/place/22%C2%B016'06.4%22N+114%C2%B011'12.7%22E/@22.268567,114.1868155,3a,75y,147.02h,82.82t/data=!3m7!1e1!3m5!1ss1bn_R27bLHP8vrV5M0sPw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D7.1787387254073565%26panoid%3Ds1bn_R27bLHP8vrV5M0sPw%26yaw%3D147.02454317766063!7i16384!8i8192!4m4!3m3!8m2!3d22.2684441!4d114.1868635?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D",
    url: "https://www.youtube.com/watch?v=SHFZkBPub5c",
    image: "https://i.ytimg.com/vi/SHFZkBPub5c/maxresdefault.jpg",
  },
  {
    coordinates: [34.70259615177415, 135.49608298379817],
    artists: ["Cloud 雲浩影"],
    address: "Osaka (Estimation)",
    name: "回憶半分鐘 Memento",
    url: "https://www.youtube.com/watch?v=oSeRj1sW3To",
    image: "https://i.ytimg.com/vi/oSeRj1sW3To/hq720.jpg",
  },
  {
    coordinates: [23.267013149595147, 113.02207964706872],
    artists: ["moon tang"],
    address: "Lepingzhen (Estimation)",
    name: "some days (en)",
    url: "https://youtu.be/qTay36oNgIs?t=90",
    image: "https://i.ytimg.com/vi/qTay36oNgIs/maxresdefault.jpg",
    contributors: {
      song: {
        producer: ["PhD"],
        composers: ["Moon Tang", "Kiri T", "Peter Wallevik", "Daniel Davidsen"],
        lyricists: ["Moon Tang", "Kiri T"],
        arrangers: ["Peter Wallevik", "Daniel Davidsen"],
        mixingMastering: ["Matt Sim"],
      },
      musicVideo: {
        ar: ["Malik Zain Ali", "Nicholas Cheung"],
        creativeDirector: ["Cherie Kong"],
        assistantDirector: ["Agnes Kahei @The Besties"],
        production: ["@The Besties"],
        directorOfPhotography: ["Samson Huang"],
        technoCraneTechnician: ["林少雄"],
        focusPuller: ["文明"],
        cameraAssistant: ["許良", "唐斌", "龐於新"],
        gaffer: ["Sunny Yip"],
        bestBoy: ["Brian Choi", "肖智龍", "李曉嵩", "陽利玉"],
        choreographer: ["Yuen Yuen"],
        actors: ["Thomae Brenners", "moon tang"],
        stylist: ["Cherie Kong"],
        makeUpArtist: ["Kidd Sun"],
        hairStylist: ["Ian Tsoi"],
        stylingAssistant: ["Sam Law", "Clayton Mang"],
        artTeam: ["Sam Law", "Clayton Mang"],
        toyDesigner: ["Mia Chu @ YAYAMIMI STUDIO"],
        offlineEditor: ["FuChai @THE BASTARDS"],
        onlineEditor: ["Fai Chan @THE BASTARDS"],
        animatorTitleDesigner: ["Manmen Tam"],
        colorist: ["Eric Chan @ IXAGON"],
        photographerCoverDesigner: ["Austin Cheng @Janthought"],
        projectArtistManagers: ["Malik Zain Ali", "Nicholas Cheung"],
      },
    },
  },
  {
    coordinates: [35.66997711629859, 139.7061296885545],
    artists: ["陳蕾 Panther Chan"],
    address: "Shibuya Restaurants",
    name: "相信一切是最好的安排 (In Good Hands)",
    url: "https://www.youtube.com/watch?v=RJFcyoDhzKU",
    image: "https://i.ytimg.com/vi/RJFcyoDhzKU/hq720.jpg",
  },
  {
    coordinates: [25.08684077657262, 121.48108208383434],
    artists: ["MC 張天賦"],
    address: "Tainan (Estimation)",
    name: "抽 Inhale",
    url: "https://www.youtube.com/watch?v=JmjKVtw6BrQ",
    image: "https://i.ytimg.com/vi/JmjKVtw6BrQ/hq720.jpg",
  },
  {
    coordinates: [35.71418744329801, 139.77755003071206],
    artists: ["洪嘉豪 Hung Kaho"],
    address: "Ueno Station (Estimation)",
    name: "黑玻璃 Tinted Windows",
    url: "https://www.youtube.com/watch?v=Rp4iHpTvBY8",
    image: "https://i.ytimg.com/vi/Rp4iHpTvBY8/hq720.jpg",
  },
  {
    coordinates: [22.27703996311955, 114.16131794662428],
    artists: ["Faye Wong 王菲"],
    address: "Olympic Square (Estimation)",
    name: "無奈那天",
    url: "https://www.youtube.com/watch?v=_zomc3Nz_-s",
    image: "https://i.ytimg.com/vi/_zomc3Nz_-s/maxresdefault.jpg",
  },
  {
    coordinates: [22.361638356138272, 114.1073902050347],
    artists: ["Kiri T"],
    address: "North Tsing Yi (Estimation)",
    name: "哀傷和愛上算不算同音字 (Is love enough)",
    url: "https://www.youtube.com/watch?v=8Pvj_lEapJ4",
    image: "https://i.ytimg.com/vi/8Pvj_lEapJ4/maxresdefault.jpg",
  },
  {
    coordinates: [22.221232130006396, 114.19814778230364],
    artists: ["Marf 邱彥筒"],
    address: "Near South Bay Beach (?)",
    name: "I'm Marf-elous",
    url: "https://www.youtube.com/watch?v=oAgXQwQtoHE",
    image: "https://i.ytimg.com/vi/oAgXQwQtoHE/maxresdefault.jpg",
  },
  {
    coordinates: [22.305281524932298, 114.16992231540047],
    artists: ["moon tang"],
    address: "Jordan Street",
    name: "霓虹黯色 - 《傾城》選曲 (cover)",
    url: "https://www.youtube.com/watch?v=jQHM-dB4NXg",
    image: "https://i.ytimg.com/vi/t-ZQ4iT9mVY/sddefault.jpg",
  },
  {
    coordinates: [22.294059012706807, 114.16848164217643],
    artists: ["Kiri T"],
    address: "Tsim Sha Tsui Pier",
    name: "關我蛋治 Eggnorant Sandwich",
    url: "https://youtu.be/Lc1McFzS-CM?t=59",
    image: "https://i.ytimg.com/vi/Lc1McFzS-CM/maxresdefault.jpg",
    streetView: "https://maps.app.goo.gl/CchydecM4kLvKXyD9",
    contributors: {
      song: {
        composer: [
          "Kiri T",
          "Zev Troxler",
          "Terence Po Lun Lam",
          "Adam Pondang",
        ],
        lyricist: ["鍾說", "Kiri T", "Zev Troxler"],
        arranger: ["Polun", "Adamjosh"],
        producer: ["Polun", "Adamjosh"],
      },
      musicVideo: {
        producer: ["入屋叫人 This is my Production House"],
        director: ["Titus Chan"],
        assistantDirector: ["Woody Lo"],
        cinematographer: ["Timothy Chan"],
        cameraAssistant: ["Samuel Ip"],
        gaffer: ["Fung Ho Ning"],
        electrician: ["Sum Ka Lung"],
        productionManager: ["LOLO"],
        creativeDirector: ["Freya Cheung"],
        artTeam: ["Sin Yi Hang", "Wong Lung Yi", "Jason Ng", "Cassiel Lam"],
        editor: ["Titus Chan"],
        postProduction: ["Titus Chan"],
        actors: [
          "Gavin Chan",
          "LOLO",
          "Justin Chan",
          "Freya Cheung",
          "Woody Lo",
          "Timothy Chan",
          "Fung Ho Ning",
          "Samuel Ip",
          "Titus Chan",
          "Ding Ding",
          "Conrad Ho",
        ],
        styling: ["Exactly the Sam"],
        stylingAssistant: ["Stephanie Choy"],
        wardrobe: ["ITHK", "Farfetch"],
        stillPhotographer: ["Mag Lam"],
        titleDesign: ["Hailee Chan"],
        hair: ["Toyo Ho"],
        makeup: ["ChiLi Fong"],
      },
    },
  },
  {
    coordinates: [34.043348146930455, -118.2549058354164],
    artists: ["Kiri T"],
    address: "Urban Outfitters (Rialto)",
    streetView: "https://maps.app.goo.gl/FiWGWiC5L56TZuDJ9",
    name: "歧義種子 Dear Kiwi",
    url: "https://youtu.be/8DQHxh20EZ8?t=81",
    image: "https://i.ytimg.com/vi/8DQHxh20EZ8/maxresdefault.jpg",
    contributors: {
      song: {
        composer: ["Kiri T", "Daniel Toh"],
        lyricist: ["鍾說"],
        arranger: ["Kiri T", "Daniel Chu"],
        producer: ["Kiri T", "陳考威"],
      },
      musicVideo: {
        producer: ["Tiny Machine", "Radicchio Films"],
        director: ["Amy Hoang"],
        gaffer: ["JC Falcon"],
        assistantDirector: ["Ryan Hoang"],
        firstAssistantCamera: ["Bonnie Delgado"],
        focusPuller: ["Angel Falcon"],
        hairAndMakeupArtist: ["Maureen Burke"],
        movementDirector: ["Grace Parker"],
        dancers: ["Winnie Nguyen", "Enny Owl", "Erika Parker", "Ellie Hendrix"],
        gAndE: ["Kyle Thor"],
        editor: ["Adrian Law"],
        colourist: ["Titus Chan"],
        titleDesign: ["Hailee Chan"],
      },
    },
  },
  {
    coordinates: [25.053851659626282, 121.52030632579022],
    artists: ["Nancy Kwai"],
    address: "Vacanza Accessory Cafe",
    streetView:
      "https://www.google.com/maps/place/25%C2%B003'13.9%22N+121%C2%B031'13.1%22E/@25.0538235,121.5203269,3a,75y,304.64h,74.05t/data=!3m7!1e1!3m5!1svXWUvs5cVIgdzrYZAnuI_A!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D15.953851951431403%26panoid%3DvXWUvs5cVIgdzrYZAnuI_A%26yaw%3D304.64273250789427!7i16384!8i8192!4m4!3m3!8m2!3d25.0538517!4d121.5203063?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D",
    name: "歸綽嶢 - Let go",
    url: "https://youtu.be/CbpX1RgSOl8?t=143",
    image: "https://i.ytimg.com/vi/CbpX1RgSOl8/maxresdefault.jpg",
  },
  {
    coordinates: [22.287147009589365, 114.1592487574377],
    artists: ["Kiri T"],
    address: "Central Ferry Pier (?)",
    name: "傷心的時候別説話 Beyond Words",
    url: "https://www.youtube.com/watch?v=CjGGpzZN2P0",
    image: "https://i.ytimg.com/vi/CjGGpzZN2P0/sddefault.jpg",
    contributors: {
      song: {
        vocalProduction: ["Gareth Chan", "Jeffero Chan"],
        guitars: ["Daniel Toh"],
        strings: ["Diana X. Lizhao"],
        programBackingVocalsAndKeys: ["Kiri T"],
        mixing: ["Heidi Wang"],
        mastering: ["Alex Psaroudakis"],
      },
      musicVideo: {
        producer: ["入屋叫人", "@thisismy.prod"],
        director: ["Titus Chan"],
        creative: ["Adrian Law", "Titus Chan"],
        cameraCrew: ["Woody Lo", "Audrey Lee"],
        ghost: ["Canice Tam"],
        makeup: ["ChiLi Fong"],
        makeupAssistant: ["Teddy Hon"],
        hairStylist: ["JamieLeeHair"],
        hairStylistAssistant: ["Issac Lo", "@ HOLA il colpo hair & pets"],
        titleDesigner: ["Peter Lam"],
      },
    },
  },
  {
    coordinates: [22.246342882117737, 114.1761378888844],
    artists: ["moon tang"],
    address: "Sea Life",
    name: "戀人絮語",
    url: "https://youtu.be/SmlOWWRJZcc?t=124",
    streetView:
      "https://www.google.com/maps/@22.246055,114.176123,2a,58.4y,339.13h,96.91t/data=!3m7!1e1!3m5!1syhcc5BbMGRkAAAQvvewcSw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-6.910184776316683%26panoid%3Dyhcc5BbMGRkAAAQvvewcSw%26yaw%3D339.1276907332437!7i13312!8i6656?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D",
    image: "https://i.ytimg.com/vi/SmlOWWRJZcc/maxresdefault.jpg",
  },
  {
    coordinates: [22.338462796346107, 114.2000782517885],
    artists: ["Kiri T"],
    address: "PORTAL",
    name: " 榮譽博士 PhD",
    url: "https://youtu.be/i1ijH0bwLBg?t=120",
    streetView: "https://maps.app.goo.gl/2TQXCnz6o8Sm7nbR7",
    image: "https://i.ytimg.com/vi/i1ijH0bwLBg/maxresdefault.jpg",
    contributors: {
      musicVideo: {
        producer: ["@THISISMY.PROD", "入屋叫人"],
        director: ["Titus Chan", "陳天順"],
        creative: ["Adrian Law", "羅晞凌", "Titus Chan", "陳天順"],
        productionManager: ["Lolo", "盧朗晴"],
        standIn: ["Ho King Lok", "何敬樂"],
        cameraCrew: ["Audrey Lee", "李潔映"],
        makeupArtist: ["Tammy Au"],
        hairStylist: ["Jamieleee @HOLA.HAIR.PET"],
        hairAssistant: ["Issac Lo @HOLA.HAIR.PET"],
        titleDesign: ["Peter Lam", "林卓軒"],
      },
      song: {
        composer: ["Kiri T", "Gavin Chan"],
        lyricist: ["鍾說", "Kiri T"],
        arranger: ["Kiri T", "Hirsk"],
        producer: ["Kiri T"],
      },
    },
  },
  {
    coordinates: [22.280477738664846, 114.1857419378452],
    artists: ["Kiri T"],
    address: "Great George Street",
    streetView:
      "https://www.google.com/maps/@22.2804309,114.1855097,3a,75y,75.41h,79.06t/data=!3m7!1e1!3m5!1sg375DufGdUJujemIJNByEA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D10.937259800306904%26panoid%3Dg375DufGdUJujemIJNByEA%26yaw%3D75.40512162212868!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D",
    name: "中暑傷風加失戀x2 Arctic Summer",
    url: "https://youtu.be/NL0bqEs9Izs?t=8",
    image: "https://i.ytimg.com/vi/NL0bqEs9Izs/hq720.jpg",
    contributors: {
      song: {
        composer: ["Kiri T"],
        lyricist: ["小克"],
        arranger: ["Kiri T", "Daniel Toh"],
        producer: ["Kiri T", "陳考威"],
      },
      musicVideo: {
        shooting: ["Adrian Law", "Hailee Chan", "Adrienne Lau"],
        crew: ["Erin Yan", "Peter Lam"],
        hair: ["Jamie Lee"],
        makeup: ["Tammy Au"],
        hairAssistant: ["Issac Lo"],
        titleDesign: ["Hailee Chan"],
      },
    },
  },
  {
    coordinates: [22.243714192525864, 114.22165535643198],
    artists: ["Kiri T"],
    streetView:
      "https://www.google.com/maps/@22.2447515,114.2211254,3a,75y,336.32h,81.11t/data=!3m7!1e1!3m5!1s3pJUCqvY23a8I70qY_bMjg!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D8.893341064367647%26panoid%3D3pJUCqvY23a8I70qY_bMjg%26yaw%3D336.32179936240084!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI1MDgxNy4wIKXMDSoASAFQAw%3D%3D",
    address: "Tai Tam Tuk",
    name: "至少做一件離譜的事 You Gotta Screw Up At Least Once",
    url: "https://youtu.be/RPoNXvSFHE4?t=205",
    image: "https://i.ytimg.com/vi/RPoNXvSFHE4/maxresdefault.jpg",
  },
  {
    coordinates: [22.338096905356913, 114.18373215318775],
    artists: ["Cloud 雲浩影"],
    address: "Junction Road Park Tennis Courts",
    name: "別畏高 Acrophobia",
    url: "https://www.youtube.com/watch?v=JTsi1Bc8zuk",
    image: "https://i.ytimg.com/vi/JTsi1Bc8zuk/maxresdefault.jpg",
  },
  {
    coordinates: [22.479967361059376, 114.05790422067578],
    artists: ["COLLAR"],
    address: "Chinese Legend (Yuen Long)",
    name: "暴走女團 Can't stop Won't stop",
    streetView: "https://maps.app.goo.gl/KXyg1tPcAScXhgxg6",
    url: "https://youtu.be/6EYx-cPUpxk?t=22",
    image: "https://i.ytimg.com/vi/6EYx-cPUpxk/maxresdefault.jpg",
    contributors: {
      song: {
        composer: ["Bryan Tse", "Neena Fjelddahl"],
        lyricist: ["黃偉文"],
        arranger: ["Bryan Tse", "謝國維"],
        producer: ["謝國維"],
        vocals: ["COLLAR"],
      },
      musicVideo: {
        directors: ["The Bastards"],
        creative: ["Herman Wan @The Bastards"],
        producer: ["Tiffany So"],
        directorOfPhotography: ["Hardy Yan"],
        assistantDirector: ["Avyon C."],
        choreographer: ["Rino Koyama"],
        focusPuller: ["Lau Chun Sing"],
        cameraAssistant: ["Ng Pak Hin", "Ks Wei Lo"],
        gaffer: ["Ng Pak Yiu"],
        lightingCrew: ["Hins Holiday", "Ming Ting"],
        artDirection: ["Kolin"],
        artTeam: ["Bee", "Fing"],
        props: ["Eason"],
        productionCrew: [
          "Halley Leung",
          "Lam Man",
          "Tai Ho Yeung",
          "Lui Man",
          "Cedric Cheung",
        ],
        stylingTheKollar: ["Wincy & Jessie"],
        wardrobeTheKollar: [
          "Acne Studios",
          "Jaded London",
          "Thug Club",
          "Adidas",
          "Zara",
        ],
        jewellery: ["Charles & Keith", "APM Monaco"],
        movementArtist: [
          "San Chan",
          "Janice Wong",
          "Percy Shing",
          "Cathy Zhang",
          "Jenny Fung",
          "Willow Chan",
        ],
        hairStylist: ["Taurus Lee", "Ricky Lam", "Smile Lam", "Tan Lee"],
        styling: ["Ben Cheung"],
        makeupHairStylingForCast: ["Kiki Liu"],
        visualsEditor: ["The11th @TheBastards"],
        stylingForCast: ["Cherie Kong"],
        stylingAssistantForCast: ["Clayton Mang"],
        wardrobeForCast: ["Pedro"],
        makeupArtistHairStylingForCast: ["Kiki Liu"],
        offlineEditor: ["The11th @TheBastards"],
        onlineEditor: ["Yippy Yip @The Bastards"],
        colorist: ["Eric Chan @ IXAGON"],
        coverAndStillPhotographer: ["Cow @Oniros Offical"],
        coverAndGraphicDesign: ["Herman Wan @The Bastards"],
        artisteManagement: [
          "Jocelyn Wang",
          "Wing Tai",
          "Sarah Yue",
          "Susan Hung",
          "Avis Or",
        ],
      },
    },
  },
  {
    coordinates: [22.372380870346085, 113.98814799363147],
    streetView:
      "https://www.google.com/maps/@22.372946,113.9885462,3a,75y,276.89h,89.15t/data=!3m7!1e1!3m5!1sCGSk_CAhmTSznEYci6zFaQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0.8542203553719503%26panoid%3DCGSk_CAhmTSznEYci6zFaQ%26yaw%3D276.8895835171635!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI1MDgxNy4wIKXMDSoASAFQAw%3D%3D",
    artists: ["Gordon Flanders"],
    address: "Golden Beach",
    name: "冬天一個遊",
    url: "https://youtu.be/oVpmZoj9mOM?t=37",
    image: "https://i.ytimg.com/vi/oVpmZoj9mOM/maxresdefault.jpg",
    contributors: {
      song: {
        composition: ["Gordon Flanders"],
        lyrics: ["Gordon Flanders"],
        producer: ["Gordon Flanders", "PLAYGROUND"],
        arranger: [
          "Gordon Flanders",
          "Teddy Fan",
          "PLAYGROUND",
          "Justin Yau",
          "Daniel Toh",
          "Goo Chan",
        ],
        mixing: ["PLAYGROUND"],
        mastering: ["PLAYGROUND"],
      },
      musicVideo: {
        producer: ["Ng Fong Pictures 五芳影業"],
        director: ["李卓軒 Nature Hin"],
        assistantDirector: ["曾銘森 Tsang Ming Sum"],
        directorOfPhotography: ["李卓軒 Nature Hin"],
        lineProducer: ["曾銘森 Tsang Ming Sum"],
        editor: ["李卓軒 Nature Hin"],
        compositor: ["J. Yeung 楊佚"],
        artDirector: ["Emmy Tam 譚伊南"],
        costumeDesigner: ["Emmy Tam 譚伊南"],
        gaffer: ["李卓軒 Nature Hin", "曾銘森 Tsang Ming Sum"],
        makeUpArtist: ["Cissie Chan 陳思澄"],
        hairStylist: ["Cissie Chan 陳思澄"],
        stillPhotography: ["曾銘森 Tsang Ming Sum"],
      },
    },
  },
  {
    coordinates: [22.282462397339906, 114.18495594378834],
    artists: ["馮允謙 Jay Fung"],
    address: "Cha Cha Cha",
    name: "報復式浪漫 Sweeetly",
    streetView: "https://maps.app.goo.gl/3ey1TasCZFUjqBJu8",
    url: "https://youtu.be/k2W2RGDOtaw?t=38",
    image: "https://i.ytimg.com/vi/k2W2RGDOtaw/maxresdefault.jpg",
  },
  {
    coordinates: [22.246050823338784, 114.14459785038378],
    artists: ["Gareth T"],
    address: "Aberdeen Fishing Village",
    name: "勁浪漫 超溫馨",
    url: "https://www.youtube.com/watch?v=YPJljJJzKFo",
    image: "https://i.ytimg.com/vi/YPJljJJzKFo/maxresdefault.jpg",
    contributors: {
      musicVideo: {
        producer: ["五芳影業 Ng Fong Pictures"],
        director: ["李卓軒 Nature Hin"],
        assistantDirector: ["曾銘森 Tsang Ming Sum"],
        directorOfPhotography: ["李卓軒 Nature Hin"],
        lineProducer: ["曾銘森 Tsang Ming Sum"],
        secondAssistantProducer: ["張紓綾 Sheling Chang"],
        editor: ["李卓軒 Nature Hin"],
        artDirector: ["譚伊南 Emmy Tam"],
        artAssistant: [
          "歐陽沛詩 Au Yeung Pui Sze Janice",
          "方俊皓 Fongbao",
          "Amanda Chu",
        ],
        gaffer: ["楊佚 J. Yeung", "劉德平 Lau Tak Ping Tom"],
        assistantCamera: ["楊佚 J. Yeung", "劉德平 Lau Tak Ping Tom"],
        productionAssistant: ["陳思澄 Cissie Chan"],
        costumeDesigner: ["譚伊南 Emmy Tam"],
        makeUpArtist: ["李洛誼 Candice Li"],
        hairstylist: ["李洛誼 Candice Li"],
        assistantMakeUp: ["黃蓉 Joyce Wong"],
        stillPhotography: ["梁睿偉 Leung Yui Wai", "郭潤森 Sam Kwok"],
        projectArtistManager: ["Nicholas Cheung 張軒培"],
        venue: ["樂口福酒家 Lok Hau Fook Restaurant"],
      },
    },
  },
  {
    coordinates: [22.997512585996827, 120.21257852590679],
    artists: ["Cloud 雲浩影"],
    address: "Tainan Train Station Front Station",
    name: "你的損失 your loss , not mine",
    url: "https://www.youtube.com/watch?v=N_bghNhUpkA",
    image: "https://i.ytimg.com/vi/N_bghNhUpkA/maxresdefault.jpg",
    contributors: {
      musicVideo: {
        actors: ["Cloud Wan"],
        directors: ["J.him Lee"],
        producers: ["Nova Sy"],
        directorOfPhotography: ["DF"],
        focusPuller: ["Chen Hsing Hao"],
        cameraAssistant: ["Kuo Bo Shawn"],
        lightingAssistant: ["Lin Po Ang"],
        artDirector: ["Doro Lee"],
        artAssistant: ["Cheng Ya-Yun"],
        productionSupport: ["Presence Images Studio"],
        productionManager: ["Wang Kuan Chieh", "Wu Jia-Ci"],
        production: ["Cheng Ya-Yun"],
        stillPhotographer: ["Lin Po Ang"],
        equipmentSupport: ["Haowei Video Studio"],
        editor: ["J.him Lee"],
        assistantEditor: ["Jojo Shek"],
        colorist: ["Mario Hui"],
        online: ["Mok"],
        voiceOverMixing: ["Sara Fung"],
        projectManagement: ["Tiffany Lin"],
        makeUp: ["Monique Ching"],
        hair: ["Wing Wong @ The Attic"],
        stylist: ["Matthew Chan"],
      },
    },
  },
  {
    coordinates: [43.30424161106344, 5.39431220992521],
    artists: ["moon tang"],
    address: "Longchamp",
    name: "趁你旅行時搬走",
    streetView:
      "https://www.google.com/maps/place/43%C2%B018'15.3%22N+5%C2%B023'39.5%22E/@43.3037165,5.3933466,3a,75y,63.77h,90t/data=!3m7!1e1!3m5!1sJ2WLORH1TUQEjxMioUpznA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3DJ2WLORH1TUQEjxMioUpznA%26yaw%3D63.774932406866725!7i13312!8i6656!4m4!3m3!8m2!3d43.3042416!4d5.3943122?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D",
    url: "https://youtu.be/OqZqJ6yaeOw?t=132",
    image: "https://i.ytimg.com/vi/OqZqJ6yaeOw/maxresdefault.jpg",
  },
];

export function constructTitle(
  location: LocationItem | { name: string; artists: string[] },
) {
  const songTitle = location?.name.replace(/ /g, "-") ?? "";
  const artists = location?.artists.join("-").replace(/ /g, "-") ?? "";

  return `${artists}-${songTitle}`;
}

export const nameToLocation = RAW_LOCATIONS.reduce(
  (acc, location) => {
    const title = constructTitle(LocationItemSchema.parse(location));
    acc[title] = LocationItemSchema.parse(location);
    return acc;
  },
  {} as Record<string, LocationItem>,
);

// Validate and normalize at module load; throws early if data is invalid
export const LOCATIONS: LocationItem[] = z
  .array(LocationItemSchema)
  .parse(RAW_LOCATIONS);

export const ARTISTS = [
  ...new Set(LOCATIONS.map((location) => location.artists).flat()),
  "COLLAR",
  "MIRROR",
  "AGA 江海迦",
  "Gin Lee 李幸倪",
  "衛蘭 Janice Vidal",
  "張蔓莎 Sabrina Cheung",
  "Lewsz",
  "BILLY CHOI",
  "Claudia Koh",
  "WINKA 陳泳伽",
  "Jace Chan 陳凱詠",
  "Other",
];

export const SONGS = [
  ...new Set(
    LOCATIONS.map((location) => {
      return { name: location.name, artists: location.artists };
    }),
  ),
];

export function extractContributorNamesFromLocation(
  location: LocationItem,
): string[] {
  const names = new Set<string>();
  const c = location as unknown as {
    contributors?: {
      song?: Record<string, string[]>;
      musicVideo?: Record<string, string[]>;
    } | null;
  };
  const contributors = c.contributors;
  if (!contributors) return [];
  const buckets = [contributors.song, contributors.musicVideo].filter(
    Boolean,
  ) as Array<Record<string, string[]>>;
  for (const bucket of buckets) {
    for (const role of Object.keys(bucket)) {
      const roleNames = bucket[role] ?? [];
      for (const person of roleNames) {
        if (person && person.trim().length > 0) names.add(person);
      }
    }
  }
  return Array.from(names);
}

export const CONTRIBUTORS: string[] = [
  ...new Set(
    LOCATIONS.flatMap((location) =>
      extractContributorNamesFromLocation(location),
    ),
  ),
];

type ContributorCategory = "song" | "musicVideo";

export function humanizeRoleKey(roleKey: string): string {
  const specialMap: Record<string, string> = {
    directorOfPhotographys: "Director of Photography",
    productionAssistants: "Production Assistants",
  };
  if (specialMap[roleKey]) return specialMap[roleKey];
  // Insert spaces before capital letters and capitalize first letter
  const withSpaces = roleKey.replace(/([A-Z])/g, " $1");
  const words = withSpaces.split(" ").filter(Boolean);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export interface ContributorRoleGroup {
  category: ContributorCategory;
  roleKey: string;
  title: string;
  names: string[];
}

export const CONTRIBUTOR_ROLE_GROUPS: ContributorRoleGroup[] = (() => {
  const groups = new Map<
    string,
    {
      category: ContributorCategory;
      roleKey: string;
      title: string;
      names: Set<string>;
    }
  >();

  const add = (
    category: ContributorCategory,
    roleKey: string,
    people: string[],
  ) => {
    const key = `${category}:${roleKey}`;
    let entry = groups.get(key);
    if (!entry) {
      const roleTitle = humanizeRoleKey(roleKey);
      entry = {
        category,
        roleKey,
        title: `${roleTitle}`,
        names: new Set<string>(),
      };
      groups.set(key, entry);
    }
    const ensured = entry;
    people.forEach((p) => {
      if (p && p.trim().length > 0) ensured.names.add(p);
    });
  };

  for (const location of LOCATIONS) {
    const c = (
      location as unknown as {
        contributors?: {
          song?: Record<string, string[]>;
          musicVideo?: Record<string, string[]>;
        } | null;
      }
    ).contributors;
    if (!c) continue;
    if (c.song) {
      for (const roleKey of Object.keys(c.song)) {
        add("song", roleKey, c.song[roleKey] ?? []);
      }
    }
    if (c.musicVideo) {
      for (const roleKey of Object.keys(c.musicVideo)) {
        add("musicVideo", roleKey, c.musicVideo[roleKey] ?? []);
      }
    }
  }

  return Array.from(groups.values()).map((g) => ({
    category: g.category,
    roleKey: g.roleKey,
    title: g.title,
    names: Array.from(g.names).sort((a, b) => a.localeCompare(b)),
  }));
})();
